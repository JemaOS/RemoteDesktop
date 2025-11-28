// Jema Remote Desktop - Join Page
// Design 2025 - Épuré, Élégant, Minimaliste
// Primary Color: #5b64e9
// Responsive: 4" to 50"+ screens, foldables support
// Author: Jema Technology
// Date: 2025

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Monitor,
  Wifi,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { usePeerSession } from '@/contexts/PeerSessionContext';
import { toast } from 'sonner';

export function JoinPage() {
  const navigate = useNavigate();
  const { sessionCode: urlSessionCode } = useParams<{ sessionCode: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    state, 
    initialize,
    joinSession, 
    disconnect, 
    clearError, 
    validateSessionCode
  } = usePeerSession();
  
  const [manualSessionCode, setManualSessionCode] = useState(urlSessionCode || '');
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialiser PeerJS au chargement
  useEffect(() => {
    if (!state.peerId) {
      initialize().catch(console.error);
    }
  }, []);

  // Si un code est dans l'URL, tenter de se connecter automatiquement
  useEffect(() => {
    if (urlSessionCode && state.peerId && !state.sessionCode) {
      handleJoinSession();
    }
  }, [urlSessionCode, state.peerId]);

  // Configurer le flux vidéo
  useEffect(() => {
    if (videoRef.current && state.remoteStream) {
      videoRef.current.srcObject = state.remoteStream;
      videoRef.current.play().catch(console.error);
    }
  }, [state.remoteStream]);

  // Gestion du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Validation du format du code de session
  const validateCodeFormat = (code: string): boolean => {
    const codeRegex = /^[A-Z0-9]{6,8}$/;
    return codeRegex.test(code);
  };

  const handleJoinSession = async () => {
    const codeToUse = urlSessionCode || manualSessionCode;
    
    if (!codeToUse || codeToUse.trim() === '') {
      setCodeValidationError('Veuillez entrer un code');
      return;
    }

    if (!validateCodeFormat(codeToUse.toUpperCase())) {
      setCodeValidationError('Code invalide (6-8 caractères)');
      return;
    }

    setCodeValidationError(null);
    setIsConnecting(true);
    
    try {
      await joinSession(codeToUse.toUpperCase());
      toast.success('Connecté !');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setCodeValidationError(error instanceof Error ? error.message : 'Erreur de connexion');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Erreur plein écran:', error);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const sessionCode = urlSessionCode || manualSessionCode;
  const isReady = state.peerId !== null;
  const hasRemoteStream = state.remoteStream !== null;

  // Déterminer l'étape actuelle
  const getStep = () => {
    if (isConnecting) return 'connecting';
    if (hasRemoteStream) return 'viewing';
    if (state.status === 'connected') return 'waiting-stream';
    return 'join';
  };

  const step = getStep();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      
      {/* Header - Hidden in fullscreen viewing mode */}
      {!(step === 'viewing' && isFullscreen) && (
        <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
          <div className="container-fluid">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Back & Title */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#5b64e9' }}
                  >
                    <Wifi className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden xs:block">
                    <h1 className="text-sm sm:text-base font-semibold text-foreground">
                      Rejoindre
                    </h1>
                    {state.sessionCode && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {state.sessionCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {step === 'viewing' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-medium text-success hidden sm:inline">En direct</span>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="rounded-xl text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
                >
                  Quitter
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={`${step === 'viewing' ? '' : 'container-fluid py-6 sm:py-8 lg:py-12'}`}>
        {/* Error Alert */}
        {state.error && step !== 'viewing' && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 animate-fade-in max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-error">{state.error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-6 px-2 text-xs text-error hover:bg-error/10"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}

        {/* Join Step */}
        {step === 'join' && (
          <div className="max-w-md mx-auto animate-in">
            <Card className="card-elevated">
              <CardContent className="p-6 sm:p-8">
                {/* Icon */}
                <div className="text-center mb-6">
                  <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgba(91, 100, 233, 0.1)' }}
                  >
                    <Wifi className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#5b64e9' }} />
                  </div>
                  <h2 className="text-title text-foreground mb-1">
                    Rejoindre une session
                  </h2>
                  <p className="text-caption">
                    Entrez le code partagé par l'hôte
                  </p>
                </div>
                
                {/* Code Input */}
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="ABC123"
                      value={manualSessionCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        setManualSessionCode(value);
                        setCodeValidationError(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && manualSessionCode.length >= 6) {
                          handleJoinSession();
                        }
                      }}
                      className={`
                        input-code h-14 sm:h-16
                        ${codeValidationError ? 'border-error focus:ring-error' : 'focus:ring-[#5b64e9]'}
                      `}
                      maxLength={8}
                    />
                    {manualSessionCode.length >= 6 && validateCodeFormat(manualSessionCode) && (
                      <CheckCircle 
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ color: '#5b64e9' }}
                      />
                    )}
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`
                          h-1 flex-1 rounded-full transition-all duration-300
                          ${i < manualSessionCode.length ? 'bg-[#5b64e9]' : 'bg-muted'}
                        `}
                      />
                    ))}
                  </div>
                  
                  {/* Error Message */}
                  {codeValidationError && (
                    <div className="flex items-center gap-2 text-error animate-fade-in">
                      <XCircle className="w-4 h-4" />
                      <p className="text-sm">{codeValidationError}</p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleJoinSession}
                    className="w-full rounded-xl h-12 sm:h-14 text-base font-medium"
                    style={{ backgroundColor: '#5b64e9' }}
                    disabled={!isReady || manualSessionCode.length < 6}
                  >
                    Se connecter
                  </Button>
                  
                  {!isReady && (
                    <div className="flex items-center justify-center gap-2 text-warning">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Initialisation...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && (
          <div className="max-w-md mx-auto animate-in">
            <Card className="card-elevated">
              <CardContent className="p-6 sm:p-8 text-center">
                <Loader2 
                  className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 animate-spin"
                  style={{ color: '#5b64e9' }}
                />
                <h2 className="text-title text-foreground mb-2">
                  Connexion en cours
                </h2>
                <p className="text-caption mb-6">
                  Établissement de la connexion avec l'hôte...
                </p>
                
                {/* Progress Steps */}
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground">Code validé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#5b64e9' }} />
                    <span className="text-sm text-foreground">Connexion au peer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting for Stream Step */}
        {step === 'waiting-stream' && (
          <div className="max-w-md mx-auto animate-in">
            <Card className="card-elevated">
              <CardContent className="p-6 sm:p-8 text-center">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(91, 100, 233, 0.1)' }}
                >
                  <Monitor className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" style={{ color: '#5b64e9' }} />
                </div>
                <h2 className="text-title text-foreground mb-2">
                  Connecté !
                </h2>
                <p className="text-caption">
                  En attente que l'hôte démarre le partage d'écran...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Viewing Step */}
        {step === 'viewing' && state.remoteStream && (
          <div
            ref={containerRef}
            className={`
              ${isFullscreen
                ? 'fixed inset-0 z-50 bg-black'
                : 'container-fluid py-4 sm:py-6 lg:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)]'}
            `}
          >
            {/* Video Container */}
            <div className={`
              relative bg-black rounded-2xl overflow-hidden shadow-2xl
              ${isFullscreen
                ? 'w-full h-full rounded-none'
                : 'aspect-video w-full max-w-5xl max-h-[70vh] mx-auto'}
            `}>
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
              />
              
              {/* Video Controls Overlay */}
              <div className={`
                absolute bottom-0 left-0 right-0 p-4
                bg-gradient-to-t from-black/80 to-transparent
                opacity-0 hover:opacity-100 transition-opacity duration-300
                ${isFullscreen ? 'pb-8' : ''}
              `}>
                <div className="flex items-center justify-between">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-white/90">En direct</span>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="w-9 h-9 rounded-xl text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="w-9 h-9 rounded-xl text-white hover:bg-white/20"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-5 h-5" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Info Card - Hidden in fullscreen */}
            {!isFullscreen && (
              <Card className="card-flat mt-4 w-full max-w-5xl mx-auto">
                <CardContent className="p-4 sm:p-5 text-center">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                    Mode Visualisation
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Vous visualisez l'écran de l'hôte en temps réel
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}