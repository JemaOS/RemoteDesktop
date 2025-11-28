// Jema Remote Desktop - Supabase Client
// This file manages the Supabase client for session management
// Features:
// - Supabase client initialization
// - Session CRUD operations
// - Real-time subscriptions for session updates
// Author: Jema Technology
// Date: 2025

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Configuration Supabase - Ces valeurs seront remplacées par les variables d'environnement
// On utilise trim() pour supprimer les espaces et retours à la ligne potentiels
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Types pour les sessions
export interface Session {
  id: string;
  code: string;
  host_peer_id: string | null;
  client_peer_id: string | null;
  status: 'waiting' | 'active' | 'connected' | 'closed';
  created_at: string;
  expires_at: string;
}

export interface SessionInsert {
  code: string;
  host_peer_id?: string;
  status?: 'waiting' | 'active' | 'connected' | 'closed';
  expires_at: string;
}

export interface SessionUpdate {
  host_peer_id?: string | null;
  client_peer_id?: string | null;
  status?: 'waiting' | 'active' | 'connected' | 'closed';
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private isInitialized = false;

  initialize(): boolean {
    if (this.isInitialized && this.client) {
      return true;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase non configuré - Mode local activé');
      return false;
    }

    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      this.isInitialized = true;
      console.log('✅ Supabase initialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation Supabase:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  // Créer une nouvelle session
  async createSession(code: string, hostPeerId: string): Promise<Session | null> {
    if (!this.client) {
      console.error('❌ Supabase non initialisé');
      return null;
    }

    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 heure
    const upperCode = code.toUpperCase();

    console.log('📝 Création session:', { code: upperCode, hostPeerId, expiresAt });

    const { data, error } = await this.client
      .from('rdp_sessions')
      .insert({
        code: upperCode,
        host_peer_id: hostPeerId,
        status: 'waiting',
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création session:', error.code, error.message, error.details);
      // Si erreur de duplication, essayer de récupérer la session existante
      if (error.code === '23505') {
        console.log('ℹ️ Session existe déjà, récupération...');
        return this.getSessionByCode(upperCode);
      }
      return null;
    }

    console.log('✅ Session créée:', data);
    return data as Session;
  }

  // Récupérer une session par code
  async getSessionByCode(code: string): Promise<Session | null> {
    if (!this.client) {
      console.error('❌ Supabase non initialisé');
      return null;
    }

    // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur 406
    const { data, error } = await this.client
      .from('rdp_sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      // Erreur 42P01 = table n'existe pas
      if (error.code === '42P01') {
        console.error('❌ Table rdp_sessions non trouvée. Veuillez exécuter le schéma SQL dans Supabase.');
        return null;
      }
      console.error('❌ Erreur récupération session:', error.code, error.message);
      return null;
    }

    if (!data) {
      console.log('ℹ️ Session non trouvée');
      return null;
    }

    return data as Session;
  }

  // Mettre à jour une session
  async updateSession(code: string, updates: SessionUpdate): Promise<Session | null> {
    if (!this.client) {
      console.error('❌ Supabase non initialisé');
      return null;
    }

    const { data, error } = await this.client
      .from('rdp_sessions')
      .update(updates)
      .eq('code', code.toUpperCase())
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour session:', error);
      return null;
    }

    return data as Session;
  }

  // Rejoindre une session en tant que client
  async joinSessionAsClient(code: string, clientPeerId: string): Promise<Session | null> {
    return this.updateSession(code, {
      client_peer_id: clientPeerId,
      status: 'connected'
    });
  }

  // Fermer une session
  async closeSession(code: string): Promise<boolean> {
    if (!this.client) {
      console.error('❌ Supabase non initialisé');
      return false;
    }

    const { error } = await this.client
      .from('rdp_sessions')
      .update({ status: 'closed' })
      .eq('code', code.toUpperCase());

    if (error) {
      console.error('❌ Erreur fermeture session:', error);
      return false;
    }

    return true;
  }

  // S'abonner aux changements d'une session
  subscribeToSession(
    code: string,
    onUpdate: (session: Session) => void
  ): RealtimeChannel | null {
    if (!this.client) {
      console.error('❌ Supabase non initialisé');
      return null;
    }

    // Se désabonner du canal précédent si existant
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = this.client
      .channel(`session:${code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rdp_sessions',
          filter: `code=eq.${code.toUpperCase()}`
        },
        (payload) => {
          console.log('📡 Mise à jour session reçue:', payload);
          if (payload.new) {
            onUpdate(payload.new as Session);
          }
        }
      )
      .subscribe();

    return this.channel;
  }

  // Se désabonner des changements
  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  // Nettoyer les sessions expirées (appelé périodiquement)
  async cleanupExpiredSessions(): Promise<void> {
    if (!this.client) return;

    const { error } = await this.client
      .from('rdp_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('❌ Erreur nettoyage sessions:', error);
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;