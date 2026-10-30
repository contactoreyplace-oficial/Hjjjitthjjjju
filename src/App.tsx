/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NightFilterMode,
  DecoyMode,
  BoundingBox,
  GlintCandidate,
  RecordedMedia,
  SecurityEvent,
  DetectionConfig,
  DetectionProfile,
  ScreenAspectMode,
  HudStyleMode,
  FilterEnhancement,
  PrivacyTerminalConfig,
  VaultSecurityConfig,
  CameraQualityConfig,
  VideoResolution,
  VideoFrameRate,
  VideoBitrateMode,
  CloudConsentConfig,
  MediaFormat,
} from './types';
import { CVProcessor } from './utils/cvEngine';
import { generateTacticalSvg } from './utils/svgExporter';
import {
  playTacticalAlertSound,
  triggerHapticVibrate,
  sendPushAlert,
  acquireWakeLock,
  releaseWakeLock,
} from './utils/audioAlerts';
import { Header } from './components/Header';
import { TacticalHUD } from './components/TacticalHUD';
import { FilterSelector } from './components/FilterSelector';
import { DecoyScreens } from './components/DecoyScreens';
import { DetectionSettings } from './components/DetectionSettings';
import { HiddenCameraScanner } from './components/HiddenCameraScanner';
import { SecurityVault } from './components/SecurityVault';
import { VaultAuthGate } from './components/VaultAuthGate';
import { QualitySettingsModal } from './components/QualitySettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { PrivacyShieldModal } from './components/PrivacyShieldModal';
import { CloudConsentModal } from './components/CloudConsentModal';
import { WifiCsiSpectrogram } from './components/WifiCsiSpectrogram';
import { GridExclusionModal } from './components/GridExclusionModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import {
  saveRecordingToDB,
  loadRecordingsFromDB,
  deleteRecordingFromDB,
  updateRecordingInDB,
  saveConfigToDB,
  loadConfigFromDB,
  saveEventsToDB,
  loadEventsFromDB,
  savePrivacyConfigToDB,
  loadPrivacyConfigFromDB,
  savePrivacyActiveStateToDB,
  loadPrivacyActiveStateFromDB,
  DEFAULT_PRIVACY_CONFIG,
  saveVaultSecurityConfigToDB,
  loadVaultSecurityConfigFromDB,
  DEFAULT_VAULT_SECURITY_CONFIG,
  saveCameraQualityConfigToDB,
  loadCameraQualityConfigFromDB,
  DEFAULT_CAMERA_QUALITY_CONFIG,
  DEFAULT_DETECTION_CONFIG,
  saveCloudConsentToDB,
  loadCloudConsentFromDB,
  DEFAULT_CLOUD_CONSENT,
} from './utils/storageDB';
import { OfflineIndicator } from './components/OfflineIndicator';
import { auth, loginWithGoogle, syncIncidentToCloud, syncRecordingMetadataToCloud, syncConfigToCloud } from './lib/firebase';
import {
  Eye,
  Camera,
  Film,
  Crosshair,
  Activity,
  AlertCircle,
  Radio,
  Lock,
  ShieldAlert,
  Maximize2,
  Sparkles,
  Terminal,
  Power,
  PowerOff,
  Sliders,
  SwitchCamera,
  Moon,
  Grid,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'monitor' | 'detector' | 'scanner' | 'vault'>('monitor');

  // Camera & Stream
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchActive, setTorchActive] = useState<boolean>(false);

  // Vision, Super Gain & Filter Settings
  const [currentFilter, setCurrentFilter] = useState<NightFilterMode>('night-white');
  const [enhancement, setEnhancement] = useState<FilterEnhancement>({
    gain: 2.5, // 2.5x light amplification by default
    contrast: 1.2,
    sharpness: true,
    noiseReduction: false,
    ambientLux: 45,
    autoNightVision: true,
    tubeVignette: false,
    screenIlluminator: false,
  });

  // Screen Aspect Ratio & Viewport Cleanliness
  const [aspectMode, setAspectMode] = useState<ScreenAspectMode>('cover');
  const [hudStyle, setHudStyle] = useState<HudStyleMode>('full');

  const [fps, setFps] = useState<number>(30);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Detection States
  const [motionScore, setMotionScore] = useState<number>(0);
  const [personDetected, setPersonDetected] = useState<boolean>(false);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [glintCandidates, setGlintCandidates] = useState<GlintCandidate[]>([]);

  // Decoy & Stealth Screen
  const [decoyMode, setDecoyMode] = useState<DecoyMode>('none');
  const [privacyConfig, setPrivacyConfig] = useState<PrivacyTerminalConfig>(DEFAULT_PRIVACY_CONFIG);

  const [config, setConfig] = useState<DetectionConfig>(DEFAULT_DETECTION_CONFIG);
  const [profiles, setProfiles] = useState<DetectionProfile[]>([
    { id: 'prof-1', name: 'Vigilancia Nocturna Estándar', config: DEFAULT_DETECTION_CONFIG },
  ]);

  const handleSaveProfile = (newProfile: DetectionProfile) => {
    setProfiles((prev) => [...prev, newProfile]);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleLoadProfile = (profile: DetectionProfile) => {
    setConfig(profile.config);
    saveConfigToDB(profile.config);
  };

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordings, setRecordings] = useState<RecordedMedia[]>([]);

  // Camera Power State (Botón encendido/apagado de cámara)
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);

  // Vault Security Verification Gate State (PIN / Patrón de Seguridad)
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [vaultSecurityConfig, setVaultSecurityConfig] = useState<VaultSecurityConfig>(DEFAULT_VAULT_SECURITY_CONFIG);

  // Video Quality, Resolution & Background Recording State
  const [qualityConfig, setQualityConfig] = useState<CameraQualityConfig>(DEFAULT_CAMERA_QUALITY_CONFIG);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  // Cloud Consent State: Local-First Storage by default, cloud strictly by acceptance
  const [cloudConsent, setCloudConsent] = useState<CloudConsentConfig>(DEFAULT_CLOUD_CONSENT);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState<boolean>(false);

  // Audit Logs
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isPrivacyShieldModalOpen, setIsPrivacyShieldModalOpen] = useState<boolean>(false);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(false);
  const [isWifiCsiOpen, setIsWifiCsiOpen] = useState<boolean>(false);
  const [isGridModalOpen, setIsGridModalOpen] = useState<boolean>(false);
  const simulationTimeRef = useRef<number>(0);

  // HTML Element Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Media & CV Engine Refs
  const cvProcessorRef = useRef<CVProcessor>(new CVProcessor());
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const autoRecordTimeoutRef = useRef<number | null>(null);
  const currentRecordingTriggerRef = useRef<RecordedMedia['trigger']>('manual');

  // Audio Context & Analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Alert throttling ref
  const lastAlertTimeRef = useRef<{ person: number; motion: number; glint: number; sound: number }>({
    person: 0,
    motion: 0,
    glint: 0,
    sound: 0,
  });
  const lastLuxUpdateRef = useRef<number>(0);
  const lastAutoNvTriggerRef = useRef<number>(0);

  // Log Security Event Helper
  const addSecurityEvent = useCallback(
    (
      type: SecurityEvent['type'],
      title: string,
      description: string,
      severity: SecurityEvent['severity']
    ) => {
      const newEvent: SecurityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type,
        title,
        description,
        severity,
      };

      if ((severity === 'high' || severity === 'critical') && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            newEvent.latitude = position.coords.latitude;
            newEvent.longitude = position.coords.longitude;
            newEvent.accuracy = position.coords.accuracy;
            setSecurityEvents((prev) => {
              const updated = prev.map((ev) => (ev.id === newEvent.id ? { ...newEvent } : ev));
              saveEventsToDB(updated);
              if (cloudConsent.accepted && cloudConsent.autoSyncOnAccept && auth.currentUser) {
                syncIncidentToCloud(newEvent, auth.currentUser.uid).catch(() => {});
              }
              return updated;
            });
          },
          (error) => {
            console.warn('Geolocation acquisition error for high-severity event:', error.message);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      }

      setSecurityEvents((prev) => {
        const next = [newEvent, ...prev.slice(0, 99)];
        saveEventsToDB(next);
        // Sync to cloud ONLY if cloud consent has been explicitly accepted
        if (cloudConsent.accepted && cloudConsent.autoSyncOnAccept && auth.currentUser) {
          syncIncidentToCloud(newEvent, auth.currentUser.uid).catch(() => {});
        }
        return next;
      });
    },
    [cloudConsent]
  );

  // Load Persisted Local Storage on Launch (IndexedDB)
  useEffect(() => {
    loadCloudConsentFromDB().then((savedConsent) => {
      if (savedConsent) {
        setCloudConsent(savedConsent);
      }
    });

    loadRecordingsFromDB().then((savedRecordings) => {
      if (savedRecordings && savedRecordings.length > 0) {
        setRecordings(savedRecordings);
      }
    });

    loadConfigFromDB().then((savedCfg) => {
      if (savedCfg) {
        setConfig((prev) => ({ ...prev, ...savedCfg }));
      }
    });

    loadEventsFromDB().then((savedEvents) => {
      if (savedEvents && savedEvents.length > 0) {
        setSecurityEvents(savedEvents);
      }
    });

    // Load Vault Security configuration
    loadVaultSecurityConfigFromDB().then((savedVaultCfg) => {
      if (savedVaultCfg) {
        setVaultSecurityConfig(savedVaultCfg);
      }
    });

    // Load Camera Quality & Resolution configuration
    loadCameraQualityConfigFromDB().then((savedQualityCfg) => {
      if (savedQualityCfg) {
        setQualityConfig(savedQualityCfg);
      }
    });

    // Load Privacy Mode config & state from Local Storage (IndexedDB)
    loadPrivacyConfigFromDB().then((savedPrivacyCfg) => {
      if (savedPrivacyCfg) {
        setPrivacyConfig(savedPrivacyCfg);
        if (savedPrivacyCfg.persistOnReload) {
          loadPrivacyActiveStateFromDB().then((wasActive) => {
            if (wasActive) {
              setDecoyMode('terminal');
            }
          });
        }
      }
    });
  }, []);

  // Start MediaRecorder with Selected Resolution, Framerate & Bitrate
  const startRecording = useCallback((trigger: RecordedMedia['trigger'] = 'manual') => {
    if (isRecording || !displayCanvasRef.current) return;

    try {
      currentRecordingTriggerRef.current = trigger;
      recordedChunksRef.current = [];

      // Capture filtered canvas stream at user-configured fps
      const canvasStream = displayCanvasRef.current.captureStream(qualityConfig.fps);

      // Attach audio tracks from mic if available
      if (mediaStreamRef.current) {
        const audioTracks = mediaStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      }

      const mimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      // Bitrate mapping for evidence compression
      const bitrateMap: Record<VideoBitrateMode, number> = {
        ultra: 12000000,
        high: 6000000,
        balanced: 2500000,
        stealth: 800000,
      };
      const videoBitsPerSecond = bitrateMap[qualityConfig.bitrate] || 6000000;

      const recorder = new MediaRecorder(
        canvasStream,
        selectedMime
          ? { mimeType: selectedMime, videoBitsPerSecond }
          : { videoBitsPerSecond }
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = selectedMime && selectedMime.includes('mp4') ? selectedMime : 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, {
          type: finalMime,
        });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const durationSec = recordingDuration;

        let thumb = '';
        if (displayCanvasRef.current) {
          thumb = displayCanvasRef.current.toDataURL('image/jpeg', 0.6);
        }

        const sizeInMb = (blob.size / (1024 * 1024)).toFixed(2);
        const filename = `Evidencia_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.mp4`;

        const newRec: RecordedMedia = {
          id: `rec-${Date.now()}`,
          url,
          blob,
          name: filename,
          timestamp: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          duration: durationSec,
          sizeFormatted: `${sizeInMb} MB`,
          type: 'video',
          format: 'mp4',
          trigger: currentRecordingTriggerRef.current,
          thumbnailUrl: thumb,
          cloudSynced: false,
        };

        // 100% Local save in IndexedDB
        saveRecordingToDB(newRec);

        // Sync metadata to Firestore Cloud ONLY by explicit user acceptance
        if (cloudConsent.accepted && cloudConsent.autoSyncOnAccept && auth.currentUser) {
          syncRecordingMetadataToCloud(newRec, auth.currentUser.uid).then(() => {
            newRec.cloudSynced = true;
            newRec.cloudSyncedAt = new Date().toISOString();
            updateRecordingInDB(newRec);
          }).catch(() => {});
        }

        addRecordingWithQuota(newRec);
        addSecurityEvent(
          'recording_saved',
          'Grabación de Video (.mp4) Guardada Localmente',
          `Video de ${durationSec}s guardado localmente en IndexedDB (${sizeInMb} MB, formato .MP4) por origen: ${currentRecordingTriggerRef.current.toUpperCase()}`,
          'low'
        );
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      if (trigger === 'manual') {
        playTacticalAlertSound('shutter');
      }

      addSecurityEvent(
        'recording_started',
        'Grabación Oculta Iniciada',
        `Grabando video y audio en segundo plano (${trigger.toUpperCase()})`,
        'medium'
      );
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }, [isRecording, recordingDuration, addSecurityEvent, qualityConfig.fps, qualityConfig.bitrate]);

  // Stop MediaRecorder
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;
    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.warn('Error stopping recorder', err);
    }
    setIsRecording(false);
    if (autoRecordTimeoutRef.current) {
      clearTimeout(autoRecordTimeoutRef.current);
      autoRecordTimeoutRef.current = null;
    }
  }, [isRecording]);

  const totalStorageUsedBytes = recordings.reduce((acc, rec) => acc + (rec.blob ? rec.blob.size : 5 * 1024 * 1024), 0);

  const addRecordingWithQuota = useCallback((newRec: RecordedMedia) => {
    setRecordings((prev) => {
      let list = [newRec, ...prev];
      if (qualityConfig.maxLocalStorageGb && qualityConfig.maxLocalStorageGb > 0 && qualityConfig.autoPurgeOldest) {
        const maxBytes = qualityConfig.maxLocalStorageGb * 1024 * 1024 * 1024;
        let totalBytes = list.reduce((acc, r) => acc + (r.blob ? r.blob.size : 5 * 1024 * 1024), 0);
        while (totalBytes > maxBytes && list.length > 1) {
          const removed = list.pop();
          if (removed) {
            deleteRecordingFromDB(removed.id);
          }
          totalBytes = list.reduce((acc, r) => acc + (r.blob ? r.blob.size : 5 * 1024 * 1024), 0);
        }
      }
      return list;
    });
  }, [qualityConfig.maxLocalStorageGb, qualityConfig.autoPurgeOldest]);

  // Recording Duration Counter
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Take Instant Snapshot (.jpg)
  const handleTakeSnapshot = useCallback(() => {
    if (!displayCanvasRef.current) return;
    try {
      const dataUrl = displayCanvasRef.current.toDataURL('image/jpeg', 0.95);
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const now = new Date();
          const sizeKb = (blob.size / 1024).toFixed(0);
          const newSnap: RecordedMedia = {
            id: `snap-${Date.now()}`,
            url: dataUrl,
            blob,
            name: `Foto_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.jpg`,
            timestamp: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            duration: 0,
            sizeFormatted: `${sizeKb} KB`,
            type: 'snapshot',
            format: 'jpg',
            trigger: 'manual',
            thumbnailUrl: dataUrl,
            cloudSynced: false,
          };
          // Save persistently to IndexedDB local storage
          saveRecordingToDB(newSnap);

          // Sync metadata to Firestore Cloud ONLY upon user acceptance
          if (cloudConsent.accepted && cloudConsent.autoSyncOnAccept && auth.currentUser) {
            syncRecordingMetadataToCloud(newSnap, auth.currentUser.uid).then(() => {
              newSnap.cloudSynced = true;
              newSnap.cloudSyncedAt = new Date().toISOString();
              updateRecordingInDB(newSnap);
            }).catch(() => {});
          }

          addRecordingWithQuota(newSnap);
          playTacticalAlertSound('shutter');
          triggerHapticVibrate([60]);
          addSecurityEvent(
            'recording_saved',
            'Foto Espía (.jpg) Guardada en Local',
            `Fotograma con filtro ${currentFilter} (Ganancia ${enhancement.gain}x) guardado en almacenamiento local en formato .JPG`,
            'low'
          );
        });
    } catch (err) {
      console.error('Snapshot failed', err);
    }
  }, [currentFilter, enhancement.gain, addSecurityEvent, cloudConsent]);

  // Take Instant Tactical Vector Schematic (.svg)
  const handleTakeVectorSvg = useCallback(() => {
    if (!displayCanvasRef.current) return;
    try {
      const canvas = displayCanvasRef.current;
      const bgDataUrl = canvas.toDataURL('image/jpeg', 0.45);
      const now = new Date();
      const timestampStr = now.toISOString();

      const svgString = generateTacticalSvg({
        width: canvas.width || 1280,
        height: canvas.height || 720,
        filter: currentFilter,
        boxes: boundingBoxes,
        glints: glintCandidates,
        fps,
        gain: enhancement.gain,
        contrast: enhancement.contrast,
        detectionBoost: config.detectionBoost,
        timestamp: timestampStr,
        backgroundImageUrl: bgDataUrl,
        includeBackgroundImage: true,
      });

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const sizeKb = (svgBlob.size / 1024).toFixed(1);
      const filename = `Vector_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.svg`;

      const newSvgMedia: RecordedMedia = {
        id: `svg-${Date.now()}`,
        url: svgUrl,
        blob: svgBlob,
        name: filename,
        timestamp: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        duration: 0,
        sizeFormatted: `${sizeKb} KB`,
        type: 'vector_svg',
        format: 'svg',
        trigger: 'manual',
        thumbnailUrl: svgUrl,
        svgContent: svgString,
        cloudSynced: false,
      };

      // 100% Local save in IndexedDB
      saveRecordingToDB(newSvgMedia);

      // Sync metadata to Firestore Cloud ONLY upon user acceptance
      if (cloudConsent.accepted && cloudConsent.autoSyncOnAccept && auth.currentUser) {
        syncRecordingMetadataToCloud(newSvgMedia, auth.currentUser.uid).then(() => {
          newSvgMedia.cloudSynced = true;
          newSvgMedia.cloudSyncedAt = new Date().toISOString();
          updateRecordingInDB(newSvgMedia);
        }).catch(() => {});
      }

      addRecordingWithQuota(newSvgMedia);
      playTacticalAlertSound('shutter');
      triggerHapticVibrate([40, 50]);
      addSecurityEvent(
        'recording_saved',
        'Esquema Vectorial (.svg) Guardado en Local',
        `Esquema vectorial táctico con telemetría de siluetas y radar guardado en almacenamiento local en formato .SVG`,
        'low'
      );
    } catch (err) {
      console.error('Vector SVG capture failed', err);
    }
  }, [currentFilter, boundingBoxes, glintCandidates, fps, enhancement.gain, enhancement.contrast, config.detectionBoost, addSecurityEvent, cloudConsent]);

  // Cloud Consent Handlers
  const handleSaveCloudConsent = useCallback((newConsent: CloudConsentConfig) => {
    setCloudConsent(newConsent);
    saveCloudConsentToDB(newConsent);
    addSecurityEvent(
      'vault_unlocked',
      'Consentimiento de Nube Actualizado',
      newConsent.accepted
        ? 'Respaldo en la nube Firestore autorizado voluntariamente por el usuario'
        : 'Almacenamiento configurado en modo estrictamente 100% LOCAL',
      'medium'
    );
  }, [addSecurityEvent]);

  // Upload individual local media to Firestore Cloud upon user acceptance
  const handleUploadToCloud = useCallback(async (rec: RecordedMedia): Promise<boolean> => {
    try {
      let user = auth.currentUser;
      if (!user) {
        user = await loginWithGoogle();
      }
      if (!user) {
        return false;
      }
      await syncRecordingMetadataToCloud(rec, user.uid);
      const updated: RecordedMedia = {
        ...rec,
        cloudSynced: true,
        cloudSyncedAt: new Date().toISOString(),
      };
      await updateRecordingInDB(updated);
      setRecordings((prev) => prev.map((item) => (item.id === rec.id ? updated : item)));
      addSecurityEvent(
        'recording_saved',
        'Evidencia Respaldada en la Nube',
        `Archivo ${rec.name} (${rec.format.toUpperCase()}) respaldado en Firestore tras aceptación del usuario`,
        'low'
      );
      triggerHapticVibrate([40, 60]);
      return true;
    } catch (err) {
      console.error('Failed to upload recording to cloud', err);
      return false;
    }
  }, [addSecurityEvent]);

  // Initialize Camera & Microphone Stream with Resolution, FPS & Power State
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (!isCameraOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    async function initCamera() {
      try {
        setCameraError(null);

        // Resolution dimension mappings
        const getDims = () => {
          switch (qualityConfig.resolution) {
            case '4k':
              return { width: 3840, height: 2160 };
            case '1080p':
              return { width: 1920, height: 1080 };
            case '720p':
              return { width: 1280, height: 720 };
            case '480p':
              return { width: 640, height: 480 };
          }
        };
        const dims = getDims();

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode,
            width: { ideal: dims.width },
            height: { ideal: dims.height },
            frameRate: { ideal: qualityConfig.fps },
          },
          audio: true,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Acceso a cámara denegado. Por favor, habilita los permisos en la configuración del navegador.');
            setHasCameraPermission(false);
            return;
          }
          console.warn('Microphone permission blocked, using video only', err);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode,
                width: { ideal: dims.width },
                height: { ideal: dims.height },
                frameRate: { ideal: qualityConfig.fps },
              },
            });
          } catch (videoErr: any) {
            setCameraError(`Error al acceder a la cámara: ${videoErr.message}`);
            setHasCameraPermission(false);
            return;
          }
        }

        mediaStreamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
          } catch (e) {
            console.warn('Audio analyser setup error', e);
          }
        }

        acquireWakeLock();
      } catch (err: unknown) {
        console.error('Camera access error', err);
        setHasCameraPermission(false);
        const errMsg = err instanceof Error ? err.message : 'Error al acceder a la cámara';
        setCameraError(errMsg);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      releaseWakeLock();
    };
  }, [facingMode, isCameraOn, qualityConfig.resolution, qualityConfig.fps]);

  // Camera Power ON / OFF Handler
  const handleToggleCameraPower = useCallback(() => {
    triggerHapticVibrate([60]);
    if (isCameraOn) {
      // Turn Camera OFF
      if (isRecording) {
        stopRecording();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      setTorchActive(false);
      addSecurityEvent(
        'camera_power',
        'Cámara Apagada',
        'Sensor de hardware desconectado por el operador. Transmisión detenida y LEDs apagados.',
        'low'
      );
    } else {
      // Turn Camera ON
      setIsCameraOn(true);
      addSecurityEvent(
        'camera_power',
        'Cámara Encendida',
        'Sensor de hardware reconectado. Transmisión reanudada con resolución ' + qualityConfig.resolution.toUpperCase(),
        'low'
      );
    }
  }, [isCameraOn, isRecording, stopRecording, qualityConfig.resolution, addSecurityEvent]);

  // Background Recording & Picture-in-Picture (Ventana Flotante) Handler
  const handleRequestPiP = useCallback(async () => {
    try {
      if (!displayCanvasRef.current) return;
      if (!pipVideoRef.current) {
        const vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true;
        pipVideoRef.current = vid;
      }
      const stream = displayCanvasRef.current.captureStream(qualityConfig.fps);
      pipVideoRef.current.srcObject = stream;
      await pipVideoRef.current.play();

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (pipVideoRef.current.requestPictureInPicture) {
        await pipVideoRef.current.requestPictureInPicture();
        addSecurityEvent(
          'stealth_engaged',
          'Ventana Flotante (PiP) Activada',
          'Grabación y vigilancia activa en segundo plano mediante Picture-in-Picture flotante',
          'low'
        );
      }
    } catch (err) {
      console.warn('Picture-in-picture error', err);
    }
  }, [qualityConfig.fps, addSecurityEvent]);

  // Background Recording Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && qualityConfig.backgroundRecording) {
        addSecurityEvent(
          'stealth_engaged',
          'Grabación en Segundo Plano Activa',
          'La aplicación pasó a segundo plano. MediaRecorder y sensores persisten activos sin interrupción.',
          'low'
        );
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [qualityConfig.backgroundRecording, addSecurityEvent]);

  // Torch control
  const handleToggleTorch = useCallback(async () => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !torchActive;
      const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as Record<string, unknown>) : {};
      if ('torch' in capabilities) {
        await (videoTrack.applyConstraints as (constraints: unknown) => Promise<void>)({
          advanced: [{ torch: nextState }],
        });
        setTorchActive(nextState);
      } else {
        setTorchActive(nextState);
      }
    } catch (e) {
      console.warn('Torch failed', e);
      setTorchActive(!torchActive);
    }
  }, [torchActive]);

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    cvProcessorRef.current.resetBuffers();
  }, []);

  // Main 60FPS Video Processing Loop with Boost & Super Filters
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    const audioDataArray = new Uint8Array(32);

    const processLoop = () => {
      const video = videoRef.current;
      const displayCanvas = displayCanvasRef.current;
      const hiddenCanvas = hiddenCanvasRef.current;

      const canProcessReal = video && video.readyState >= 2 && !isSimulatedFeed;
      const canProcessSimulated = isSimulatedFeed && displayCanvas && hiddenCanvas;

      if (displayCanvas && hiddenCanvas && (canProcessReal || canProcessSimulated)) {
        const vw = canProcessReal && video ? (video.videoWidth || 640) : 640;
        const vh = canProcessReal && video ? (video.videoHeight || 480) : 480;

        const procW = Math.min(vw, 480);
        const procH = Math.min(vh, 360);

        if (hiddenCanvas.width !== procW || hiddenCanvas.height !== procH) {
          hiddenCanvas.width = procW;
          hiddenCanvas.height = procH;
        }

        const hCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
        if (hCtx) {
          if (canProcessSimulated) {
            simulationTimeRef.current += 0.035;
            const t = simulationTimeRef.current;
            hCtx.fillStyle = '#090d13';
            hCtx.fillRect(0, 0, procW, procH);

            // Perspective surveillance room & floor grid
            hCtx.strokeStyle = 'rgba(20, 55, 40, 0.45)';
            hCtx.lineWidth = 1;
            const horizon = procH * 0.44;
            for (let x = -procW; x <= procW * 2; x += 38) {
              hCtx.beginPath();
              hCtx.moveTo(x, procH);
              hCtx.lineTo(procW * 0.5 + (x - procW * 0.5) * 0.15, horizon);
              hCtx.stroke();
            }
            for (let y = horizon; y <= procH; y += 18) {
              hCtx.beginPath();
              hCtx.moveTo(0, y);
              hCtx.lineTo(procW, y);
              hCtx.stroke();
            }

            // Dual Humanoid Movement Cycle (Demonstrating Crossing & Persistent UIDs)
            const targetsSim = [
              {
                cycle: (t * 0.4) % (Math.PI * 2),
                dir: 1,
                offsetZ: 0,
                baseColor: 'rgba(245, 215, 180, 0.95)',
                limbColor: 'rgba(190, 130, 90, 0.85)',
              },
              {
                cycle: (t * 0.35 + Math.PI) % (Math.PI * 2),
                dir: -1,
                offsetZ: 0.15,
                baseColor: 'rgba(235, 185, 150, 0.90)',
                limbColor: 'rgba(175, 115, 80, 0.80)',
              },
            ];

            targetsSim.forEach(({ cycle, dir, offsetZ, baseColor, limbColor }) => {
              const px = procW * 0.5 + Math.sin(cycle) * (procW * 0.28) * dir;
              const depthScale = 0.8 + Math.cos(cycle) * 0.2 + offsetZ;
              const pw = 40 * depthScale;
              const ph = 115 * depthScale;
              const py = procH * 0.42 + (1 - depthScale) * 35;

              // Thermal core body glow (for FLIR and PIR detection)
              const grad = hCtx.createRadialGradient(px, py + ph * 0.4, 6, px, py + ph * 0.4, pw * 1.4);
              grad.addColorStop(0, baseColor);
              grad.addColorStop(0.5, 'rgba(195, 95, 65, 0.7)');
              grad.addColorStop(1, 'rgba(40, 30, 25, 0.1)');
              hCtx.fillStyle = grad;
              hCtx.beginPath();
              hCtx.ellipse(px, py + ph * 0.4, pw * 0.75, ph * 0.45, 0, 0, Math.PI * 2);
              hCtx.fill();

              // Head
              hCtx.fillStyle = baseColor;
              hCtx.beginPath();
              hCtx.arc(px, py + ph * 0.12, pw * 0.32, 0, Math.PI * 2);
              hCtx.fill();

              // Limbs animation
              const walkPhase = t * 4 * dir;
              hCtx.strokeStyle = limbColor;
              hCtx.lineWidth = Math.max(3, 4 * depthScale);
              hCtx.beginPath();
              hCtx.moveTo(px - pw * 0.2, py + ph * 0.65);
              hCtx.lineTo(px - pw * 0.2 + Math.sin(walkPhase) * 16 * depthScale, py + ph);
              hCtx.moveTo(px + pw * 0.2, py + ph * 0.65);
              hCtx.lineTo(px + pw * 0.2 - Math.sin(walkPhase) * 16 * depthScale, py + ph);
              hCtx.stroke();

              hCtx.beginPath();
              hCtx.moveTo(px - pw * 0.35, py + ph * 0.28);
              hCtx.lineTo(px - pw * 0.35 - Math.sin(walkPhase) * 12 * depthScale, py + ph * 0.52);
              hCtx.moveTo(px + pw * 0.35, py + ph * 0.28);
              hCtx.lineTo(px + pw * 0.35 + Math.sin(walkPhase) * 12 * depthScale, py + ph * 0.52);
              hCtx.stroke();
            });

            // Periodic optical glint reflection (simulated hidden camera lens)
            const glintPulse = Math.sin(t * 1.8);
            if (glintPulse > 0.82) {
              const gx = procW * 0.8;
              const gy = procH * 0.26;
              const gGrad = hCtx.createRadialGradient(gx, gy, 1, gx, gy, 12);
              gGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
              gGrad.addColorStop(0.3, 'rgba(255, 230, 200, 0.95)');
              gGrad.addColorStop(1, 'rgba(255, 0, 128, 0)');
              hCtx.fillStyle = gGrad;
              hCtx.beginPath();
              hCtx.arc(gx, gy, 12, 0, Math.PI * 2);
              hCtx.fill();
            }
          } else if (video) {
            hCtx.drawImage(video, 0, 0, procW, procH);
          }

          // Process frame with Super Gain, Enhanced Contrast and Aggressive Detection Boost
          const result = cvProcessorRef.current.processFrame(
            hiddenCanvas,
            displayCanvas,
            currentFilter,
            enhancement,
            {
              motionEnabled: config.motionDetection,
              motionSensitivity: config.motionSensitivity,
              personEnabled: config.personDetection,
              personSensitivity: config.personSensitivity,
              glintEnabled: config.hiddenCameraScanner,
              glintSensitivity: config.glintSensitivity,
              detectionBoost: config.detectionBoost,
              personSkeletonEnabled: config.personSkeletonDetection,
              personThermalBioEnabled: config.personThermalBioDetection,
              personTrajectoryEnabled: config.personTrajectoryTracking,
              personLoiteringEnabled: config.personLoiteringDetection,
              personProximityEnabled: config.personProximityDistance,
              personMicroMotionEnabled: config.personMicroMotion,
              solidBodyVolumetricMesh: config.solidBodyVolumetricMesh,
              persistentPersonLock: config.persistentPersonLock,
              throughWallPenetration: config.throughWallPenetration,
              pirSensitivity: config.pirSensitivity,
              excludedGrid: config.excludedGrid,
            }
          );

          setMotionScore(result.motionScore);
          setPersonDetected(result.personDetected);
          setBoundingBoxes(result.boxes);
          setGlintCandidates(result.glints);

          const now = Date.now();

          // Throttled update of ambientLux (~600ms) and Auto Night Vision Trigger
          if (now - lastLuxUpdateRef.current > 600) {
            lastLuxUpdateRef.current = now;
            setEnhancement((prev) =>
              prev.ambientLux !== result.ambientLux ? { ...prev, ambientLux: result.ambientLux } : prev
            );

            // Auto-Night Vision: If light drops below 12 Lux and operator has autoNightVision enabled and currently on normal
            if (
              enhancement.autoNightVision &&
              result.ambientLux < 12 &&
              currentFilter === 'normal' &&
              now - lastAutoNvTriggerRef.current > 20000
            ) {
              lastAutoNvTriggerRef.current = now;
              setCurrentFilter('night-white');
              addSecurityEvent(
                'stealth_engaged',
                'Auto-Visión Nocturna Activada',
                `Iluminación ambiental crítica (${result.ambientLux} Lux). Sistema activó automáticamente NVG Fósforo Blanco Gen 3+.`,
                'low'
              );
              triggerHapticVibrate([40, 40]);
            }
          }

          // 1. Person Silhouette Alert
          if (result.personDetected && now - lastAlertTimeRef.current.person > 10000) {
            lastAlertTimeRef.current.person = now;
            addSecurityEvent(
              'person',
              'Silueta Humana Confirmada (Fuerza Boost)',
              `Persona identificada con ${result.maxPersonConfidence}% de confianza`,
              'critical'
            );

            if (config.pushNotifications) {
              sendPushAlert(
                '🚨 ¡PERSONA DETECTADA!',
                `Se detectó presencia humana con ${result.maxPersonConfidence}% de certeza.`
              );
            }
            if (config.vibrationAlert) {
              triggerHapticVibrate([220, 100, 220]);
            }
            if (config.soundAlarm) {
              playTacticalAlertSound('critical');
            }

            if (config.autoRecordOnDetection && !isRecording) {
              startRecording('person');
              if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
              autoRecordTimeoutRef.current = window.setTimeout(() => {
                stopRecording();
              }, config.autoRecordDuration * 1000);
            }
          }

          // 2. Motion Alert
          if (result.motionScore > 35 && !result.personDetected && now - lastAlertTimeRef.current.motion > 12000) {
            lastAlertTimeRef.current.motion = now;
            addSecurityEvent(
              'motion',
              'Movimiento Detectado',
              `Flujo óptico al ${result.motionScore}% (${config.detectionBoost}x fuerza)`,
              'medium'
            );

            if (config.pushNotifications) {
              sendPushAlert(
                '⚠️ Movimiento Detectado',
                `Actividad detectada en el área (${result.motionScore}% intensidad).`
              );
            }
            if (config.vibrationAlert) {
              triggerHapticVibrate([80]);
            }

            if (config.autoRecordOnDetection && !isRecording) {
              startRecording('motion');
              if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
              autoRecordTimeoutRef.current = window.setTimeout(() => {
                stopRecording();
              }, config.autoRecordDuration * 1000);
            }
          }

          // 3. Hidden Camera Glint Alert
          if (result.glints.length > 0 && now - lastAlertTimeRef.current.glint > 12000) {
            lastAlertTimeRef.current.glint = now;
            const topGlint = result.glints[0];
            addSecurityEvent(
              'lens_glint',
              topGlint.isIR ? '🚨 Emisor Infrarrojo Spy' : '🔍 Reflejo Lente Óptico',
              `Coordenadas: [${Math.round(topGlint.x)}, ${Math.round(topGlint.y)}] (${topGlint.confidence}% certeza)`,
              'high'
            );

            if (config.pushNotifications) {
              sendPushAlert(
                topGlint.isIR ? '🚨 ¡Cámara Infrarroja Detectada!' : '🔍 ¡Posible Lente Espía Detectado!',
                `Retro-reflexión óptica confirmada en el encuadre.`
              );
            }
            if (config.vibrationAlert) {
              triggerHapticVibrate([100, 50, 100]);
            }
          }
        }
      }

      // Audio Level Meter & Sound Spike Alert
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(audioDataArray);
        let sum = 0;
        for (let i = 0; i < audioDataArray.length; i++) {
          sum += audioDataArray[i];
        }
        const avg = sum / audioDataArray.length;
        const currentAudioLvl = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(currentAudioLvl);

        // Sound spike trigger
        if (config.soundSpikeDetection && currentAudioLvl > 70) {
          const now = Date.now();
          if (now - lastAlertTimeRef.current.sound > 15000) {
            lastAlertTimeRef.current.sound = now;
            addSecurityEvent(
              'motion',
              'Alerta de Pico Sonoro / Ruido',
              `Sonido inusual detectado (${currentAudioLvl}% nivel VU)`,
              'medium'
            );
            if (config.autoRecordOnDetection && !isRecording) {
              startRecording('motion');
              if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
              autoRecordTimeoutRef.current = window.setTimeout(() => {
                stopRecording();
              }, config.autoRecordDuration * 1000);
            }
          }
        }
      }

      // FPS
      frameCount++;
      const currentNow = performance.now();
      if (currentNow - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentNow;
      }

      animFrameId = requestAnimationFrame(processLoop);
    };

    animFrameId = requestAnimationFrame(processLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [
    currentFilter,
    enhancement,
    config,
    isRecording,
    startRecording,
    stopRecording,
    addSecurityEvent,
    isSimulatedFeed,
  ]);

  const handleDeleteRecording = (id: string) => {
    deleteRecordingFromDB(id);
    setRecordings((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((r) => r.id !== id);
    });
  };

  // Viewport aspect ratio container sizing
  const getViewportAspectContainerClass = () => {
    if (hudStyle === 'clean') {
      // Clean mode expands to maximum immersive height
      return 'w-full h-[78vh] sm:h-[84vh]';
    }
    switch (aspectMode) {
      case 'cover':
        return 'w-full h-[62vh] sm:h-[72vh]';
      case '16:9':
        return 'w-full aspect-[16/9] max-h-[72vh]';
      case '4:3':
        return 'w-full max-w-4xl aspect-[4/3] max-h-[72vh] mx-auto';
      case '9:16':
        return 'w-full max-w-sm aspect-[9/16] max-h-[78vh] mx-auto';
      case '1:1':
        return 'w-full max-w-lg aspect-square max-h-[72vh] mx-auto';
      case 'contain':
      default:
        return 'w-full aspect-[16/9] max-h-[70vh]';
    }
  };

  const getCanvasFitClass = () => {
    if (aspectMode === 'cover') return 'w-full h-full object-cover';
    return 'w-full h-full object-contain';
  };

  // Privacy Mode (Fake Black Terminal) Handlers with Local Persistence
  const handleActivatePrivacyMode = useCallback(() => {
    setDecoyMode('terminal');
    savePrivacyActiveStateToDB(true);
    addSecurityEvent(
      'stealth_engaged',
      'Modo Privacidad Activado',
      'Pantalla camuflada de terminal negro activada en primer plano (Grabación y sensores en segundo plano)',
      'medium'
    );
  }, [addSecurityEvent]);

  const handleExitDecoy = useCallback(() => {
    const prevMode = decoyMode;
    setDecoyMode('none');
    savePrivacyActiveStateToDB(false);
    addSecurityEvent(
      'stealth_engaged',
      prevMode === 'terminal' ? 'Modo Privacidad Desactivado' : 'Modo Oculto Desactivado',
      `Retorno al panel de control desde ${prevMode.toUpperCase()}`,
      'low'
    );
  }, [decoyMode, addSecurityEvent]);

  const handleUpdatePrivacyConfig = useCallback((updated: Partial<PrivacyTerminalConfig>) => {
    setPrivacyConfig((prev) => {
      const next = { ...prev, ...updated };
      savePrivacyConfigToDB(next);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#06090d] text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Hidden Webcam Video Input */}
      <video ref={videoRef} playsInline muted autoPlay className="hidden" />

      {/* Hidden Canvas for fast processing */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Decoy Screen & Privacy Terminal Component */}
      <DecoyScreens
        mode={decoyMode}
        onExit={handleExitDecoy}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        privacyConfig={privacyConfig}
        onUpdatePrivacyConfig={handleUpdatePrivacyConfig}
      />

      {/* Header toolbar with Privacy Mode, Camera Power & Quality Buttons */}
      <Header
        onSelectDecoy={(mode) => {
          setDecoyMode(mode);
          if (mode === 'terminal') {
            savePrivacyActiveStateToDB(true);
          } else {
            savePrivacyActiveStateToDB(false);
          }
          addSecurityEvent(
            'stealth_engaged',
            mode === 'terminal' ? 'Modo Privacidad Activado' : 'Modo Oculto Activado',
            `Pantalla simulada: ${mode.toUpperCase()} (Grabación en segundo plano activa)`,
            'medium'
          );
        }}
        onOpenPrivacyMode={handleActivatePrivacyMode}
        onSwitchCamera={handleSwitchCamera}
        onToggleTorch={handleToggleTorch}
        torchActive={torchActive}
        onOpenVault={() => {
          if (vaultSecurityConfig.autoLockOnExit && activeTab !== 'vault') {
            setIsVaultUnlocked(false);
          }
          setActiveTab('vault');
        }}
        onOpenLogs={() => setIsLogModalOpen(true)}
        recordingsCount={recordings.length}
        eventsCount={securityEvents.length}
        facingMode={facingMode}
        isCameraOn={isCameraOn}
        onToggleCameraPower={handleToggleCameraPower}
        onOpenQualitySettings={() => setIsQualityModalOpen(true)}
        qualityConfig={qualityConfig}
        cloudConsent={cloudConsent}
        onOpenConsentModal={() => setIsConsentModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col gap-3">
        {/* Navigation Tabs Bar & Quick Clean Mode Toggle */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              onClick={() => {
                if (vaultSecurityConfig.autoLockOnExit && activeTab === 'vault') {
                  setIsVaultUnlocked(false);
                }
                setActiveTab('monitor');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'monitor'
                  ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border border-transparent'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>CÁMARA & MONITOR HUD</span>
            </button>

            {/* Quick Night Vision Fast-Toggle Button */}
            <button
              onClick={() => {
                if (vaultSecurityConfig.autoLockOnExit && activeTab === 'vault') {
                  setIsVaultUnlocked(false);
                }
                setActiveTab('monitor');
                // Cycle between flagship night modes: WP -> Green -> Bi-Spectral Fusion -> FLIR -> Starlight -> Normal
                if (currentFilter === 'normal') {
                  setCurrentFilter('night-white');
                  setEnhancement((prev) => ({ ...prev, gain: Math.max(prev.gain, 3) }));
                  addSecurityEvent(
                    'stealth_engaged',
                    'Visión Nocturna Activada',
                    'Modo NVG Fósforo Blanco Gen 3+ activado con amplificación fotónica',
                    'low'
                  );
                } else if (currentFilter === 'night-white') {
                  setCurrentFilter('night-green');
                } else if (currentFilter === 'night-green') {
                  setCurrentFilter('fusion-thermal-nvg');
                } else if (currentFilter === 'fusion-thermal-nvg') {
                  setCurrentFilter('starlight-boost');
                } else {
                  setCurrentFilter('normal');
                }
                triggerHapticVibrate([50]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                currentFilter !== 'normal'
                  ? 'bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 shadow-md shadow-cyan-950/40'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border border-transparent'
              }`}
              title="Alternar Modos de Visión Nocturna Táctica (Fósforo Blanco, Fósforo Verde, Fusión Bi-Espectral, Starlight)"
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                VISIÓN NOCTURNA {currentFilter !== 'normal' ? `(${currentFilter.toUpperCase()})` : 'NVG'}
              </span>
              {enhancement.ambientLux !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    enhancement.ambientLux < 10
                      ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                      : 'bg-black/50 text-zinc-400'
                  }`}
                >
                  {enhancement.ambientLux.toFixed(1)} LX
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (vaultSecurityConfig.autoLockOnExit && activeTab === 'vault') {
                  setIsVaultUnlocked(false);
                }
                setActiveTab('detector');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'detector'
                  ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>DETECCIÓN & FUERZA ({config.detectionBoost}x)</span>
            </button>

            <button
              onClick={() => {
                if (vaultSecurityConfig.autoLockOnExit && activeTab === 'vault') {
                  setIsVaultUnlocked(false);
                }
                setActiveTab('scanner');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'scanner'
                  ? 'bg-red-500/10 border border-red-500/40 text-red-400'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border border-transparent'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>BUSCADOR CÁMARAS OCULTAS</span>
            </button>

            <button
              onClick={() => {
                if (vaultSecurityConfig.autoLockOnExit && activeTab !== 'vault') {
                  setIsVaultUnlocked(false);
                }
                setActiveTab('vault');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vault'
                  ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border border-transparent'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>BÓVEDA ({recordings.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Grid Exclusion button */}
            <button
              onClick={() => setIsGridModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/60 text-xs font-mono font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              title="Zonas de Exclusión (Grid Mask) para omitir ventanas o tráfico constante"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              <span>ZONAS GRID</span>
            </button>

            {/* Wi-Fi CSI & Espectrograma button */}
            <button
              onClick={() => setIsWifiCsiOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-cyan-950/40"
              title="Wi-Fi CSI Spectrogram & 3D Humanoid RF DensePose"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>WI-FI CSI RF</span>
            </button>

            {/* Direct Privacy Mode (Terminal Camuflado) button */}
            <button
              onClick={handleActivatePrivacyMode}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-xs font-mono font-bold text-emerald-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-950/40 animate-pulse hover:animate-none"
              title="Activar Modo Privacidad: Pantalla completa de terminal negro falso (Guardado local)"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>MODO PRIVACIDAD</span>
            </button>

            {/* 1-Tap Visor Súper Limpio button */}
            <button
              onClick={() => setHudStyle(hudStyle === 'clean' ? 'full' : 'clean')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                hudStyle === 'clean'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-950/60'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="Alternar Visor 100% Limpio (Sin ninguna interfaz ni bordes)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{hudStyle === 'clean' ? 'VISOR LIMPIO (ACTIVO)' : 'VISOR SÚPER LIMPIO'}</span>
            </button>

            <button
              onClick={handleTakeSnapshot}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              title="Foto espía con filtro procesado"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Foto</span>
            </button>
          </div>
        </div>

        {/* Camera Permission Alert & Simulation Mode Quick Action */}
        {hasCameraPermission === false && (
          <div className="bg-red-950/60 border border-red-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-200 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">
                  {isSimulatedFeed ? 'Modo Demostración Táctico Activo' : 'Permiso de cámara o micrófono requerido'}
                </h4>
                <p className="text-xs text-red-300 mt-1">
                  {isSimulatedFeed
                    ? 'Procesando escena sintética de prueba a 60 FPS con detección de siluetas, visión térmica y escáner óptico.'
                    : 'Para operar con tu cámara física, permite el acceso en el navegador o activa el feed táctico simulado para probar todas las funciones.'}
                </p>
                {cameraError && !isSimulatedFeed && (
                  <p className="text-[11px] font-mono text-red-400 mt-1">Diagnóstico: {cameraError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => {
                  setIsSimulatedFeed(true);
                  setIsCameraOn(true);
                }}
                className={`px-3 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-lg transition-all flex items-center gap-1.5 ${
                  isSimulatedFeed
                    ? 'bg-amber-600 hover:bg-amber-500 text-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-black animate-pulse hover:animate-none'
                }`}
                title="Activar simulación forense interactiva sin necesidad de webcam física"
              >
                <Activity className="w-4 h-4" />
                <span>{isSimulatedFeed ? 'Feed Simulado Activo' : 'Probar Feed Simulado'}</span>
              </button>
              <button
                onClick={() => {
                  setIsSimulatedFeed(false);
                  setIsCameraOn(false);
                  setTimeout(() => setIsCameraOn(true), 250);
                }}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs cursor-pointer border border-zinc-600 transition-all flex items-center gap-1.5"
                title="Reintentar conexión con la cámara física"
              >
                <SwitchCamera className="w-4 h-4 text-emerald-400" />
                <span>Reintentar Cámara</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Surveillance Viewport with Dynamic Aspect Sizing & Clean Visor */}
        <div
          className={`relative ${getViewportAspectContainerClass()} bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center transition-all duration-300`}
        >
          {/* Main Visual Display Canvas */}
          <canvas
            ref={displayCanvasRef}
            className={`${getCanvasFitClass()} transition-all duration-200`}
          />

          {/* Camera Standby Screen when powered OFF */}
          {!isCameraOn && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 font-mono">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
                <PowerOff className="w-8 h-8 text-red-400 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-wider">
                SENSOR DE CÁMARA EN STANDBY (APAGADO)
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
                El sensor óptico ha sido desconectado. Los LEDs físicos están apagados para proteger tu privacidad y ahorrar batería.
              </p>
              <button
                onClick={handleToggleCameraPower}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/60 transition-all hover:scale-105"
              >
                <Power className="w-4 h-4" />
                <span>ENCENDER CÁMARA (ACTIVAR SENSOR)</span>
              </button>
            </div>
          )}

          {/* CRT scanline simulation */}
          {hudStyle !== 'clean' && isCameraOn && (
            <>
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-70"></div>
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-35"></div>
            </>
          )}

          {/* Tactical HUD Overlay with Clean Mode & Aspect controls */}
          <TacticalHUD
            filter={currentFilter}
            enhancement={enhancement}
            onUpdateEnhancement={(enh) => setEnhancement((prev) => ({ ...prev, ...enh }))}
            boxes={boundingBoxes}
            glints={glintCandidates}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            motionScore={motionScore}
            personDetected={personDetected}
            fps={fps}
            audioLevel={audioLevel}
            torchActive={torchActive}
            hudStyle={hudStyle}
            onSetHudStyle={setHudStyle}
            aspectMode={aspectMode}
            onSetAspectMode={setAspectMode}
            detectionBoost={config.detectionBoost}
            onSetDetectionBoost={(b) => setConfig((prev) => ({ ...prev, detectionBoost: b }))}
            onQuickRecordToggle={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording('manual');
              }
            }}
            onDecoyTrigger={() => setDecoyMode('black')}
            onPrivacyTrigger={handleActivatePrivacyMode}
            detectionConfig={config}
            onToggleDetectionFilter={(f) => {
              const updated = { ...config, [f]: !config[f] };
              setConfig(updated);
              saveConfigToDB(updated);
            }}
            isCameraOn={isCameraOn}
            onToggleCameraPower={handleToggleCameraPower}
            onOpenQualitySettings={() => setIsQualityModalOpen(true)}
            qualityConfig={qualityConfig}
            onTakeSnapshot={handleTakeSnapshot}
            onTakeVectorSvg={handleTakeVectorSvg}
            isSimulatedFeed={isSimulatedFeed}
            onToggleSimulatedFeed={() => {
              if (isSimulatedFeed) {
                setIsSimulatedFeed(false);
                setIsCameraOn(false);
                setTimeout(() => setIsCameraOn(true), 200);
              } else {
                setIsSimulatedFeed(true);
                setIsCameraOn(true);
              }
            }}
          />
        </div>

        {/* Filter Controls Carousel with Super Gain Booster */}
        <FilterSelector
          currentFilter={currentFilter}
          onSelectFilter={(f) => setCurrentFilter(f)}
          enhancement={enhancement}
          onUpdateEnhancement={(enh) => setEnhancement((prev) => ({ ...prev, ...enh }))}
        />

        {/* Sub-Panels based on Active Tab */}
        {activeTab === 'detector' && (
          <DetectionSettings
            config={config}
            onChangeConfig={(newCfg) => {
              setConfig(newCfg);
              saveConfigToDB(newCfg);
            }}
            profiles={profiles}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
            onLoadProfile={handleLoadProfile}
          />
        )}

        {activeTab === 'scanner' && (
          <HiddenCameraScanner
            glints={glintCandidates}
            sensitivity={config.glintSensitivity}
            onSensitivityChange={(val) => {
              const updated = { ...config, glintSensitivity: val };
              setConfig(updated);
              saveConfigToDB(updated);
            }}
            scannerActive={config.hiddenCameraScanner}
            onToggleScanner={() => {
              const updated = { ...config, hiddenCameraScanner: !config.hiddenCameraScanner };
              setConfig(updated);
              saveConfigToDB(updated);
            }}
            torchActive={torchActive}
            onToggleTorch={handleToggleTorch}
          />
        )}

        {/* Security Vault Protected by PIN or Pattern Authentication Gate */}
        {activeTab === 'vault' && (
          !isVaultUnlocked ? (
            <VaultAuthGate
              securityConfig={vaultSecurityConfig}
              onUnlockSuccess={() => {
                setIsVaultUnlocked(true);
                addSecurityEvent(
                  'vault_unlocked',
                  'Bóveda Desbloqueada',
                  'Acceso autorizado concedido mediante verificación exitosa de clave',
                  'medium'
                );
              }}
              onFailedAttempt={(attempts) => {
                addSecurityEvent(
                  'vault_unauthorized',
                  'Intento de Acceso No Autorizado a la Bóveda',
                  `Intento fallido #${attempts} de verificación de clave PIN/Patrón`,
                  'high'
                );
              }}
              onUpdateConfig={(updated) => {
                const next = { ...vaultSecurityConfig, ...updated };
                setVaultSecurityConfig(next);
                saveVaultSecurityConfigToDB(next);
              }}
            />
          ) : (
            <SecurityVault
              recordings={recordings}
              onDeleteRecording={handleDeleteRecording}
              onTakeSnapshot={handleTakeSnapshot}
              onTakeVectorSvg={handleTakeVectorSvg}
              onLockVault={() => setIsVaultUnlocked(false)}
              securityConfig={vaultSecurityConfig}
              onUpdateSecurityConfig={(updated) => {
                const next = { ...vaultSecurityConfig, ...updated };
                setVaultSecurityConfig(next);
                saveVaultSecurityConfigToDB(next);
              }}
              cloudConsent={cloudConsent}
              onOpenConsentModal={() => setIsConsentModalOpen(true)}
              onUploadToCloud={handleUploadToCloud}
            />
          )
        )}

        {/* Monitor Tab Quick Guide & Specs */}
        {activeTab === 'monitor' && hudStyle !== 'clean' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Pantalla Bloqueada & Visor Limpio</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Toca "100% LIMPIO" para eliminar toda la interfaz y ver la cámara sin distracciones. O pulsa "BLOQUEAR" para simular pantalla apagada o calculadora.
              </p>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono font-semibold mb-1">
                <Radio className="w-3.5 h-3.5" />
                <span>Fuerza de Detección ({config.detectionBoost}x)</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Modo 3x Ultra Agresivo analiza micro-movimientos, siluetas lejanas y picos de audio de susurros, alertando de inmediato vía push.
              </p>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-semibold mb-1">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Súper Ganancia Nocturna ({enhancement.gain}x)</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Aumenta la amplificación hasta 8x para iluminar habitaciones en penumbra absoluta con acumulación Starlight y contraste térmico FLIR dinámico.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Audit Log Modal */}
      <AuditLogModal
        events={securityEvents}
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onClear={() => {
          setSecurityEvents([]);
          saveEventsToDB([]);
        }}
      />

      {/* Video Quality, Resolution & Background Recording Modal */}
      <QualitySettingsModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        qualityConfig={qualityConfig}
        onChangeQuality={(updated) => {
          const next = { ...qualityConfig, ...updated };
          setQualityConfig(next);
          saveCameraQualityConfigToDB(next);
        }}
        onRequestPiP={handleRequestPiP}
        isPiPSupported={typeof document !== 'undefined' && 'pictureInPictureEnabled' in document}
        onOpenPrivacyShieldSettings={() => setIsPrivacyShieldModalOpen(true)}
        totalStorageUsedBytes={totalStorageUsedBytes}
      />

      {/* Privacy Shield & Facial Recognition Modal */}
      <PrivacyShieldModal
        isOpen={isPrivacyShieldModalOpen}
        onClose={() => setIsPrivacyShieldModalOpen(false)}
        config={qualityConfig.privacyShield || {
          enabled: true,
          anonymizeMode: 'proximity_adaptive',
          recognitionActive: true,
          autoAnonymizeUnauthorized: true,
          knownFaces: [],
        }}
        onUpdateConfig={(newPrivacyConfig) => {
          const next = { ...qualityConfig, privacyShield: newPrivacyConfig };
          setQualityConfig(next);
          saveCameraQualityConfigToDB(next);
        }}
      />

      {/* Cloud Consent & Terms Modal (Solo por Aceptación) */}
      <CloudConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        consent={cloudConsent}
        onSaveConsent={handleSaveCloudConsent}
        userEmail={auth.currentUser?.email || undefined}
      />

      {/* Wi-Fi CSI Spectrogram & 3D Humanoid RF DensePose Modal */}
      {isWifiCsiOpen && (
        <WifiCsiSpectrogram
          onClose={() => setIsWifiCsiOpen(false)}
          personDetected={personDetected}
        />
      )}

      {/* Grid Exclusion Zones Modal */}
      <GridExclusionModal
        isOpen={isGridModalOpen}
        onClose={() => setIsGridModalOpen(false)}
        excludedGrid={config.excludedGrid}
        onSaveExcludedGrid={(newGrid) => {
          const nextConfig = { ...config, excludedGrid: newGrid };
          setConfig(nextConfig);
          saveConfigToDB(nextConfig);
        }}
      />

      {/* APK & PWA Offline Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* PWA Offline Notification Indicator */}
      <OfflineIndicator />
    </div>
  );
}
