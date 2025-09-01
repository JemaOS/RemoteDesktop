// Jema Remote Desktop - Page de Connexion Client
// Cette page gère la connexion à une session existante en tant que client
// Fonctionnalités:
// - Validation du code de session
// - Connexion à la session de l'hôte
// - Affichage du bureau distant avec contrôle à distance
// - Gestion des états de connexion et de contrôle
// - Interface intuitive pour le client
// Auteur: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeftIcon,
  MonitorIcon,
  WifiIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  MousePointerIcon,
  KeyboardIcon,
  LoaderIcon,
  ShieldCheckIcon,
  XCircleIcon
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { RemoteDesktop } from '@/components/ui/RemoteDesktop';
import { webrtcService } from '@/services/webrtc';

export function JoinPage() {
  const navigate = useNavigate();
  const { sessionCode: urlSessionCode } = useParams<{ sessionCode: string }>();
  const { state, joinSession, disconnect, clearError, validateSessionCode } = useSession();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<'join' | 'validating' | 'connecting' | 'connected' | 'viewing'>('join');
  const [isControlling, setIsControlling] = useState(false);
  const [manualSessionCode, setManualSessionCode] = useState(urlSessionCode || '');
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string>('');

  useEffect(() => {
    // Configuration des callbacks WebRTC
    webrtcService.onRemoteStream((stream) => {
      console.log('📺 Flux distant reçu');
      setRemoteStream(stream);
      setStep('viewing');
    });

    webrtcService.onConnectionStateChange((connectionState) => {
      console.log(`🔗 État de connexion: ${connectionState}`);
      if (connectionState === 'connected') {
        setStep('connected');
      } else if (connectionState === 'disconnected' || connectionState === 'failed') {
        setStep('connecting');
        setRemoteStream(null);
      }
    });

    return () => {
      // Cleanup
    };
  }, []);

  useEffect(() => {
    // Mise à jour de l'étape selon l'état de la session
    if (state.status === 'in-session' && state.targetPeerId) {
      setStep('connected');
    }
  }, [state.status, state.targetPeerId]);

  // Validation du format du code de session
  const validateCodeFormat = (code: string): boolean => {
    // Code de 6 à 8 caractères alphanumériques
    const codeRegex = /^[A-Z0-9]{6,8}$/;
    return codeRegex.test(code);
  };

  const handleJoinSession = async () => {
    const codeToUse = urlSessionCode || manualSessionCode;
    
    if (!codeToUse || codeToUse.trim() === '') {
      setCodeValidationError('Veuillez entrer un code de session');
      return;
    }

    // Validation du format
    if (!validateCodeFormat(codeToUse.toUpperCase())) {
      setCodeValidationError('Le code doit contenir 6 à 8 caractères alphanumériques');
      return;
    }

    setCodeValidationError(null);
    
    try {
      // Étape 1: Validation du code
      setStep('validating');
      setConnectionMessage('Vérification du code de session...');
      
      const isValid = await validateSessionCode(codeToUse.toUpperCase());
      
      if (!isValid) {
        setCodeValidationError('Code de session invalide ou expiré');
        setStep('join');
        return;
      }

      // Étape 2: Connexion
      setStep('connecting');
      setConnectionMessage('Connexion au serveur de signalisation...');
      
      await joinSession(codeToUse.toUpperCase(), 'client');
      
      setConnectionMessage('Établissement de la connexion avec l\'hôte...');
    } catch (error) {
      console.error('Erreur lors de la jointure de session:', error);
      setCodeValidationError(error instanceof Error ? error.message : 'Erreur de connexion');
      setStep('join');
      setConnectionMessage('');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const toggleControl = () => {
    setIsControlling(!isControlling);
  };

  // Si pas de code dans l'URL, afficher le champ de saisie manuelle
  const sessionCode = urlSessionCode || manualSessionCode;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b64e9' }}>
                  <WifiIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rejoindre la Session
                  </h1>
                  {sessionCode && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code: <span className="font-mono font-semibold">{sessionCode.toUpperCase()}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectionStatus 
                status={state.status}
                serverConnected={state.serverConnected}
                connectionState={state.connectionState}
              />
              
              {step === 'viewing' && (
                <Button 
                  onClick={toggleControl}
                  variant={isControlling ? 'default' : 'outline'}
                  style={isControlling ? { backgroundColor: '#5b64e9', borderColor: '#5b64e9' } : {}}
                  className="border-gray-300 dark:border-gray-600"
                >
                  {isControlling ? (
                    <>
                      <KeyboardIcon className="h-4 w-4" />
                      Contrôle Activé
                    </>
                  ) : (
                    <>
                      <MousePointerIcon className="h-4 w-4" />
                      Activer le Contrôle
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Gestion des erreurs */}
        {state.error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {state.error}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-2 h-auto p-1 text-red-600 hover:text-red-800"
              >
                Fermer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Étape 1: Rejoindre la session */}
        {step === 'join' && (
          <div className="max-w-md mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#5b64e9' }}>
                  <WifiIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Rejoindre une Session</CardTitle>
                {!urlSessionCode && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Entrez le code de session partagé par l\'hôte
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Champ de saisie manuelle si pas de code dans l'URL */}
                {!urlSessionCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Code de Session
                    </label>
                    <Input
                      placeholder="ABC123XY"
                      value={manualSessionCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        setManualSessionCode(value);
                        setCodeValidationError(null);
                      }}
                      className="font-mono text-center text-lg tracking-wider"
                      maxLength={8}
                    />
                    {manualSessionCode && !validateCodeFormat(manualSessionCode) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Le code doit contenir 6 à 8 caractères alphanumériques
                      </p>
                    )}
                  </div>
                )}

                {/* Affichage du code si présent dans l'URL */}
                {urlSessionCode && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Code de Session:</p>
                    <p className="text-2xl font-mono font-bold text-center tracking-wider">
                      {urlSessionCode.toUpperCase()}
                    </p>
                  </div>
                )}

                {/* Message d'erreur de validation */}
                {codeValidationError && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {codeValidationError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleJoinSession}
                  className="w-full"
                  style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}
                  disabled={
                    !state.serverConnected ||
                    state.status === 'connecting' ||
                    (!urlSessionCode && (!manualSessionCode || manualSessionCode.length < 6))
                  }
                >
                  {state.status === 'connecting' ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se Connecter'
                  )}
                </Button>
                
                {!state.serverConnected && (
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      Serveur inaccessible. Vérifiez votre connexion internet.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Étape 1.5: Validation du code */}
        {step === 'validating' && (
          <div className="max-w-md mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#5b64e9' }}>
                    <ShieldCheckIcon className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Validation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {connectionMessage || 'Vérification du code de session...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Étape 2: Connexion en cours */}
        {step === 'connecting' && (
          <div className="max-w-md mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: '#5b64e9' }}>
                    <WifiIcon className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Connexion
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {connectionMessage || 'Établissement de la connexion avec l\'hôte...'}
                    </p>
                  </div>
                  
                  {/* Indicateurs de progression */}
                  <div className="space-y-2 text-left max-w-xs mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Code validé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LoaderIcon className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Connexion au serveur</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                      <span className="text-sm text-gray-500">Connexion à l\'hôte</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Étape 3: Connecté, en attente du flux */}
        {step === 'connected' && (
          <div className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CheckCircleIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Connexion réussie! En attente que l\'hôte démarre le partage d\'écran...
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Card className="max-w-md mx-auto border border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#5b64e9' }}>
                    <MonitorIcon className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    En attente du partage d\'écran
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    L\'hôte va bientôt démarrer le partage d\'écran.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Étape 4: Visualisation du bureau distant */}
        {step === 'viewing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              >
                🟢 Active session
              </Badge>
              
              {isControlling && (
                <Badge
                  variant="default"
                  style={{ backgroundColor: '#5b64e9' }}
                >
                  Contrôle activé
                </Badge>
              )}
            </div>
            
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Bureau à Distance
                </h3>
                <RemoteDesktop
                  stream={remoteStream!}
                  isControlling={isControlling}
                  onDisconnect={handleDisconnect}
                  className="w-full h-[70vh] min-h-[500px]"
                />
              </CardContent>
            </Card>
            
            {!isControlling && (
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Mode Visualisation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Vous visualisez l\'écran distant. Cliquez sur "Activer le Contrôle" pour interagir avec l\'ordinateur distant.
                    </p>
                    <Button onClick={toggleControl} style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }} className="gap-2">
                      <MousePointerIcon className="h-4 w-4" />
                      Activer le Contrôle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Actions globales */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Quitter la session
          </Button>
        </div>
      </main>
    </div>
  );
}