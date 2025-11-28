// Jema Remote Desktop - Home Page
// Design 2025 - Épuré, Élégant, Minimaliste
// Primary Color: #5b64e9
// Responsive: 4" to 50"+ screens - NO SCROLL on small screens
// Author: Jema Technology
// Date: 2025

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Monitor,
  Users,
  ArrowRight,
  CheckCircle,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { usePeerSession } from '@/contexts/PeerSessionContext';

export function HomePage() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { state, initialize, validateSessionCode } = usePeerSession();

  useEffect(() => {
    if (state.status === 'disconnected') {
      initialize().catch(console.error);
    }
  }, []);

  const validateCodeFormat = (code: string): boolean => {
    return /^[A-Z0-9]{6,8}$/.test(code);
  };

  const handleCodeInput = (value: string) => {
    const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSessionCode(formattedCode);
    setCodeError(null);
  };

  const handleJoinWithCode = async () => {
    if (!sessionCode || !validateCodeFormat(sessionCode)) {
      setCodeError('Code invalide');
      return;
    }

    setIsValidating(true);
    try {
      const isValid = await validateSessionCode(sessionCode);
      if (isValid) {
        navigate(`/join/${sessionCode}`);
      } else {
        setCodeError('Code invalide');
      }
    } catch {
      setCodeError('Erreur');
    } finally {
      setIsValidating(false);
    }
  };

  const isReady = state.status === 'ready' || state.peerId !== null;

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header - Compact */}
      <header className="flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="px-3 xs:px-4 h-12 xs:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 xs:w-8 xs:h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#5b64e9' }}
            >
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <span className="text-base xs:text-lg font-semibold">Jema RDP</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {isReady ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Flex grow to fill space */}
      <main className="flex-1 flex flex-col justify-center px-3 xs:px-4 py-3 xs:py-4 overflow-hidden">
        {/* Logo & Title - Compact */}
        <div className="text-center mb-4 xs:mb-5">
          {/* Logo */}
          <img
            src="/logo.svg"
            alt="Jema Logo"
            className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto mb-2 xs:mb-3"
          />
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            Partage d'écran
          </h1>
          <p className="text-xs xs:text-sm text-muted-foreground mt-1">
            Connexion pair-à-pair chiffrée
          </p>
        </div>

        {/* Action Cards - Compact Grid */}
        <div className="grid grid-cols-1 gap-3 xs:gap-4 max-w-lg mx-auto w-full">
          {/* Host Card */}
          <div className="bg-card border border-border rounded-xl p-3 xs:p-4">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#5b64e9' }}
              >
                <Monitor className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm xs:text-base font-semibold text-foreground">
                  Partager mon écran
                </h2>
              </div>
            </div>
            
            <Link to="/host" className="block">
              <Button 
                className="w-full h-10 xs:h-11 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#5b64e9' }}
                disabled={!isReady}
              >
                Héberger
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Join Card */}
          <div className="bg-card border border-border rounded-xl p-3 xs:p-4">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#5b64e9' }}
              >
                <Users className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm xs:text-base font-semibold text-foreground">
                  Rejoindre
                </h2>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="CODE"
                  value={sessionCode}
                  onChange={(e) => handleCodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && sessionCode.length >= 6) {
                      handleJoinWithCode();
                    }
                  }}
                  className={`
                    h-10 xs:h-11 rounded-lg text-center font-mono text-sm xs:text-base tracking-wider uppercase
                    ${codeError ? 'border-red-500' : ''}
                  `}
                  maxLength={8}
                />
                {sessionCode.length >= 6 && validateCodeFormat(sessionCode) && (
                  <CheckCircle 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: '#5b64e9' }}
                  />
                )}
              </div>
              
              <Button
                className="h-10 xs:h-11 px-4 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#5b64e9' }}
                disabled={sessionCode.length < 6 || isValidating || !isReady}
                onClick={handleJoinWithCode}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'OK'
                )}
              </Button>
            </div>
            
            {codeError && (
              <p className="text-xs text-red-500 mt-1.5 text-center">{codeError}</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="flex-shrink-0 py-2 xs:py-3 text-center">
        <p className="text-[10px] xs:text-xs text-muted-foreground/60">
          © 2025 Jema Technology
        </p>
      </footer>
    </div>
  );
}