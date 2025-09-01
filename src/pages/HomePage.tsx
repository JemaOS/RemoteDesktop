// Jema Remote Desktop - Page d'Accueil
// Cette page gère l'interface principale de l'application
// Fonctionnalités:
// - Navigation vers l'hébergement ou la connexion à une session
// - Validation des codes de session en temps réel
// - Affichage du statut de connexion au serveur
// - Design minimaliste inspiré de Jema Technology
// Auteur: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MonitorIcon,
  UsersIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

export function HomePage() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { state, connectToServer, validateSessionCode } = useSession();

  const handleConnectToServer = async () => {
    if (!state.serverConnected) {
      await connectToServer();
    }
  };

  // Validation du format du code
  const validateCodeFormat = (code: string): boolean => {
    const codeRegex = /^[A-Z0-9]{6,8}$/;
    return codeRegex.test(code);
  };

  // Gestion de la saisie du code
  const handleCodeInput = (value: string) => {
    const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSessionCode(formattedCode);
    setCodeError(null);
  };

  // Validation et redirection vers la page de connexion
  const handleJoinWithCode = async () => {
    if (!sessionCode) {
      setCodeError('Veuillez entrer un code de session');
      return;
    }

    if (!validateCodeFormat(sessionCode)) {
      setCodeError('Le code doit contenir 6 à 8 caractères alphanumériques');
      return;
    }

    setIsValidating(true);
    setCodeError(null);

    try {
      const isValid = await validateSessionCode(sessionCode);
      if (isValid) {
        navigate(`/join/${sessionCode}`);
      } else {
        setCodeError('Code de session invalide ou expiré');
      }
    } catch (error) {
      setCodeError('Erreur lors de la vérification du code');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b64e9' }}>
                <MonitorIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Jema RDP
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectionStatus 
                status={state.status}
                serverConnected={state.serverConnected}
                connectionState={state.connectionState}
              />
              
              {!state.serverConnected && (
                <Button
                  onClick={handleConnectToServer}
                  variant="outline"
                  size="sm"
                  style={{ borderColor: '#5b64e9' }}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Connecter
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Assistance à Distance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Partage d'écran simple pour le support
          </p>
        </div>

        {/* Actions principales */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Héberger une session */}
          <Card className="border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b64e9' }}>
                  <MonitorIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Héberger une Session</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link to="/host" className="block">
                <Button className="w-full" style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}>
                  Héberger
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Rejoindre une session */}
          <Card className="border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b64e9' }}>
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Rejoindre une Session</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Code de Session
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="ABC123XY"
                      value={sessionCode}
                      onChange={(e) => handleCodeInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && sessionCode.length >= 6) {
                          handleJoinWithCode();
                        }
                      }}
                      className={`
                        font-mono text-center text-lg tracking-wider pr-10
                        ${codeError ? 'border-red-500 focus:ring-red-500' : ''}
                      `}
                      maxLength={8}
                    />
                    {sessionCode.length >= 6 && validateCodeFormat(sessionCode) && (
                      <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                    )}
                  </div>
                  
                  {/* Indicateur de progression */}
                  <div className="mt-2 flex gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={`
                          h-1 flex-1 rounded-full transition-all duration-300
                          ${i < sessionCode.length
                            ? 'bg-[#5b64e9]'
                            : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}
                      />
                    ))}
                  </div>
                  
                  {/* Message d'erreur */}
                  {codeError && (
                    <Alert className="mt-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <AlertCircleIcon className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {codeError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <Button
                  className="w-full"
                  style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}
                  disabled={sessionCode.length < 6 || isValidating || !state.serverConnected}
                  onClick={handleJoinWithCode}
                >
                  {isValidating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    'Se Connecter'
                  )}
                </Button>
                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section d'accès rapide */}
        <div className="max-w-4xl mx-auto">
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b64e9' }}>
                    <KeyIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Accès Rapide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rejoindre une session existante ou en créer une nouvelle
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/host">
                    <Button variant="outline" size="sm" style={{ borderColor: '#5b64e9' }} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Héberger
                    </Button>
                  </Link>
                  <Link to="/join">
                    <Button size="sm" style={{ backgroundColor: '#5b64e9', borderColor: '#5b64e9' }}>
                      Rejoindre
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm">
              ©2025 Jema Technology. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}