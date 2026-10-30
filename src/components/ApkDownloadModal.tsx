import React, { useState } from 'react';
import { Download, Smartphone, Shield, Check, X, WifiOff, Terminal, HardDrive } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { triggerHapticVibrate } from '../utils/audioAlerts';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    triggerHapticVibrate([60, 30, 60]);
    setDownloadingApk(true);

    setTimeout(() => {
      setDownloadingApk(false);
      setDownloadSuccess(true);

      const a = document.createElement('a');
      a.href = '/downloads/StealthCamPro_v2.4_offline.apk';
      a.download = 'StealthCamPro_v2.4_offline_installer.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col font-mono text-zinc-100">
        
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-3.5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400 tracking-wider">
                DESCARGAR PWA & APK OFFLINE
              </h3>
              <p className="text-[11px] text-zinc-400">
                Instalación nativa y paquete instalador Android sin conexión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-black/60 overflow-y-auto max-h-[75vh]">
          
          {/* Option 1: PWA Native Installation */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white tracking-wider">
                  1. INSTALAR PWA WEB APP NATIVA
                </h4>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                RECOMENDADO
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Instala StealthCam Pro directamente desde tu navegador (Chrome, Edge, Safari). Funciona 100% offline con Service Worker y almacenamiento local en IndexedDB.
            </p>
            {isInstallable ? (
              <button
                onClick={() => {
                  install();
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicación PWA Ahora</span>
              </button>
            ) : isIOS ? (
              <div className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30">
                En iOS Safari: Toca el botón <strong>Compartir</strong> y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
              </div>
            ) : (
              <div className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                La PWA ya está instalada o tu navegador gestiona la instalación mediante el menú de opciones (⋮) → <strong>"Instalar aplicación"</strong>.
              </div>
            )}
          </div>

          {/* Option 2: Android APK Offline Installer */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white tracking-wider">
                  2. DESCARGAR PAQUETE APK OFFLINE (.APK)
                </h4>
              </div>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                ANDROID 8.0+
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Descarga el paquete instalador APK offline empaquetado con todos los recursos estáticos y motor de visión por computadora incorporado para uso autónomo en dispositivos Android.
            </p>

            <button
              onClick={handleDownloadApk}
              disabled={downloadingApk}
              className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 text-black'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-cyan-950/60'
              }`}
            >
              {downloadingApk ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                  <span>Generando APK firmado...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡APK Descargado con Éxito!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar StealthCamPro_offline.apk</span>
                </>
              )}
            </button>
          </div>

          {/* Offline Capabilities Note */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200">Garantía Offline:</strong> Una vez instalada la PWA o el APK, todas las grabaciones de video, fotos espía y registros de seguridad se almacenan de manera local y cifrada en tu dispositivo. Ningún dato sale a la nube a menos que aceptes explícitamente la sincronización con Firestore.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-zinc-900 px-5 py-3 border-t border-emerald-500/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
