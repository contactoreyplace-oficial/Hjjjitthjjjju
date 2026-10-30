import React from 'react';
import { NightFilterMode, FilterEnhancement } from '../types';
import {
  Moon,
  Flame,
  Eye,
  Video,
  ShieldAlert,
  Crosshair,
  Sparkles,
  Sun,
  Radar,
  Activity,
  Zap,
  Grid,
  Radio,
  Layers,
  Aperture,
  Sliders,
  Shield,
  Lightbulb,
} from 'lucide-react';

interface FilterSelectorProps {
  currentFilter: NightFilterMode;
  onSelectFilter: (filter: NightFilterMode) => void;
  enhancement: FilterEnhancement;
  onUpdateEnhancement: (enh: Partial<FilterEnhancement>) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  currentFilter,
  onSelectFilter,
  enhancement,
  onUpdateEnhancement,
}) => {
  const ambientLux = enhancement.ambientLux ?? 45;
  const isExtremeDark = ambientLux < 10;
  const isPenumbra = ambientLux >= 10 && ambientLux < 30;

  const getLuxLabel = () => {
    if (ambientLux < 0.5) return 'Oscuridad Absoluta (0.01-0.5 Lux)';
    if (ambientLux < 5) return 'Noche Estelar / Penumbra Extrema (<5 Lux)';
    if (ambientLux < 20) return 'Baja Luminosidad Nocturna (5-20 Lux)';
    if (ambientLux < 80) return 'Iluminación Interior / Sala Penumbra';
    return 'Luz Diurna / Fuerte Iluminación';
  };

  const filters: Array<{
    id: NightFilterMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }> = [
    {
      id: 'night-white',
      title: 'NVG Fósforo Blanco',
      description: 'L3Harris Gen 3+ WP de alto contraste y bajo ruido',
      icon: <Moon className="w-4 h-4 text-cyan-200" />,
      color: 'text-cyan-200 border-cyan-400/50 bg-cyan-950/30',
      badge: 'WP GEN 3+',
    },
    {
      id: 'night-green',
      title: 'NVG Fósforo Verde',
      description: 'Fósforo verde Gen 3 + realce gamma IIT PVS-14',
      icon: <Moon className="w-4 h-4 text-emerald-400" />,
      color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30',
      badge: 'FÓSFORO 3+',
    },
    {
      id: 'fusion-thermal-nvg',
      title: 'Fusión Bi-Espectral',
      description: 'NVG Fósforo Blanco + silueta térmica viva en tiempo real',
      icon: <Flame className="w-4 h-4 text-amber-300" />,
      color: 'text-amber-300 border-amber-400/50 bg-amber-950/30',
      badge: 'FUSIÓN ÓPTICA',
    },
    {
      id: 'predator-thermal',
      title: 'Predator Ironbow',
      description: 'Multiespectral Ironbow de alta discriminación',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      color: 'text-orange-400 border-orange-500/50 bg-orange-950/30',
      badge: 'IRONBOW',
    },
    {
      id: 'thermal',
      title: 'Térmico FLIR',
      description: 'Firma de calor y personas por termografía',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      color: 'text-amber-400 border-amber-500/50 bg-amber-950/30',
      badge: 'CALÓRICO',
    },
    {
      id: 'starlight-boost',
      title: 'Starlight Boost',
      description: 'Penumbra total y acumulación temporal multi-fotón',
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      color: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30',
      badge: 'ULTRA LUZ',
    },
    {
      id: 'lidar-depth',
      title: 'LIDAR Laser 3D',
      description: 'Topografía de profundidad e isolíneas láser',
      icon: <Radar className="w-4 h-4 text-teal-400" />,
      color: 'text-teal-400 border-teal-500/50 bg-teal-950/30',
      badge: 'LIDAR 3D',
    },
    {
      id: 'biometric-pulse',
      title: 'Pulso Biométrico',
      description: 'Amplificación microvascular de piel viva',
      icon: <Activity className="w-4 h-4 text-rose-400" />,
      color: 'text-rose-400 border-rose-500/50 bg-rose-950/30',
      badge: 'BIOPULSO',
    },
    {
      id: 'crypto-uv',
      title: 'Forense UV',
      description: 'Radiación ultravioleta y fluorescencia óptica',
      icon: <Zap className="w-4 h-4 text-violet-400" />,
      color: 'text-violet-400 border-violet-500/50 bg-violet-950/30',
      badge: 'FORENSE UV',
    },
    {
      id: 'wireframe-cyber',
      title: 'Malla Cyberpunk',
      description: 'Matriz vectorial 3D y polígonos neuronales',
      icon: <Grid className="w-4 h-4 text-yellow-400" />,
      color: 'text-yellow-400 border-yellow-500/50 bg-yellow-950/30',
      badge: 'VECTOR 3D',
    },
    {
      id: 'solar-invert',
      title: 'Rayos-X Solar',
      description: 'Inversión dinámica penetrante de siluetas',
      icon: <Radio className="w-4 h-4 text-blue-300" />,
      color: 'text-blue-300 border-blue-500/50 bg-blue-950/30',
      badge: 'RAYOS-X',
    },
    {
      id: 'tactical-bw',
      title: 'Infrarrojo B/W',
      description: 'Monocromo táctico de alto contraste IR',
      icon: <ShieldAlert className="w-4 h-4 text-slate-300" />,
      color: 'text-slate-300 border-slate-500/50 bg-slate-950/30',
      badge: 'IR MONO',
    },
    {
      id: 'edge-matrix',
      title: 'Matriz Edge',
      description: 'Delineado de siluetas en oscuridad absoluta',
      icon: <Crosshair className="w-4 h-4 text-teal-300" />,
      color: 'text-teal-300 border-teal-500/50 bg-teal-950/30',
      badge: 'CONTORNOS',
    },
    {
      id: 'wall-penetrating-radar',
      title: 'Radar Tras Paredes',
      description: 'Microondas UWB SAR penetrante de tabiques y barreras',
      icon: <Radar className="w-4 h-4 text-cyan-300" />,
      color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/30',
      badge: 'RADAR UWB',
    },
    {
      id: 'hyperspectral-fabric',
      title: 'Transparencia Telas',
      description: 'Sub-terahertz para visión a través de ropa y telas',
      icon: <Layers className="w-4 h-4 text-amber-300" />,
      color: 'text-amber-300 border-amber-500/50 bg-amber-950/30',
      badge: 'SUB-THZ',
    },
    {
      id: 'ir-spectrum',
      title: 'Espectro IR & Emisores',
      description: 'Analizador de espectro infrarrojo y fuentes térmicas',
      icon: <Radio className="w-4 h-4 text-pink-400" />,
      color: 'text-pink-400 border-pink-500/50 bg-pink-950/30',
      badge: 'ESPECTRO IR',
    },
    {
      id: 'normal',
      title: 'Estándar',
      description: 'Color natural con ganancia dinámica',
      icon: <Video className="w-4 h-4 text-zinc-300" />,
      color: 'text-zinc-300 border-zinc-700 bg-zinc-900/40',
      badge: 'RGB 1080P',
    },
  ];

  return (
    <div className="w-full bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-3 backdrop-blur-md space-y-3 shadow-xl">
      {/* Header and Filter Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-zinc-100 tracking-wider">
            SISTEMA DE VISIÓN NOCTURNA & SENSORES TÁCTICOS
          </span>
        </div>

        {/* Real-Time Ambient LUX Meter */}
        <div className="flex items-center gap-2 bg-black/60 border border-zinc-800 px-2.5 py-1 rounded-lg font-mono text-[11px]">
          <span className="text-zinc-500">LUX AMBIENTAL:</span>
          <span className={`font-bold ${isExtremeDark ? 'text-red-400 animate-pulse' : isPenumbra ? 'text-amber-400' : 'text-emerald-400'}`}>
            {ambientLux.toFixed(1)} LUX
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 text-[10px] hidden sm:inline">{getLuxLabel()}</span>
        </div>
      </div>

      {/* Grid of 17 Tactical Modes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filters.map((item) => {
          const isSelected = currentFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectFilter(item.id)}
              className={`relative flex flex-col items-start p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? `${item.color} ring-1 ring-emerald-400/50 shadow-lg shadow-black/60 scale-[1.01]`
                  : 'border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={isSelected ? 'text-emerald-400' : 'text-zinc-400'}>{item.icon}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/50 text-zinc-400">
                  {item.badge}
                </span>
              </div>
              <div className="text-xs font-semibold font-mono text-zinc-100">{item.title}</div>
              <div className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">
                {item.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Súper Fuerza de Filtro: Gain (up to 16x Starlight ISO) & Contrast Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-zinc-200">AMPLIFICADOR FOTÓNICO / GANANCIA:</span>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md">
          {/* Ganancia slider up to 16x */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-zinc-300 whitespace-nowrap">Luz: {enhancement.gain}x</span>
            <input
              type="range"
              min="1"
              max="16"
              step="0.5"
              value={enhancement.gain}
              onChange={(e) => onUpdateEnhancement({ gain: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Contraste slider */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-zinc-300 whitespace-nowrap">Contraste: {enhancement.contrast.toFixed(1)}x</span>
            <input
              type="range"
              min="1"
              max="3.5"
              step="0.2"
              value={enhancement.contrast}
              onChange={(e) => onUpdateEnhancement({ contrast: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 4, 8, 16].map((g) => (
            <button
              key={g}
              onClick={() => onUpdateEnhancement({ gain: g })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                enhancement.gain === g
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {g}x
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Night Vision Sub-Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>HERRAMIENTAS PARA PENUMBRA EXTREMA:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Night Vision Toggle */}
          <button
            onClick={() => onUpdateEnhancement({ autoNightVision: !enhancement.autoNightVision })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              enhancement.autoNightVision
                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Activar visión nocturna automáticamente cuando la luz caiga por debajo de 12 Lux"
          >
            <Moon className="w-3 h-3 text-emerald-400" />
            <span>AUTO-NV ({enhancement.autoNightVision ? 'ON' : 'OFF'})</span>
          </button>

          {/* Tactical Tube Vignette (PVS-14) Toggle */}
          <button
            onClick={() => onUpdateEnhancement({ tubeVignette: !enhancement.tubeVignette })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              enhancement.tubeVignette
                ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Simular tubo óptico militar circular PVS-14 con viñeta perimetral"
          >
            <Aperture className="w-3 h-3 text-cyan-400" />
            <span>TUBO PVS-14 ({enhancement.tubeVignette ? 'ACTIVO' : 'PLANO'})</span>
          </button>

          {/* Denoise Filter Toggle */}
          <button
            onClick={() => onUpdateEnhancement({ noiseReduction: !enhancement.noiseReduction })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              enhancement.noiseReduction
                ? 'bg-teal-950/80 border border-teal-500/60 text-teal-300'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Filtro espacial 3x3 para suprimir ruido de sensor / grano ISO en penumbra"
          >
            <Shield className="w-3 h-3 text-teal-400" />
            <span>DENOISE ISO ({enhancement.noiseReduction ? 'ON' : 'OFF'})</span>
          </button>

          {/* Screen Front Illuminator Toggle */}
          <button
            onClick={() => onUpdateEnhancement({ screenIlluminator: !enhancement.screenIlluminator })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              enhancement.screenIlluminator
                ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300 shadow-md shadow-amber-900/30'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Iluminador táctico de pantalla frontal para penumbra absoluta (luz blanca/fósforo perimetral)"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>ILUMINADOR FRONTAL ({enhancement.screenIlluminator ? 'ENCENDIDO' : 'APAGADO'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
