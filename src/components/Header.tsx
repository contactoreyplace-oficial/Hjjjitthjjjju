import React from 'react';
import { DecoyMode, CameraQualityConfig, CloudConsentConfig } from '../types';
import {
  Shield,
  Lock,
  SwitchCamera,
  Zap,
  Maximize,
  FileText,
  Film,
  Eye,
  Sparkles,
  Terminal,
  Power,
  PowerOff,
  Sliders,
  Smartphone,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { CloudSyncStatus } from './CloudSyncStatus';

interface HeaderProps {
  onSelectDecoy: (mode: DecoyMode) => void;
  onOpenPrivacyMode: () => void;
  onSwitchCamera: () => void;
  onToggleTorch: () => void;
  torchActive: boolean;
  onOpenVault: () => void;
  onOpenLogs: () => void;
  recordingsCount: number;
  eventsCount: number;
  facingMode: 'user' | 'environment';
  isCameraOn: boolean;
  onToggleCameraPower: () => void;
  onOpenQualitySettings: () => void;
  qualityConfig: CameraQualityConfig;
  cloudConsent?: CloudConsentConfig;
  onOpenConsentModal?: () => void;
  onOpenApkModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectDecoy,
  onOpenPrivacyMode,
  onSwitchCamera,
  onToggleTorch,
  torchActive,
  onOpenVault,
  onOpenLogs,
  recordingsCount,
  eventsCount,
  facingMode,
  isCameraOn,
  onToggleCameraPower,
  onOpenQualitySettings,
  qualityConfig,
  cloudConsent,
  onOpenConsentModal,
  onOpenApkModal,
}) => {
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="w-full bg-zinc-950/90 border-b border-zinc-800/80 px-3 py-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Stealth Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shadow-emerald-500/20">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold font-mono tracking-wider text-zinc-100">
              STEALTHCAM <span className="text-emerald-400">PRO</span>
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              VIGILANCIA OCULTA
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 hidden sm:block">
            Grabación en segundo plano • Detección en tiempo real • Guardado Local PWA
          </p>
        </div>
      </div>

      {/* Center/Right Action Bar */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Cloud Firestore Sync Status with local-first consent */}
        <CloudSyncStatus
          cloudConsent={cloudConsent}
          onOpenConsentModal={onOpenConsentModal}
        />

        {/* Network Status Indicator */}
        <div
          className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-red-950/80 border-red-500/60 text-red-200 animate-pulse'
          }`}
          title={isOnline ? 'Conexión de red activa' : 'Alerta: Sin conexión a red (Modo local estricto)'}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-500 animate-ping'}`}></span>
          <span className="hidden lg:inline">{isOnline ? 'RED OK' : 'SIN RED'}</span>
        </div>

        {/* In-App PWA Install Button */}
        <PWAInstallButton />

        {/* APK Offline Download Button */}
        {onOpenApkModal && (
          <button
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 hover:border-cyan-400 px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-white shadow-md shadow-cyan-950/40 transition cursor-pointer"
            title="Descargar APK offline y paquete PWA"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">APK OFFLINE</span>
          </button>
        )}

        {/* Prominent Privacy Mode (Terminal Camuflado) Button */}
        <button
          onClick={onOpenPrivacyMode}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer animate-pulse hover:animate-none"
          title="Modo Privacidad: Cubre toda la pantalla con una interfaz de terminal negro falso impidiendo que miren la cámara"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>MODO PRIVACIDAD</span>
        </button>

        {/* Decoy Dropdown / Quick Locks */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 rounded-lg p-1">
          <span className="text-[10px] font-mono text-zinc-400 px-1 hidden md:inline">
            BLOQUEO:
          </span>
          <button
            onClick={() => onSelectDecoy('terminal')}
            className="px-2 py-1 rounded text-xs font-mono bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 transition-all cursor-pointer flex items-center gap-1"
            title="Terminal Falso (Modo Privacidad con Guardado Local)"
          >
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Terminal</span>
          </button>
          <button
            onClick={() => onSelectDecoy('black')}
            className="px-2 py-1 rounded text-xs font-mono bg-black hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer flex items-center gap-1"
            title="Pantalla 100% Apagada (OLED Negro Puro)"
          >
            <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
            <span>Apagada</span>
          </button>
          <button
            onClick={() => onSelectDecoy('lockscreen')}
            className="px-2 py-1 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer flex items-center gap-1"
            title="Pantalla de Bloqueo Móvil Simulada"
          >
            <Lock className="w-3 h-3 text-zinc-400" />
            <span className="hidden sm:inline">Lock Screen</span>
          </button>
          <button
            onClick={() => onSelectDecoy('calculator')}
            className="px-2 py-1 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer flex items-center gap-1"
            title="Calculadora Funcional Camuflada (PIN: 1234=)"
          >
            <span>Calc</span>
          </button>
          <button
            onClick={() => onSelectDecoy('system-update')}
            className="px-2 py-1 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer hidden lg:flex items-center gap-1"
            title="Actualización del Sistema Simulada"
          >
            <span>Update</span>
          </button>
        </div>

        {/* Camera Power ON / OFF Button */}
        <button
          onClick={onToggleCameraPower}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
            isCameraOn
              ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-300 hover:text-white shadow-emerald-950/40'
              : 'bg-red-950/90 hover:bg-red-900 border border-red-500/80 text-red-200 hover:text-white shadow-red-950/50 animate-pulse'
          }`}
          title={isCameraOn ? "Apagar sensor de cámara (Corta señal física y apaga LED)" : "Encender sensor de cámara (Activar transmisión y detector)"}
        >
          {isCameraOn ? (
            <>
              <Power className="w-3.5 h-3.5 text-emerald-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[11px]">CÁMARA ON</span>
            </>
          ) : (
            <>
              <PowerOff className="w-3.5 h-3.5 text-red-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-[11px]">CÁMARA OFF</span>
            </>
          )}
        </button>

        {/* Quality, Resolution & Background Recording Trigger */}
        <button
          onClick={onOpenQualitySettings}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500/60 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          title="Ajustar Calidad, Resolución y Grabación de Fondo"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold">{qualityConfig.resolution.toUpperCase()}</span>
          <span className="text-[10px] text-zinc-400 hidden xl:inline">{qualityConfig.fps}FPS</span>
          {qualityConfig.backgroundRecording && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Grabación de fondo habilitada"></span>
          )}
        </button>

        {/* Hardware controls */}
        <button
          onClick={onSwitchCamera}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
          title={`Cambiar a cámara ${facingMode === 'user' ? 'trasera' : 'frontal'}`}
        >
          <SwitchCamera className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTorch}
          className={`p-2 rounded-lg border transition-all cursor-pointer ${
            torchActive
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-amber-300'
          }`}
          title="Encender Linterna / Iluminación auxiliar"
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* Vault button */}
        <button
          onClick={onOpenVault}
          className="relative px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          title="Abrir Bóveda de grabaciones"
        >
          <Film className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Bóveda</span>
          {recordingsCount > 0 && (
            <span className="bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.1 rounded-full">
              {recordingsCount}
            </span>
          )}
        </button>

        {/* Event Logs */}
        <button
          onClick={onOpenLogs}
          className="relative px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          title="Registro de incidentes"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Eventos</span>
          {eventsCount > 0 && (
            <span className="bg-zinc-700 text-zinc-200 text-[10px] px-1 py-0.1 rounded-full">
              {eventsCount}
            </span>
          )}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer hidden sm:block"
          title="Pantalla completa"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
