import React, { useState, useEffect, useRef } from 'react';
import { Radio, Activity, Cpu, Wifi, User, Crosshair, Zap, Shield, Eye, Camera, Download, Layers } from 'lucide-react';

interface WifiCsiSpectrogramProps {
  onClose?: () => void;
  personDetected?: boolean;
}

// 2D Kalman smoothing point filter
class Kalman2D {
  private x: number;
  private y: number;
  private vx = 0;
  private vy = 0;
  private p = 1.0;
  private q = 0.03;
  private r = 0.6;
  private lastTime = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(measX: number, measY: number, nowMs: number): { x: number; y: number } {
    if (this.lastTime === 0) {
      this.lastTime = nowMs;
      this.x = measX;
      this.y = measY;
      return { x: this.x, y: this.y };
    }
    const dt = Math.max(0.016, Math.min(0.2, (nowMs - this.lastTime) / 1000));
    this.lastTime = nowMs;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.p += this.q;

    const k = this.p / (this.p + this.r);
    const inX = measX - this.x;
    const inY = measY - this.y;

    this.x += k * inX;
    this.y += inY * k;
    this.vx = (1 - k) * this.vx + (k * inX) / dt;
    this.vy = (1 - k) * this.vy + (k * inY) / dt;
    this.p = (1 - k) * this.p;

    return { x: this.x, y: this.y };
  }
}

