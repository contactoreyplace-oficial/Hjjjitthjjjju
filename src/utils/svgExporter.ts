import { BoundingBox, GlintCandidate, NightFilterMode, PersonMetrics } from '../types';

export interface SvgExportOptions {
  width: number;
  height: number;
  filter: NightFilterMode;
  boxes: BoundingBox[];
  glints?: GlintCandidate[];
  fps?: number;
  gain?: number;
  contrast?: number;
  detectionBoost?: number;
  timestamp?: string;
  backgroundImageUrl?: string;
  includeBackgroundImage?: boolean;
}

export function generateTacticalSvg(options: SvgExportOptions): string {
  const {
    width = 1280,
    height = 720,
    filter = 'normal',
    boxes = [],
    glints = [],
    fps = 30,
    gain = 1,
    contrast = 1,
    detectionBoost = 2,
    timestamp = new Date().toISOString(),
    backgroundImageUrl,
    includeBackgroundImage = true,
  } = options;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour12: false });
  const dateStr = now.toLocaleDateString('es-ES');
  const cx = width / 2;
  const cy = height / 2;

  // Color palette depending on filter mode
  let primaryNeon = '#10b981'; // emerald
  let secondaryNeon = '#06b6d4'; // cyan
  let accentAlert = '#ef4444'; // red
  let radarHue = '160';

  if (filter === 'thermal' || filter === 'predator-thermal') {
    primaryNeon = '#f97316'; // orange
    secondaryNeon = '#eab308'; // yellow
    radarHue = '30';
  } else if (filter === 'wall-penetrating-radar') {
    primaryNeon = '#06b6d4'; // cyan
    secondaryNeon = '#8b5cf6'; // violet
    radarHue = '190';
  } else if (filter === 'hyperspectral-fabric') {
    primaryNeon = '#ec4899'; // pink
    secondaryNeon = '#f59e0b'; // amber
    radarHue = '320';
  } else if (filter === 'ir-spectrum') {
    primaryNeon = '#ec4899'; // infrared crimson/magenta
    secondaryNeon = '#06b6d4'; // IR cyan emitter
    radarHue = '330';
  } else if (filter === 'night-white') {
    primaryNeon = '#a5f3fc'; // cool slate cyan-white
    secondaryNeon = '#67e8f9';
    radarHue = '195';
  } else if (filter === 'fusion-thermal-nvg') {
    primaryNeon = '#fb923c'; // thermal flame orange
    secondaryNeon = '#38bdf8'; // nvg cyan
    radarHue = '35';
  } else if (filter === 'wireframe-cyber') {
    primaryNeon = '#00ffcc'; // cyber
    secondaryNeon = '#3b82f6'; // blue
    radarHue = '175';
  }

  // Generate SVG string
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #05080c; font-family: monospace, monospace;">
  <defs>
    <!-- Tactical Gradients -->
    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryNeon}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${secondaryNeon}" stop-opacity="0.6" />
    </linearGradient>
    <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primaryNeon}" stop-opacity="0.18" />
      <stop offset="70%" stop-color="${secondaryNeon}" stop-opacity="0.06" />
      <stop offset="100%" stop-color="${primaryNeon}" stop-opacity="0" />
    </radialGradient>

    <!-- Glowing effect filter -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Radar Grid Pattern -->
    <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(${filter === 'thermal' ? '240, 100, 30' : '16, 185, 129'}, 0.08)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="#070c12" />
  <rect width="${width}" height="${height}" fill="url(#radarGrid)" />
`;

  // Optional background frame image
  if (includeBackgroundImage && backgroundImageUrl) {
    svg += `
  <!-- Captured Optical / Sensor Frame -->
  <image href="${backgroundImageUrl}" x="0" y="0" width="${width}" height="${height}" opacity="0.45" preserveAspectRatio="none" />
