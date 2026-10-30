export type NightFilterMode = 
  | 'normal'
  | 'night-green'
  | 'night-white'
  | 'fusion-thermal-nvg'
  | 'thermal'
  | 'starlight-boost'
  | 'tactical-bw'
  | 'edge-matrix'
  | 'predator-thermal'
  | 'lidar-depth'
  | 'biometric-pulse'
  | 'crypto-uv'
  | 'wireframe-cyber'
  | 'solar-invert'
  | 'wall-penetrating-radar'
  | 'hyperspectral-fabric'
  | 'ir-spectrum';

export type DecoyMode = 
  | 'none'
  | 'black'
  | 'lockscreen'
  | 'calculator'
  | 'system-update'
  | 'terminal';

export interface PrivacyTerminalConfig {
  theme: 'matrix' | 'amber' | 'cyan' | 'classic';
  fontSize: 'sm' | 'base' | 'lg';
  autoStream: boolean;
  secretPin: string;
  persistOnReload: boolean;
}

export interface SkeletonJoint {
  x: number;
  y: number;
  name: string;
  confidence?: number;
}

export interface PersonMetrics {
  distanceMeters: number;
  speedKmh: number;
  trajectoryAngle: number;
  approachStatus: 'approaching' | 'departing' | 'stationary';
  tempEstimateC: number;
  loiteringSeconds: number;
  microMotionScore: number;
  joints?: SkeletonJoint[];
  // Enhanced solid tracking & through-wall telemetry:
  isAnchored?: boolean; // Persiste en el lugar aunque no haya movimiento
  anchorStabilityScore?: number; // 0-100% solidez y consistencia del anclaje
  torsoWidth?: number;
  penetrationDepthCm?: number; // Profundidad de penetración tras pared/obstáculo
  wallOcclusionDetected?: boolean; // Detección a través de tabique / tela / superficie
  uid?: string; // Identificador único persistente (ej: "TGT-01")
  color?: string; // Color persistente de seguimiento
  depthZ?: number; // Profundidad estimada en el plano 3D (Z-index)
}

export interface BoundingBox {
  id: string;
  uid?: string; // Identificador único persistente ej: "TGT-01"
  color?: string; // Color persistente asignado al sujeto
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string;
  type: 'motion' | 'person' | 'camera_glint';
  timestamp: number;
  personData?: PersonMetrics;
  depthZ?: number; // Profundidad Z para ordenación espacial y proyección en suelo
}

export interface GlintCandidate {
  x: number;
  y: number;
  intensity: number;
  radius: number;
  confidence: number;
  isIR: boolean;
}

export interface CloudConsentConfig {
  accepted: boolean;
  acceptedAt?: string;
  autoSyncOnAccept: boolean;
  userEmail?: string;
}

export type MediaFormat = 'mp4' | 'jpg' | 'svg';

export interface RecordedMedia {
  id: string;
  url: string;
  blob: Blob;
  name: string;
  timestamp: string;
  duration: number; // in seconds
  sizeFormatted: string;
  type: 'video' | 'audio' | 'snapshot' | 'vector_svg';
  format: MediaFormat;
  trigger: 'manual' | 'motion' | 'person' | 'hidden_cam';
  thumbnailUrl?: string;
  svgContent?: string;
  cloudSynced?: boolean;
  cloudSyncedAt?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'motion' | 'person' | 'lens_glint' | 'recording_started' | 'recording_saved' | 'stealth_engaged' | 'vault_unauthorized' | 'vault_unlocked' | 'camera_power';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export type ScreenAspectMode = 
  | 'cover'
  | 'contain'
  | '16:9'
  | '4:3'
  | '9:16'
  | '1:1';

export type HudStyleMode = 
  | 'full'
  | 'minimal'
  | 'clean';

export interface DetectionConfig {
  motionDetection: boolean;
  motionSensitivity: number; // 10 - 90
  personDetection: boolean;
  personSensitivity: number; // 30 - 90
  hiddenCameraScanner: boolean;
  glintSensitivity: number; // 20 - 90
  autoRecordOnDetection: boolean;
  autoRecordDuration: number; // 10 - 60 sec
  pushNotifications: boolean;
  soundAlarm: boolean;
  vibrationAlert: boolean;
  stealthAudio: boolean; // silent recording
  detectionBoost: number; // 1x, 2x, 3x (Fuerza de detección agresiva)
  soundSpikeDetection: boolean; // detección de picos de sonido

