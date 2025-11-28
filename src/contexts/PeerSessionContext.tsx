// Jema Remote Desktop - Peer Session Context
// This context manages the application state using PeerJS and Supabase
// Features:
// - Session management with Supabase (or local fallback)
// - WebRTC connections via PeerJS
// - Screen sharing and remote control
// - Real-time session updates
// Author: Jema Technology
// Date: 2025

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { peerService, RemoteInputEvent } from '../services/peerService';
import { supabaseService, Session } from '../lib/supabase';

// État de la session
interface SessionState {
  sessionId: string | null;
  sessionCode: string | null;
  role: 'host' | 'client' | null;
  status: 'disconnected' | 'initializing' | 'ready' | 'waiting' | 'connecting' | 'connected' | 'sharing' | 'error';
  error: string | null;
  peerId: string | null;
  remotePeerId: string | null;
  isScreenSharing: boolean;
  remoteStream: MediaStream | null;
  expiresAt: string | null;
  useSupabase: boolean;
}

// Actions du reducer
type SessionAction =
  | { type: 'SET_STATUS'; payload: SessionState['status'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_PEER_ID'; payload: string }
  | { type: 'SET_REMOTE_PEER_ID'; payload: string | null }
  | { type: 'SET_SESSION'; payload: { sessionId: string; sessionCode: string; expiresAt: string } }
  | { type: 'SET_ROLE'; payload: 'host' | 'client' }
  | { type: 'SET_SCREEN_SHARING'; payload: boolean }
  | { type: 'SET_REMOTE_STREAM'; payload: MediaStream | null }
  | { type: 'SET_USE_SUPABASE'; payload: boolean }
  | { type: 'RESET' };

// État initial
const initialState: SessionState = {
  sessionId: null,
  sessionCode: null,
  role: null,
  status: 'disconnected',
  error: null,
  peerId: null,
  remotePeerId: null,
  isScreenSharing: false,
  remoteStream: null,
  expiresAt: null,
  useSupabase: false
};

// Reducer
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload, error: action.payload === 'error' ? state.error : null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: 'error' };
    case 'CLEAR_ERROR':
      return { ...state, error: null, status: state.status === 'error' ? 'disconnected' : state.status };
    case 'SET_PEER_ID':
      return { ...state, peerId: action.payload };
    case 'SET_REMOTE_PEER_ID':
      return { ...state, remotePeerId: action.payload };
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        sessionCode: action.payload.sessionCode,
        expiresAt: action.payload.expiresAt
      };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_SCREEN_SHARING':
      return { ...state, isScreenSharing: action.payload };
    case 'SET_REMOTE_STREAM':
      return { ...state, remoteStream: action.payload };
    case 'SET_USE_SUPABASE':
      return { ...state, useSupabase: action.payload };
    case 'RESET':
      return { ...initialState, useSupabase: state.useSupabase };
    default:
      return state;
  }
}

// Stockage local pour le mode sans Supabase
const localSessions = new Map<string, {
  code: string;
  hostPeerId: string;
  clientPeerId: string | null;
  expiresAt: string;
}>();

// Interface du contexte
interface PeerSessionContextType {
  state: SessionState;
  initialize: () => Promise<void>;
  createSession: () => Promise<string>;
  joinSession: (sessionCode: string) => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendRemoteInput: (input: RemoteInputEvent) => void;
  disconnect: () => void;
  clearError: () => void;
  validateSessionCode: (code: string) => Promise<boolean>;
}

const PeerSessionContext = createContext<PeerSessionContextType | undefined>(undefined);

