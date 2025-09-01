// Jema Remote Desktop - WebRTC Service
// This file manages all peer-to-peer communication logic via WebRTC
// Features:
// - Peer-to-peer connection management
// - Screen sharing via getDisplayMedia
// - Remote control command sending
// - ICE candidate and offer/answer management
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import { socketService } from './socket';

// Configuration WebRTC pour les serveurs ICE
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

// Interface pour les événements de contrôle à distance
export interface RemoteInputEvent {
  type: 'mouse-move' | 'mouse-click' | 'key-press' | 'key-release' | 'scroll';
  payload: {
    x?: number; // Position X de la souris
    y?: number; // Position Y de la souris
    button?: number; // Bouton de la souris (0: gauche, 1: milieu, 2: droit)
    key?: string; // Touche pressée
    code?: string; // Code de la touche
    deltaX?: number; // Défilement horizontal
    deltaY?: number; // Défilement vertical
    ctrlKey?: boolean; // Touche Ctrl pressée
    altKey?: boolean; // Touche Alt pressée
    shiftKey?: boolean; // Touche Shift pressée
    metaKey?: boolean; // Touche Meta (Cmd) pressée
  };
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onDataChannelMessageCallback?: (data: any) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;

  async initializePeerConnection(config: WebRTCConfig, isInitiator = false) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.iceServers,
      iceCandidatePoolSize: 10
    });

    // Configuration des événements
    this.setupPeerConnectionEvents();

    if (isInitiator) {
      // L'initiateur crée le canal de données
      this.dataChannel = this.peerConnection.createDataChannel('control', {
        ordered: true
      });
      this.setupDataChannelEvents(this.dataChannel);
    } else {
      // Le récepteur écoute le canal de données
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannelEvents(this.dataChannel);
      };
    }

    return this.peerConnection;
  }

  private setupPeerConnectionEvents() {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Candidat ICE généré');
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            target: this.getTargetPeerId()
          });
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log(`🔗 État de connexion WebRTC: ${state}`);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(state!);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('📺 Flux distant reçu');
      if (this.onRemoteStreamCallback && event.streams[0]) {
        this.onRemoteStreamCallback(event.streams[0]);
      }
    };
  }

  private setupDataChannelEvents(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('📡 Canal de données ouvert');
    };

    channel.onclose = () => {
      console.log('📡 Canal de données fermé');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onDataChannelMessageCallback) {
          this.onDataChannelMessageCallback(data);
        }
      } catch (error) {
        console.error('❌ Erreur de parsing du message:', error);
      }
    };
  }

  async startScreenShare() {
    try {
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: 'always'
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      console.log('📹 Partage d\'écran démarré');

      // Ajouter les pistes au peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Gérer l'arrêt du partage d'écran
      this.localStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('📹 Partage d\'écran arrêté par l\'utilisateur');
        this.stopScreenShare();
      });

      return this.localStream;
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du partage d\'écran:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await this.peerConnection.setLocalDescription(offer);
    console.log('📤 Offre WebRTC créée');
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log('📥 Réponse WebRTC créée');
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    await this.peerConnection.setRemoteDescription(answer);
    console.log('📥 Réponse WebRTC traitée');
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  sendRemoteInput(input: RemoteInputEvent) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(input));
    }
  }

  private getTargetPeerId(): string {
    // Récupère le targetPeerId depuis l'instance
    return this.targetPeerId;
  }

  setTargetPeerId(peerId: string) {
    this.targetPeerId = peerId;
  }

  private targetPeerId = '';

  // Méthodes pour les callbacks
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onDataChannelMessage(callback: (data: any) => void) {
    this.onDataChannelMessageCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  cleanup() {
    this.stopScreenShare();
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;