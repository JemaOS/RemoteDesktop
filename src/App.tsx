// Jema Remote Desktop - Main Application
// This file is the entry point of the React application
// Features:
// - Route configuration with React Router
// - Global context provider (PeerSessionProvider)
// - Toast notifications with Sonner
// Author: Jema Technology
// Date: 2025

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PeerSessionProvider } from './contexts/PeerSessionContext';
import { HomePage } from './pages/HomePage';
import { HostPage } from './pages/HostPage';
import { JoinPage } from './pages/JoinPage';
import './App.css';

function App() {
  return (
    <PeerSessionProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/host" element={<HostPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/join/:sessionCode" element={<JoinPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster
            position="top-center"
            expand={false}
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              className: 'toast-responsive',
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                maxWidth: 'calc(100vw - 2rem)',
                margin: '0 auto',
                fontSize: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }
            }}
          />
        </div>
      </Router>
    </PeerSessionProvider>
  );
}

export default App;