  // Filtros Avanzados de Detección de Personas con Botón ON/OFF Individual:
  personSkeletonDetection: boolean; // Esqueleto Biométrico / Pose Keypoints
  personThermalBioDetection: boolean; // Firma Térmica y Temperatura Corporal
  personTrajectoryTracking: boolean; // Vectores de Trayectoria, Velocidad y Rumbo
  personLoiteringDetection: boolean; // Detector de Acecho / Permanencia Sospechosa
  personProximityDistance: boolean; // Radar de Distancia y Contacto Facial
  personMicroMotion: boolean; // Micro-movimientos y Frecuencia de Respiración
  solidBodyVolumetricMesh: boolean; // Renderizado de cuerpo humano sólido, anatómico y fluido
  persistentPersonLock: boolean; // Seguimiento anclado persistente (no desaparece si no se mueve)
  throughWallPenetration: boolean; // Visión penetrante tras paredes, telas y obstáculos
  pirSensitivity: number; // Sensibilidad de Infrarrojo Pasivo (PIR) térmica para detección de personas (10-90)
  excludedGrid?: boolean[][]; // Matriz de celdas de exclusión (true = zona ignorada)
}

export interface FilterEnhancement {
  gain: number; // 1x - 16x amplificación de luz
  contrast: number; // 1x - 3.5x contraste
  sharpness: boolean;
  noiseReduction: boolean;
  ambientLux?: number; // Nivel estimado de iluminancia en LUX (0 - 1000+)
  autoNightVision?: boolean; // Activar NV automáticamente si LUX < 12
  tubeVignette?: boolean; // Simulación de tubo óptico PVS-14 / GPNVG
  screenIlluminator?: boolean; // Foco de pantalla frontal para penumbra total
}

export interface VaultSecurityConfig {
  authType: 'pin' | 'pattern';
  pin: string; // PIN de 4-6 dígitos (por defecto 0000)
  pattern: number[]; // Array de índices 0-8 del patrón 3x3
  isConfigured: boolean;
  autoLockOnExit: boolean;
  autoDeleteDays: number; // 0 = Nunca, 7, 30, 90 días para auto-borrado de grabaciones
}

export type VideoResolution = '4k' | '1080p' | '720p' | '480p';
export type VideoFrameRate = 15 | 24 | 30 | 60;
export type VideoBitrateMode = 'ultra' | 'high' | 'balanced' | 'stealth';

export interface KnownFaceRecord {
  id: string;
  name: string;
  category: 'authorized' | 'vip' | 'unauthorized';
  confidence: number;
}

export interface PrivacyShieldConfig {
  enabled: boolean;
  anonymizeMode: 'gaussian_blur' | 'pixelate' | 'cyber_mask' | 'visor_blackout' | 'proximity_adaptive';
  recognitionActive: boolean;
  autoAnonymizeUnauthorized: boolean;
  knownFaces: KnownFaceRecord[];
}

export interface CameraQualityConfig {
  resolution: VideoResolution;
  fps: VideoFrameRate;
  bitrate: VideoBitrateMode;
  backgroundRecording: boolean;
  adaptiveCompression: boolean; // Compresión adaptativa eliminando fotogramas estáticos sin movimiento
  irSpectrumAnalyzer: boolean; // Analizador de espectro infrarrojo (IR) en tiempo real
  privacyShield: PrivacyShieldConfig;
  maxLocalStorageGb: number; // Límite máximo de almacenamiento local en GB (ej. 1, 2, 5, 10, 0 = ilimitado)
  autoPurgeOldest: boolean; // Borrar automáticamente archivos antiguos cuando se alcance el límite de cuota
}

export interface DetectionProfile {
  id: string;
  name: string;
  config: DetectionConfig;
}


