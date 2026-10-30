import React, { useState } from 'react';
import { PrivacyShieldConfig, KnownFaceRecord } from '../types';
import {
  Shield,
  Eye,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Check,
  X,
  Sliders,
  Sparkles,
  Lock,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { triggerHapticVibrate } from '../utils/audioAlerts';

interface PrivacyShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrivacyShieldConfig;
  onUpdateConfig: (newConfig: PrivacyShieldConfig) => void;
}

export const PrivacyShieldModal: React.FC<PrivacyShieldModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<PrivacyShieldConfig>(config);
  const [newFaceName, setNewFaceName] = useState<string>('');
  const [newFaceCategory, setNewFaceCategory] = useState<'authorized' | 'vip' | 'unauthorized'>('unauthorized');

  if (!isOpen) return null;

  const handleSave = () => {
    triggerHapticVibrate([60, 40, 60]);
    onUpdateConfig(localConfig);
    onClose();
  };

  const handleAddFace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaceName.trim()) return;
    const newRecord: KnownFaceRecord = {
      id: `face-${Date.now()}`,
      name: newFaceName.trim(),
      category: newFaceCategory,
      confidence: Math.floor(88 + Math.random() * 11) / 100,
    };
    setLocalConfig({
      ...localConfig,
      knownFaces: [...localConfig.knownFaces, newRecord],
    });
    setNewFaceName('');
  };

  const handleRemoveFace = (id: string) => {
    setLocalConfig({
      ...localConfig,
      knownFaces: localConfig.knownFaces.filter((f) => f.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-zinc-950 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 font-mono flex items-center gap-2">
                <span>ESCUDO DE PRIVACIDAD & RECONOCIMIENTO FACIAL</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 font-mono">PROXIMIDAD ADAPTATIVA</span>
              </h2>
              <p className="text-xs text-zinc-400">Anonimización inteligente por distancia con IA y biometría local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar text-zinc-300">

          {/* Master Toggle */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Activar Escudo de Privacidad CV</span>
              </span>
              <p className="text-xs text-zinc-400">Anonimiza rostros no reconocidos de forma dinámica en tiempo real</p>
            </div>
            <button
              onClick={() => {
                triggerHapticVibrate([40]);
                setLocalConfig({ ...localConfig, enabled: !localConfig.enabled });
              }}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                localConfig.enabled ? 'bg-emerald-600' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Anonymization Mode Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo de Anonimización Visual (Incluye Proximidad Adaptativa)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'proximity_adaptive', name: 'Proximidad Adaptativa (IA)', desc: 'Alterna Blur / Máscara según distancia' },
                { id: 'gaussian_blur', name: 'Difuminado Gaussiano', desc: 'Blur suave de alta calidad' },
                { id: 'pixelate', name: 'Pixelado Criptográfico', desc: 'Mosaico de bloques seguros' },
                { id: 'cyber_mask', name: 'Máscara Digital Cyber', desc: 'Overlay táctico futurista' },
                { id: 'visor_blackout', name: 'Visor Negro (Blackout)', desc: 'Privacidad absoluta 100%' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setLocalConfig({ ...localConfig, anonymizeMode: mode.id as any })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    localConfig.anonymizeMode === mode.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/50'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold">{mode.name}</span>
                  <span className="text-[10px] text-zinc-500 mt-1">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Facial Recognition & Auto-Anonymize Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">Reconocimiento Facial IA</span>
                <p className="text-[11px] text-zinc-400">Identifica rostros con base de datos biométrica local</p>
              </div>
              <button
                onClick={() => setLocalConfig({ ...localConfig, recognitionActive: !localConfig.recognitionActive })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  localConfig.recognitionActive ? 'bg-emerald-600' : 'bg-zinc-800'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${localConfig.recognitionActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">Auto-Anonimizar Intrusos</span>
                <p className="text-[11px] text-zinc-400">Aplica escudo automáticamente a no autorizados</p>
              </div>
              <button
                onClick={() => setLocalConfig({ ...localConfig, autoAnonymizeUnauthorized: !localConfig.autoAnonymizeUnauthorized })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  localConfig.autoAnonymizeUnauthorized ? 'bg-emerald-600' : 'bg-zinc-800'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${localConfig.autoAnonymizeUnauthorized ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Known Faces & Biometric Registry Manager */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base de Datos Biométrica y Rostros Conocidos ({localConfig.knownFaces.length})</span>
              </h3>
            </div>

            {/* Add Face Form */}
            <form onSubmit={handleAddFace} className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del individuo (ej. Operador X, Invitado)..."
                value={newFaceName}
                onChange={(e) => setNewFaceName(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <select
                value={newFaceCategory}
                onChange={(e: any) => setNewFaceCategory(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="authorized">Autorizado</option>
                <option value="vip">VIP / Operador</option>
                <option value="unauthorized">No Autorizado (Intruso)</option>
              </select>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar</span>
              </button>
            </form>

            {/* Faces List */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {localConfig.knownFaces.map((face) => (
                <div
                  key={face.id}
                  className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${
                      face.category === 'vip'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : face.category === 'authorized'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-red-500/20 border-red-500/40 text-red-400'
                    }`}>
                      {face.category === 'unauthorized' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-white font-mono">{face.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          face.category === 'vip'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : face.category === 'authorized'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {face.category.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">Confianza: {Math.round(face.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFace(face.id)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-700 transition-colors"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">Procesamiento en tiempo real local (Sin latencia cloud)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold font-mono text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/60"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar y Guardar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
