// Jema Remote Desktop - Session Code Display Component
// This component manages session code display and sharing
// Features:
// - Session code display with formatting
// - QR code generation and display
// - Code copying to clipboard
// - Code sharing via multiple methods
// - Intuitive interface for hosts
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CopyIcon,
  CheckIcon,
  QrCodeIcon,
  TimerIcon,
  ShareIcon,
  LinkIcon,
  SparklesIcon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import QRCode from 'qrcode';

interface SessionCodeDisplayProps {
  sessionCode: string;
  expiresAt: string;
  onShare?: () => void;
}

export function SessionCodeDisplay({ sessionCode, expiresAt, onShare }: SessionCodeDisplayProps) {
  const { copied, copyToClipboard } = useClipboard();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'code' | 'url' | null>(null);
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Génération du QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const connectionUrl = `${window.location.origin}/join/${sessionCode}`;
        const qrUrl = await QRCode.toDataURL(connectionUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
      }
    };
    
    if (sessionCode) {
      generateQR();
    }
  }, [sessionCode]);

  // Calcul du temps restant
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expiré');
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      // Avertissement si moins de 2 minutes
      if (minutes < 2) {
        setIsExpired(false); // Pas encore expiré mais bientôt
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Formater le code avec des espaces pour une meilleure lisibilité
  const formatCode = (code: string) => {
    // Diviser le code en groupes de 3 caractères
    const groups = code.match(/.{1,3}/g) || [];
    return groups.join(' ');
  };

  // Animation de copie
  const triggerCopyAnimation = () => {
    setShowCopyAnimation(true);
    setTimeout(() => setShowCopyAnimation(false), 2000);
  };

  const handleCopyCode = () => {
    copyToClipboard(sessionCode);
    setCopiedType('code');
    triggerCopyAnimation();
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/join/${sessionCode}`;
    copyToClipboard(url);
    setCopiedType('url');
    triggerCopyAnimation();
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Code de session RDP',
          text: `Rejoignez ma session avec le code: ${sessionCode}`,
          url: `${window.location.origin}/join/${sessionCode}`
        });
      } catch (error) {
        console.log('Partage annulé ou non supporté');
      }
    } else if (onShare) {
      onShare();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto relative overflow-hidden">
      {/* Animation de copie */}
      {showCopyAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-green-500/20 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <CheckIcon className="h-16 w-16 text-green-600 animate-bounce" />
          </div>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
            Code de Session
          </span>
          <Badge
            variant={isExpired ? "destructive" : timeLeft.startsWith('1:') || timeLeft.startsWith('0:') ? "secondary" : "outline"}
            className="flex items-center gap-1"
          >
            <TimerIcon className="h-3 w-3" />
            {timeLeft}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Code de session avec format amélioré */}
        <div className="text-center relative">
          <div className={`
            text-3xl font-mono font-bold tracking-wider
            bg-[#f8faff]
            dark:bg-gray-800
            p-6 rounded-xl mb-3
            border-2 ${isExpired ? 'border-red-300 dark:border-red-700' : 'border-blue-200 dark:border-blue-800'}
            transition-all duration-300
            ${showCopyAnimation ? 'scale-105' : 'scale-100'}
          `}>
            <span className="text-[#5b64e9]">
              {formatCode(sessionCode)}
            </span>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant={copiedType === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={handleCopyCode}
              style={copiedType === 'code' ? { backgroundColor: '#5b64e9', borderColor: '#5b64e9' } : { borderColor: '#5b64e9' }}
              className={copiedType === 'code' ? '' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 gap-2 transition-all duration-300'}
              disabled={isExpired}
            >
              {copiedType === 'code' ? (
                <>
                  <CheckIcon className="h-4 w-4 animate-bounce" />
                  Code copié !
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  Copier le code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* QR Code avec animation */}
        {qrCodeUrl && !isExpired && (
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center justify-center gap-1">
              <QrCodeIcon className="h-4 w-4" />
              Scannez pour rejoindre
            </p>
          </div>
        )}

        {/* Actions avec animations */}
        <div className="space-y-2">
          <Button
            variant={copiedType === 'url' ? 'default' : 'outline'}
            onClick={handleCopyUrl}
            style={copiedType === 'url' ? { backgroundColor: '#5b64e9', borderColor: '#5b64e9' } : { borderColor: '#5b64e9' }}
            className={copiedType === 'url' ? 'w-full gap-2 transition-all duration-300' : 'w-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 gap-2 transition-all duration-300'}
            disabled={isExpired}
          >
            {copiedType === 'url' ? (
              <>
                <CheckIcon className="h-4 w-4 animate-bounce" />
                Lien copié !
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                Copier le lien de connexion
              </>
            )}
          </Button>
          
          {(navigator.share || onShare) && (
            <Button
              onClick={handleShare}
              style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}
              className="w-full gap-2 transition-all duration-300"
              disabled={isExpired}
            >
              <ShareIcon className="h-4 w-4" />
              Partager la session
            </Button>
          )}
        </div>

        {/* Instructions avec état dynamique */}
        <div className={`
          p-4 rounded-lg transition-all duration-300
          ${isExpired
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-[#f8faff] dark:bg-gray-800 border border-[#5b64e9]/20'
          }
        `}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${
            isExpired ? 'text-red-900 dark:text-red-100' : 'text-blue-900 dark:text-blue-100'
          }`}>
            {isExpired ? (
              <>
                <AlertCircleIcon className="h-4 w-4" />
                Session expirée
              </>
            ) : (
              <>
                <InfoIcon className="h-4 w-4" />
                Instructions
              </>
            )}
          </h4>
          
          {isExpired ? (
            <p className="text-sm text-red-800 dark:text-red-200">
              Cette session a expiré. Veuillez créer une nouvelle session pour continuer.
            </p>
          ) : (
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-[#5b64e9] mt-1">•</span>
                <span>Partagez ce code avec la personne qui doit se connecter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5b64e9] mt-1">•</span>
                <span>Le code expire dans <strong>{timeLeft}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Une seule connexion autorisée par session</span>
              </li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}