import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-mono font-bold text-black shadow-lg shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
        title="Instalar como aplicación nativa en tu dispositivo (PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>INSTALAR PWA</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 px-2.5 py-1.5 text-xs font-mono text-zinc-200 hover:text-white transition cursor-pointer"
          title="Instalar en iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl text-zinc-100 font-sans">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-semibold font-mono text-white">
                    Instalar en iPhone o iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </span>
                  <p>
                    Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra inferior de Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </span>
                  <p>
                    Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </span>
                  <p>
                    Toca <strong>"Agregar"</strong> en la esquina superior derecha para ejecutarla como app nativa a pantalla completa.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-mono font-bold text-black transition"
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