`;
  }

  // Tactical Radar Range Rings & Crosshairs
  const maxR = Math.min(width, height) * 0.42;
  svg += `
  <!-- Tactical Vector Overlay: Radar Geometry -->
  <g opacity="0.65">
    <circle cx="${cx}" cy="${cy}" r="${maxR * 0.25}" fill="none" stroke="${primaryNeon}" stroke-width="1" stroke-dasharray="2,3" />
    <circle cx="${cx}" cy="${cy}" r="${maxR * 0.5}" fill="none" stroke="${primaryNeon}" stroke-width="1" stroke-opacity="0.4" />
    <circle cx="${cx}" cy="${cy}" r="${maxR * 0.75}" fill="none" stroke="${primaryNeon}" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.5" />
    <circle cx="${cx}" cy="${cy}" r="${maxR}" fill="none" stroke="${secondaryNeon}" stroke-width="1.5" stroke-opacity="0.6" />
    <circle cx="${cx}" cy="${cy}" r="${maxR}" fill="url(#radarSweep)" />

    <!-- Compass & Axis Lines -->
    <line x1="${cx - maxR}" y1="${cy}" x2="${cx + maxR}" y2="${cy}" stroke="${primaryNeon}" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.3" />
    <line x1="${cx}" y1="${cy - maxR}" x2="${cx}" y2="${cy + maxR}" stroke="${primaryNeon}" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.3" />

    <!-- Corner Brackets (Viewfinder) -->
    <path d="M 25 50 L 25 25 L 50 25" fill="none" stroke="${primaryNeon}" stroke-width="2.5" />
    <path d="M ${width - 50} 25 L ${width - 25} 25 L ${width - 25} 50" fill="none" stroke="${primaryNeon}" stroke-width="2.5" />
    <path d="M 25 ${height - 50} L 25 ${height - 25} L 50 ${height - 25}" fill="none" stroke="${primaryNeon}" stroke-width="2.5" />
    <path d="M ${width - 50} ${height - 25} L ${width - 25} ${height - 25} L ${width - 25} ${height - 50}" fill="none" stroke="${primaryNeon}" stroke-width="2.5" />
  </g>
`;

  // Render Bounding Boxes & Skeletons & Volumetric Meshes
  boxes.forEach((box, idx) => {
    const bx = Math.round(box.x);
    const by = Math.round(box.y);
    const bw = Math.round(box.width);
    const bh = Math.round(box.height);
    const isPerson = box.type === 'person';
    const boxColor = isPerson ? primaryNeon : secondaryNeon;
    const pData = box.personData;

    // Corner bracket size
    const cs = Math.min(18, bw * 0.25);

    svg += `
  <!-- Entity #${idx + 1}: ${box.label} (${box.type}) -->
  <g id="entity-${box.id}">
    <!-- Bounding Box -->
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(16, 185, 129, 0.06)" stroke="${boxColor}" stroke-width="1.2" stroke-dasharray="6,3" />

    <!-- Tactical 4-Corner Brackets -->
    <path d="M ${bx} ${by + cs} L ${bx} ${by} L ${bx + cs} ${by}" fill="none" stroke="${boxColor}" stroke-width="2.5" filter="url(#neonGlow)" />
    <path d="M ${bx + bw - cs} ${by} L ${bx + bw} ${by} L ${bx + bw} ${by + cs}" fill="none" stroke="${boxColor}" stroke-width="2.5" filter="url(#neonGlow)" />
    <path d="M ${bx} ${by + bh - cs} L ${bx} ${by + bh} L ${bx + cs} ${by + bh}" fill="none" stroke="${boxColor}" stroke-width="2.5" filter="url(#neonGlow)" />
    <path d="M ${bx + bw - cs} ${by + bh} L ${bx + bw} ${by + bh} L ${bx + bw} ${by + bh - cs}" fill="none" stroke="${boxColor}" stroke-width="2.5" filter="url(#neonGlow)" />

    <!-- Label Badge -->
    <rect x="${bx}" y="${Math.max(10, by - 24)}" width="${Math.max(120, bw * 0.7)}" height="20" fill="#041f17" stroke="${boxColor}" stroke-width="1" rx="3" />
    <text x="${bx + 6}" y="${Math.max(24, by - 10)}" fill="${boxColor}" font-size="11" font-weight="bold">${box.label} [${Math.round(box.confidence * 100)}%]</text>
