import React, { useState } from 'react';
import { CameraQualityConfig, VideoResolution, VideoFrameRate, VideoBitrateMode } from '../types';
import {
  Sliders,
  Tv,
  Film,
  Zap,
  HardDrive,
  PictureInPicture,
  Volume2,
  Cpu,
  X,
  Check,
  Sparkles,
  Shield,
  Layers,
  Database,
} from 'lucide-react';
import { triggerHapticVibrate } from '../utils/audioAlerts';

interface QualitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  qualityConfig: CameraQualityConfig;
  onChangeQuality: (updated: Partial<CameraQualityConfig>) => void;
  onRequestPiP?: () => void;
  isPiPSupported?: boolean;
  onOpenPrivacyShieldSettings?: () => void;
  totalStorageUsedBytes?: number;
}

export const QualitySettingsModal: React.FC<QualitySettingsModalProps> = ({
  isOpen,
  onClose,
  qualityConfig,
  onChangeQuality,
  onRequestPiP,
  isPiPSupported = true,
  onOpenPrivacyShieldSettings,
  totalStorageUsedBytes = 0,
}) => {
  if (!isOpen) return null;

  const resolutionPresets: {
    id: VideoResolution;
    label: string;
    sub: string;
    dimensions: string;
    badge: string;
  }[] = [
    {
      id: '4k',
      label: '4K Ultra HD',
      sub: 'Máxima evidencia forense, micro-detalles y placas',
      dimensions: '3840 x 2160',
      badge: 'FORENSE ULTRA',
    },
    {
      id: '1080p',
      label: 'Full HD 1080p',
      sub: 'Excelente nitidez recomendada para vigilancia general',
      dimensions: '1920 x 1080',
      badge: 'RECOMENDADO',
    },
    {
      id: '720p',
      label: 'HD 720p',
      sub: 'Optimizado para ahorrar batería y espacio en disco',
      dimensions: '1280 x 720',
      badge: 'EFICIENTE',
    },
    {
      id: '480p',
      label: 'SD 480p',
      sub: 'Modo encubierto de bajo consumo para grabaciones prolongadas',
      dimensions: '640 x 480',
      badge: 'ESPÍA MÍNIMO',
    },
  ];

  const fpsOptions: { fps: VideoFrameRate; label: string; desc: string }[] = [
    { fps: 60, label: '60 FPS', desc: 'Ultra Fluido (Objetivos rápidos)' },
    { fps: 30, label: '30 FPS', desc: 'Estándar Táctico (Recomendado)' },
    { fps: 24, label: '24 FPS', desc: 'Cinemático' },
    { fps: 15, label: '15 FPS', desc: 'Modo Espía (Ahorro de batería)' },
  ];

  const bitrateOptions: { id: VideoBitrateMode; label: string; bitrate: string; desc: string }[] = [
    { id: 'ultra', label: 'Ultra (12 Mbps)', bitrate: '12 Mbps', desc: 'Sin compresión visible' },
    { id: 'high', label: 'Alta (6 Mbps)', bitrate: '6 Mbps', desc: 'Balance perfecto calidad/peso' },
    { id: 'balanced', label: 'Equilibrada (2.5 Mbps)', bitrate: '2.5 Mbps', desc: 'Archivos livianos' },
    { id: 'stealth', label: 'Comprimida (800 Kbps)', bitrate: '0.8 Mbps', desc: 'Grabación de horas sin llenar memoria' },
  ];

  const getEstimatedSizePerMinute = () => {
    switch (qualityConfig.bitrate) {
      case 'ultra':
        return '~90 MB / min';
      case 'high':
        return '~45 MB / min';
      case 'balanced':
        return '~19 MB / min';
      case 'stealth':
        return '~6 MB / min';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2">
                <span>CALIDAD, RESOLUCIÓN & GRABACIÓN DE FONDO</span>
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">
                Ajusta resolución de captura, tasa de fotogramas y persistencia oculta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-5 font-mono text-xs">
          {/* Section 1: Resolution */}
          <div>
            <label className="flex items-center justify-between text-zinc-300 font-bold mb-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Tv className="w-3.5 h-3.5" />
                Resolución de Grabación & Sensor
              </span>
              <span className="text-[10px] text-zinc-500">Estimado: {getEstimatedSizePerMinute()}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resolutionPresets.map((preset) => {
                const isSelected = qualityConfig.resolution === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      triggerHapticVibrate([40]);
                      onChangeQuality({ resolution: preset.id });
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-100">{preset.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{preset.sub}</p>
                    <span className="text-[9px] text-zinc-500 mt-1.5">{preset.dimensions}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: FPS & Bitrate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FPS */}
            <div>
              <label className="block text-zinc-300 font-bold mb-2 flex items-center gap-1.5 text-emerald-400">
                <Film className="w-3.5 h-3.5" />
                Fotogramas por Segundo (FPS)
              </label>
              <div className="space-y-1.5">
                {fpsOptions.map((opt) => {
                  const isSelected = qualityConfig.fps === opt.fps;
                  return (
                    <button
                      key={opt.fps}
                      onClick={() => {
                        triggerHapticVibrate([30]);
                        onChangeQuality({ fps: opt.fps });
                      }}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-500 text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div>
                        <span className="font-bold">{opt.label}</span>
                        <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bitrate / Quality Mode */}
            <div>
              <label className="block text-zinc-300 font-bold mb-2 flex items-center gap-1.5 text-emerald-400">
                <HardDrive className="w-3.5 h-3.5" />
                Compresión & Tasa de Bits
              </label>
              <div className="space-y-1.5">
                {bitrateOptions.map((opt) => {
                  const isSelected = qualityConfig.bitrate === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        triggerHapticVibrate([30]);
                        onChangeQuality({ bitrate: opt.id });
                      }}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-500 text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div>
                        <span className="font-bold">{opt.label}</span>
                        <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Background Recording (Grabación de Fondo) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PictureInPicture className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-200 text-xs">
                    Grabación de Fondo & Modo Pantalla Apagada
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Mantiene el sensor y la grabación activa al minimizar o bloquear
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={qualityConfig.backgroundRecording}
                  onChange={(e) => {
                    triggerHapticVibrate([40]);
                    onChangeQuality({ backgroundRecording: e.target.checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-400">
              <div className="flex items-start gap-1.5 bg-black/40 p-2 rounded-lg border border-zinc-800/80">
                <Cpu className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Wake Lock Activo:</strong> Previene que el procesador del dispositivo entre en suspensión profunda.
                </span>
              </div>

              <div className="flex items-start gap-1.5 bg-black/40 p-2 rounded-lg border border-zinc-800/80">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Heartbeat de Audio:</strong> Mantiene el subproceso del navegador despierto con frecuencia inaudible.
                </span>
              </div>
            </div>

            {/* Picture-in-Picture trigger button */}
            {onRequestPiP && (
              <div className="pt-1 flex items-center justify-between border-t border-zinc-800/70">
                <span className="text-[11px] text-zinc-400">
                  Ventana Flotante (PiP) para monitoreo en segundo plano:
                </span>
                <button
                  onClick={() => {
                    triggerHapticVibrate([50]);
                    onRequestPiP();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <PictureInPicture className="w-3.5 h-3.5" />
                  <span>Activar PiP Ahora</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Compresión Adaptativa & Analizador de Espectro IR */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-xs">
                    Compresión Adaptativa (.mp4) & Espectro IR
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Elimina fotogramas estáticos sin movimiento y detecta emisores IR externos
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Adaptive Compression Toggle */}
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-zinc-800">
                <div>
                  <div className="font-bold text-zinc-200 text-[11px]">Compresión Adaptativa</div>
                  <div className="text-[9px] text-zinc-400">Reduce tamaño .mp4 omitiendo estáticos</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityConfig.adaptiveCompression !== false}
                    onChange={(e) => {
                      triggerHapticVibrate([40]);
                      onChangeQuality({ adaptiveCompression: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* IR Spectrum Analyzer Toggle */}
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-zinc-800">
                <div>
                  <div className="font-bold text-zinc-200 text-[11px]">Analizador Espectro IR</div>
                  <div className="text-[9px] text-zinc-400">Detecta emisores IR externos y calor</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityConfig.irSpectrumAnalyzer !== false}
                    onChange={(e) => {
                      triggerHapticVibrate([40]);
                      onChangeQuality({ irSpectrumAnalyzer: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Escudo de Privacidad & Reconocimiento Facial (Proximidad Adaptativa) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-xs">
                    Escudo de Privacidad & Proximidad Adaptativa (IA)
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Alterna automáticamente Blur y Máscaras Digitales según la distancia del objetivo
                  </p>
                </div>
              </div>

              {onOpenPrivacyShieldSettings && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticVibrate([40]);
                    onOpenPrivacyShieldSettings();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {qualityConfig.privacyShield?.enabled ? 'Escudo ACTIVO' : 'Configurar Escudo'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Section 5: Gestión de Cuotas de Almacenamiento Local */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-xs">
                    Gestión de Cuotas & Límite de Almacenamiento Local
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Controla el espacio máximo ocupado en IndexedDB y auto-purgado de archivos antiguos
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-1.5 bg-black/50 p-3 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-300">Espacio Ocupado por Grabaciones:</span>
                <span className="text-cyan-400 font-bold">
                  {(totalStorageUsedBytes / (1024 * 1024)).toFixed(2)} MB / {qualityConfig.maxLocalStorageGb === 0 ? 'Ilimitado' : `${qualityConfig.maxLocalStorageGb} GB`}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: qualityConfig.maxLocalStorageGb === 0
                      ? '15%'
                      : `${Math.min(100, ((totalStorageUsedBytes / (1024 * 1024 * 1024)) / qualityConfig.maxLocalStorageGb) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>0 GB</span>
                <span>Límite: {qualityConfig.maxLocalStorageGb === 0 ? 'Sin Límite' : `${qualityConfig.maxLocalStorageGb} GB`}</span>
              </div>
            </div>

            {/* Quota Limit Selector */}
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Límite Máximo de Cuota Local:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 5, 10, 0].map((gb) => {
                  const isSelected = (qualityConfig.maxLocalStorageGb ?? 5) === gb;
                  return (
                    <button
                      key={gb}
                      onClick={() => {
                        triggerHapticVibrate([30]);
                        onChangeQuality({ maxLocalStorageGb: gb });
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 border-cyan-400 text-black shadow-md'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {gb === 0 ? 'Ilimitado' : `${gb} GB`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Purge Oldest Toggle */}
            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-zinc-800">
              <div>
                <div className="font-bold text-zinc-200 text-[11px]">Borrado Automático de Antiguos (FIFO)</div>
                <div className="text-[9px] text-zinc-400">Elimina los videos más antiguos al superar el límite de cuota</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={qualityConfig.autoPurgeOldest !== false}
                  onChange={(e) => {
                    triggerHapticVibrate([40]);
                    onChangeQuality({ autoPurgeOldest: e.target.checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between font-mono text-xs">
          <div className="text-zinc-500 text-[10px]">
            Activo: {qualityConfig.resolution.toUpperCase()} @ {qualityConfig.fps}FPS ({qualityConfig.bitrate})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold cursor-pointer transition-all"
          >
            GUARDAR Y APLICAR
          </button>
        </div>
      </div>
    </div>
  );
};
