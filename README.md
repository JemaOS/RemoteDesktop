# Jema Remote Desktop

Application de bureau à distance peer-to-peer, similaire à Chrome Remote Desktop. Fonctionne entièrement dans le navigateur sans installation.

## 🚀 Fonctionnalités

- **Partage d'écran en temps réel** via WebRTC
- **Contrôle à distance** (souris, clavier, défilement)
- **Connexion peer-to-peer** sécurisée et chiffrée
- **Aucune installation requise** - fonctionne dans le navigateur
- **Code de session simple** à 6 caractères
- **Mode local** ou **Supabase** pour la persistance des sessions

## 🏗️ Architecture

L'application utilise :
- **PeerJS** pour la signalisation WebRTC (serveur cloud gratuit)
- **Supabase** (optionnel) pour la persistance des sessions
- **React + TypeScript + Vite** pour le frontend
- **Tailwind CSS** pour le style

## 📦 Déploiement sur Vercel

### Prérequis

- Compte [Vercel](https://vercel.com) (gratuit)
- Compte [Supabase](https://supabase.com) (optionnel, gratuit)
- Node.js 18+

### Étapes de déploiement

#### 1. Cloner et préparer le projet

```bash
git clone https://github.com/JemaOS/RemoteDesktop.git
cd RemoteDesktop
npm install
```

#### 2. (Optionnel) Configurer Supabase

Si vous voulez la persistance des sessions :

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** et exécutez le contenu de `supabase/schema.sql`
3. Récupérez votre **URL** et **anon key** dans **Settings > API**

#### 3. Déployer sur Vercel

**Option A : Via l'interface Vercel**

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement (si Supabase) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Déployez !

**Option B : Via CLI**

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | Non |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | Non |

> **Note** : Sans Supabase, l'application fonctionne en mode local. Les sessions ne sont pas persistantes entre les rechargements de page, mais le partage d'écran fonctionne parfaitement.

## 🖥️ Utilisation

### Partager son écran (Hôte)

1. Allez sur l'application
2. Cliquez sur **"Héberger"**
3. Un code de session à 6 caractères est généré
4. Partagez ce code avec la personne qui doit voir votre écran
5. Cliquez sur **"Démarrer le Partage d'Écran"**
6. Sélectionnez l'écran ou la fenêtre à partager

### Voir un écran distant (Client)

1. Allez sur l'application
2. Entrez le code de session reçu
3. Cliquez sur **"Se Connecter"**
4. L'écran distant s'affiche
5. Activez le contrôle si nécessaire

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## 🔒 Sécurité

- **Connexion peer-to-peer** : Les données transitent directement entre les navigateurs
- **Chiffrement WebRTC** : Toutes les communications sont chiffrées (DTLS/SRTP)
- **Sessions temporaires** : Les codes expirent après 1 heure
- **Aucun stockage serveur** : Aucune donnée n'est stockée sur nos serveurs

## 📁 Structure du projet

```
RemoteDesktop/
├── src/
│   ├── components/     # Composants React
│   ├── contexts/       # Contextes React (PeerSessionContext)
│   ├── hooks/          # Hooks personnalisés
│   ├── lib/            # Utilitaires et Supabase
│   ├── pages/          # Pages de l'application
│   └── services/       # Services (PeerJS)
├── supabase/
│   └── schema.sql      # Schéma de base de données
├── vercel.json         # Configuration Vercel
└── package.json
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT License - © 2025 Jema Technology

## 🔗 Liens

- [PeerJS](https://peerjs.com/) - Bibliothèque WebRTC
- [Supabase](https://supabase.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Plateforme de déploiement