`;

    // Skeleton joints rendering
    if (pData?.joints && pData.joints.length >= 2) {
      const joints = pData.joints;
      const jMap: Record<string, { x: number; y: number }> = {};
      joints.forEach((j) => {
        jMap[j.name] = { x: j.x, y: j.y };
      });

      // Connections between joints
      const connections: [string, string][] = [
        ['head', 'neck'],
        ['neck', 'left_shoulder'],
        ['neck', 'right_shoulder'],
        ['neck', 'spine_mid'],
        ['spine_mid', 'pelvis'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['pelvis', 'left_hip'],
        ['pelvis', 'right_hip'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle'],
      ];

      svg += `    <!-- Skeleton Biometric Bones -->\n`;
      connections.forEach(([from, to]) => {
        if (jMap[from] && jMap[to]) {
          svg += `    <line x1="${Math.round(jMap[from].x)}" y1="${Math.round(jMap[from].y)}" x2="${Math.round(jMap[to].x)}" y2="${Math.round(jMap[to].y)}" stroke="${secondaryNeon}" stroke-width="2" stroke-linecap="round" opacity="0.9" />\n`;
        }
      });

      // Render Joints Circles
      svg += `    <!-- Skeleton Keypoints -->\n`;
      joints.forEach((j) => {
        svg += `    <circle cx="${Math.round(j.x)}" cy="${Math.round(j.y)}" r="4.5" fill="${primaryNeon}" stroke="#000" stroke-width="1.2" filter="url(#neonGlow)" />\n`;
      });
    }

    // Telemetry Box
    if (pData) {
      const tx = bx + bw + 12 < width - 180 ? bx + bw + 12 : Math.max(10, bx - 180);
      const ty = Math.max(20, by);
      svg += `
    <!-- Telemetry Vector Card -->
    <g transform="translate(${tx}, ${ty})">
      <rect width="170" height="95" fill="rgba(6, 26, 20, 0.9)" stroke="${boxColor}" stroke-width="1" rx="4" />
      <text x="8" y="16" fill="${primaryNeon}" font-size="10" font-weight="bold">TELEMETRÍA TÁCTICA</text>
      <text x="8" y="32" fill="#94a3b8" font-size="9">DIST: <tspan fill="#fff" font-weight="bold">${pData.distanceMeters.toFixed(1)}m</tspan> | VEL: <tspan fill="#38bdf8" font-weight="bold">${pData.speedKmh.toFixed(1)}km/h</tspan></text>
      <text x="8" y="46" fill="#94a3b8" font-size="9">RUMBO: <tspan fill="#fff">${pData.trajectoryAngle}°</tspan> | TEMP: <tspan fill="#fb923c" font-weight="bold">${pData.tempEstimateC.toFixed(1)}°C</tspan></text>
      <text x="8" y="60" fill="#94a3b8" font-size="9">ACECHO: <tspan fill="#fff">${pData.loiteringSeconds}s</tspan> | RESPIR: <tspan fill="#4ade80">${pData.microMotionScore}%</tspan></text>
      <text x="8" y="74" fill="#94a3b8" font-size="9">ESTABILIDAD: <tspan fill="#a855f7" font-weight="bold">${pData.anchorStabilityScore || 95}%</tspan></text>
      ${pData.penetrationDepthCm ? `<text x="8" y="88" fill="#ec4899" font-size="9" font-weight="bold">SAR PENETRACIÓN: ${pData.penetrationDepthCm.toFixed(1)}cm</text>` : ''}
    </g>
`;
    }

    svg += `  </g>\n`;
  });

  // Glints (Hidden Camera reflections)
  glints.forEach((g, idx) => {
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);
    svg += `
  <!-- Glint / Hidden Lens Alert #${idx + 1} -->
  <g>
    <circle cx="${gx}" cy="${gy}" r="${Math.max(8, g.radius * 2)}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3" />
    <circle cx="${gx}" cy="${gy}" r="4" fill="#ef4444" filter="url(#neonGlow)" />
    <text x="${gx + 12}" y="${gy + 4}" fill="#f59e0b" font-size="9" font-weight="bold">LENTE OCULTO (${Math.round(g.confidence * 100)}%)</text>
  </g>
`;
  });

  // Header & Footer Tactical Banner Vector Watermark
  svg += `
  <!-- Top System Banner -->
  <rect x="0" y="0" width="${width}" height="32" fill="rgba(3, 7, 18, 0.92)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1" />
  <text x="16" y="20" fill="${primaryNeon}" font-size="12" font-weight="bold" letter-spacing="1.5">STEALTHCAM PRO • SISTEMA VECTORIAL TÁCTICO (.SVG)</text>
  <text x="${width - 16}" y="20" fill="#64748b" font-size="10" text-anchor="end">${dateStr} ${timeStr} | FILTRO: ${filter.toUpperCase()} | GANANCIA: ${gain}X | FPS: ${fps}</text>

  <!-- Bottom Verification Footer -->
  <rect x="0" y="${height - 26}" width="${width}" height="26" fill="rgba(3, 7, 18, 0.95)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1" />
  <text x="16" y="${height - 9}" fill="#10b981" font-size="10" font-weight="bold">✓ EVIDENCIA VECTORIAL LOCAL [FORMATO: .SVG NATIVO] • COPIA CIFRADA EN BÓVEDA</text>
  <text x="${width - 16}" y="${height - 9}" fill="#64748b" font-size="9" text-anchor="end">AUTORIZACIÓN NUBE: SOLO POR ACEPTACIÓN EXPRESA</text>
</svg>`;

  return svg;
}
