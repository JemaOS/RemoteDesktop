// Jema Remote Desktop - Node.js Server
// This file manages the RDP application backend
// Features:
// - WebSocket session management with Socket.IO
// - Session creation and validation
// - WebRTC signaling for peer-to-peer connections
// - Disconnection handling and session cleanup
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import { Server } from "socket.io";
import express from "express";
import http from "http";
import cors from "cors";

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permet les connexions depuis n'importe quelle origine (à modifier en production)
  },
});

// Configuration des middlewares
app.use(cors({ // Autorise les requêtes cross-origin
  origin: "*", // Permet les requêtes depuis n'importe quelle origine
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Stockage en mémoire des sessions actives
// En production, utiliser une base de données comme Redis ou MongoDB
const activeSessions = new Map();

// Caractères pour la génération de code (sans caractères ambigus O/0, I/1)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Fonction pour générer un code de session sécurisé
function generateSessionCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return code;
}

// Fonction pour générer un code unique
function generateUniqueCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateSessionCode();
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Impossible de générer un code de session unique');
    }
  } while (activeSessions.has(code));
  
  return code;
}

// Nettoyage automatique des sessions expirées
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [code, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      console.log(`Session expirée nettoyée: ${code}`);
      // Déconnecter les clients associés
      if (session.hostSocketId) {
        const hostSocket = io.sockets.sockets.get(session.hostSocketId);
        if (hostSocket) {
          hostSocket.disconnect(true);
        }
      }
      if (session.clientSocketId) {
        const clientSocket = io.sockets.sockets.get(session.clientSocketId);
        if (clientSocket) {
          clientSocket.disconnect(true);
        }
      }
      activeSessions.delete(code);
    }
  }
}

// Lancer le nettoyage toutes les 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// Route de santé du serveur
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route pour créer une session
app.post('/api/session', (req, res) => {
  try {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const sessionCode = generateUniqueCode();
    const createdAt = Date.now();
    const expiresAt = createdAt + 3600000; // Expire dans 1 heure
    
    // Stocker la session avec ses métadonnées
    const sessionData = {
      sessionId,
      code: sessionCode,
      createdAt,
      expiresAt,
      hostSocketId: null,
      clientSocketId: null,
      status: 'waiting'
    };
    
    activeSessions.set(sessionCode, sessionData);
    
    console.log(`Nouvelle session créée: ${sessionCode}`);
    
    res.json({
      sessionId,
      sessionCode,
      expiresAt: new Date(expiresAt).toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la création de session:', error);
    res.status(500).json({ error: 'Échec de la création de session' });
  }
});

// Route pour obtenir les informations d'une session
app.get('/api/session/:code', (req, res) => {
  const { code } = req.params;
  const upperCode = code.toUpperCase();
  
  // Vérifier si la session existe
  const session = activeSessions.get(upperCode);
  
  if (session) {
    // Vérifier si la session n'est pas expirée
    if (session.expiresAt > Date.now()) {
      res.json({
        sessionId: session.sessionId,
        status: session.status,
        expiresAt: new Date(session.expiresAt).toISOString(),
        hasHost: !!session.hostSocketId,
        hasClient: !!session.clientSocketId
      });
    } else {
      // Session expirée, la nettoyer
      activeSessions.delete(upperCode);
      res.status(410).json({ error: 'Session expirée' });
    }
  } else {
    res.status(404).json({ error: 'Session non trouvée' });
  }
});

io.on("connection", (socket) => {
  console.log("Client connecté :", socket.id);

  // Relayer les signaux entre les pairs
  socket.on("signal", (data) => {
    const { to, signal } = data;
    io.to(to).emit("signal", { from: socket.id, signal });
  });

  // Gestion des sessions améliorée
  socket.on('join-session', (data) => {
    const { sessionCode, role } = data;
    const upperCode = sessionCode ? sessionCode.toUpperCase() : '';
    
    console.log(`Tentative de connexion - Code: ${upperCode}, Rôle: ${role}, Socket: ${socket.id}`);
    
    // Vérifier si la session existe
    const session = activeSessions.get(upperCode);
    
    if (!session) {
      socket.emit('session-error', { error: 'Session non trouvée' });
      return;
    }
    
    // Vérifier si la session n'est pas expirée
    if (session.expiresAt <= Date.now()) {
      activeSessions.delete(upperCode);
      socket.emit('session-error', { error: 'Session expirée' });
      return;
    }
    
    // Gérer l'attribution des rôles et limiter à une connexion par rôle
    if (role === 'host') {
      if (session.hostSocketId && session.hostSocketId !== socket.id) {
        socket.emit('session-error', { error: 'Hôte déjà connecté' });
        return;
      }
      session.hostSocketId = socket.id;
      session.status = 'active';
      console.log(`Hôte connecté à la session ${upperCode}`);
    } else if (role === 'client') {
      if (session.clientSocketId && session.clientSocketId !== socket.id) {
        socket.emit('session-error', { error: 'Client déjà connecté' });
        return;
      }
      session.clientSocketId = socket.id;
      if (session.hostSocketId) {
        session.status = 'connected';
      }
      console.log(`Client connecté à la session ${upperCode}`);
    }
    
    // Joindre la room de la session
    socket.join(upperCode);
    socket.data.sessionCode = upperCode;
    socket.data.role = role;
    
    socket.emit('session-joined', {
      peerId: socket.id,
      sessionCode: upperCode,
      role: role,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    
    // Notifier les autres participants
    socket.to(upperCode).emit('peer-joined', {
      peerId: socket.id,
      role: role
    });
  });

  socket.on('webrtc-offer', (data) => {
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Gérer la déconnexion
  socket.on("disconnect", () => {
    console.log("Client déconnecté :", socket.id);
    
    // Nettoyer la session si nécessaire
    if (socket.data.sessionCode) {
      const session = activeSessions.get(socket.data.sessionCode);
      if (session) {
        if (session.hostSocketId === socket.id) {
          session.hostSocketId = null;
          session.status = 'waiting';
          console.log(`Hôte déconnecté de la session ${socket.data.sessionCode}`);
        } else if (session.clientSocketId === socket.id) {
          session.clientSocketId = null;
          if (session.hostSocketId) {
            session.status = 'active';
          } else {
            session.status = 'waiting';
          }
          console.log(`Client déconnecté de la session ${socket.data.sessionCode}`);
        }
        
        // Notifier les autres participants
        socket.to(socket.data.sessionCode).emit('peer-disconnected', {
          peerId: socket.id,
          role: socket.data.role
        });
        
        // Si plus personne n'est connecté, on peut optionnellement supprimer la session
        if (!session.hostSocketId && !session.clientSocketId) {
          console.log(`Session ${socket.data.sessionCode} vide, sera nettoyée à l'expiration`);
        }
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Serveur de signalisation WebSocket et API en cours d'exécution sur http://localhost:3001");
});
