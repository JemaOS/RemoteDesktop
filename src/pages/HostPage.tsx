// Jema Remote Desktop - Page Hôte
// Cette page gère la création et le partage de sessions par l'hôte
// Fonctionnalités:
// - Création de sessions avec génération de codes
// - Démarrage et arrêt du partage d'écran
// - Affichage du code de session avec QR code
// - Gestion des états de connexion et de partage
// - Interface intuitive pour l'hôte
// Auteur: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeftIcon,
  ShareIcon,
  MonitorIcon,
  UsersIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  SquareIcon
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { SessionCodeDisplay } from '@/components/ui/SessionCodeDisplay';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { RemoteDesktop } from '@/components/ui/RemoteDesktop';
import { webrtcService } from '@/services/webrtc';

export function HostPage() {
  const navigate = useNavigate();
  const { state, createSession, startScreenShare, stopScreenShare, disconnect, clearError } = useSession();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<'create' | 'waiting' | 'connected' | 'sharing'>('create');

  useEffect(() => {
    // Configuration des callbacks WebRTC
    webrtcService.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });

    webrtcService.onConnectionStateChange((connectionState) => {
      if (connectionState === 'connected') {
        setStep('connected');
      } else if (connectionState === 'disconnected' || connectionState === 'failed') {
        setStep('waiting');
        setRemoteStream(null);
      }
    });

    return () => {
      // Cleanup
    };
  }, []);

  useEffect(() => {
    // Mise à jour de l'étape selon l'état de la session
    if (state.sessionCode && !state.targetPeerId) {
      setStep('waiting');
    } else if (state.targetPeerId && state.connectionState === 'connected') {
      setStep('connected');
    }
  }, [state.sessionCode, state.targetPeerId, state.connectionState]);

  const handleCreateSession = async () => {
    try {
      await createSession();
      setStep('waiting');
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleStartSharing = async () => {
    try {
      await startScreenShare();
      setStep('sharing');
    } catch (error) {
      console.error('Error starting share:', error);
    }
  };

  const handleStopSharing = () => {
    stopScreenShare();
    setStep('connected');
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                style={{ borderColor: '#5b64e9' }}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b64e9' }}>
                  <MonitorIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Session Hôte
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectionStatus 
                status={state.status}
                serverConnected={state.serverConnected}
                connectionState={state.connectionState}
              />
              
              {step !== 'create' && (
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  style={{ borderColor: '#5b64e9' }}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Terminer
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Étape 1: Créer une session */}
        {step === 'create' && (
          <div className="max-w-md mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#5b64e9' }}>
                  <MonitorIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Démarrer le Partage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Partagez votre écran en toute sécurité
                </p>
                
                <Button 
                  onClick={handleCreateSession}
                  className="w-full"
                  style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}
                >
                  Créer une Session
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Étape 2: En attente */}
        {step === 'waiting' && (
          <div className="max-w-md mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#5b64e9' }}>
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">En attente de connexion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Partagez ce code avec la personne qui doit se connecter
                </p>
                
                {state.sessionCode && state.expiresAt && (
                  <SessionCodeDisplay
                    sessionCode={state.sessionCode}
                    expiresAt={state.expiresAt}
                  />
                )}
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleStartSharing}
                    className="w-full"
                    style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Démarrer le Partage
                  </Button>
                  
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    style={{ borderColor: '#5b64e9' }}
                    className="w-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Étape 3: Connecté */}
        {step === 'connected' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Connecté
                </Badge>
                <span className="text-gray-600 dark:text-gray-400">
                  Utilisateur distant connecté
                </span>
              </div>
              
              <Button 
                onClick={handleStartSharing}
                style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Démarrer le Partage
              </Button>
            </div>
          </div>
        )}

        {/* Étape 4: Partage en cours */}
        {step === 'sharing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Partage en cours
                </Badge>
                <span className="text-gray-600 dark:text-gray-400">
                  Partage d'écran actif
                </span>
              </div>
              
              <Button
                onClick={handleStopSharing}
                variant="outline"
                style={{ borderColor: '#5b64e9' }}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <SquareIcon className="h-4 w-4 mr-2" />
                Arrêter le Partage
              </Button>
            </div>
            
            <Alert>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Votre écran est maintenant visible par l'utilisateur connecté. Cliquez sur "Arrêter le Partage" lorsque vous avez terminé.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Bureau distant */}
        {(step === 'connected' || step === 'sharing') && remoteStream && (
          <Card className="border border-gray-200 dark:border-gray-800 mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bureau à Distance
              </h3>
              <RemoteDesktop
                stream={remoteStream}
                isControlling={false}
                onDisconnect={handleDisconnect}
                className="w-full h-[70vh] min-h-[500px]"
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}