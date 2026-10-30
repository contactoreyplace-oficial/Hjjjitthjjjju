import {
  RecordedMedia,
  DetectionConfig,
  SecurityEvent,
  PrivacyTerminalConfig,
  VaultSecurityConfig,
  CameraQualityConfig,
  CloudConsentConfig,
  MediaFormat,
} from '../types';

const DB_NAME = 'StealthCamPro_DB';
const DB_VERSION = 1;
const STORE_RECORDINGS = 'recordings';
const STORE_CONFIG = 'config';
const STORE_EVENTS = 'events';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported on this device'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
        db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecordingToDB(media: RecordedMedia): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDINGS);
    store.put({
      id: media.id,
      name: media.name,
      blob: media.blob,
      timestamp: media.timestamp,
      duration: media.duration,
      sizeFormatted: media.sizeFormatted,
      type: media.type,
      format: media.format || (media.name.endsWith('.mp4') ? 'mp4' : media.name.endsWith('.svg') ? 'svg' : 'jpg'),
      trigger: media.trigger,
      thumbnailUrl: media.thumbnailUrl,
      svgContent: media.svgContent,
      cloudSynced: !!media.cloudSynced,
      cloudSyncedAt: media.cloudSyncedAt,
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving recording to IndexedDB', err);
  }
}

export async function updateRecordingInDB(media: RecordedMedia): Promise<void> {
  return saveRecordingToDB(media);
}

export async function loadRecordingsFromDB(): Promise<RecordedMedia[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDINGS, 'readonly');
    const store = tx.objectStore(STORE_RECORDINGS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const records = request.result || [];
        const items: RecordedMedia[] = records.map((r) => {
          let url = '';
          if (r.blob) {
            url = URL.createObjectURL(r.blob);
          } else if (r.thumbnailUrl) {
            url = r.thumbnailUrl;
          }

          let fmt: MediaFormat = r.format;
          if (!fmt) {
            if (r.name?.endsWith('.mp4') || r.type === 'video') fmt = 'mp4';
            else if (r.name?.endsWith('.svg') || r.type === 'vector_svg') fmt = 'svg';
            else fmt = 'jpg';
          }

          return {
            id: r.id,
            name: r.name,
            blob: r.blob,
            url,
            timestamp: r.timestamp,
            duration: r.duration || 0,
            sizeFormatted: r.sizeFormatted || '0 KB',
            type: r.type || (fmt === 'mp4' ? 'video' : fmt === 'svg' ? 'vector_svg' : 'snapshot'),
            format: fmt,
            trigger: r.trigger || 'manual',
            thumbnailUrl: r.thumbnailUrl,
            svgContent: r.svgContent,
            cloudSynced: !!r.cloudSynced,
            cloudSyncedAt: r.cloudSyncedAt,
          };
        });
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error loading recordings from IndexedDB', err);
    return [];
  }
}

export async function deleteRecordingFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDINGS);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error deleting recording from IndexedDB', err);
  }
}

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  motionDetection: false, // Especializado 100% en Detección de Seres Humanos y Humanoides
  motionSensitivity: 55,
  personDetection: true,
  personSensitivity: 60,
  hiddenCameraScanner: true,
  glintSensitivity: 60,
  autoRecordOnDetection: true,
  autoRecordDuration: 15,
  pushNotifications: false,
  soundAlarm: false,
  vibrationAlert: true,
  stealthAudio: true,
  detectionBoost: 2,
  soundSpikeDetection: true,
  personSkeletonDetection: true,
  personThermalBioDetection: true,
  personTrajectoryTracking: true,
  personLoiteringDetection: true,
  personProximityDistance: true,
  personMicroMotion: true,
  solidBodyVolumetricMesh: true,
  persistentPersonLock: true,
  throughWallPenetration: true,
  pirSensitivity: 65,
  excludedGrid: undefined,
};

