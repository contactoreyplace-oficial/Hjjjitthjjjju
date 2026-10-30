import React, { useState } from 'react';
import { RecordedMedia, VaultSecurityConfig, CloudConsentConfig, MediaFormat } from '../types';
import {
  Download,
  Trash2,
  Play,
  Camera,
  Film,
  FileCode,
  ShieldCheck,
  KeyRound,
  Check,
  Lock,
  Cloud,
  CloudUpload,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Layers,
  X,
} from 'lucide-react';
import { triggerHapticVibrate } from '../utils/audioAlerts';

interface SecurityVaultProps {
  recordings: RecordedMedia[];
  onDeleteRecording: (id: string) => void;
  onTakeSnapshot: () => void;
  onTakeVectorSvg?: () => void;
  onLockVault?: () => void;
  securityConfig?: VaultSecurityConfig;
  onUpdateSecurityConfig?: (updated: Partial<VaultSecurityConfig>) => void;
  cloudConsent?: CloudConsentConfig;
  onOpenConsentModal?: () => void;
  onUploadToCloud?: (rec: RecordedMedia) => Promise<boolean>;
}

export const SecurityVault: React.FC<SecurityVaultProps> = ({
  recordings,
  onDeleteRecording,
  onTakeSnapshot,
  onTakeVectorSvg,
  onLockVault,
  securityConfig,
  onUpdateSecurityConfig,
  cloudConsent,
  onOpenConsentModal,
  onUploadToCloud,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<RecordedMedia | null>(null);
  const [activeFormatFilter, setActiveFormatFilter] = useState<'all' | 'mp4' | 'jpg' | 'svg'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>(securityConfig?.pin || '1234');
  const [newAuthType, setNewAuthType] = useState<'pin' | 'pattern'>(securityConfig?.authType || 'pin');
  const [autoLock, setAutoLock] = useState<boolean>(securityConfig?.autoLockOnExit !== false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number>(securityConfig?.autoDeleteDays ?? 30);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getFormatBadge = (format: MediaFormat) => {
    switch (format) {
      case 'mp4':
        return (
          <span className="bg-blue-950/80 text-blue-300 border border-blue-500/50 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
            .MP4
          </span>
        );
      case 'jpg':
        return (
          <span className="bg-amber-950/80 text-amber-300 border border-amber-500/50 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
            .JPG
          </span>
        );
      case 'svg':
        return (
          <span className="bg-purple-950/80 text-purple-300 border border-purple-500/50 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
            .SVG
          </span>
        );
      default:
        return null;
    }
  };

  const getTriggerBadge = (trigger: RecordedMedia['trigger']) => {
    switch (trigger) {
      case 'person':
        return <span className="bg-red-950/80 text-red-300 border border-red-500/50 text-[9px] font-mono px-1.5 py-0.5 rounded">AUTO: PERSONA</span>;
      case 'motion':
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-[9px] font-mono px-1.5 py-0.5 rounded">AUTO: MOVIMIENTO</span>;
      case 'hidden_cam':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-500/50 text-[9px] font-mono px-1.5 py-0.5 rounded">AUTO: LENTE GLINT</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-300 text-[9px] font-mono px-1.5 py-0.5 rounded">MANUAL</span>;
    }
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      alert('El PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }
    if (onUpdateSecurityConfig) {
      onUpdateSecurityConfig({
        pin: newPin,
        authType: newAuthType,
        autoLockOnExit: autoLock,
        autoDeleteDays,
        isConfigured: true,
      });
    }
    triggerHapticVibrate([60]);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSettingsOpen(false);
    }, 1200);
  };

  const handleUploadItemToCloud = async (rec: RecordedMedia, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cloudConsent?.accepted) {
      // Must prompt user for acceptance first
      triggerHapticVibrate([80]);
      if (onOpenConsentModal) {
        onOpenConsentModal();
      }
      return;
    }

    if (onUploadToCloud) {
      setUploadingId(rec.id);
      triggerHapticVibrate([40]);
      await onUploadToCloud(rec);
      setUploadingId(null);
    }
  };

  const handleCopySvgContent = (content?: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedSvg(true);
    triggerHapticVibrate([50]);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  // Filter recordings
  const filteredRecordings = recordings.filter((r) => {
    if (activeFormatFilter === 'all') return true;
    return r.format === activeFormatFilter;
  });

  const mp4Count = recordings.filter((r) => r.format === 'mp4').length;
  const jpgCount = recordings.filter((r) => r.format === 'jpg').length;
  const svgCount = recordings.filter((r) => r.format === 'svg').length;

  return (
    <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 backdrop-blur-md space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            BÓVEDA DE EVIDENCIAS & ARCHIVOS LOCALES ({recordings.length})
          </h3>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            100% LOCAL
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Capture JPG */}
          <button
            onClick={onTakeSnapshot}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
            title="Capturar fotograma actual como imagen .JPG"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Foto .JPG</span>
          </button>

          {/* Quick Capture SVG */}
          {onTakeVectorSvg && (
            <button
              onClick={onTakeVectorSvg}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-purple-500/50 text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
              title="Exportar esquema táctico vectorial .SVG con telemetría y esqueleto"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>Vector .SVG</span>
            </button>
          )}

          {/* Cloud Acceptance Settings */}
          {onOpenConsentModal && (
            <button
              onClick={onOpenConsentModal}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                cloudConsent?.accepted
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
              title="Configurar consentimiento de respaldo en la nube (Solo por Aceptación)"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {cloudConsent?.accepted ? 'Nube Autorizada' : 'Opción Nube'}
              </span>
            </button>
          )}

          {/* Vault Security PIN */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
            title="Cambiar PIN o método de acceso de la bóveda"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Seguridad</span>
          </button>

          {/* Lock Vault */}
          {onLockVault && (
            <button
              onClick={() => {
                triggerHapticVibrate([80]);
                onLockVault();
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 hover:bg-red-900/60 text-red-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
              title="Bloquear la bóveda inmediatamente"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Bloquear</span>
            </button>
          )}
        </div>
      </div>

      {/* Local-First Notice & Cloud Acceptance Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Todo se guarda localmente en formatos <strong className="text-blue-400">.mp4</strong>, <strong className="text-amber-400">.jpg</strong> y <strong className="text-purple-400">.svg</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">
            {cloudConsent?.accepted ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Nube habilitada por aceptación
              </span>
            ) : (
              <span className="text-zinc-500">
                Nube inactiva (Solo se sincroniza tras tu aceptación)
              </span>
            )}
          </span>
          {onOpenConsentModal && !cloudConsent?.accepted && (
            <button
              onClick={onOpenConsentModal}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] underline cursor-pointer"
            >
              Ver Términos Nube
            </button>
          )}
        </div>
      </div>

      {/* Security settings modal */}
      {isSettingsOpen && (
        <div className="p-4 bg-zinc-900/80 border border-emerald-500/30 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Configuración de Protección de la Bóveda
            </span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveSecurity} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Clave PIN (4-6 dígitos):</label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 tracking-widest focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Método de desbloqueo:</label>
              <select
                value={newAuthType}
                onChange={(e) => setNewAuthType(e.target.value as 'pin' | 'pattern')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:border-emerald-500 outline-none"
              >
                <option value="pin">PIN Numérico</option>
                <option value="pattern">Patrón Táctico 3x3</option>
              </select>
            </div>

            <div className="flex flex-col justify-between">
              <label className="flex items-center gap-2 text-zinc-300 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLock}
                  onChange={(e) => setAutoLock(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-zinc-900"
                />
                <span>Auto-bloquear al salir</span>
              </label>

              <button
                type="submit"
                className="mt-2 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <span>Guardar Clave</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Format Filter Bar: .MP4, .JPG, .SVG */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800/80 pb-2 overflow-x-auto text-xs">
        <span className="text-zinc-500 text-[10px] mr-1">FORMATO:</span>
        <button
          onClick={() => setActiveFormatFilter('all')}
          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            activeFormatFilter === 'all'
              ? 'bg-zinc-200 text-black font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({recordings.length})
        </button>

        <button
          onClick={() => setActiveFormatFilter('mp4')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            activeFormatFilter === 'mp4'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-zinc-900 text-blue-300 hover:bg-zinc-800'
          }`}
        >
          <Film className="w-3 h-3 text-blue-400" />
          <span>Videos .MP4 ({mp4Count})</span>
        </button>

        <button
          onClick={() => setActiveFormatFilter('jpg')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            activeFormatFilter === 'jpg'
              ? 'bg-amber-600 text-black font-bold'
              : 'bg-zinc-900 text-amber-300 hover:bg-zinc-800'
          }`}
        >
          <Camera className="w-3 h-3 text-amber-400" />
          <span>Fotos .JPG ({jpgCount})</span>
        </button>

        <button
          onClick={() => setActiveFormatFilter('svg')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            activeFormatFilter === 'svg'
              ? 'bg-purple-600 text-white font-bold'
              : 'bg-zinc-900 text-purple-300 hover:bg-zinc-800'
          }`}
        >
          <FileCode className="w-3 h-3 text-purple-400" />
          <span>Esquemas .SVG ({svgCount})</span>
        </button>
      </div>

      {/* Grid of recordings */}
      {filteredRecordings.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center text-zinc-500">
          <Film className="w-8 h-8 text-zinc-700 mb-2" />
          <p className="text-xs">No hay archivos en formato {activeFormatFilter.toUpperCase()} en la bóveda aún.</p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Usa los botones superiores para capturar Fotos .JPG, Esquemas .SVG o Grabar Video .MP4.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRecordings.map((rec) => (
            <div
              key={rec.id}
              className="group bg-zinc-900/60 border border-zinc-800/80 rounded-lg overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              {/* Media preview/thumbnail */}
              <div
                onClick={() => setSelectedMedia(rec)}
                className="relative aspect-video bg-black flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {rec.format === 'svg' ? (
                  <div className="w-full h-full p-2 bg-zinc-950 flex flex-col items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    {rec.thumbnailUrl ? (
                      <img src={rec.thumbnailUrl} alt={rec.name} className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <FileCode className="w-10 h-10 text-purple-400 mb-1" />
                        <span className="text-[10px] text-zinc-400">VECTOR TÁCTICO SVG</span>
                      </>
                    )}
                  </div>
                ) : rec.thumbnailUrl ? (
                  <img
                    src={rec.thumbnailUrl}
                    alt={rec.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                    <Film className="w-8 h-8 text-zinc-700" />
                  </div>
                )}

                {/* Format Tag & Duration */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  {getFormatBadge(rec.format)}
                </div>

                <div className="absolute bottom-1.5 right-1.5 bg-black/85 px-1.5 py-0.5 rounded text-[10px] text-zinc-300">
                  {rec.format === 'jpg' ? 'FOTO' : rec.format === 'svg' ? 'VECTOR' : formatDuration(rec.duration)}
                </div>

                {/* Play/View Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                    {rec.format === 'mp4' ? <Play className="w-4 h-4 ml-0.5 fill-black" /> : <ExternalLink className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Media Info */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-zinc-200 truncate" title={rec.name}>
                      {rec.name}
                    </span>
                    {getTriggerBadge(rec.trigger)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{rec.timestamp}</span>
                    <span>{rec.sizeFormatted}</span>
                  </div>

                  {/* Storage Status */}
                  <div className="flex items-center gap-1.5 mt-1.5 text-[9px]">
                    <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded flex items-center gap-0.5">
                      <HardDrive className="w-2.5 h-2.5" />
                      LOCAL
                    </span>
                    {rec.cloudSynced ? (
                      <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 px-1 py-0.2 rounded flex items-center gap-0.5">
                        <Cloud className="w-2.5 h-2.5 text-cyan-400" />
                        NUBE OK
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded">
                        SOLO LOCAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60">
                  {/* Upload to Cloud button (Solo por Aceptación) */}
                  <button
                    onClick={(e) => handleUploadItemToCloud(rec, e)}
                    disabled={uploadingId === rec.id}
                    className={`p-1 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      rec.cloudSynced
                        ? 'text-cyan-400 hover:text-cyan-300'
                        : 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800'
                    }`}
                    title={
                      cloudConsent?.accepted
                        ? 'Subir copia de seguridad a la nube'
                        : 'Subir a la nube (Requiere previa aceptación de términos)'
                    }
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span className="text-[9px] hidden sm:inline">
                      {rec.cloudSynced ? 'En Nube' : 'Nube'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Native Download (.mp4, .jpg, .svg) */}
                    <a
                      href={rec.url}
                      download={rec.name}
                      className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                      title={`Descargar archivo local como ${rec.format.toUpperCase()} (${rec.name})`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteRecording(rec.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Eliminar de la memoria local"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Playback / Viewer Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                {getFormatBadge(selectedMedia.format)}
                <span className="text-xs font-semibold text-zinc-200">
                  {selectedMedia.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-3 bg-black flex items-center justify-center max-h-[70vh] overflow-auto">
              {selectedMedia.format === 'svg' ? (
                <div className="w-full flex items-center justify-center bg-zinc-950 p-2 rounded">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    className="max-h-[60vh] max-w-full object-contain rounded"
                  />
                </div>
              ) : selectedMedia.format === 'jpg' || selectedMedia.type === 'snapshot' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="max-h-[60vh] object-contain rounded"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="w-full max-h-[60vh] rounded"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[11px] text-zinc-400">
                <span>Grabado: {selectedMedia.timestamp}</span> • <span>Tamaño: {selectedMedia.sizeFormatted}</span> • <span className="text-emerald-400">100% Local</span>
              </div>

              <div className="flex items-center gap-2">
                {selectedMedia.svgContent && (
                  <button
                    onClick={() => handleCopySvgContent(selectedMedia.svgContent)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span>{copiedSvg ? '¡Copiado!' : 'Copiar SVG'}</span>
                  </button>
                )}

                {/* Cloud upload option */}
                <button
                  onClick={(e) => handleUploadItemToCloud(selectedMedia, e)}
                  disabled={uploadingId === selectedMedia.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedMedia.cloudSynced
                      ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {selectedMedia.cloudSynced
                      ? 'En la Nube'
                      : cloudConsent?.accepted
                      ? 'Subir a la Nube'
                      : 'Respaldar a Nube (Requiere Aceptación)'}
                  </span>
                </button>

                {/* Direct Download */}
                <a
                  href={selectedMedia.url}
                  download={selectedMedia.name}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DESCARGAR .{selectedMedia.format.toUpperCase()}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
