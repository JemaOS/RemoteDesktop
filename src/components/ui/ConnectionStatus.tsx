import React from 'react';
import { cn } from '@/lib/utils';
import { WifiIcon, WifiOffIcon, LoaderIcon } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'in-session' | 'error';
  serverConnected: boolean;
  connectionState?: RTCPeerConnectionState | null;
  className?: string;
}

export function ConnectionStatus({ 
  status, 
  serverConnected, 
  connectionState, 
  className 
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (!serverConnected) return 'text-red-500';
    
    switch (status) {
      case 'connected':
      case 'in-session':
        return connectionState === 'connected' ? 'text-green-500' : 'text-blue-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (!serverConnected) return 'Serveur déconnecté';
    
    switch (status) {
      case 'connecting':
        return 'Connexion...';
      case 'connected':
        return 'Connecté';
      case 'in-session':
        return connectionState === 'connected' ? 'Session active' : 'En session';
      case 'error':
        return 'Erreur';
      default:
        return 'Déconnecté';
    }
  };

  const getIcon = () => {
    if (!serverConnected || status === 'error') {
      return <WifiOffIcon className="h-4 w-4" />;
    }
    
    if (status === 'connecting') {
      return <LoaderIcon className="h-4 w-4 animate-spin" />;
    }
    
    return <WifiIcon className="h-4 w-4" />;
  };

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors',
      'bg-gray-50 dark:bg-gray-800/50',
      getStatusColor(),
      className
    )}>
      {getIcon()}
      <span>{getStatusText()}</span>
      {connectionState && status === 'in-session' && (
        <span className="text-xs opacity-70">({connectionState})</span>
      )}
    </div>
  );
}