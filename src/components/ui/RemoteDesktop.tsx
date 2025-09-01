// Jema Remote Desktop - Remote Desktop Component
// This component manages remote desktop display and control
// Features:
// - Remote screen video stream display
// - Remote control (mouse, keyboard, scroll)
// - Connection and control state management
// - Intuitive user interface for control
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRemoteInput } from '@/hooks/useRemoteInput';
import {
  MaximizeIcon,
  MinimizeIcon,
  VolumeXIcon,
  Volume2Icon,
  SettingsIcon,
  PowerIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemoteDesktopProps {
  stream?: MediaStream;
  isControlling?: boolean;
  onDisconnect?: () => void;
  className?: string;
}

export function RemoteDesktop({ 
  stream, 
  isControlling = false, 
  onDisconnect,
  className 
}: RemoteDesktopProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [scale, setScale] = useState(1);
  
  const {
    sendMouseMove,
    sendMouseClick,
    sendKeyPress,
    sendKeyRelease,
    sendScroll
  } = useRemoteInput(isControlling);

  // Configuration du flux vidéo
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  // Gestion du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Masquage automatique de la barre d'outils
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      setIsToolbarVisible(true);
      timeoutId = setTimeout(() => {
        if (isFullscreen) {
          setIsToolbarVisible(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      if (isFullscreen) {
        resetTimeout();
      }
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
      resetTimeout();
    } else {
      setIsToolbarVisible(true);
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFullscreen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isControlling || !videoRef.current) return;
    
    const rect = videoRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    sendMouseMove(x, y);
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    if (!isControlling || !videoRef.current) return;
    
    e.preventDefault();
    const rect = videoRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    sendMouseClick(x, y, e.button);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isControlling) return;
    
    e.preventDefault();
    sendKeyPress(e.key, e.code, {
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isControlling) return;
    
    e.preventDefault();
    sendKeyRelease(e.key, e.code);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isControlling) return;
    
    e.preventDefault();
    sendScroll(e.deltaX, e.deltaY);
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
      console.error('Erreur lors du basculement en plein écran:', error);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const adjustScale = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(2, newScale)));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {/* Vidéo principale */}
      <div className="relative w-full h-full flex items-center justify-center">
        {stream ? (
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${scale})` }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseClick}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            autoPlay
            playsInline
          />
        ) : (
          <div className="text-center text-white/60">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/10 flex items-center justify-center">
              <SettingsIcon className="h-8 w-8" />
            </div>
            <p>En attente du flux vidéo...</p>
          </div>
        )}
      </div>

      {/* Barre d'outils */}
      <div
        className={cn(
          'absolute bottom-4 left-1/2 transform -translate-x-1/2',
          'bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2',
          'flex items-center gap-2 text-white',
          'transition-opacity duration-300',
          isToolbarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Contrôles de zoom */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustScale(scale - 0.1)}
            className="text-white hover:bg-white/20 h-8 px-2"
          >
            -
          </Button>
          <span className="text-xs px-2 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustScale(scale + 0.1)}
            className="text-white hover:bg-white/20 h-8 px-2"
          >
            +
          </Button>
        </div>

        {/* Contrôles média */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
        >
          {isMuted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
        </Button>

        {/* Plein écran */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
        >
          {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
        </Button>

        {/* Déconnexion */}
        {onDisconnect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="text-white hover:bg-white/20 h-8 w-8 p-0 border-l border-white/20 ml-2 pl-2"
          >
            <PowerIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Indicateur de contrôle */}
      {isControlling && (
        <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-lg text-sm font-medium">
          Contrôle activé
        </div>
      )}
    </div>
  );
}