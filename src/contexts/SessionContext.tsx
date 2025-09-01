// Jema Remote Desktop - Contexte de Session
// Ce fichier gère l'état global de l'application et la logique des sessions
// Auteur: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

// Jema Remote Desktop - Session Context
// This context manages the global application state and sessions
// Features:
// - Session state management (creation, connection, disconnection)
// - WebRTC state management (peer connections, video streams)
// - Server communication management
// - Error and connection state management
// - Business logic centralization
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { socketService } from '../services/socket';
import { apiService, SessionResponse, SessionInfo } from '../services/api';
import { webrtcService } from '../services/webrtc';
import { Socket } from 'socket.io-client';

interface SessionState {
  sessionId: string | null;
  sessionCode: string | null;
  role: 'host' | 'client' | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'in-session' | 'error';
  error: string | null;
  socket: Socket | null;
  peerId: string | null;
  targetPeerId: string | null;
  connectionState: RTCPeerConnectionState | null;
  isScreenSharing: boolean;
  serverConnected: boolean;
  expiresAt: string | null;
  remoteStream: MediaStream | null;
}

type SessionAction =
  | { type: 'SET_SESSION'; payload: { sessionId: string; sessionCode: string; expiresAt: string } }
  | { type: 'SET_ROLE'; payload: 'host' | 'client' }
  | { type: 'SET_STATUS'; payload: SessionState['status'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SOCKET'; payload: Socket | null }
  | { type: 'SET_PEER_ID'; payload: string }
  | { type: 'SET_TARGET_PEER_ID'; payload: string }
  | { type: 'SET_CONNECTION_STATE'; payload: RTCPeerConnectionState }
  | { type: 'SET_SCREEN_SHARING'; payload: boolean }
  | { type: 'SET_SERVER_CONNECTED'; payload: boolean }
  | { type: 'SET_REMOTE_STREAM'; payload: MediaStream | null }
  | { type: 'RESET_SESSION' };

const initialState: SessionState = {
  sessionId: null,
  sessionCode: null,
  role: null,
  status: 'disconnected',
  error: null,
  socket: null,
  peerId: null,
  targetPeerId: null,
  connectionState: null,
  isScreenSharing: false,
  serverConnected: false,
  expiresAt: null,
  remoteStream: null
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        sessionCode: action.payload.sessionCode,
        expiresAt: action.payload.expiresAt,
        error: null
      };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: 'error' };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_PEER_ID':
      return { ...state, peerId: action.payload };
    case 'SET_TARGET_PEER_ID':
      return { ...state, targetPeerId: action.payload };
    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.payload };
    case 'SET_SCREEN_SHARING':
      return { ...state, isScreenSharing: action.payload };
    case 'SET_SERVER_CONNECTED':
      return { ...state, serverConnected: action.payload };
    case 'SET_REMOTE_STREAM':
      return { ...state, remoteStream: action.payload };
    case 'RESET_SESSION':
      return {
        ...initialState,
        serverConnected: state.serverConnected,
        socket: state.socket
      };
    default:
      return state;
  }
}

interface SessionContextType {
  state: SessionState;
  createSession: () => Promise<void>;
  joinSession: (sessionCode: string, role: 'host' | 'client') => Promise<void>;
  connectToServer: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendRemoteInput: (input: any) => void;
  disconnect: () => void;
  clearError: () => void;
  validateSessionCode: (sessionCode: string) => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Vérification de la santé du serveur au démarrage
  useEffect(() => {
    const checkServer = async () => {
      const isHealthy = await apiService.checkServerHealth();
      dispatch({ type: 'SET_SERVER_CONNECTED', payload: isHealthy });
    };
    checkServer();
  }, []);

