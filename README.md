# Jema Remote Desktop

A modern remote desktop solution built with WebRTC technology for real-time screen sharing and remote control. Designed with a minimalist interface inspired by Jema Technology.

## 🌟 Features

- **Real-time Screen Sharing**: Share your screen with remote users via WebRTC
- **Remote Control**: Full mouse and keyboard control for remote assistance
- **Session Management**: Secure session creation with unique codes
- **Minimalist Design**: Clean, intuitive interface focused on functionality
- **French Language Support**: Full French localization for user experience
- **Responsive UI**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JemaOS/RemoteDesktop.git
cd RemoteDesktop
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:

**Backend Server:**
```bash
node server.js
```

**Frontend Development Server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173` and the API server at `http://localhost:3001`.

## 📱 How It Works

### For Hosts (Assistants)
1. Click "Héberger une session" (Host a session)
2. A unique 6-digit code will be generated
3. Share this code with the user who needs assistance
4. Click "Démarrer le partage d'écran" (Start screen sharing) when ready

### For Clients (Users needing assistance)
1. Click "Rejoindre une session" (Join a session)
2. Enter the 6-digit code provided by the assistant
3. Wait for the connection to establish
4. You can now see the assistant's screen and request control

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket signaling
- **WebRTC** for peer-to-peer connections
- **CORS** enabled for cross-origin requests

### Key Components
- **SessionContext**: Global state management for sessions and WebRTC connections
- **WebRTC Service**: Handles peer connections, offers, answers, and ICE candidates
- **Socket Service**: Manages WebSocket communication with the server
- **RemoteDesktop**: Main component for displaying remote screen and handling controls
- **SessionCodeDisplay**: UI for sharing session codes with QR code support

## 🎨 Design Philosophy

The application follows a minimalist design approach with:
- Clean, uncluttered interface
- Consistent color scheme (Jema blue #5b64e9)
- Intuitive navigation
- Focus on core functionality
- Responsive design for all devices

## 🌍 Localization

- Complete French language support
- All user-facing text is translated to French
- Server messages and error handling in French
- Designed for French-speaking users and support teams

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SERVER_URL=http://localhost:3001
```

### Server Configuration

The server runs on port 3001 by default and can be configured in `server.js`:
- Session duration: 1 hour (3600000ms)
- Session cleanup: Every 5 minutes
- CORS: Enabled for all origins (modify for production)

## 📁 Project Structure

```
src/
├── components/ui/          # UI Components
│   ├── RemoteDesktop.tsx   # Main remote desktop viewer
│   ├── SessionCodeDisplay.tsx  # Session code sharing
│   └── ...
├── contexts/              # React Contexts
│   └── SessionContext.tsx  # Session and WebRTC state management
├── services/              # API and Service layers
│   ├── api.ts             # REST API service
│   ├── socket.ts          # WebSocket service
│   └── webrtc.ts          # WebRTC peer management
├── pages/                 # Page components
│   ├── HomePage.tsx       # Landing page
│   ├── HostPage.tsx       # Host session page
│   └── JoinPage.tsx       # Join session page
└── hooks/                 # Custom React hooks
    └── useRemoteInput.ts  # Remote input handling
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Production Server

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
node server.js
```

3. Configure your web server to serve the `dist` directory

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "server.js"]
```

## 🔒 Security Considerations

- Session codes are generated with secure random characters
- Sessions expire after 1 hour of inactivity
- CORS is configured for production environments
- WebRTC connections are peer-to-peer and encrypted
- Input validation on all API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WebRTC for enabling real-time peer-to-peer communication
- Socket.IO for robust WebSocket signaling
- Tailwind CSS for the utility-first CSS framework
- Lucide for the beautiful icon library

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the Jema Technology team

---

© 2025 Jema Technology. All rights reserved.
