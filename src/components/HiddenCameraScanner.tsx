import React, { useState } from 'react';
import { GlintCandidate } from '../types';
import { Crosshair, Eye, Zap, Radio, AlertTriangle, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { playTacticalAlertSound } from '../utils/audioAlerts';

interface HiddenCameraScannerProps {
  glints: GlintCandidate[];
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  scannerActive: boolean;
  onToggleScanner: () => void;
  torchActive: boolean;
  onToggleTorch: () => void;
}

export const HiddenCameraScanner: React.FC<HiddenCameraScannerProps> = ({
  glints,
  sensitivity,
  onSensitivityChange,
  scannerActive,
  onToggleScanner,
  torchActive,
  onToggleTorch,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'scanner' | 'guide'>('scanner');

  const handleTestBeep = () => {
    if (soundEnabled) {
      playTacticalAlertSound('radar');
    }
  };

  return (
    <div className="bg-zinc-950/85 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
            <Crosshair className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-zinc-100 flex items-center gap-2">
              DETECTOR DE CÁMARAS ESCONDIDAS & IR
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-mono">
                MIL-SPEC
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Escaneo óptico de retro-reflexión en lentes de cristal y emisores infrarrojos 850/940nm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'scanner' ? 'guide' : 'scanner')}
            className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>{activeTab === 'scanner' ? 'Guía de Inspección' : 'Volver a Scanner'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'scanner' ? (
        <div className="space-y-4">
          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Activation status */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-200 block">
                  Sensor Óptico Glint
                </span>
                <span className="text-[10px] text-zinc-400">
                  {scannerActive ? 'Escaneando en tiempo real' : 'Detector en pausa'}
                </span>
              </div>
              <button
                onClick={onToggleScanner}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  scannerActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {scannerActive ? 'ACTIVO' : 'ACTIVAR'}
              </button>
            </div>

            {/* Flashlight / Torch for Glint reflections */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Flash / Luz de Búsqueda
                </span>
                <span className="text-[10px] text-zinc-400">
                  Refleja curvatura del lente espía
                </span>
              </div>
              <button
                onClick={onToggleTorch}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  torchActive
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-900/40'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {torchActive ? 'ENCENDIDO' : 'FLASH'}
              </button>
            </div>

            {/* Sonar / Geiger Beep toggle */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
                  Alerta Sonora Geiger
                </span>
                <span className="text-[10px] text-zinc-400">
                  Beep táctico al detectar lente
                </span>
              </div>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  handleTestBeep();
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {soundEnabled ? 'SONIDO ON' : 'SILENCIOSO'}
              </button>
            </div>
          </div>

          {/* Sensitivity Slider & Live Glints Counter */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">Sensibilidad de Detección de Destellos Ópticos</span>
              <span className="text-red-400 font-bold">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Menor (Solo lentes muy reflectantes)</span>
              <span>Ultra Alta (Detecta micro lentes pinhole ocultos)</span>
            </div>
          </div>

          {/* Live Candidates Detected Display */}
          <div className="border border-zinc-800 rounded-lg p-3 bg-black/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                CANDIDATOS DETECTADOS EN PANTALLA:
                <strong className={glints.length > 0 ? 'text-red-400 text-sm' : 'text-zinc-500'}>
                  {glints.length}
                </strong>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">CALIBRACIÓN AUTOMÁTICA</span>
            </div>

            {glints.length === 0 ? (
              <div className="py-4 text-center text-xs font-mono text-zinc-500 flex flex-col items-center justify-center gap-1">
                <Eye className="w-5 h-5 text-zinc-700" />
                <span>No se detectan reflejos ópticos anómalos ni LEDs infrarrojos en este encuadre.</span>
                <span className="text-[10px] text-zinc-600">
                  Mueva lentamente la cámara hacia tornillos, detectores de humo, espejos o enchufes.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {glints.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-red-950/40 border border-red-500/50 p-2 rounded text-xs font-mono text-red-200"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="font-bold">
                          {g.isIR ? '🚨 EMISOR INFRARROJO (IR SPY)' : '🔍 REFLEJO LENTE ÓPTICO'}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Coordenadas: X:{Math.round(g.x)}, Y:{Math.round(g.y)} | Intensidad: {Math.round(g.intensity)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400">{g.confidence}%</span>
                      <span className="text-[9px] text-zinc-400 block">Probabilidad</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tactical Inspection Guide */
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
            <h4 className="font-semibold text-emerald-400 font-mono mb-1">
              1. ¿Cómo funciona la detección de lentes ópticos?
            </h4>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Todos los lentes de cámaras fotográficas (incluso los micro lentes de 1 mm) están compuestos de vidrio curvado. Al proyectar la luz de la linterna hacia la habitación a oscuras, el cristal del lente devuelve un destello concentrado hacia el sensor (efecto retro-reflexión). Nuestro algoritmo aísla ese destello de alto contraste y te marca su posición exacta con un retículo rojo.
            </p>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
            <h4 className="font-semibold text-cyan-400 font-mono mb-1">
              2. Detección de visión nocturna infrarroja (IR Spy)
            </h4>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Las cámaras de vigilancia ocultas usan diodos infrarrojos (850nm / 940nm) para grabar en la oscuridad. El ojo humano no los puede ver, pero el sensor de esta cámara los captura como un punto brillante violáceo o blanco. Apaga la luz de la habitación y usa el filtro "Infrarrojo B/W" o "Starlight" para detectarlos inmediatamente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/50 p-2.5 rounded border border-zinc-800">
              <span className="font-bold text-amber-400 font-mono block mb-1">Lugares comunes:</span>
              <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
                <li>Detectores de humo falsos</li>
                <li>Cargadores USB de pared</li>
                <li>Tornillos y marcos de fotos</li>
                <li>Espejos de dos vías</li>
                <li>Relojes despertadores de mesa</li>
              </ul>
            </div>
            <div className="bg-black/50 p-2.5 rounded border border-zinc-800">
              <span className="font-bold text-emerald-400 font-mono block mb-1">Recomendación táctica:</span>
              <p className="text-zinc-400 leading-tight">
                Apaga las luces de la habitación, enciende el Flash integrado en la app y barra la habitación a una distancia de 1 a 2 metros apuntando directamente a las esquinas y muebles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
