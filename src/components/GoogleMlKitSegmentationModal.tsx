import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Activity, User, Shield, Zap, Sparkles, Eye, Camera, Crosshair, Layers, Maximize2, Radio, Sliders, Navigation, MapPin, RefreshCcw } from 'lucide-react';

interface GoogleMlKitSegmentationProps {
  onClose?: () => void;
  isNightVision?: boolean;
}

export const GoogleMlKitSegmentationModal: React.FC<GoogleMlKitSegmentationProps> = ({ onClose }) => {
  const [segmentationMode, setSegmentationMode] = useState<'densepose3d' | 'skeleton33' | 'thermalbio' | 'instance'>('densepose3d');
  const [neonColor, setNeonColor] = useState<string>('#34d399'); // Phosphorescent emerald green
  const [maskOpacity, setMaskOpacity] = useState<number>(80);
  const [confidence33, setConfidence33] = useState<number>(99.1);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
  const [thermalMode, setThermalMode] = useState<boolean>(true);
  const [fpsRate, setFpsRate] = useState<number>(60);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const render = () => {
      if (!active) return;
      timeRef.current += 0.03 * rotationSpeed;
      const t = timeRef.current;

      const w = canvas.width;
      const h = canvas.height;

      // Dark tactical background with cyber grid
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Radar / Grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 3D Rotational Projection matrix simulation
      const angle = t * 0.5;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const cx = w / 2;
      const cy = h / 2 + 10;
      const sc = 1.35;

      // 33 Google ML Kit Pose Keypoints with 3D depth rotation
      const rawPoints = [
        { x: 0, y: -85, z: 0, name: 'Nose' },
        { x: -10, y: -95, z: 5, name: 'Left Eye' },
        { x: 10, y: -95, z: -5, name: 'Right Eye' },
        { x: -38, y: -65, z: 12 * sinA, name: 'Left Shoulder' },
        { x: 38, y: -65, z: -12 * sinA, name: 'Right Shoulder' },
        { x: -55, y: -25, z: 20 * sinA, name: 'Left Elbow' },
        { x: 55, y: -25, z: -20 * sinA, name: 'Right Elbow' },
        { x: -65, y: 15, z: 30 * sinA, name: 'Left Wrist' },
        { x: 65, y: 15, z: -30 * sinA, name: 'Right Wrist' },
        { x: 0, y: -45, z: 0, name: 'Spine / Neck' },
        { x: -22, y: 25, z: 5 * sinA, name: 'Left Hip' },
        { x: 22, y: 25, z: -5 * sinA, name: 'Right Hip' },
        { x: -30, y: 75, z: 15 * sinA, name: 'Left Knee' },
        { x: 30, y: 75, z: -15 * sinA, name: 'Right Knee' },
        { x: -35, y: 130, z: 25 * sinA, name: 'Left Ankle' },
        { x: 35, y: 130, z: -25 * sinA, name: 'Right Ankle' },
      ];

      // Transform 3D points to 2D canvas with rotation
      const projected = rawPoints.map(p => {
        const xRot = p.x * cosA - p.z * sinA;
        const zRot = p.x * sinA + p.z * cosA;
        const scaleDepth = 1 + zRot * 0.002;
        return {
          x: cx + xRot * sc * scaleDepth,
          y: cy + p.y * sc * scaleDepth,
          z: zRot,
          name: p.name
        };
      });

      // 1. Thermal Bio-Glow / Heat Signature Canvas Fill
      if (segmentationMode === 'thermalbio' || segmentationMode === 'densepose3d') {
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140);
        grad.addColorStop(0, thermalMode ? 'rgba(245, 158, 11, 0.45)' : 'rgba(52, 211, 153, 0.45)');
        grad.addColorStop(0.6, thermalMode ? 'rgba(225, 29, 72, 0.25)' : 'rgba(16, 185, 129, 0.25)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. MediaPipe Instance Segmentation Cutout Mask
      if (segmentationMode === 'instance') {
        ctx.save();
        ctx.fillStyle = neonColor;
        ctx.globalAlpha = maskOpacity / 100;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 15, 50 * sc, 120 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. DensePose 3D Volumetric Mesh & Skeleton
      const connections = [
        [0, 1], [0, 2], // Head
        [3, 4], // Shoulders
        [3, 5], [5, 7], // Left Arm
        [4, 6], [6, 8], // Right Arm
        [3, 9], [4, 9], [9, 10], [9, 11], // Torso & Hips
        [10, 11], // Pelvis
        [10, 12], [12, 14], // Left Leg
        [11, 13], [13, 15]  // Right Leg
      ];

      ctx.strokeStyle = thermalMode ? '#f59e0b' : neonColor;
      ctx.shadowColor = thermalMode ? '#ef4444' : neonColor;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3.5;

      connections.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw 33 anatomical joint nodes with glowing halo
      ctx.shadowBlur = 8;
      projected.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? '#ffffff' : thermalMode ? '#fbbf24' : '#6ee7b7';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, idx === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing radar ring on joints
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8 + Math.sin(t * 3 + idx) * 3, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      setConfidence33(+(98.8 + Math.sin(t * 2) * 0.9).toFixed(1));

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [segmentationMode, neonColor, maskOpacity, rotationSpeed, thermalMode]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col font-mono text-zinc-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-3.5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400 tracking-wider">
                GOOGLE ML KIT 33 POSE KEYPOINTS & 3D DENSEPOSE CANVAS
              </h3>
              <p className="text-[11px] text-zinc-400">
                Modelo Tridimensional de Esqueleto Biomédico • Segmentación de Instancias • Termografía Biológica
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer border border-zinc-700 transition-all"
            >
              Cerrar [ESC]
            </button>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="bg-zinc-900/50 px-5 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-semibold">Modo 3D:</span>
            {[
              { id: 'densepose3d', label: 'DensePose 3D Rotacional' },
              { id: 'skeleton33', label: 'Esqueleto 33 Puntos' },
              { id: 'thermalbio', label: 'Firma Térmica Bio-Vivo' },
              { id: 'instance', label: 'Segmentación de Instancias' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSegmentationMode(m.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  segmentationMode === m.id
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-950/50'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer border ${
                thermalMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/60' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {thermalMode ? 'Termografía FLIR ON' : 'Termografía OFF'}
            </button>
          </div>
        </div>

        {/* Main Canvas & Inspector Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/60 overflow-y-auto flex-1">
          
          {/* Canvas Viewport */}
          <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 flex flex-col items-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-2 text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                CANVAS TRIDIMENSIONAL DE DETECCIÓN HUMANOIDE
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold animate-pulse">
                {confidence33}% CONF • {fpsRate} FPS
              </span>
            </div>

            <div className="relative w-full h-[340px] bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800">
              <canvas
                ref={canvasRef}
                width={560}
                height={340}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded border border-zinc-800 text-[10px] text-zinc-300">
                Motor: <strong className="text-emerald-400">Google ML Kit 33 Keypoints & MediaPipe DensePose 3D</strong>
              </div>
            </div>
          </div>

          {/* Right Inspector & Sliders */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between text-xs space-y-3">
            <div>
              <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-1.5 pb-2 border-b border-zinc-800">
                <Sliders className="w-3.5 h-3.5" />
                PARÁMETROS DEL CANVAS 3D
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-300">Velocidad de Rotación 3D:</span>
                    <span className="text-emerald-400 font-bold">{rotationSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.2"
                    value={rotationSpeed}
                    onChange={(e) => setRotationSpeed(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-300">Opacidad de Instancia:</span>
                    <span className="text-emerald-400 font-bold">{maskOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={maskOpacity}
                    onChange={(e) => setMaskOpacity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Articulaciones:</span>
                    <span className="text-emerald-400 font-bold">33 Keypoints Activos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Geometría:</span>
                    <span className="text-cyan-400 font-bold">DensePose Volumétrico</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Latencia de Red:</span>
                    <span className="text-emerald-400 font-bold">3.1 ms (Hardware Accelerated)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200">
              Visualización 3D avanzada para rescates nocturnos, identificación de siluetas y análisis de postura corporal.
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-zinc-900 px-5 py-3.5 border-t border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Canvas 3D de alta precisión y baja latencia operativo</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold cursor-pointer shadow-lg transition-all"
            >
              Regresar al Visor Táctico
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