export async function saveConfigToDB(config: DetectionConfig): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    store.put({ key: 'main_config', value: config });
  } catch (err) {
    console.warn('Error saving config to IndexedDB', err);
  }
}

export async function loadConfigFromDB(): Promise<DetectionConfig | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const request = store.get('main_config');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_DETECTION_CONFIG, ...request.result.value });
        } else {
          resolve(DEFAULT_DETECTION_CONFIG);
        }
      };
      request.onerror = () => resolve(DEFAULT_DETECTION_CONFIG);
    });
  } catch (err) {
    console.warn('Error loading config from IndexedDB', err);
    return DEFAULT_DETECTION_CONFIG;
  }
}

export async function saveEventsToDB(events: SecurityEvent[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EVENTS, 'readwrite');
    const store = tx.objectStore(STORE_EVENTS);
    store.clear();
    events.slice(0, 50).forEach((ev) => store.put(ev));
  } catch (err) {
    console.warn('Error saving events to IndexedDB', err);
  }
}

export async function loadEventsFromDB(): Promise<SecurityEvent[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EVENTS, 'readonly');
    const store = tx.objectStore(STORE_EVENTS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Error loading events from IndexedDB', err);
    return [];
  }
}

export const DEFAULT_PRIVACY_CONFIG: PrivacyTerminalConfig = {
  theme: 'matrix',
  fontSize: 'sm',
  autoStream: true,
  secretPin: 'exit',
  persistOnReload: false,
};

const LOCAL_STORAGE_PRIVACY_KEY = 'stealthcam_privacy_config';
const LOCAL_STORAGE_ACTIVE_KEY = 'stealthcam_privacy_active';

export async function savePrivacyConfigToDB(config: PrivacyTerminalConfig): Promise<void> {
  try {
    // Save to localStorage immediately
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_KEY, JSON.stringify(config));
    }
    // Also persist to IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    store.put({ key: 'privacy_config', value: config });
  } catch (err) {
    console.warn('Error saving privacy config to IndexedDB', err);
  }
}

export async function loadPrivacyConfigFromDB(): Promise<PrivacyTerminalConfig> {
  // Try synchronous localStorage first for instant load
  if (typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_PRIVACY_KEY);
      if (local) {
        return { ...DEFAULT_PRIVACY_CONFIG, ...JSON.parse(local) };
      }
    } catch {}
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const request = store.get('privacy_config');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_PRIVACY_CONFIG, ...request.result.value });
        } else {
          resolve(DEFAULT_PRIVACY_CONFIG);
        }
      };
      request.onerror = () => resolve(DEFAULT_PRIVACY_CONFIG);
    });
  } catch (err) {
    console.warn('Error loading privacy config from IndexedDB', err);
    return DEFAULT_PRIVACY_CONFIG;
  }
}

export async function savePrivacyActiveStateToDB(active: boolean): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, active ? 'true' : 'false');
    }
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    store.put({ key: 'privacy_active', value: active });
  } catch (err) {
    console.warn('Error saving privacy active state', err);
  }
}

export async function loadPrivacyActiveStateFromDB(): Promise<boolean> {
  if (typeof localStorage !== 'undefined') {
    try {
      const activeStr = localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
      if (activeStr === 'true') return true;
      if (activeStr === 'false') return false;
    } catch {}
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const request = store.get('privacy_active');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && typeof request.result.value === 'boolean') {
          resolve(request.result.value);
        } else {
          resolve(false);
        }
      };
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

export const DEFAULT_VAULT_SECURITY_CONFIG: VaultSecurityConfig = {
  authType: 'pin',
  pin: '1234',
  pattern: [0, 1, 2, 5, 8],
  isConfigured: true,
  autoLockOnExit: true,
  autoDeleteDays: 30, // por defecto 30 días
};

const LOCAL_STORAGE_VAULT_KEY = 'stealthcam_vault_security';

export async function saveVaultSecurityConfigToDB(config: VaultSecurityConfig): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(config));
    }
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    store.put({ key: 'vault_security_config', value: config });
  } catch (err) {
    console.warn('Error saving vault security config', err);
  }
}

