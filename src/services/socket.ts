// Jema Remote Desktop - Socket.IO Service
// This service manages communication with the signaling server
// Features:
// - WebSocket server connection and disconnection
// - Socket.IO event management
// - Connection state management
// - Automatic reconnection on connection loss
// - Connection options configuration
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        retries: 3
      });

      this.socket.on('connect', () => {
        console.log('📡 Connecté au serveur de signaling');
        this.connected = true;
        resolve(this.socket!);
      });

      this.socket.on('disconnect', () => {
        console.log('📡 Déconnecté du serveur de signaling');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion:', error.message);
        this.connected = false;
        reject(new Error(`Erreur de connexion: ${error.message}`));
      });

      // Timeout de connexion
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Timeout de connexion au serveur'));
        }
      }, 10000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}

export const socketService = new SocketService();
export default socketService;