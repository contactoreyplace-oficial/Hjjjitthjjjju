import React, { useState, useEffect } from 'react';
import {
  BoundingBox,
  GlintCandidate,
  NightFilterMode,
  HudStyleMode,
  ScreenAspectMode,
  FilterEnhancement,
  DetectionConfig,
  CameraQualityConfig,
} from '../types';
import {
  ShieldAlert,
  Crosshair,
  Eye,
  Flame,
  Moon,
  Video,
  Mic,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Sliders,
  Layers,
  Terminal,
  Radar,
  Activity,
  UserCheck,
  Compass,
  Clock,
  Radio,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Camera,
  FileCode,
} from 'lucide-react';

interface TacticalHUDProps {
  filter: NightFilterMode;
  enhancement: FilterEnhancement;
  onUpdateEnhancement: (enh: Partial<FilterEnhancement>) => void;
  boxes: BoundingBox[];
  glints: GlintCandidate[];
  isRecording: boolean;
  recordingDuration: number;
  motionScore: number;
  personDetected: boolean;
  fps: number;
  audioLevel: number;
  torchActive: boolean;
  hudStyle: HudStyleMode;
  onSetHudStyle: (style: HudStyleMode) => void;
  aspectMode: ScreenAspectMode;
  onSetAspectMode: (mode: ScreenAspectMode) => void;
  detectionBoost: number;
  onSetDetectionBoost: (boost: number) => void;
  onQuickRecordToggle: () => void;
  onDecoyTrigger: () => void;
  onPrivacyTrigger?: () => void;
  onTakeSnapshot?: () => void;
  onTakeVectorSvg?: () => void;
  detectionConfig?: DetectionConfig;
  onToggleDetectionFilter?: (field: keyof DetectionConfig) => void;
  isCameraOn?: boolean;
  onToggleCameraPower?: () => void;
  onOpenQualitySettings?: () => void;
  qualityConfig?: CameraQualityConfig;
  isSimulatedFeed?: boolean;
  onToggleSimulatedFeed?: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  filter,
  enhancement,
  onUpdateEnhancement,
  boxes,
  glints,
  isRecording,
  recordingDuration,
  motionScore,
  personDetected,
  fps,
  audioLevel,
  torchActive,
  hudStyle,
  onSetHudStyle,
  aspectMode,
  onSetAspectMode,
  detectionBoost,
  onSetDetectionBoost,
  onQuickRecordToggle,
  onDecoyTrigger,
  onPrivacyTrigger = () => {},
  onTakeSnapshot,
  onTakeVectorSvg,
  detectionConfig,
  onToggleDetectionFilter = () => {},
  isCameraOn = true,
  onToggleCameraPower = () => {},
  onOpenQualitySettings,
  qualityConfig,
  isSimulatedFeed = false,
  onToggleSimulatedFeed,
}) => {
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [showAspectMenu, setShowAspectMenu] = useState<boolean>(false);
  const [showFiltersDock, setShowFiltersDock] = useState<boolean>(true);

  // In clean mode, autohide controls after inactivity
  useEffect(() => {
    if (hudStyle === 'clean') {
      const timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setControlsVisible(true);
    }
  }, [hudStyle, controlsVisible]);

  const handleViewportInteract = () => {
    if (hudStyle === 'clean') {
      setControlsVisible((prev) => !prev);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 17 Strategic Filters metadata
  const filterLabels: Record<NightFilterMode, { name: string; tag: string; icon: React.ReactNode }> = {
    normal: { name: 'ESTÁNDAR', tag: 'RGB 1080P', icon: <Video className="w-3.5 h-3.5 text-zinc-400" /> },
    'night-white': { name: 'NVG-WP WHITE', tag: 'FÓSFORO BLANCO', icon: <Moon className="w-3.5 h-3.5 text-cyan-200" /> },
    'night-green': { name: 'NVG-3 MILITAR', tag: 'FÓSFORO VERDE', icon: <Moon className="w-3.5 h-3.5 text-emerald-400" /> },
    'fusion-thermal-nvg': { name: 'FUSIÓN TÉRMICA NVG', tag: 'BI-ESPECTRAL FLIR', icon: <Flame className="w-3.5 h-3.5 text-amber-300" /> },
    thermal: { name: 'TERMOGRAFÍA FLIR', tag: 'FIRMA CALÓRICA', icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> },
    'starlight-boost': { name: 'STARLIGHT LUX BOOST', tag: 'ULTRA BAJA LUZ', icon: <Eye className="w-3.5 h-3.5 text-cyan-400" /> },
    'tactical-bw': { name: 'INFRARROJO MONO B/W', tag: 'IR ALTO CONTRASTE', icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-300" /> },
    'edge-matrix': { name: 'MATRIZ DE SILUETAS', tag: 'CONTORNOS EDGE', icon: <Crosshair className="w-3.5 h-3.5 text-teal-400" /> },
    'predator-thermal': { name: 'PREDATOR IRONBOW', tag: 'MULTIESPECTRAL TÉRMICO', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
    'lidar-depth': { name: 'LIDAR LASER 3D', tag: 'TOPOGRAFÍA PROFUNDIDAD', icon: <Radar className="w-3.5 h-3.5 text-teal-300" /> },
    'biometric-pulse': { name: 'PULSO BIOMÉTRICO', tag: 'MICROVASCULAR VITAL', icon: <Activity className="w-3.5 h-3.5 text-rose-400" /> },
    'crypto-uv': { name: 'FORENSE ULTRAVIOLETA', tag: 'LUMINISCENCIA ÓPTICA', icon: <Zap className="w-3.5 h-3.5 text-violet-400" /> },
    'wireframe-cyber': { name: 'MALLA CYBERPUNK 3D', tag: 'POLÍGONOS VECTORIALES', icon: <Activity className="w-3.5 h-3.5 text-yellow-400" /> },
    'solar-invert': { name: 'RAYOS-X SOLAR', tag: 'INVERSIÓN PENETRANTE', icon: <Radio className="w-3.5 h-3.5 text-blue-300" /> },
    'wall-penetrating-radar': { name: 'RADAR TRAS PAREDES', tag: 'MICROONDAS UWB SAR', icon: <Radar className="w-3.5 h-3.5 text-cyan-300" /> },
    'hyperspectral-fabric': { name: 'TRANSPARENCIA TELAS', tag: 'SUB-TERAHERTZ FIBRA', icon: <Layers className="w-3.5 h-3.5 text-amber-300" /> },
    'ir-spectrum': { name: 'ESPECTRO IR & EMISORES', tag: 'ANALIZADOR TÉRMICO IR', icon: <Radio className="w-3.5 h-3.5 text-pink-400" /> },
  };

  const activeFilterInfo = filterLabels[filter] || filterLabels['night-green'];

  return (
    <div
      onClick={handleViewportInteract}
      className="absolute inset-0 select-none flex flex-col justify-between p-2.5 sm:p-4 overflow-hidden pointer-events-none"
    >
      {/* Front-Facing Tactical Screen Illuminator */}
      {enhancement.screenIlluminator && (
        <div className="absolute inset-0 pointer-events-none border-4 sm:border-8 border-cyan-100/50 shadow-[inset_0_0_90px_rgba(200,245,255,0.4)] z-10 transition-all duration-300"></div>
      )}

      {/* 1. CLEAN MODE DISCREET OVERLAY (Visor Súper Limpio) */}
      {hudStyle === 'clean' && (
        <>
          {/* Micro Recording indicator top-right */}
          <div className="w-full flex items-center justify-between pointer-events-auto">
            {isRecording ? (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full border border-red-500/40 text-[10px] font-mono text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>REC {formatTime(recordingDuration)}</span>
              </div>
            ) : (
              <div></div>
            )}

            {/* Quick floating exit button if controls are hidden */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetHudStyle('full');
              }}
              className={`p-1.5 rounded-full bg-black/70 hover:bg-black text-zinc-400 hover:text-white border border-zinc-800 transition-opacity ${
                controlsVisible ? 'opacity-100' : 'opacity-20 hover:opacity-100'
              }`}
              title="Restaurar HUD Completo"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Floating minimal bar when interacted */}
          {controlsVisible && (
            <div className="self-center bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-xs font-mono flex items-center gap-2 pointer-events-auto shadow-2xl animate-fade-in flex-wrap">
              <span className="text-emerald-400 font-bold">{activeFilterInfo.name}</span>
              <span className="text-zinc-600">|</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickRecordToggle();
                }}
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  isRecording ? 'bg-red-600 text-white' : 'bg-emerald-600 text-black'
                }`}
              >
                {isRecording ? 'DETENER' : 'GRABAR'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrivacyTrigger();
                }}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Modo Privacidad: Pantalla terminal falso"
              >
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>PRIVACIDAD</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecoyTrigger();
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full text-[11px]"
              >
                BLOQUEAR
              </button>
              {/* Clean mode camera power toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCameraPower();
                }}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                  isCameraOn
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/90 border border-red-500/70 text-red-200 animate-pulse'
                }`}
                title={isCameraOn ? "Apagar sensor de cámara" : "Encender sensor de cámara"}
              >
                {isCameraOn ? <Power className="w-3 h-3 text-emerald-400" /> : <PowerOff className="w-3 h-3 text-red-400" />}
                <span>{isCameraOn ? 'CAM ON' : 'CAM OFF'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetHudStyle('full');
                }}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                HUD ON
              </button>
            </div>
          )}
          <div className="w-1 h-1"></div>
        </>
      )}

      {/* 2. FULL OR MINIMAL HUD OVERLAYS */}
      {hudStyle !== 'clean' && (
        <>
          {/* Top Tactical Bar */}
          <div className="flex items-start justify-between gap-2 pointer-events-auto">
            {/* Left: Mode Badge, Gain & Boost */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                    {activeFilterInfo.icon}
                    {activeFilterInfo.name}
                  </span>
                  <span className="text-zinc-600 hidden sm:inline">|</span>
                  <span className="text-zinc-300 text-[11px] hidden sm:inline">{activeFilterInfo.tag}</span>
                </div>

                {isSimulatedFeed && (
                  <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/70 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="font-bold">FEED SIMULADO</span>
                    {onToggleSimulatedFeed && (
                      <button
                        onClick={onToggleSimulatedFeed}
                        className="ml-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[9px] cursor-pointer transition-all"
                        title="Intentar conectar cámara física real"
                      >
                        CONECTAR CÁMARA
                      </button>
                    )}
                  </div>
                )}
              </div>

              {hudStyle === 'full' && (
                <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-zinc-400 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur border border-zinc-800">
                  <span>FPS: <strong className="text-zinc-200">{fps}</strong></span>
                  <span className="text-zinc-600">•</span>
                  <span>LUX: <strong className={enhancement.ambientLux !== undefined && enhancement.ambientLux < 10 ? 'text-amber-400 font-bold animate-pulse' : 'text-cyan-400'}>{enhancement.ambientLux !== undefined ? `${enhancement.ambientLux.toFixed(1)} Lux` : 'AUTO'}</strong></span>
                  <span className="text-zinc-600">•</span>
                  <span>GANANCIA: <strong className="text-cyan-400">{enhancement.gain}x</strong></span>
                  {enhancement.autoNightVision && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400 font-semibold">AUTO-NV</span>
                    </>
                  )}
                  {enhancement.tubeVignette && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="text-teal-400">PVS-14</span>
                    </>
                  )}
                  <span className="text-zinc-600">•</span>
                  <span>DETECCIÓN: <strong className={detectionBoost >= 2 ? 'text-amber-400' : 'text-emerald-400'}>{detectionBoost}x FUERZA</strong></span>
                  {detectionConfig?.pirSensitivity !== undefined && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span>PIR: <strong className="text-amber-400">{detectionConfig.pirSensitivity}%</strong></span>
                    </>
                  )}
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    GPS: ACTIVO
                  </span>
                  {torchActive && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="text-amber-400 font-semibold animate-pulse">LINTERNA ON</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Viewport Clean Toggles, Aspect Ratio & Recording status */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                {/* Camera Power ON/OFF Toggle */}
                <button
                  onClick={onToggleCameraPower}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isCameraOn
                      ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300'
                      : 'bg-red-950/90 hover:bg-red-900 border border-red-500/80 text-red-200 animate-pulse'
                  }`}
                  title={isCameraOn ? "Apagar sensor de cámara" : "Encender sensor de cámara"}
                >
                  {isCameraOn ? <Power className="w-3 h-3 text-emerald-400" /> : <PowerOff className="w-3 h-3 text-red-400" />}
                  <span>{isCameraOn ? 'CAM ON' : 'CAM OFF'}</span>
                </button>

                {/* Quality & Resolution trigger */}
                {onOpenQualitySettings && (
                  <button
                    onClick={onOpenQualitySettings}
                    className="bg-black/70 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] font-mono border border-zinc-700 flex items-center gap-1 transition-all cursor-pointer"
                    title="Calidad, Resolución y Grabación de Fondo"
                  >
                    <Sliders className="w-3 h-3 text-emerald-400" />
                    <span>{qualityConfig ? qualityConfig.resolution.toUpperCase() : 'CALIDAD'}</span>
                  </button>
                )}

                {/* Clean Viewport button (Super Limpio) */}
                <button
                  onClick={() => onSetHudStyle(hudStyle === 'full' ? 'minimal' : hudStyle === 'minimal' ? 'clean' : 'full')}
                  className="bg-black/70 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] font-mono border border-zinc-700 flex items-center gap-1 transition-all cursor-pointer"
                  title="Cambiar vista de interfaz"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>
                    {hudStyle === 'full' ? 'VISOR COMPLETO' : 'VISOR MÍNIMO'}
                  </span>
                </button>

                {/* Instant 100% Super Clean button */}
                <button
                  onClick={() => onSetHudStyle('clean')}
                  className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Activar pantalla 100% limpia sin interfaz"
                >
                  <span>100% LIMPIO</span>
                </button>

                {/* Aspect Ratio selector button */}
                <div className="relative">
                  <button
                    onClick={() => setShowAspectMenu(!showAspectMenu)}
                    className="bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    title="Formato de pantalla de cámara"
                  >
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span className="uppercase">{aspectMode}</span>
                  </button>

                  {showAspectMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-32 font-mono text-xs">
                      {(['cover', '16:9', '4:3', '9:16', '1:1', 'contain'] as ScreenAspectMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            onSetAspectMode(mode);
                            setShowAspectMenu(false);
                          }}
                          className={`px-2 py-1 text-left rounded transition-colors text-[11px] ${
                            aspectMode === mode
                              ? 'bg-emerald-600 text-black font-bold'
                              : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          {mode === 'cover' ? 'Llenar (Cover)' : mode === 'contain' ? 'Ajustar (Fit)' : mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recording Indicator & Audio Level */}
              <div className="flex items-center gap-1.5">
                {isRecording ? (
                  <div className="flex items-center gap-2 bg-red-950/90 backdrop-blur-md px-2.5 py-0.5 rounded border border-red-500/70 shadow-lg shadow-red-950/50">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-[11px] font-mono font-bold text-red-200 tracking-wider">
                      REC {formatTime(recordingDuration)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                    <span>STANDBY</span>
                  </div>
                )}

                {/* Audio VU meter */}
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded border border-zinc-800">
                  <Mic className="w-3 h-3 text-zinc-400" />
                  <div className="flex items-center gap-0.5 w-12 h-2 bg-zinc-900 rounded overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const filled = audioLevel > i * 16;
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-full rounded-xs transition-colors duration-75 ${
                            filled
                              ? i > 4
                                ? 'bg-red-500'
                                : i > 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-zinc-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Tactical Crosshair */}
          {hudStyle === 'full' && (
            <div className="absolute inset-8 pointer-events-none border border-emerald-500/10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-40">
                <div className="w-full h-[1px] bg-emerald-400"></div>
                <div className="h-full w-[1px] bg-emerald-400 absolute"></div>
                <div className="w-4 h-4 rounded-full border border-emerald-400 absolute"></div>
              </div>

              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/60"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/60"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/60"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/60"></div>
            </div>
          )}

          {/* Real-Time Motion, Multi-scale Human Bounding Boxes & Biometric Overlays with Z-Index Sorting */}
          {[...boxes]
            .sort((a, b) => {
              const zA = a.depthZ ?? a.personData?.depthZ ?? 1;
              const zB = b.depthZ ?? b.personData?.depthZ ?? 1;
              return zB - zA; // Farther targets first, closer targets on top (3D solidity)
            })
            .map((box, boxIdx) => {
              const isPerson = box.type === 'person';
              const pData = box.personData;
              const boxKey = box.id ? `${box.id}-${boxIdx}` : `box-${boxIdx}`;
              const targetColor =
                box.color ||
                pData?.color ||
                (pData?.wallOcclusionDetected ? '#a855f7' : isPerson ? '#06b6d4' : '#10b981');

              return (
                <div
                  key={boxKey}
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                  }}
                  className={`absolute pointer-events-none transition-all duration-100 ease-out ${
                    isPerson
                      ? 'bg-black/10'
                      : 'border border-emerald-400/80 bg-emerald-500/5'
                  }`}
                >
                  {/* High-Tech Tactical Corner Reticles */}
                  {isPerson && (
                    <>
                      <div
                        className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 shadow-sm"
                        style={{ borderColor: targetColor }}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 shadow-sm"
                        style={{ borderColor: targetColor }}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 shadow-sm"
                        style={{ borderColor: targetColor }}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 shadow-sm"
                        style={{ borderColor: targetColor }}
                      />
                    </>
                  )}

                  {/* Clean Minimalist Header Tag (UID & Confidence) */}
                  <div
                    className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider whitespace-nowrap flex items-center gap-1.5 shadow-lg bg-black/90 backdrop-blur-md border"
                    style={{ borderColor: targetColor, color: targetColor }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ backgroundColor: targetColor }}
                    />
                    <span>{box.uid || box.label}</span>
                    <span className="text-zinc-400 text-[8px] font-normal">({box.confidence}%)</span>
                    {pData?.isAnchored && <span className="text-cyan-300 text-[9px]">🔒</span>}
                    {pData?.wallOcclusionDetected && (
                      <span className="bg-purple-900/90 text-purple-200 px-1 py-0.2 rounded text-[7px] font-bold">
                        UWB
                      </span>
                    )}
                  </div>

                  {/* 3D Depth Ground-Plane Anchor Grid Projection Disc */}
                  {isPerson && (
                    <div
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 pointer-events-none"
                      style={{ width: `${Math.max(64, box.width * 1.15)}px`, height: '24px' }}
                    >
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30">
                        <defs>
                          <radialGradient id={`ground-disc-${boxKey}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={targetColor} stopOpacity="0.45" />
                            <stop offset="70%" stopColor={targetColor} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={targetColor} stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        {/* Perspective floor ellipse */}
                        <ellipse
                          cx="50"
                          cy="15"
                          rx="46"
                          ry="11"
                          fill={`url(#ground-disc-${boxKey})`}
                          stroke={targetColor}
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <ellipse
                          cx="50"
                          cy="15"
                          rx="26"
                          ry="6"
                          fill="none"
                          stroke={targetColor}
                          strokeWidth="1"
                          opacity="0.7"
                        />
                        {/* Vertical axis line connecting body base to floor */}
                        <line
                          x1="50"
                          y1="0"
                          x2="50"
                          y2="15"
                          stroke={targetColor}
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        {/* Ground anchor node */}
                        <circle cx="50" cy="15" r="2.5" fill="#ffffff" stroke={targetColor} strokeWidth="1.5" />
                      </svg>
                      {/* Distance Tag on Ground Plane */}
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-black/90 border whitespace-nowrap shadow-md"
                        style={{ borderColor: targetColor, color: targetColor }}
                      >
                        Z: {(box.depthZ ?? pData?.distanceMeters ?? 2.5).toFixed(1)}m
                      </div>
                    </div>
                  )}

                  {/* Advanced Person Biometric Overlays */}
                  {isPerson && pData && (
                    <>
                      {/* Volumetric Solid & Fluid Body Rendering with Kalman Smoothed Joints */}
                      {pData.joints && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                          <defs>
                            <linearGradient id={`torso-grad-${boxKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor={targetColor} stopOpacity="0.60" />
                              <stop offset="50%" stopColor={targetColor} stopOpacity="0.40" />
                              <stop offset="100%" stopColor={targetColor} stopOpacity="0.25" />
                            </linearGradient>
                            <linearGradient id={`limb-grad-${boxKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                              <stop offset="50%" stopColor={targetColor} stopOpacity="0.55" />
                              <stop offset="100%" stopColor={targetColor} stopOpacity="0.30" />
                            </linearGradient>
                            <radialGradient id={`head-grad-${boxKey}`} cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                              <stop offset="50%" stopColor={targetColor} stopOpacity="0.7" />
                              <stop offset="100%" stopColor={targetColor} stopOpacity="0.2" />
                            </radialGradient>
                          </defs>

                          {/* 1. Volumetric Solid Torso Mesh */}
                          {detectionConfig?.solidBodyVolumetricMesh !== false && (
                            <path
                              d={`
                                M ${box.width * 0.5} ${box.height * 0.20}
                                L ${box.width * 0.26} ${box.height * 0.25}
                                L ${box.width * 0.27} ${box.height * 0.44}
                                L ${box.width * 0.35} ${box.height * 0.60}
                                L ${box.width * 0.50} ${box.height * 0.64}
                                L ${box.width * 0.65} ${box.height * 0.60}
                                L ${box.width * 0.73} ${box.height * 0.44}
                                L ${box.width * 0.74} ${box.height * 0.25}
                                Z
                              `}
                              fill={`url(#torso-grad-${boxKey})`}
                              stroke={targetColor}
                              strokeWidth="1.5"
                              className="transition-all duration-100"
                            />
                          )}

                          {/* 2. Volumetric Solid Limbs (Capsule Segments) */}
                          {detectionConfig?.solidBodyVolumetricMesh !== false && (
                            <g stroke={targetColor} strokeLinecap="round">
                              {/* Left Arm */}
                              <line
                                x1={box.width * 0.26}
                                y1={box.height * 0.25}
                                x2={box.width * 0.18}
                                y2={box.height * 0.42}
                                strokeWidth="5"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              <line
                                x1={box.width * 0.18}
                                y1={box.height * 0.42}
                                x2={box.width * 0.20}
                                y2={box.height * 0.58}
                                strokeWidth="4"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              {/* Right Arm */}
                              <line
                                x1={box.width * 0.74}
                                y1={box.height * 0.25}
                                x2={box.width * 0.82}
                                y2={box.height * 0.42}
                                strokeWidth="5"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              <line
                                x1={box.width * 0.82}
                                y1={box.height * 0.42}
                                x2={box.width * 0.80}
                                y2={box.height * 0.58}
                                strokeWidth="4"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              {/* Left Leg */}
                              <line
                                x1={box.width * 0.35}
                                y1={box.height * 0.60}
                                x2={box.width * 0.32}
                                y2={box.height * 0.78}
                                strokeWidth="6"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              <line
                                x1={box.width * 0.32}
                                y1={box.height * 0.78}
                                x2={box.width * 0.45}
                                y2={box.height * 0.96}
                                strokeWidth="5"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              {/* Right Leg */}
                              <line
                                x1={box.width * 0.65}
                                y1={box.height * 0.60}
                                x2={box.width * 0.68}
                                y2={box.height * 0.78}
                                strokeWidth="6"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                              <line
                                x1={box.width * 0.68}
                                y1={box.height * 0.78}
                                x2={box.width * 0.55}
                                y2={box.height * 0.96}
                                strokeWidth="5"
                                stroke={`url(#limb-grad-${boxKey})`}
                              />
                            </g>
                          )}

                          {/* 3. Volumetric Head & Cranial Visor */}
                          <ellipse
                            cx={box.width * 0.5}
                            cy={box.height * 0.11}
                            rx={Math.max(10, box.width * 0.14)}
                            ry={Math.max(12, box.height * 0.08)}
                            fill={`url(#head-grad-${boxKey})`}
                            stroke={targetColor}
                            strokeWidth="1.5"
                          />
                          <line
                            x1={box.width * 0.42}
                            y1={box.height * 0.11}
                            x2={box.width * 0.58}
                            y2={box.height * 0.11}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />

                          {/* 4. Fine Skeleton Bone Connectors */}
                          {detectionConfig?.personSkeletonDetection && (
                            <g stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.85">
                              <line
                                x1={box.width * 0.5}
                                y1={box.height * 0.11}
                                x2={box.width * 0.5}
                                y2={box.height * 0.20}
                              />
                              <line
                                x1={box.width * 0.5}
                                y1={box.height * 0.20}
                                x2={box.width * 0.5}
                                y2={box.height * 0.60}
                              />
                            </g>
                          )}

                          {/* 5. Kalman Smoothed Skeleton Joints Nodes */}
                          {detectionConfig?.personSkeletonDetection &&
                            pData.joints.map((j, jIdx) => (
                              <g key={`j-${boxKey}-${j.name || jIdx}-${jIdx}`}>
                                <circle
                                  cx={j.x - box.x}
                                  cy={j.y - box.y}
                                  r={jIdx === 0 ? 4.5 : 3}
                                  fill={targetColor}
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                />
                                <circle
                                  cx={j.x - box.x}
                                  cy={j.y - box.y}
                                  r={jIdx === 0 ? 8 : 5}
                                  fill="none"
                                  stroke={targetColor}
                                  strokeWidth="1"
                                  opacity="0.6"
                                />
                              </g>
                            ))}
                        </svg>
                      )}

                      {/* Clean, Sleek Micro-Metrics Telemetry Strip */}
                      <div className="absolute top-full left-0 mt-4 flex items-center gap-1 pointer-events-none text-[8px] font-mono font-bold whitespace-nowrap bg-black/85 backdrop-blur-md border border-zinc-800 px-2 py-0.5 rounded shadow-lg">
                        <span className="text-zinc-200 flex items-center gap-0.5">
                          <Radar className="w-2.5 h-2.5" style={{ color: targetColor }} />
                          {(box.depthZ ?? pData.distanceMeters).toFixed(1)}m
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-amber-300 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          {pData.tempEstimateC}°C
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-teal-300 flex items-center gap-0.5">
                          <Compass className="w-2.5 h-2.5 text-teal-400" />
                          {pData.speedKmh}k/h
                        </span>
                        {pData.loiteringSeconds >= 5 && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-red-400 animate-pulse font-extrabold flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {pData.loiteringSeconds}s
                            </span>
                          </>
                        )}
                        {pData.microMotionScore > 0 && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-purple-300 flex items-center gap-0.5">
                              <Radio className="w-2.5 h-2.5 text-purple-400" />
                              {pData.microMotionScore}%
                            </span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

          {/* Lens Glint & IR Candidate Markers */}
          {glints.map((glint, idx) => (
            <div
              key={`glint-${idx}`}
              style={{
                left: `${glint.x - 20}px`,
                top: `${glint.y - 20}px`,
              }}
              className="absolute w-10 h-10 pointer-events-none flex items-center justify-center"
            >
              <div className="absolute w-10 h-10 rounded-full border-2 border-red-500 animate-ping"></div>
              <div className="absolute w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-950/90 border border-red-500 px-1 py-0.2 rounded text-[8px] font-mono font-bold text-red-200">
                {glint.isIR ? '🚨 IR SPY' : '🔍 LENTE'} ({glint.confidence}%)
              </div>
            </div>
          ))}

          {/* 3. FLOATING DETECTION FILTERS ON/OFF QUICK DOCK (Directamente en pantalla) */}
          {hudStyle === 'full' && detectionConfig && (
            <div className="self-center w-full max-w-4xl bg-black/85 backdrop-blur-md rounded-xl border border-zinc-800/90 p-1.5 shadow-2xl pointer-events-auto transition-all text-xs font-mono">
              <div className="flex items-center justify-between px-1.5 pb-1 border-b border-zinc-800/80 mb-1">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span className="font-bold text-zinc-100">FILTROS DE DETECCIÓN & IA (ON / OFF):</span>
                </div>
                <button
                  onClick={() => setShowFiltersDock(!showFiltersDock)}
                  className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{showFiltersDock ? 'Ocultar' : 'Expandir'}</span>
                  {showFiltersDock ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showFiltersDock && (
                <div className="flex items-center flex-wrap gap-1">
                  {[
                    { key: 'personDetection', label: 'Silueta', icon: '👤' },
                    { key: 'personSkeletonDetection', label: 'Esqueleto', icon: '🦴' },
                    { key: 'personThermalBioDetection', label: 'Térmico', icon: '🌡️' },
                    { key: 'personTrajectoryTracking', label: 'Trayectoria', icon: '🧭' },
                    { key: 'personLoiteringDetection', label: 'Acecho', icon: '⏱️' },
                    { key: 'personProximityDistance', label: 'Radar', icon: '🎯' },
                    { key: 'personMicroMotion', label: 'Micro-Pulso', icon: '🫁' },
                    { key: 'motionDetection', label: 'Movimiento', icon: '🏃' },
                    { key: 'solidBodyVolumetricMesh', label: 'Cuerpo Sólido 3D', icon: '🧬' },
                    { key: 'persistentPersonLock', label: 'Anclaje Persistente', icon: '🔒' },
                    { key: 'throughWallPenetration', label: 'Ver Tras Paredes', icon: '🧱' },
                    { key: 'hiddenCameraScanner', label: 'Cámaras IR', icon: '🔍' },
                    { key: 'soundSpikeDetection', label: 'Audio', icon: '🎙️' },
                  ].map((f) => {
                    const isActive = Boolean(detectionConfig[f.key as keyof DetectionConfig]);
                    return (
                      <button
                        key={f.key}
                        onClick={() => onToggleDetectionFilter(f.key as keyof DetectionConfig)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 font-bold'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                        }`}
                        title={`${f.label}: Toca para encender o apagar`}
                      >
                        <span>{f.icon}</span>
                        <span>{f.label}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bottom Bar: Quick Filter Gain Slider & Detection Force Selector */}
          <div className="flex items-end justify-between gap-2 pointer-events-auto">
            {/* Left: Alerts & Force Toggles */}
            <div className="flex flex-col gap-1.5">
              {personDetected && (
                <div className="flex items-center gap-1.5 bg-red-950/95 border border-red-500 px-2 py-0.5 rounded text-xs font-mono font-bold text-red-100 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>SILUETA HUMANA CONFIRMADA</span>
                </div>
              )}

              {/* Force & Gain Floating Bar */}
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur px-2 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono">
                {/* Gain Booster */}
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400 text-[10px]">AMPLIFICAR:</span>
                  {[1, 2, 4, 8].map((g) => (
                    <button
                      key={g}
                      onClick={() => onUpdateEnhancement({ gain: g })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        enhancement.gain === g
                          ? 'bg-cyan-500 text-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {g}x
                    </button>
                  ))}
                </div>

                <span className="text-zinc-600">|</span>

                {/* Detection Boost */}
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400 text-[10px]">DETECCIÓN:</span>
                  {[1, 2, 3].map((b) => (
                    <button
                      key={b}
                      onClick={() => onSetDetectionBoost(b)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        detectionBoost === b
                          ? b === 3
                            ? 'bg-red-500 text-white'
                            : 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      title={b === 3 ? 'Fuerza Ultra Agresiva' : `Fuerza ${b}x`}
                    >
                      {b === 3 ? '3x MAX' : `${b}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Record, Snapshot, SVG & Privacy Actions */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              {/* Take Photo .JPG */}
              {onTakeSnapshot && (
                <button
                  onClick={onTakeSnapshot}
                  className="bg-amber-950/70 hover:bg-amber-900 text-amber-300 text-xs font-mono px-2 py-1.5 rounded-lg border border-amber-500/50 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-950/40"
                  title="Capturar foto instantánea (.jpg) y guardar en local"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline font-bold">.JPG</span>
                </button>
              )}

              {/* Take Vector .SVG */}
              {onTakeVectorSvg && (
                <button
                  onClick={onTakeVectorSvg}
                  className="bg-purple-950/70 hover:bg-purple-900 text-purple-300 text-xs font-mono px-2 py-1.5 rounded-lg border border-purple-500/50 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-950/40"
                  title="Capturar esquema vectorial táctico (.svg) y guardar en local"
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden xs:inline font-bold">.SVG</span>
                </button>
              )}

              <button
                onClick={onPrivacyTrigger}
                className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-mono px-2 py-1.5 rounded-lg border border-emerald-500/60 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-950/50"
                title="Modo Privacidad (Terminal negro falso con guardado local)"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">PRIVACIDAD</span>
              </button>

              <button
                onClick={onDecoyTrigger}
                className="bg-black/80 hover:bg-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95 hidden sm:flex"
                title="Bloquear pantalla con modo espía"
              >
                <span>BLOQUEAR</span>
              </button>

              <button
                onClick={onQuickRecordToggle}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/60 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/60'
                }`}
                title={isRecording ? "Detener y guardar video local .mp4" : "Iniciar grabación de video local .mp4"}
              >
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-black'}`}></span>
                <span>{isRecording ? 'DETENER .MP4' : 'REC .MP4'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