export function PeerSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Initialiser les services au montage
  useEffect(() => {
    const useSupabase = supabaseService.initialize();
    dispatch({ type: 'SET_USE_SUPABASE', payload: useSupabase });
    
    if (!useSupabase) {
      console.log('ℹ️ Mode local activé (Supabase non configuré)');
    }

    return () => {
      peerService.cleanup();
      supabaseService.unsubscribe();
    };
  }, []);

  // Configurer les callbacks PeerJS
  const setupPeerCallbacks = useCallback((role?: 'host' | 'client') => {
    peerService.onRemoteStream((stream) => {
      console.log('📺 Flux distant reçu');
      dispatch({ type: 'SET_REMOTE_STREAM', payload: stream });
      // Ne pas changer le status ici pour éviter les re-renders
    });

    peerService.onConnection(async (connected) => {
      if (connected) {
        console.log('📡 Client connecté');
        dispatch({ type: 'SET_STATUS', payload: 'connected' });
        
        // Si on est hôte et qu'on partage déjà l'écran, envoyer le flux au nouveau client
        if (peerService.hasLocalStream()) {
          console.log('📤 Envoi du flux au client connecté');
          const connectedPeerId = peerService.getConnectedPeerId();
          if (connectedPeerId) {
            try {
              await peerService.sendStreamToPeer(connectedPeerId);
              console.log('✅ Flux envoyé au client');
            } catch (error) {
              console.error('❌ Erreur envoi flux:', error);
            }
          }
        }
      } else {
        dispatch({ type: 'SET_STATUS', payload: 'waiting' });
        dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
      }
    });

    // Handler pour les commandes de contrôle à distance reçues (côté hôte uniquement)
    // Le client n'a pas besoin de traiter les commandes
    peerService.onData((input: RemoteInputEvent) => {
      // Vérifier si on est l'hôte avant de traiter
      if (role === 'host') {
        console.log('🎮 Commande reçue (hôte):', input.type);
        handleRemoteInput(input);
      }
    });

    peerService.onError((error) => {
      dispatch({ type: 'SET_ERROR', payload: translateError(error) });
    });
  }, []);

  // Traiter les commandes de contrôle à distance (côté hôte)
  const handleRemoteInput = (input: RemoteInputEvent) => {
    const { type, payload } = input;
    
    // Obtenir les dimensions de la fenêtre du navigateur (pas de l'écran)
    // Les coordonnées reçues sont relatives (0-1) par rapport à la vidéo
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    switch (type) {
      case 'mouse-move':
        // Afficher la position du curseur distant
        if (payload.x !== undefined && payload.y !== undefined) {
          // Convertir les coordonnées relatives en coordonnées absolues de la fenêtre
          const absX = Math.round(payload.x * windowWidth);
          const absY = Math.round(payload.y * windowHeight);
          // Émettre un événement personnalisé pour afficher le curseur virtuel
          window.dispatchEvent(new CustomEvent('remote-cursor-move', {
            detail: { x: absX, y: absY }
          }));
        }
        break;
        
      case 'mouse-click':
        if (payload.x !== undefined && payload.y !== undefined) {
          const absX = Math.round(payload.x * windowWidth);
          const absY = Math.round(payload.y * windowHeight);
          console.log(`🖱️ Click distant à (${absX}, ${absY}) bouton ${payload.button}`);
          
          // Émettre un événement pour le clic
          window.dispatchEvent(new CustomEvent('remote-cursor-click', {
            detail: { x: absX, y: absY, button: payload.button }
          }));
          
          // Tenter de simuler le clic sur l'élément à cette position
          // Note: Cela ne fonctionne que pour les éléments dans le navigateur
          const element = document.elementFromPoint(absX, absY);
          if (element) {
            console.log('📍 Élément trouvé:', element.tagName, element.className);
            // Créer et dispatcher un événement de clic
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: absX,
              clientY: absY,
              button: payload.button || 0
            });
            element.dispatchEvent(clickEvent);
          }
        }
        break;
        
      case 'key-press':
        console.log(`⌨️ Touche pressée: ${payload.key} (${payload.code})`);
        // Émettre un événement pour la touche
        window.dispatchEvent(new CustomEvent('remote-key-press', {
          detail: payload
        }));
        
        // Tenter de simuler la frappe sur l'élément actif
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          const keyEvent = new KeyboardEvent('keydown', {
            key: payload.key,
            code: payload.code,
            bubbles: true,
            cancelable: true,
            ctrlKey: payload.ctrlKey,
            altKey: payload.altKey,
            shiftKey: payload.shiftKey,
            metaKey: payload.metaKey
          });
          activeElement.dispatchEvent(keyEvent);
        }
        break;
        
      case 'key-release':
        console.log(`⌨️ Touche relâchée: ${payload.key}`);
        break;
        
      case 'scroll':
        console.log(`🔄 Scroll: deltaX=${payload.deltaX}, deltaY=${payload.deltaY}`);
        // Émettre un événement pour le scroll
        window.dispatchEvent(new CustomEvent('remote-scroll', {
          detail: payload
        }));
        break;
    }
  };

  // Initialiser PeerJS
  const initialize = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_STATUS', payload: 'initializing' });
      
      const peerId = await peerService.initialize();
      dispatch({ type: 'SET_PEER_ID', payload: peerId });
      
      setupPeerCallbacks();
      
      dispatch({ type: 'SET_STATUS', payload: 'ready' });
      console.log('✅ PeerJS initialisé:', peerId);
    } catch (error) {
      const message = translateError(error instanceof Error ? error : 'Erreur d\'initialisation');
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  // Créer une nouvelle session (hôte)
  const createSession = async (): Promise<string> => {
    try {
      // S'assurer que PeerJS est initialisé
      if (!state.peerId) {
        await initialize();
      }
      
      // Reconfigurer les callbacks pour le rôle hôte
      setupPeerCallbacks('host');

      const peerId = peerService.getPeerId();
      if (!peerId) {
        throw new Error('PeerJS non initialisé');
      }

      const sessionCode = peerService.generateSessionCode();
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      if (state.useSupabase) {
        // Créer la session dans Supabase
        const session = await supabaseService.createSession(sessionCode, peerId);
        if (!session) {
          throw new Error('Impossible de créer la session');
        }

        // S'abonner aux mises à jour de la session
        supabaseService.subscribeToSession(sessionCode, (updatedSession) => {
          if (updatedSession.client_peer_id && updatedSession.client_peer_id !== state.remotePeerId) {
            dispatch({ type: 'SET_REMOTE_PEER_ID', payload: updatedSession.client_peer_id });
            dispatch({ type: 'SET_STATUS', payload: 'connected' });
          }
        });

        dispatch({
          type: 'SET_SESSION',
          payload: {
            sessionId: session.id,
            sessionCode: session.code,
            expiresAt: session.expires_at
          }
        });
      } else {
        // Mode local - stocker en mémoire
        localSessions.set(sessionCode, {
          code: sessionCode,
          hostPeerId: peerId,
          clientPeerId: null,
          expiresAt
        });

        dispatch({
          type: 'SET_SESSION',
          payload: {
            sessionId: sessionCode,
            sessionCode,
            expiresAt
          }
        });
      }

      dispatch({ type: 'SET_ROLE', payload: 'host' });
      dispatch({ type: 'SET_STATUS', payload: 'waiting' });

      console.log('✅ Session créée:', sessionCode);
      return sessionCode;

    } catch (error) {
      const message = translateError(error instanceof Error ? error : 'Erreur de création de session');
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  // Rejoindre une session existante (client)
  const joinSession = async (sessionCode: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_STATUS', payload: 'connecting' });
      console.log('🔍 Recherche de la session:', sessionCode);

      // S'assurer que PeerJS est initialisé
      if (!state.peerId) {
        await initialize();
      }
      
      // Reconfigurer les callbacks pour le rôle client
      setupPeerCallbacks('client');

      const peerId = peerService.getPeerId();
      if (!peerId) {
        throw new Error('PeerJS non initialisé');
      }

      console.log('📱 Mon peer ID:', peerId);

      let hostPeerId: string | null = null;

      if (state.useSupabase) {
        // Récupérer la session depuis Supabase
        console.log('🔎 Recherche dans Supabase...');
        const session = await supabaseService.getSessionByCode(sessionCode);
        
        if (!session) {
          console.error('❌ Session non trouvée dans Supabase');
          throw new Error('Session non trouvée ou expirée');
        }

        console.log('✅ Session trouvée:', session);
        hostPeerId = session.host_peer_id;
        console.log('🎯 Host peer ID:', hostPeerId);

        // Mettre à jour la session avec le client
        await supabaseService.joinSessionAsClient(sessionCode, peerId);

        dispatch({
          type: 'SET_SESSION',
          payload: {
            sessionId: session.id,
            sessionCode: session.code,
            expiresAt: session.expires_at
          }
        });
      } else {
        // Mode local
        const session = localSessions.get(sessionCode.toUpperCase());
        if (!session) {
          throw new Error('Session non trouvée');
        }

        if (new Date(session.expiresAt) < new Date()) {
          localSessions.delete(sessionCode.toUpperCase());
          throw new Error('Session expirée');
        }

        hostPeerId = session.hostPeerId;
        session.clientPeerId = peerId;

        dispatch({
          type: 'SET_SESSION',
          payload: {
            sessionId: sessionCode,
            sessionCode,
            expiresAt: session.expiresAt
          }
        });
      }

      if (!hostPeerId) {
        throw new Error('Hôte non disponible');
      }

      dispatch({ type: 'SET_ROLE', payload: 'client' });
      dispatch({ type: 'SET_REMOTE_PEER_ID', payload: hostPeerId });

      // Se connecter au peer hôte
      await peerService.connectToPeer(hostPeerId);
      
      dispatch({ type: 'SET_STATUS', payload: 'connected' });
      console.log('✅ Connecté à la session:', sessionCode);

    } catch (error) {
      const message = translateError(error instanceof Error ? error : 'Erreur de connexion');
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  // Valider un code de session
  const validateSessionCode = async (code: string): Promise<boolean> => {
    const codeRegex = /^[A-Z0-9]{6,8}$/;
    if (!codeRegex.test(code.toUpperCase())) {
      return false;
    }

    if (state.useSupabase) {
      const session = await supabaseService.getSessionByCode(code);
      return session !== null;
    } else {
      const session = localSessions.get(code.toUpperCase());
      if (!session) return false;
      return new Date(session.expiresAt) > new Date();
    }
  };

  // Traduire les messages d'erreur en français
  const translateError = (error: Error | string): string => {
    const message = typeof error === 'string' ? error : error.message;
    
    // Erreurs de partage d'écran
    if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
      return 'Partage refusé par l\'utilisateur';
    }
    if (message.includes('NotFoundError') || message.includes('No screen')) {
      return 'Aucun écran disponible';
    }
    if (message.includes('NotReadableError')) {
      return 'Impossible d\'accéder à l\'écran';
    }
    if (message.includes('AbortError')) {
      return 'Partage annulé';
    }
    
    // Erreurs de connexion
    if (message.includes('Timeout')) {
      return 'Délai de connexion dépassé';
    }
    if (message.includes('Connection failed') || message.includes('connection-failure')) {
      return 'Échec de la connexion';
    }
    if (message.includes('peer-unavailable')) {
      return 'Hôte non disponible';
    }
    if (message.includes('disconnected')) {
      return 'Connexion perdue';
    }
    
    // Erreurs de session
    if (message.includes('Session non trouvée') || message.includes('not found')) {
      return 'Session non trouvée';
    }
    if (message.includes('Session expirée') || message.includes('expired')) {
      return 'Session expirée';
    }
    if (message.includes('Invalid session')) {
      return 'Session invalide';
    }
    
    // Erreurs réseau
    if (message.includes('network') || message.includes('Network')) {
      return 'Erreur réseau';
    }
    if (message.includes('server-error')) {
      return 'Erreur serveur';
    }
    
    // Message par défaut ou déjà en français
    return message;
  };

  // Démarrer le partage d'écran (hôte)
  const startScreenShare = async (): Promise<void> => {
    try {
      // Démarrer le partage même sans client connecté
      // Le flux sera envoyé quand un client se connectera
      await peerService.startScreenShareLocal();
      dispatch({ type: 'SET_SCREEN_SHARING', payload: true });
      dispatch({ type: 'SET_STATUS', payload: 'sharing' });
      
      // Si un client est déjà connecté, envoyer le flux
      if (state.remotePeerId) {
        await peerService.sendStreamToPeer(state.remotePeerId);
      }
      
      console.log('📹 Partage d\'écran démarré');
    } catch (error) {
      const message = translateError(error instanceof Error ? error : String(error));
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  // Arrêter le partage d'écran
  const stopScreenShare = (): void => {
    peerService.stopScreenShare();
    dispatch({ type: 'SET_SCREEN_SHARING', payload: false });
    dispatch({ type: 'SET_STATUS', payload: 'connected' });
  };

  // Envoyer un événement de contrôle à distance
  const sendRemoteInput = (input: RemoteInputEvent): void => {
    peerService.sendRemoteInput(input);
  };

  // Se déconnecter
  const disconnect = (): void => {
    if (state.sessionCode && state.useSupabase) {
      supabaseService.closeSession(state.sessionCode);
      supabaseService.unsubscribe();
    }

    peerService.cleanup();
    dispatch({ type: 'RESET' });
  };

  // Effacer l'erreur
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <PeerSessionContext.Provider
      value={{
        state,
        initialize,
        createSession,
        joinSession,
        startScreenShare,
        stopScreenShare,
        sendRemoteInput,
        disconnect,
        clearError,
        validateSessionCode
      }}
    >
      {children}
    </PeerSessionContext.Provider>
  );
}

export function usePeerSession() {
  const context = useContext(PeerSessionContext);
  if (context === undefined) {
    throw new Error('usePeerSession doit être utilisé dans un PeerSessionProvider');
  }
  return context;
}