  const connectToServer = async () => {
    try {
      dispatch({ type: 'SET_STATUS', payload: 'connecting' });
      const socket = await socketService.connect();
      dispatch({ type: 'SET_SOCKET', payload: socket });
      dispatch({ type: 'SET_SERVER_CONNECTED', payload: true });
      dispatch({ type: 'SET_STATUS', payload: 'connected' });
      
      setupSocketListeners(socket);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de se connecter au serveur';
      dispatch({ type: 'SET_ERROR', payload: `Erreur de connexion: ${errorMessage}` });
      dispatch({ type: 'SET_SERVER_CONNECTED', payload: false });
      throw error;
    }
  };

  const setupSocketListeners = (socket: Socket) => {
    socket.on('session-joined', (data) => {
      console.log('✅ Session rejoint:', data);
      dispatch({ type: 'SET_PEER_ID', payload: data.peerId });
      dispatch({ type: 'SET_STATUS', payload: 'in-session' });
      
      // Initialiser WebRTC
      webrtcService.initializePeerConnection(
        { iceServers: data.iceServers },
        state.role === 'host'
      );
      
      webrtcService.setTargetPeerId(data.peerId);
      
      // Configurer le callback pour le flux vidéo distant
      webrtcService.onRemoteStream((stream) => {
        console.log('📺 Flux vidéo reçu côté client');
        dispatch({ type: 'SET_REMOTE_STREAM', payload: stream });
      });
      
      webrtcService.onConnectionStateChange((connectionState) => {
        dispatch({ type: 'SET_CONNECTION_STATE', payload: connectionState });
      });
    });

    socket.on('peer-joined', (data) => {
      console.log('👥 Pair rejoint:', data);
      dispatch({ type: 'SET_TARGET_PEER_ID', payload: data.peerId });
      webrtcService.setTargetPeerId(data.peerId);
      
      // Si c'est l'hôte qui reçoit un nouveau client, créer une offre WebRTC
      if (state.role === 'host' && state.isScreenSharing) {
        console.log('📡 Nouveau client détecté, création d\'une offre WebRTC');
        webrtcService.createOffer().then(offer => {
          socket.emit('webrtc-offer', {
            offer,
            target: data.peerId
          });
        });
      }
    });

    socket.on('peer-left', (data) => {
      console.log('👥 Pair parti:', data);
      dispatch({ type: 'SET_TARGET_PEER_ID', payload: '' });
    });

    socket.on('webrtc-offer', async (data) => {
      console.log('📤 Offre WebRTC reçue');
      const answer = await webrtcService.createAnswer(data.offer);
      socket.emit('webrtc-answer', {
        answer,
        target: data.from
      });
    });

    socket.on('webrtc-answer', async (data) => {
      console.log('📥 Réponse WebRTC reçue');
      await webrtcService.handleAnswer(data.answer);
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      await webrtcService.addIceCandidate(data.candidate);
    });

    socket.on('error', (data) => {
      const errorMessage = data.message || 'Une erreur est survenue';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Gestion spécifique des erreurs de session
      if (errorMessage.includes('expired') || errorMessage.includes('expiré')) {
        dispatch({ type: 'SET_ERROR', payload: 'La session a expiré. Veuillez créer une nouvelle session.' });
        // Note: disconnect is not available here, it's defined later
      } else if (errorMessage.includes('invalid') || errorMessage.includes('invalide')) {
        dispatch({ type: 'SET_ERROR', payload: 'Code de session invalide. Vérifiez le code et réessayez.' });
      } else if (errorMessage.includes('full') || errorMessage.includes('pleine')) {
        dispatch({ type: 'SET_ERROR', payload: 'La session est déjà complète. Une seule connexion est autorisée.' });
      }
    });

    socket.on('session-expired', () => {
      dispatch({ type: 'SET_ERROR', payload: 'La session a expiré. Veuillez créer une nouvelle session.' });
      // Clean up will be handled by the disconnect function when called externally
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Déconnexion du serveur:', reason);
      if (reason === 'io server disconnect') {
        dispatch({ type: 'SET_ERROR', payload: 'Vous avez été déconnecté par le serveur.' });
      } else if (reason === 'ping timeout') {
        dispatch({ type: 'SET_ERROR', payload: 'Connexion perdue avec le serveur (timeout).' });
      } else if (reason === 'transport close') {
        dispatch({ type: 'SET_ERROR', payload: 'La connexion au serveur a été interrompue.' });
      }
      dispatch({ type: 'SET_SERVER_CONNECTED', payload: false });
    });
  };

