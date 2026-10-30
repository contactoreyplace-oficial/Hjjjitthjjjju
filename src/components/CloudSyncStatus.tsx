import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logoutFirebase, testConnection } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Cloud, CloudCheck, CloudOff, LogIn, LogOut, User, Shield, HardDrive, CheckCircle } from 'lucide-react';
import { CloudConsentConfig } from '../types';

interface CloudSyncStatusProps {
  cloudConsent?: CloudConsentConfig;
  onOpenConsentModal?: () => void;
}

export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({
  cloudConsent,
  onOpenConsentModal,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    testConnection().then((connected) => setIsCloudConnected(connected));
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleAuth = async () => {
    setIsLoading(true);
    if (currentUser) {
      await logoutFirebase();
    } else {
      await loginWithGoogle();
    }
    setIsLoading(false);
  };

  const isAccepted = !!cloudConsent?.accepted;

  return (
    <div className="flex items-center gap-1.5 font-mono">
      {/* Cloud Acceptance status button */}
      {onOpenConsentModal && (
        <button
          onClick={onOpenConsentModal}
          className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
            isAccepted
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
              : 'bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:border-zinc-500'
          }`}
          title="Configuración de Privacidad y Consentimiento de Nube"
        >
          {isAccepted ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Nube: Aceptada</span>
            </>
          ) : (
            <>
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Guardado: 100% Local</span>
            </>
          )}
        </button>
      )}

      {/* Firebase Account status */}
      {currentUser ? (
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700 px-2 py-1 rounded-lg text-xs text-zinc-300">
          <Cloud className={`w-3.5 h-3.5 ${isAccepted ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span className="max-w-[100px] truncate hidden sm:inline" title={currentUser.email || ''}>
            {currentUser.displayName || currentUser.email?.split('@')[0]}
          </span>
          <button
            onClick={handleToggleAuth}
            disabled={isLoading}
            className="text-zinc-400 hover:text-red-400 ml-1 cursor-pointer"
            title="Cerrar sesión en la nube"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleToggleAuth}
          disabled={isLoading}
          className="bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 px-2 py-1 rounded-lg text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
          title="Conectar cuenta Google para habilitar opción de nube"
        >
          <Cloud className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Conectar Nube</span>
        </button>
      )}
    </div>
  );
};

