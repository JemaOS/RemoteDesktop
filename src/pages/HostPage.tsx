// Jema Remote Desktop - Host Page
// Design 2025 - Épuré, Élégant, Minimaliste
// Primary Color: #5b64e9
// Responsive: 4" to 50"+ screens, foldables support
// Author: Jema Technology
// Date: 2025

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Monitor,
  Users,
  Copy,
  Share2,
  Play,
  Square,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePeerSession } from '@/contexts/PeerSessionContext';
import { toast } from 'sonner';

export function HostPage() {
  const navigate = useNavigate();
  const {
    state,
    initialize,
    createSession,
    startScreenShare,
    stopScreenShare,
    disconnect,
    clearError
  } = usePeerSession();
  
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  // Initialiser et créer la session au chargement
  useEffect(() => {
    const initAndCreate = async () => {
      try {
        setIsCreating(true);
        
        if (!state.peerId) {
          await initialize();
        }
        
        if (!state.sessionCode) {
          await createSession();
        }
      } catch (error) {
        console.error('Erreur initialisation:', error);
      } finally {
        setIsCreating(false);
      }
    };

    initAndCreate();
  }, []);

  const handleStartSharing = async () => {
    try {
      await startScreenShare();
      toast.success('Partage d\'écran démarré');
    } catch (error) {
      console.error('Erreur partage:', error);
      toast.error('Impossible de démarrer le partage');
    }
  };

  const handleStopSharing = () => {
    stopScreenShare();
    toast.info('Partage arrêté');
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const handleCopyCode = async () => {
    if (state.sessionCode) {
      await navigator.clipboard.writeText(state.sessionCode);
      setCopied('code');
      toast.success('Code copié');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (state.sessionCode) {
      const link = `${window.location.origin}/join/${state.sessionCode}`;
      await navigator.clipboard.writeText(link);
      setCopied('link');
      toast.success('Lien copié');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  // Déterminer l'étape actuelle
  const getStep = () => {
    if (isCreating || !state.sessionCode) return 'creating';
    if (state.status === 'sharing' || state.isScreenSharing) return 'sharing';
    if (state.remotePeerId || state.status === 'connected') return 'connected';
    return 'waiting';
  };

  const step = getStep();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      
      {/* Header */}
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
                  <Monitor className="w-4 h-4 text-white" />
                </div>
                <div className="hidden xs:block">
                  <h1 className="text-sm sm:text-base font-semibold text-foreground">
                    Session Hôte
                  </h1>
                  {state.sessionCode && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {state.sessionCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {step === 'sharing' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-error/10">
                  <div className="w-2 h-2 rounded-full bg-error status-dot-live" />
                  <span className="text-xs font-medium text-error hidden sm:inline">En direct</span>
                </div>
              )}
              {step === 'connected' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(91, 100, 233, 0.1)' }}>
                  <Users className="w-3 h-3" style={{ color: '#5b64e9' }} />
                  <span className="text-xs font-medium hidden sm:inline" style={{ color: '#5b64e9' }}>Connecté</span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="rounded-xl text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              >
                Terminer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-fluid py-6 sm:py-8 lg:py-12">
        {/* Error Alert */}
        {state.error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 animate-fade-in">
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

        {/* Creating State */}
        {step === 'creating' && (
          <div className="max-w-md mx-auto animate-in">
            <Card className="card-elevated">
              <CardContent className="p-6 sm:p-8 text-center">
                <Loader2 
                  className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 animate-spin"
                  style={{ color: '#5b64e9' }}
                />
                <h2 className="text-title text-foreground mb-2">
                  Création de la session...
                </h2>
                <p className="text-caption">
                  Connexion au réseau peer-to-peer
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting State */}
        {step === 'waiting' && state.sessionCode && (
          <div className="max-w-md mx-auto animate-in px-1">
            <Card className="card-elevated">
              <CardContent className="p-4 xs:p-5 sm:p-6">
                {/* Icon - Plus petit sur très petits écrans */}
                <div className="text-center mb-4 xs:mb-5">
                  <div
                    className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-xl xs:rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: 'rgba(91, 100, 233, 0.1)' }}
                  >
                    <Users className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" style={{ color: '#5b64e9' }} />
                  </div>
                  <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-foreground mb-0.5">
                    En attente
                  </h2>
                  <p className="text-xs xs:text-sm text-muted-foreground">
                    Partagez ce code
                  </p>
                </div>
                
                {/* Session Code - Optimisé pour petits écrans */}
                <div className="bg-muted/50 rounded-xl xs:rounded-2xl p-4 xs:p-5 mb-4 xs:mb-5 text-center">
                  <p className="text-[10px] xs:text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Code
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-mono font-bold tracking-[0.15em] xs:tracking-[0.2em] text-foreground">
                    {state.sessionCode}
                  </p>
                </div>
                
                {/* Copy Buttons - Plus compacts */}
                <div className="grid grid-cols-2 gap-2 xs:gap-3 mb-4 xs:mb-5">
                  <Button
                    variant="outline"
                    onClick={handleCopyCode}
                    className="rounded-lg xs:rounded-xl h-10 xs:h-11 text-xs xs:text-sm"
                  >
                    {copied === 'code' ? (
                      <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5" />
                    )}
                    Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="rounded-lg xs:rounded-xl h-10 xs:h-11 text-xs xs:text-sm"
                  >
                    {copied === 'link' ? (
                      <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 text-success" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5" />
                    )}
                    Lien
                  </Button>
                </div>
                
                {/* Start Sharing Button */}
                <Button
                  onClick={handleStartSharing}
                  className="w-full rounded-lg xs:rounded-xl h-11 xs:h-12 sm:h-13 text-sm xs:text-base font-medium"
                  style={{ backgroundColor: '#5b64e9' }}
                >
                  <Play className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2" />
                  Démarrer
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected State */}
        {step === 'connected' && (
          <div className="max-w-md mx-auto animate-in">
            <Card className="card-elevated">
              <CardContent className="p-6 sm:p-8">
                {/* Success Icon */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-success/10">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
                  </div>
                  <h2 className="text-title text-foreground mb-1">
                    Client connecté
                  </h2>
                  <p className="text-caption">
                    Un utilisateur a rejoint votre session
                  </p>
                </div>
                
                {/* Start Sharing Button */}
                <Button 
                  onClick={handleStartSharing}
                  className="w-full rounded-xl h-12 sm:h-14 text-base font-medium"
                  style={{ backgroundColor: '#5b64e9' }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Démarrer le partage
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sharing State */}
        {step === 'sharing' && (
          <div className="max-w-2xl mx-auto animate-in">
            <Card className="card-elevated">
              <CardContent className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-error status-dot-live" />
                    <h2 className="text-title text-foreground">
                      Partage en cours
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleStopSharing}
                    className="rounded-xl border-error/30 text-error hover:bg-error/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Arrêter
                  </Button>
                </div>
                
                {/* Info */}
                <div 
                  className="p-4 rounded-xl mb-6"
                  style={{ backgroundColor: 'rgba(91, 100, 233, 0.05)' }}
                >
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#5b64e9' }} />
                    <p className="text-sm" style={{ color: '#5b64e9' }}>
                      Votre écran est visible par l'utilisateur connecté. 
                      Cliquez sur "Arrêter" pour terminer le partage.
                    </p>
                  </div>
                </div>
                
                {/* Visual Indicator */}
                <div className="bg-muted/30 rounded-2xl p-8 sm:p-12 text-center">
                  <Monitor className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Écran partagé en temps réel
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                    Session: {state.sessionCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}