export const WifiCsiSpectrogram: React.FC<WifiCsiSpectrogramProps> = ({ onClose, personDetected: externalPersonDetected }) => {
  const [frequencyBand, setFrequencyBand] = useState<'2.4GHz' | '5GHz' | '6GHz'>('5GHz');
  const [subcarrierCount] = useState<number>(64);
  const [sensitivity, setSensitivity] = useState<number>(85);
  const [detectedPose, setDetectedPose] = useState<string>('TGT-01: Vigilancia Activa • TGT-02: En Tránsito');
  const [poseConfidence, setPoseConfidence] = useState<number>(96.4);
  const [distanceMeters, setDistanceMeters] = useState<number>(3.2);
  const [signalDistortion, setSignalDistortion] = useState<number>(82);

  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeStepRef = useRef<number>(0);

  // Kalman filters per target
  const kalmanFiltersRef = useRef<Map<string, Map<string, Kalman2D>>>(new Map());

  useEffect(() => {
    const specCanvas = spectrogramCanvasRef.current;
    const skelCanvas = skeletonCanvasRef.current;
    if (!specCanvas || !skelCanvas) return;

    const specCtx = specCanvas.getContext('2d');
    const skelCtx = skelCanvas.getContext('2d');
    if (!specCtx || !skelCtx) return;

    let active = true;

    const renderLoop = () => {
      if (!active) return;
      timeStepRef.current += 0.045;
      const t = timeStepRef.current;
      const nowMs = performance.now();

      // -------------------------------------------------------------
      // 1. Render Spectrogram (Frequency vs Time Waterfall Heatmap)
      // -------------------------------------------------------------
      const w = specCanvas.width;
      const h = specCanvas.height;

      const imgData = specCtx.getImageData(2, 0, w - 2, h);
      specCtx.putImageData(imgData, 0, 0);

      specCtx.fillStyle = '#020617';
      specCtx.fillRect(w - 2, 0, 2, h);

      for (let y = 0; y < h; y += 3) {
        const freqNorm = y / h;
        const wave1 = Math.sin(freqNorm * 14 + t * 2.8) * Math.cos(t * 1.6 + freqNorm * 6);
        const wave2 = Math.cos(freqNorm * 8 - t * 2.1) * 0.5;
        const noise = (Math.random() - 0.5) * 0.25;
        const energy = Math.abs(wave1 + wave2 + noise) * (externalPersonDetected ? 1.35 : 0.9);

        if (energy > 0.42) {
          specCtx.fillStyle =
            energy > 0.85 ? '#38bdf8' : energy > 0.68 ? '#06b6d4' : energy > 0.52 ? '#10b981' : '#047857';
          specCtx.fillRect(w - 2, y, 2, 3);
        }
      }

      // -------------------------------------------------------------
      // 2. Render 3D Perspective Ground Grid & Z-Index Sorted RF Skeletons
      // -------------------------------------------------------------
      const sw = skelCanvas.width;
      const sh = skelCanvas.height;

      // Deep cyber background
      skelCtx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      skelCtx.fillRect(0, 0, sw, sh);

      const horizonY = sh * 0.34;
      const floorBottomY = sh * 0.98;
      const vanishX = sw * 0.5;
      const vanishY = horizonY;

      // A. Ground Perspective Grid (3D Floor Plane)
      skelCtx.save();
      skelCtx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
      skelCtx.lineWidth = 1;

      // Converging perspective lines from vanishing point across floor
      const numFloorRays = 16;
      for (let i = -numFloorRays; i <= numFloorRays; i++) {
        const floorX = vanishX + (i * sw) / 8;
        skelCtx.beginPath();
        skelCtx.moveTo(vanishX, vanishY);
        skelCtx.lineTo(floorX, floorBottomY);
        skelCtx.stroke();
      }

      // Depth horizontal rings spaced by inverse distance (1/Z)
      const depthDistances = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.5];
      depthDistances.forEach((dist) => {
        const zNorm = 1.0 / dist;
        const gridY = horizonY + (floorBottomY - horizonY) * Math.min(1.0, zNorm * 1.5);

        skelCtx.strokeStyle = dist === 3.0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(6, 182, 212, 0.2)';
        skelCtx.lineWidth = dist === 3.0 ? 1.5 : 1;
        skelCtx.beginPath();
        skelCtx.moveTo(0, gridY);
        skelCtx.lineTo(sw, gridY);
        skelCtx.stroke();

        // Distance marker along center axis
        skelCtx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        skelCtx.font = '8px monospace';
        skelCtx.fillText(`${dist.toFixed(1)}m`, vanishX + 6, gridY - 2);
      });

      // Animated 3D floor sweep wave
      const sweepZ = (Math.sin(t * 1.5) * 0.5 + 0.5) * (depthDistances[depthDistances.length - 1] - 1.0) + 1.0;
      const sweepY = horizonY + (floorBottomY - horizonY) * (1.0 / sweepZ) * 1.5;
      if (sweepY >= horizonY && sweepY <= floorBottomY) {
        skelCtx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        skelCtx.lineWidth = 2;
        skelCtx.shadowColor = '#38bdf8';
        skelCtx.shadowBlur = 8;
        skelCtx.beginPath();
        skelCtx.moveTo(0, sweepY);
        skelCtx.lineTo(sw, sweepY);
        skelCtx.stroke();
        skelCtx.shadowBlur = 0;
      }
      skelCtx.restore();

      // B. Multi-Target RF Skeletons with Z-Index Depth Sorting
      interface TargetRF {
        uid: string;
        color: string;
        depthZ: number; // In meters
        baseX: number;
        poseLabel: string;
        confidence: number;
      }

      // Two simulated targets crossing each other with distinct depths
      const tgt1Depth = 2.8 + Math.cos(t * 0.4) * 0.8;
      const tgt2Depth = 4.4 - Math.cos(t * 0.4) * 0.9;

      const targets: TargetRF[] = [
        {
          uid: 'TGT-01',
          color: '#06b6d4', // Cyan
          depthZ: tgt1Depth,
          baseX: vanishX + Math.sin(t * 0.6) * (sw * 0.22),
          poseLabel: 'TGT-01: Vigilancia Dinámica',
          confidence: +(95 + Math.sin(t * 2) * 3).toFixed(1),
        },
        {
          uid: 'TGT-02',
          color: '#10b981', // Emerald
          depthZ: tgt2Depth,
          baseX: vanishX - Math.sin(t * 0.5) * (sw * 0.26),
          poseLabel: 'TGT-02: Deambulación Trasera',
          confidence: +(93 + Math.cos(t * 2) * 4).toFixed(1),
        },
      ];

      // Sort targets by depthZ descending (farther target drawn first, closer target in front)
      targets.sort((a, b) => b.depthZ - a.depthZ);

      targets.forEach((tgt) => {
        // Compute 3D perspective scale
        const scale = Math.max(0.55, Math.min(1.4, 2.8 / tgt.depthZ));
        const footY = horizonY + (floorBottomY - horizonY) * (1.0 / tgt.depthZ) * 1.5;
        const bodyHeight = 160 * scale;
        const centerY = footY - bodyHeight * 0.5;
        const centerX = tgt.baseX;

        // 1. Draw 3D Ground Projection Disc under feet
        skelCtx.save();
        skelCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        skelCtx.strokeStyle = tgt.color;
        skelCtx.lineWidth = 1.2;
        skelCtx.beginPath();
        skelCtx.ellipse(centerX, footY, 32 * scale, 9 * scale, 0, 0, Math.PI * 2);
        skelCtx.fill();
        skelCtx.stroke();

        // Inner anchor circle
        skelCtx.beginPath();
        skelCtx.ellipse(centerX, footY, 14 * scale, 4 * scale, 0, 0, Math.PI * 2);
        skelCtx.stroke();

        // Vertical drop line from spine to floor
        skelCtx.setLineDash([2, 3]);
        skelCtx.strokeStyle = tgt.color;
        skelCtx.beginPath();
        skelCtx.moveTo(centerX, centerY);
        skelCtx.lineTo(centerX, footY);
        skelCtx.stroke();
        skelCtx.setLineDash([]);

        // Ground anchor pin
        skelCtx.fillStyle = '#ffffff';
        skelCtx.beginPath();
        skelCtx.arc(centerX, footY, 3, 0, Math.PI * 2);
        skelCtx.fill();

        // Ground Z-depth badge
        skelCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        skelCtx.fillRect(centerX - 24, footY + 4, 48, 12);
        skelCtx.strokeStyle = tgt.color;
        skelCtx.lineWidth = 1;
        skelCtx.strokeRect(centerX - 24, footY + 4, 48, 12);
        skelCtx.fillStyle = tgt.color;
        skelCtx.font = 'bold 8px monospace';
        skelCtx.textAlign = 'center';
        skelCtx.fillText(`${tgt.uid} ${tgt.depthZ.toFixed(1)}m`, centerX, footY + 13);
        skelCtx.restore();

        // 2. Kalman Filtered Anatomical Skeleton Joints
        if (!kalmanFiltersRef.current.has(tgt.uid)) {
          kalmanFiltersRef.current.set(tgt.uid, new Map());
        }
        const targetFilters = kalmanFiltersRef.current.get(tgt.uid)!;

        const walkCycle = t * 3.5 + (tgt.uid === 'TGT-02' ? Math.PI : 0);

        const rawJoints: Record<string, { x: number; y: number }> = {
          head: { x: centerX, y: centerY - 55 * scale },
          neck: { x: centerX, y: centerY - 38 * scale },
          shoulderL: { x: centerX - 22 * scale, y: centerY - 30 * scale },
          shoulderR: { x: centerX + 22 * scale, y: centerY - 30 * scale },
          elbowL: { x: centerX - 36 * scale + Math.sin(walkCycle) * 8 * scale, y: centerY - 5 * scale },
          elbowR: { x: centerX + 36 * scale - Math.cos(walkCycle) * 8 * scale, y: centerY - 5 * scale },
          handL: { x: centerX - 42 * scale + Math.sin(walkCycle) * 12 * scale, y: centerY + 18 * scale },
          handR: { x: centerX + 42 * scale - Math.cos(walkCycle) * 12 * scale, y: centerY + 18 * scale },
          spine: { x: centerX, y: centerY + 6 * scale },
          hipL: { x: centerX - 14 * scale, y: centerY + 22 * scale },
          hipR: { x: centerX + 14 * scale, y: centerY + 22 * scale },
          kneeL: { x: centerX - 18 * scale + Math.cos(walkCycle) * 10 * scale, y: centerY + 55 * scale },
          kneeR: { x: centerX + 18 * scale - Math.sin(walkCycle) * 10 * scale, y: centerY + 55 * scale },
          footL: { x: centerX - 22 * scale + Math.cos(walkCycle) * 12 * scale, y: footY },
          footR: { x: centerX + 22 * scale - Math.sin(walkCycle) * 12 * scale, y: footY },
        };

        // Apply Kalman filter per joint (eliminates tremor)
        const smoothJoints: Record<string, { x: number; y: number }> = {};
        for (const [jKey, rawPos] of Object.entries(rawJoints)) {
          let kf = targetFilters.get(jKey);
          if (!kf) {
            kf = new Kalman2D(rawPos.x, rawPos.y);
            targetFilters.set(jKey, kf);
          }
          smoothJoints[jKey] = kf.update(rawPos.x, rawPos.y, nowMs);
        }

        // Render Glowing Skeleton Bones
        const bones: [string, string][] = [
          ['head', 'neck'],
          ['neck', 'shoulderL'],
          ['neck', 'shoulderR'],
          ['shoulderL', 'elbowL'],
          ['elbowL', 'handL'],
          ['shoulderR', 'elbowR'],
          ['elbowR', 'handR'],
          ['neck', 'spine'],
          ['spine', 'hipL'],
          ['spine', 'hipR'],
          ['hipL', 'kneeL'],
          ['kneeL', 'footL'],
          ['hipR', 'kneeR'],
          ['kneeR', 'footR'],
        ];

        skelCtx.save();
        skelCtx.strokeStyle = tgt.color;
        skelCtx.shadowColor = tgt.color;
        skelCtx.shadowBlur = 10 * scale;
        skelCtx.lineWidth = 2.4 * scale;

        bones.forEach(([k1, k2]) => {
          const p1 = smoothJoints[k1];
          const p2 = smoothJoints[k2];
          if (p1 && p2) {
            skelCtx.beginPath();
            skelCtx.moveTo(p1.x, p1.y);
            skelCtx.lineTo(p2.x, p2.y);
            skelCtx.stroke();
          }
        });

        // Joint nodes
        Object.entries(smoothJoints).forEach(([k, pt]) => {
          skelCtx.fillStyle = '#ffffff';
          skelCtx.beginPath();
          skelCtx.arc(pt.x, pt.y, k === 'head' ? 4 * scale : 2.5 * scale, 0, Math.PI * 2);
          skelCtx.fill();
        });

        // Target Floating ID Badge
        skelCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        skelCtx.strokeStyle = tgt.color;
        skelCtx.lineWidth = 1;
        const badgeW = 60 * scale;
        const badgeH = 16 * scale;
        skelCtx.fillRect(centerX - badgeW / 2, smoothJoints.head.y - badgeH - 6, badgeW, badgeH);
        skelCtx.strokeRect(centerX - badgeW / 2, smoothJoints.head.y - badgeH - 6, badgeW, badgeH);
        skelCtx.fillStyle = tgt.color;
        skelCtx.font = `bold ${Math.max(8, 10 * scale)}px monospace`;
        skelCtx.textAlign = 'center';
        skelCtx.fillText(
          `${tgt.uid} ${tgt.confidence}%`,
          centerX,
          smoothJoints.head.y - 10
        );

        skelCtx.restore();
      });

      // Update Telemetry States
      setDistanceMeters(+(tgt1Depth).toFixed(1));
      setPoseConfidence(+(95.2 + Math.sin(t * 2) * 3).toFixed(1));
      setSignalDistortion(+(78 + Math.cos(t * 2) * 16).toFixed(0));

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [externalPersonDetected]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col font-mono text-zinc-100 max-h-[92vh]">
        
        {/* Sleek Minimalist Header */}
        <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-emerald-400 tracking-wider">
                  WI-FI CSI RF DENSEPOSE 3D
                </h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  KALMAN FILTER: ACTIVO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Seguimiento persistente con UID • Rejilla 3D de profundidad de suelo (Z-Index)
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer border border-zinc-700 transition-all"
            >
              Cerrar [ESC]
            </button>
          )}
        </div>

        {/* Tactical Status & Band Selector Strip */}
        <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px]">Banda RF:</span>
            {(['2.4GHz', '5GHz', '6GHz'] as const).map((band) => (
              <button
                key={band}
                onClick={() => setFrequencyBand(band)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  frequencyBand === band
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950/50'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {band}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
              TGT-01: {distanceMeters}m
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              TGT-02: 4.4m
            </span>
            <span className="text-zinc-400 font-mono">
              CSI DISTORSIÓN: <strong className="text-zinc-100">{signalDistortion}%</strong>
            </span>
          </div>
        </div>

        {/* Main Display Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/60 overflow-y-auto">
          
          {/* Left: 3D Humanoid RF DensePose with Ground Perspective Grid */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-2.5 flex flex-col items-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-1.5 text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                <User className="w-3.5 h-3.5" />
                PERSPECTIVA 3D PLANO DE SUELO (Z-INDEX)
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                {poseConfidence}% CONF
              </span>
            </div>

            <div className="relative w-full h-[260px] bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800">
              <canvas
                ref={skeletonCanvasRef}
                width={380}
                height={260}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-zinc-800 text-[9px] text-zinc-300 font-mono">
                <span className="text-emerald-400">●</span> Suavizado Kalman 2D activo
              </div>
            </div>

            <div className="w-full mt-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-200 flex items-center justify-between">
              <div>
                <strong className="text-emerald-400">Reconocimiento Activo:</strong> Dos siluetas alineadas con el plano 3D
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">60 FPS</span>
            </div>
          </div>

          {/* Right: Spectrogram Heatmap & Channel State Information */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-2.5 flex flex-col items-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-1.5 text-xs">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5 text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                ESPECTROGRAMA DE FRECUENCIA & FASE CSI
              </span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                {subcarrierCount} SUBPORTADORAS
              </span>
            </div>

            <div className="relative w-full h-[260px] bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800">
              <canvas
                ref={spectrogramCanvasRef}
                width={380}
                height={260}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-zinc-800 text-[9px] text-zinc-300 font-mono">
                <span className="text-cyan-400">●</span> Multipath Doppler en tiempo real
              </div>
            </div>

            <div className="w-full mt-2 p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-[10px] text-cyan-200 flex items-center justify-between">
              <div>
                <strong className="text-cyan-400">CSI Análisis:</strong> Dispersión de radiofrecuencia a través de tabiques
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">Banda {frequencyBand}</span>
            </div>
          </div>

        </div>

        {/* Clean Footer Bar */}
        <div className="bg-zinc-900/90 px-4 py-2 border-t border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtro de Kalman activo en extremidades • Cero temblor de articulaciones</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold cursor-pointer text-xs transition-all"
            >
              Regresar al Visor Táctico
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
