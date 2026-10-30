import React, { useState } from 'react';
import { Grid, ShieldAlert, Check, X, RotateCcw, HelpCircle } from 'lucide-react';

interface GridExclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  excludedGrid?: boolean[][];
  onSaveExcludedGrid: (grid: boolean[][]) => void;
}

const GRID_ROWS = 12;
const GRID_COLS = 16;

export const GridExclusionModal: React.FC<GridExclusionModalProps> = ({
  isOpen,
  onClose,
  excludedGrid,
  onSaveExcludedGrid,
}) => {
  const [grid, setGrid] = useState<boolean[][]>(() => {
    if (excludedGrid && excludedGrid.length === GRID_ROWS && excludedGrid[0]?.length === GRID_COLS) {
      return excludedGrid.map((row) => [...row]);
    }
    return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
  });

  if (!isOpen) return null;

  const handleCellClick = (r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
  };

  const handleClearAll = () => {
    setGrid(Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false)));
  };

  const handleSelectAll = () => {
    setGrid(Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(true)));
  };

  const handleSave = () => {
    onSaveExcludedGrid(grid);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col font-mono text-zinc-100">
        
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-3.5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Grid className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400 tracking-wider">
                CONFIGURACIÓN DE ZONAS DE EXCLUSIÓN (GRID MASK)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Selecciona celdas para excluir ventanas, árboles o tráfico constante del análisis de IA y CV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Las celdas en <strong className="text-red-400">Rojo / Rayadas</strong> están excluidas (sin detección). Las celdas en <strong className="text-emerald-400">Verde</strong> están activas para vigilancia.
          </span>
        </div>

        {/* Interactive Grid Canvas */}
        <div className="p-5 flex flex-col items-center justify-center bg-black/60">
          <div
            className="grid gap-1 bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '540px',
              aspectRatio: '16/9',
            }}
          >
            {grid.map((row, r) =>
              row.map((isExcluded, c) => (
                <button
                  key={`cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`rounded transition-all cursor-pointer border flex items-center justify-center text-[9px] font-bold ${
                    isExcluded
                      ? 'bg-red-950/80 border-red-600/80 text-red-300 shadow-[inset_0_0_8px_rgba(239,68,68,0.4)]'
                      : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-400 text-emerald-400/60'
                  }`}
                  title={`Fila ${r + 1}, Columna ${c + 1}: ${isExcluded ? 'EXCLUIDO' : 'ACTIVO'}`}
                >
                  {isExcluded ? '✕' : '•'}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-zinc-900 px-5 py-3.5 border-t border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer border border-zinc-700 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Todo</span>
            </button>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer border border-zinc-700 transition-all"
            >
              Excluir Todo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar y Aplicar Mármol</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