export async function loadVaultSecurityConfigFromDB(): Promise<VaultSecurityConfig> {
  if (typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_VAULT_KEY);
      if (local) {
        return { ...DEFAULT_VAULT_SECURITY_CONFIG, ...JSON.parse(local) };
      }
    } catch {}
  }
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const request = store.get('vault_security_config');
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_VAULT_SECURITY_CONFIG, ...request.result.value });
        } else {
          resolve(DEFAULT_VAULT_SECURITY_CONFIG);
        }
      };
      request.onerror = () => resolve(DEFAULT_VAULT_SECURITY_CONFIG);
    });
  } catch {
    return DEFAULT_VAULT_SECURITY_CONFIG;
  }
}

export const DEFAULT_CAMERA_QUALITY_CONFIG: CameraQualityConfig = {
  resolution: '1080p',
  fps: 30,
  bitrate: 'high',
  backgroundRecording: true,
  adaptiveCompression: true,
  irSpectrumAnalyzer: true,
  privacyShield: {
    enabled: true,
    anonymizeMode: 'proximity_adaptive',
    recognitionActive: true,
    autoAnonymizeUnauthorized: true,
    knownFaces: [
      { id: 'f1', name: 'Operador Principal (VIP)', category: 'vip', confidence: 0.98 },
      { id: 'f2', name: 'Personal Autorizado A', category: 'authorized', confidence: 0.92 },
      { id: 'f3', name: 'Desconocido / No Registrado', category: 'unauthorized', confidence: 0.88 },
    ],
  },
  maxLocalStorageGb: 5,
  autoPurgeOldest: true,
};

const LOCAL_STORAGE_QUALITY_KEY = 'stealthcam_quality_config';

export async function saveCameraQualityConfigToDB(config: CameraQualityConfig): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_QUALITY_KEY, JSON.stringify(config));
    }
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    store.put({ key: 'camera_quality_config', value: config });
  } catch (err) {
    console.warn('Error saving camera quality config', err);
  }
}

export async function loadCameraQualityConfigFromDB(): Promise<CameraQualityConfig> {
  if (typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_QUALITY_KEY);
      if (local) {
        return { ...DEFAULT_CAMERA_QUALITY_CONFIG, ...JSON.parse(local) };
      }
    } catch {}
  }
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const request = store.get('camera_quality_config');
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_CAMERA_QUALITY_CONFIG, ...request.result.value });
        } else {
          resolve(DEFAULT_CAMERA_QUALITY_CONFIG);
        }
      };
      request.onerror = () => resolve(DEFAULT_CAMERA_QUALITY_CONFIG);
    });
  } catch {
    return DEFAULT_CAMERA_QUALITY_CONFIG;
  }
}

export const DEFAULT_CLOUD_CONSENT: CloudConsentConfig = {
  accepted: false,
  autoSyncOnAccept: false,
};

const LOCAL_STORAGE_CONSENT_KEY = 'stealthcam_cloud_consent';

export async function saveCloudConsentToDB(consent: CloudConsentConfig): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CONSENT_KEY, JSON.stringify(consent));
    }
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    store.put({ key: 'cloud_consent', value: consent });
  } catch (err) {
    console.warn('Error saving cloud consent to DB', err);
  }
}

export async function loadCloudConsentFromDB(): Promise<CloudConsentConfig> {
  if (typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_CONSENT_KEY);
      if (local) {
        return { ...DEFAULT_CLOUD_CONSENT, ...JSON.parse(local) };
      }
    } catch {}
  }
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const request = store.get('cloud_consent');
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_CLOUD_CONSENT, ...request.result.value });
        } else {
          resolve(DEFAULT_CLOUD_CONSENT);
        }
      };
      request.onerror = () => resolve(DEFAULT_CLOUD_CONSENT);
    });
  } catch {
    return DEFAULT_CLOUD_CONSENT;
  }
}

