import React from 'react';
import { SecurityEvent } from '../types';
import { Shield, Clock, AlertTriangle, User, Activity, Crosshair, X, Trash2, MapPin } from 'lucide-react';

interface AuditLogModalProps {
  events: SecurityEvent[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  events,
  isOpen,
  onClose,
  onClear,
}) => {
  if (!isOpen) return null;

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'person':
        return <User className="w-3.5 h-3.5 text-red-400" />;
      case 'motion':
        return <Activity className="w-3.5 h-3.5 text-teal-400" />;
      case 'lens_glint':
        return <Crosshair className="w-3.5 h-3.5 text-amber-400" />;
      case 'recording_started':
      case 'recording_saved':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full flex flex-col max-h-[80vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold font-mono text-zinc-100">
              REGISTRO TÁCTICO DE AUDITORÍA & INCIDENTES ({events.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Limpiar registro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {events.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500">
              No hay eventos de seguridad registrados todavía.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="bg-zinc-900/50 border border-zinc-800/80 p-2.5 rounded-lg flex items-start justify-between gap-3 font-mono text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded bg-black/60 border border-zinc-800">
                    {getEventIcon(ev.type)}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-200 block">{ev.title}</span>
                    <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                      {ev.description}
                    </span>
                    {ev.latitude !== undefined && ev.longitude !== undefined && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.5 rounded w-fit">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>GPS: {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)} {ev.accuracy ? `(±${Math.round(ev.accuracy)}m)` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap text-[10px] text-zinc-500">
                  {ev.timestamp}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Monitoreo forense en tiempo real</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