  const createSession = async () => {
    try {
      if (!state.socket) {
        await connectToServer();
      }
      
      const session = await apiService.createSession();
      dispatch({
        type: 'SET_SESSION',
        payload: {
          sessionId: session.sessionId,
          sessionCode: session.sessionCode,
          expiresAt: session.expiresAt
        }
      });
      dispatch({ type: 'SET_ROLE', payload: 'host' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer la session';
      dispatch({ type: 'SET_ERROR', payload: `Erreur lors de la création: ${errorMessage}` });
      throw error;
    }
  };

  const validateSessionCode = async (sessionCode: string): Promise<boolean> => {
    try {
      // Vérification du format
      const codeRegex = /^[A-Z0-9]{6,8}$/;
      if (!codeRegex.test(sessionCode)) {
        return false;
      }

      // Vérification via l'API
      const sessionInfo = await apiService.getSessionInfo(sessionCode);
      
      // Vérifier si la session n'est pas expirée
      const now = new Date().getTime();
      const expiresAt = new Date(sessionInfo.expiresAt).getTime();
      
      if (expiresAt <= now) {
        dispatch({ type: 'SET_ERROR', payload: 'La session a expiré' });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur de validation du code:', error);
      return false;
    }
  };

  const joinSession = async (sessionCode: string, role: 'host' | 'client') => {
    try {
      // Connexion au serveur si nécessaire
      let socket = state.socket;
      if (!socket) {
        await connectToServer();
        socket = state.socket;
      }
      
      // Récupération des informations de session
      let sessionInfo;
      try {
        sessionInfo = await apiService.getSessionInfo(sessionCode);
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw new Error('Session introuvable. Vérifiez le code.');
        }
        throw error;
      }
      
      // Vérification de l'expiration
      const now = new Date().getTime();
      const expiresAt = new Date(sessionInfo.expiresAt).getTime();
      
      if (expiresAt <= now) {
        throw new Error('La session a expiré. Demandez un nouveau code.');
      }
      
      dispatch({
        type: 'SET_SESSION',
        payload: {
          sessionId: sessionInfo.sessionId,
          sessionCode: sessionCode,
          expiresAt: sessionInfo.expiresAt
        }
      });
      dispatch({ type: 'SET_ROLE', payload: role });
      
      // Attendre que le socket soit bien connecté
      if (socket && socket.connected) {
        socket.emit('join-session', {
          sessionId: sessionInfo.sessionId,
          role
        });
      } else {
        throw new Error('Connexion au serveur impossible. Veuillez réessayer.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de rejoindre la session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await webrtcService.startScreenShare();
      dispatch({ type: 'SET_SCREEN_SHARING', payload: true });
      
      // Créer et envoyer l'offre WebRTC
      if (state.role === 'host' && state.targetPeerId && state.socket?.connected) {
        const offer = await webrtcService.createOffer();
        state.socket.emit('webrtc-offer', {
          offer,
          target: state.targetPeerId
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Impossible de démarrer le partage d\'écran' });
    }
  };

  const stopScreenShare = () => {
    webrtcService.stopScreenShare();
    dispatch({ type: 'SET_SCREEN_SHARING', payload: false });
  };

  const sendRemoteInput = (input: any) => {
    webrtcService.sendRemoteInput(input);
  };

  const disconnect = () => {
    try {
      webrtcService.cleanup();
      socketService.disconnect();
      dispatch({ type: 'RESET_SESSION' });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <SessionContext.Provider
      value={{
        state,
        createSession,
        joinSession,
        connectToServer,
        startScreenShare,
        stopScreenShare,
        sendRemoteInput,
        disconnect,
        clearError,
        validateSessionCode
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession doit être utilisé dans un SessionProvider');
  }
  return context;
}