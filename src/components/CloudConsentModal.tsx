import React, { useState } from 'react';
import { CloudConsentConfig } from '../types';
import { Cloud, Shield, Check, Lock, AlertTriangle, HardDrive, FileCheck, X } from 'lucide-react';
import { triggerHapticVibrate } from '../utils/audioAlerts';

interface CloudConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consent: CloudConsentConfig;
  onSaveConsent: (newConsent: CloudConsentConfig) => void;
  userEmail?: string;
}

export const CloudConsentModal: React.FC<CloudConsentModalProps> = ({
  isOpen,
  onClose,
  consent,
  onSaveConsent,
  userEmail,
}) => {
  const [accepted, setAccepted] = useState<boolean>(consent.accepted);
  const [autoSync, setAutoSync] = useState<boolean>(consent.autoSyncOnAccept);

  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHapticVibrate([60, 40, 60]);
    onSaveConsent({
      accepted,
      acceptedAt: accepted ? (consent.acceptedAt || new Date().toISOString()) : undefined,
      autoSyncOnAccept: accepted && autoSync,
      userEmail,
    });
    onClose();
  };

  const handleRevoke = () => {
    triggerHapticVibrate([80]);
    setAccepted(false);
    setAutoSync(false);
    onSaveConsent({
      accepted: false,
      acceptedAt: undefined,
      autoSyncOnAccept: false,
      userEmail,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2 text-zinc-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">OPCIÓN DE RESPALDO EN LA NUBE</h3>
              <p className="text-[10px] text-zinc-400">Solo disponible mediante Aceptación Expresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Local-first banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>POLÍTICA DE PRIVACIDAD: LOCAL POR DEFECTO</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Todo el material capturado por StealthCam Pro se procesa y guarda <strong className="text-emerald-400">estrictamente en tu almacenamiento local</strong> del dispositivo en formatos nativos:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-bold">
              <div className="bg-blue-950/60 border border-blue-500/40 rounded p-1.5 text-blue-300">
                <div className="text-xs">.MP4</div>
                <div className="text-[9px] text-zinc-400 font-normal">Grabaciones</div>
              </div>
              <div className="bg-amber-950/60 border border-amber-500/40 rounded p-1.5 text-amber-300">
                <div className="text-xs">.JPG</div>
                <div className="text-[9px] text-zinc-400 font-normal">Fotografías</div>
              </div>
              <div className="bg-purple-950/60 border border-purple-500/40 rounded p-1.5 text-purple-300">
                <div className="text-xs">.SVG</div>
                <div className="text-[9px] text-zinc-400 font-normal">Esquemas CV</div>
              </div>
            </div>
          </div>

          {/* Cloud Policy Explanation */}
          <div className="text-zinc-400 text-[11px] leading-relaxed space-y-1.5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Condiciones de Aceptación para la Nube</span>
            </div>
            <p>
              La sincronización o subida hacia la nube de Firestore está <strong className="text-zinc-200">completamente bloqueada</strong> a menos que actives tu consentimiento explícito a continuación.
            </p>
            <p className="text-[10px] text-zinc-500">
              {userEmail ? (
                <>Cuenta conectada: <span className="text-cyan-400">{userEmail}</span></>
              ) : (
                'Sin cuenta vinculada: Si aceptas, podrás iniciar sesión con Google para sincronizar.'
              )}
            </p>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-2.5 bg-zinc-900/70 border border-zinc-700/80 p-3.5 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-zinc-950 border-zinc-600 text-emerald-500 focus:ring-0 focus:outline-none cursor-pointer"
              />
              <span className="text-zinc-200 font-semibold leading-tight">
                Acepto de forma voluntaria la opción de sincronizar y respaldar evidencias en la nube
              </span>
            </label>

            {accepted && (
              <label className="flex items-start gap-2.5 cursor-pointer pl-6 pt-1 text-zinc-400 animate-fade-in">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-600 text-cyan-500 focus:ring-0 focus:outline-none cursor-pointer"
                />
                <span className="text-[11px]">
                  Subir automáticamente copias de seguridad de nuevas grabaciones (.mp4, .jpg, .svg) tras aceptación
                </span>
              </label>
            )}
          </div>

          {consent.accepted && (
            <div className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-300">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                Aceptado el: {consent.acceptedAt ? new Date(consent.acceptedAt).toLocaleString('es-ES') : 'Previamente'}
              </span>
              <button
                type="button"
                onClick={handleRevoke}
                className="text-red-400 hover:text-red-300 underline cursor-pointer"
              >
                Revocar aceptación
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all cursor-pointer"
          >
            Cerrar (Mantener Solo Local)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              accepted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-black'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{accepted ? 'Guardar Aceptación de Nube' : 'Guardar Modo Solo Local'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
