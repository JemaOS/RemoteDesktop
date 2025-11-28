// Jema Remote Desktop - PeerJS Service
// This service manages WebRTC connections using PeerJS
// Features:
// - Peer connection management with PeerJS cloud
// - Screen sharing via getDisplayMedia
// - Remote control command sending via DataChannel
// - Automatic reconnection handling
// Author: Jema Technology
// Date: 2025

import Peer, { DataConnection, MediaConnection } from 'peerjs';

// Configuration PeerJS avec serveurs TURN Xirsys (plus fiables)
const PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  debug: 3,
  config: {
    iceServers: [
      // Serveurs STUN Google
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Serveurs TURN Twilio (gratuits pour test)
      {
        urls: 'turn:global.turn.twilio.com:3478?transport=udp',
        username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
        credential: 'w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw='
      },
      {
        urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
        username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
        credential: 'w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw='
      },
      {
        urls: 'turn:global.turn.twilio.com:443?transport=tcp',
        username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
        credential: 'w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw='
      }
    ],
    iceCandidatePoolSize: 10,
    // Forcer l'utilisation de TURN si disponible
    iceTransportPolicy: 'all'
  }
};

// Interface pour les événements de contrôle à distance
export interface RemoteInputEvent {
  type: 'mouse-move' | 'mouse-click' | 'mouse-down' | 'mouse-up' | 'key-press' | 'key-release' | 'scroll';
  payload: {
    x?: number;
    y?: number;
    button?: number;
    key?: string;
    code?: string;
    deltaX?: number;
    deltaY?: number;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  };
}

// Types de callbacks
type StreamCallback = (stream: MediaStream) => void;
type DataCallback = (data: RemoteInputEvent) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: Error) => void;

class PeerService {
  private peer: Peer | null = null;
  private dataConnection: DataConnection | null = null;
  private mediaConnection: MediaConnection | null = null;
  private localStream: MediaStream | null = null;
  private peerId: string | null = null;

