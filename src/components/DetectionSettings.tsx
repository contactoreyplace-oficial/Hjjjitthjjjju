import React, { useState } from 'react';
import { DetectionConfig, DetectionProfile } from '../types';
import {
  Bell, BellRing, Eye, ShieldCheck, UserCheck, Activity, Zap, Volume2, Vibrate, 
  CheckCircle, Flame, Compass, Clock, Radar, Radio, Power, Sliders, Sparkles, 
  Save, Trash2, PlayCircle, Layers
} from 'lucide-react';
import { requestPushPermission, sendPushAlert, triggerHapticVibrate, playTacticalAlertSound } from '../utils/audioAlerts';

interface DetectionSettingsProps {
  config: DetectionConfig;
  onChangeConfig: (newConfig: DetectionConfig) => void;
  profiles: DetectionProfile[];
  onSaveProfile: (profile: DetectionProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onLoadProfile: (profile: DetectionProfile) => void;
}

const RenderOnOffButton = (field: keyof DetectionConfig, title: string, config: DetectionConfig, onChangeConfig: (newConfig: DetectionConfig) => void) => {
  const isEnabled = Boolean(config[field]);
  return (
    <button
      type="button"
      onClick={() => {
        triggerHapticVibrate([40]);
        onChangeConfig({ ...config, [field]: !isEnabled });
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
        isEnabled
          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-950/60 ring-1 ring-emerald-300'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
      }`}
      title={`Alternar ${title}`}
    >
      <Power className={`w-3.5 h-3.5 ${isEnabled ? 'text-black' : 'text-zinc-500'}`} />
      <span>{isEnabled ? 'ENCENDIDO' : 'APAGADO'}</span>
    </button>
  );
};

export const DetectionSettings: React.FC<DetectionSettingsProps> = ({ 
  config, 
  onChangeConfig,
  profiles,
  onSaveProfile,
  onDeleteProfile,
  onLoadProfile
}) => {
  const [profileName, setProfileName] = useState('');

  const handleSaveProfile = () => {
    if (profileName.trim()) {
      onSaveProfile({
        id: Date.now().toString(),
        name: profileName,
        config: config
      });
      setProfileName('');
    }
  };

  const handleEnableAllFilters = () => {
    triggerHapticVibrate([60, 40, 60]);
    onChangeConfig({
      ...config,
      personDetection: true,
      personSkeletonDetection: true,
      personThermalBioDetection: true,
      personTrajectoryTracking: true,
      personLoiteringDetection: true,
      personProximityDistance: true,
      personMicroMotion: true,
      solidBodyVolumetricMesh: true,
      persistentPersonLock: true,
      throughWallPenetration: true,
      motionDetection: true,
      hiddenCameraScanner: true,
      soundSpikeDetection: true,
    });
  };

  const handleDisableAllFilters = () => {
    triggerHapticVibrate([80]);
    onChangeConfig({
      ...config,
      personDetection: false,
      personSkeletonDetection: false,
      personThermalBioDetection: false,
      personTrajectoryTracking: false,
      personLoiteringDetection: false,
      personProximityDistance: false,
      personMicroMotion: false,
      solidBodyVolumetricMesh: false,
      persistentPersonLock: false,
      throughWallPenetration: false,
      motionDetection: false,
      hiddenCameraScanner: false,
      soundSpikeDetection: false,
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Profile Manager Section */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4" /> Perfiles de Detección
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Nombre del nuevo perfil..."
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100"
          />
          <button onClick={handleSaveProfile} className="bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1">
            <Save className="w-3 h-3" /> Guardar
          </button>
        </div>
        <div className="space-y-2">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-300 font-bold">{p.name}</span>
              <div className="flex gap-1">
                <button onClick={() => onLoadProfile(p)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-emerald-400">
                  <PlayCircle className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteProfile(p.id)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Settings Grid ... */}
      <div className="bg-zinc-950/85 border border-zinc-800 rounded-xl p-4 backdrop-blur-md space-y-5">
        {/* ... detection config settings ... */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold text-zinc-200">Detección de Personas/Humanoides</h4>
            </div>
            {RenderOnOffButton('personDetection', 'Detección de Personas', config, onChangeConfig)}
        </div>
        {/* ... other settings ... */}
        <div className="flex gap-3">
          <button onClick={handleEnableAllFilters} className="bg-emerald-950 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500">Activar Todo</button>
          <button onClick={handleDisableAllFilters} className="bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700">Desactivar Todo</button>
        </div>
      </div>
    </div>
  );
};
