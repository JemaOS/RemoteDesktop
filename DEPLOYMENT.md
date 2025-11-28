# Déploiement de Jema Remote Desktop

## Architecture

Ce projet est composé de deux parties :

1. **Frontend React** - Interface utilisateur (déployable sur Vercel)
2. **Backend Node.js + Socket.IO** - Serveur de signalisation WebRTC (nécessite un serveur persistant)

## Déploiement du Frontend sur Vercel

### Prérequis
- Compte Vercel
- Node.js 18+
- npm ou pnpm

### Étapes

1. **Installer Vercel CLI** (si pas déjà fait) :
   ```bash
   npm install -g vercel
   ```

2. **Se connecter à Vercel** :
   ```bash
   vercel login
   ```

3. **Déployer** :
   ```bash
   cd RemoteDesktop
   vercel
   ```

4. **Configurer les variables d'environnement** dans le dashboard Vercel :
   - `VITE_SERVER_URL` : URL de votre serveur backend (ex: `https://your-backend.railway.app`)

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SERVER_URL` | URL du serveur de signalisation | `https://rdp-server.railway.app` |

## Déploiement du Backend

Le backend utilise Socket.IO pour les WebSockets, ce qui nécessite un serveur persistant. Vercel ne supporte pas les WebSockets persistants.

### Options recommandées :

#### 1. Railway (Recommandé)
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Initialiser et déployer
railway init
railway up
```

#### 2. Render
1. Créer un compte sur [render.com](https://render.com)
2. Créer un nouveau "Web Service"
3. Connecter votre repo GitHub
4. Configurer :
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Port: `3001`

#### 3. Fly.io
```bash
# Installer Fly CLI
curl -L https://fly.io/install.sh | sh

# Se connecter et déployer
fly auth login
fly launch
fly deploy
```

### Configuration du Backend

Le serveur écoute sur le port `3001` par défaut. Assurez-vous que :
- Le port est exposé correctement
- CORS est configuré pour accepter les requêtes de votre frontend Vercel

## Après le déploiement

1. Notez l'URL de votre backend déployé
2. Mettez à jour `VITE_SERVER_URL` dans les variables d'environnement Vercel
3. Redéployez le frontend si nécessaire

## Test local

```bash
# Terminal 1 - Backend
node server.js

# Terminal 2 - Frontend
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173` et le backend sur `http://localhost:3001`.