  // Callbacks
  private onRemoteStreamCallback: StreamCallback | null = null;
  private onDataCallback: DataCallback | null = null;
  private onConnectionCallback: ConnectionCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  // Initialiser le peer avec un ID optionnel
  async initialize(customId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Générer un ID unique si non fourni
        const id = customId || this.generatePeerId();
        
        this.peer = new Peer(id, PEER_CONFIG);

        this.peer.on('open', (peerId) => {
          console.log('✅ PeerJS connecté avec ID:', peerId);
          this.peerId = peerId;
          resolve(peerId);
        });

        this.peer.on('error', (error) => {
          console.error('❌ Erreur PeerJS:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback(error);
          }
          reject(error);
        });

        this.peer.on('disconnected', () => {
          console.log('⚠️ PeerJS déconnecté, tentative de reconnexion...');
          this.peer?.reconnect();
        });

        this.peer.on('close', () => {
          console.log('🔌 PeerJS fermé');
          if (this.onConnectionCallback) {
            this.onConnectionCallback(false);
          }
        });

        // Écouter les connexions entrantes
        this.setupIncomingConnections();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Configurer les connexions entrantes
  private setupIncomingConnections(): void {
    if (!this.peer) return;

    // Connexion de données entrante
    this.peer.on('connection', (conn) => {
      console.log('📡 Connexion de données entrante de:', conn.peer);
      this.dataConnection = conn;
      this.setupDataConnection(conn);
    });

    // Connexion média entrante (flux vidéo)
    this.peer.on('call', (call) => {
      console.log('📹 Appel entrant de:', call.peer);
      this.mediaConnection = call;
      
      // Répondre à l'appel (sans flux local pour le client)
      call.answer();
      
      call.on('stream', (remoteStream) => {
        console.log('📺 Flux distant reçu');
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(remoteStream);
        }
      });

      call.on('close', () => {
        console.log('📹 Appel fermé');
        if (this.onConnectionCallback) {
          this.onConnectionCallback(false);
        }
      });

      call.on('error', (error) => {
        console.error('❌ Erreur appel:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      });
    });
  }

  // Configurer la connexion de données
  private setupDataConnection(conn: DataConnection): void {
    conn.on('open', () => {
      console.log('📡 Canal de données ouvert');
      if (this.onConnectionCallback) {
        this.onConnectionCallback(true);
      }
    });

    conn.on('data', (data) => {
      console.log('📥 Données reçues:', data);
      if (this.onDataCallback && data) {
        this.onDataCallback(data as RemoteInputEvent);
      }
    });

    conn.on('close', () => {
      console.log('📡 Canal de données fermé');
      this.dataConnection = null;
    });

    conn.on('error', (error) => {
      console.error('❌ Erreur canal de données:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    });
  }

  // Se connecter à un peer distant
  async connectToPeer(remotePeerId: string): Promise<void> {
    if (!this.peer) {
      throw new Error('PeerJS non initialisé');
    }

    console.log('🔗 Tentative de connexion au peer:', remotePeerId);
    console.log('📊 État du peer local:', {
      open: this.peer.open,
      disconnected: this.peer.disconnected,
      destroyed: this.peer.destroyed,
      id: this.peer.id
    });

    return new Promise((resolve, reject) => {
      let resolved = false;
      
      try {
        // Établir la connexion de données
        console.log('📡 Création de la connexion de données...');
        const conn = this.peer!.connect(remotePeerId, {
          reliable: true,
          serialization: 'json'
        });

        this.dataConnection = conn;
        console.log('📡 Connexion créée, en attente d\'ouverture...');

        const handleOpen = () => {
          if (resolved) return;
          resolved = true;
          console.log('✅ Connecté au peer:', remotePeerId);
          this.setupDataConnection(conn);
          resolve();
        };

        conn.on('open', handleOpen);

        conn.on('error', (error) => {
          if (resolved) return;
          resolved = true;
          console.error('❌ Erreur connexion au peer:', error);
          reject(error);
        });

        // Vérifier périodiquement si la connexion est ouverte
        // (workaround pour le bug où 'open' n'est pas émis)
        const checkInterval = setInterval(() => {
          console.log('🔄 Vérification état connexion:', conn.open);
          if (conn.open && !resolved) {
            clearInterval(checkInterval);
            handleOpen();
          }
        }, 500);

        // Timeout de connexion (30 secondes)
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!resolved) {
            console.error('⏱️ Timeout de connexion - État de la connexion:', {
              dataConnection: !!this.dataConnection,
              open: conn.open,
              peerConnection: conn.peerConnection?.connectionState
            });
            reject(new Error('Timeout de connexion au peer'));
          }
        }, 30000);

      } catch (error) {
        console.error('❌ Exception lors de la connexion:', error);
        reject(error);
      }
    });
  }

  // Démarrer le partage d'écran localement (sans envoyer à un peer)
  async startScreenShareLocal(): Promise<MediaStream> {
    try {
      // Demander le partage d'écran
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          cursor: 'always'
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('📹 Partage d\'écran démarré localement');

      // Gérer l'arrêt du partage par l'utilisateur
      this.localStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('📹 Partage d\'écran arrêté par l\'utilisateur');
        this.stopScreenShare();
      });

      return this.localStream;

    } catch (error) {
      console.error('❌ Erreur partage d\'écran:', error);
      throw error;
    }
  }

  // Envoyer le flux à un peer distant
  async sendStreamToPeer(remotePeerId: string): Promise<void> {
    if (!this.peer) {
      throw new Error('PeerJS non initialisé');
    }

    if (!this.localStream) {
      throw new Error('Aucun flux local à envoyer');
    }

    try {
      console.log('📤 Envoi du flux au peer:', remotePeerId);

      // Appeler le peer distant avec le flux
      const call = this.peer.call(remotePeerId, this.localStream);
      this.mediaConnection = call;

      call.on('close', () => {
        console.log('📹 Appel fermé');
      });

      call.on('error', (error) => {
        console.error('❌ Erreur appel:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      });

    } catch (error) {
      console.error('❌ Erreur envoi flux:', error);
      throw error;
    }
  }

  // Démarrer le partage d'écran et l'envoyer à un peer (méthode combinée)
  async startScreenShare(remotePeerId: string): Promise<MediaStream> {
    await this.startScreenShareLocal();
    await this.sendStreamToPeer(remotePeerId);
    return this.localStream!;
  }

  // Vérifier si un flux local est actif
  hasLocalStream(): boolean {
    return this.localStream !== null && this.localStream.active;
  }

  // Obtenir le flux local
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Arrêter le partage d'écran
  stopScreenShare(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.mediaConnection) {
      this.mediaConnection.close();
      this.mediaConnection = null;
    }
  }

  // Envoyer un événement de contrôle à distance
  sendRemoteInput(input: RemoteInputEvent): void {
    if (this.dataConnection && this.dataConnection.open) {
      console.log('📤 Envoi input distant:', input.type, input.payload);
      this.dataConnection.send(input);
    } else {
      console.warn('⚠️ Impossible d\'envoyer input - DataConnection:', {
        exists: !!this.dataConnection,
        open: this.dataConnection?.open
      });
    }
  }

  // Générer un ID de peer unique
  private generatePeerId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'jema-';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  // Générer un code de session (6 caractères)
  generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // Getters
  getPeerId(): string | null {
    return this.peerId;
  }

  isConnected(): boolean {
    return this.peer?.open === true;
  }

  hasDataConnection(): boolean {
    return this.dataConnection?.open === true;
  }

  hasMediaConnection(): boolean {
    return this.mediaConnection !== null;
  }

  // Obtenir le peer ID du client connecté via DataConnection
  getConnectedPeerId(): string | null {
    return this.dataConnection?.peer || null;
  }

  // Setters pour les callbacks
  onRemoteStream(callback: StreamCallback): void {
    this.onRemoteStreamCallback = callback;
  }

  onData(callback: DataCallback): void {
    this.onDataCallback = callback;
  }

  onConnection(callback: ConnectionCallback): void {
    this.onConnectionCallback = callback;
  }

  onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }

  // Nettoyer et fermer toutes les connexions
  cleanup(): void {
    this.stopScreenShare();

    if (this.dataConnection) {
      this.dataConnection.close();
      this.dataConnection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.peerId = null;
    console.log('🧹 PeerService nettoyé');
  }
}

export const peerService = new PeerService();
export default peerService;