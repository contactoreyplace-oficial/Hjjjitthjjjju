import React, { useState, useEffect } from 'react';
import { DecoyMode, PrivacyTerminalConfig } from '../types';
import { Lock, Battery, Wifi, Flame, RotateCw, Volume2, Shield } from 'lucide-react';
import { triggerHapticVibrate } from '../utils/audioAlerts';
import { PrivacyTerminalOverlay } from './PrivacyTerminalOverlay';

interface DecoyScreensProps {
  mode: DecoyMode;
  onExit: () => void;
  isRecording: boolean;
  recordingDuration: number;
  privacyConfig?: PrivacyTerminalConfig;
  onUpdatePrivacyConfig?: (cfg: Partial<PrivacyTerminalConfig>) => void;
}

export const DecoyScreens: React.FC<DecoyScreensProps> = ({
  mode,
  onExit,
  isRecording,
  recordingDuration,
  privacyConfig = {
    theme: 'matrix',
    fontSize: 'sm',
    autoStream: true,
    secretPin: 'exit',
    persistOnReload: false,
  },
  onUpdatePrivacyConfig = () => {},
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [calcInput, setCalcInput] = useState<string>('0');
  const [calcPrev, setCalcPrev] = useState<string | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcUnlocked, setCalcUnlocked] = useState<boolean>(false);
  const [updatePercent, setUpdatePercent] = useState<number>(43);
  const [blackTapCount, setBlackTapCount] = useState<number>(0);
  const [showExitHint, setShowExitHint] = useState<boolean>(false);

  // Live Clock for Lock Screen
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDate(
        now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update Progress Simulation
  useEffect(() => {
    if (mode === 'system-update') {
      const interval = setInterval(() => {
        setUpdatePercent((prev) => (prev < 99 ? prev + Math.floor(Math.random() * 2) : 12));
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Keyboard shortcut: Press Escape to exit any decoy screen immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHapticVibrate([80]);
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  if (mode === 'none') {
    return null;
  }

  // 1. OLED PURE BLACK SCREEN (PANTALLA APAGADA)
  if (mode === 'black') {
    return (
      <div
        onClick={() => {
          triggerHapticVibrate([40]);
          setBlackTapCount((prev) => {
            const next = prev + 1;
            if (next >= 2) {
              triggerHapticVibrate([100, 50, 100]);
              onExit();
              return 0;
            }
            return next;
          });
          setShowExitHint(true);
          setTimeout(() => setShowExitHint(false), 2000);
        }}
        className="fixed inset-0 z-50 bg-black cursor-none select-none flex flex-col items-center justify-between p-6 transition-all duration-300"
      >
        {/* Invisible tap helper: very faint hint only on tap */}
        <div className="w-full flex justify-between items-center text-zinc-900 opacity-20 text-[10px] font-mono">
          <span>{isRecording ? '•' : ''}</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>

        {showExitHint ? (
          <div className="bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono px-3 py-1.5 rounded-full animate-fade-in pointer-events-none">
            Toca 1 vez más para volver al panel de control
          </div>
        ) : (
          <div className="w-1 h-1"></div>
        )}

        {/* Secret exit button in corner for easy touch on mobile */}
        <div className="w-full flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticVibrate([100]);
              onExit();
            }}
            className="w-10 h-10 opacity-0 active:opacity-40 text-[9px] text-zinc-600 font-mono"
            title="Salir"
          >
            SALIR
          </button>
        </div>
      </div>
    );
  }

  // 2. FAKE PHONE LOCK SCREEN (PANTALLA DE BLOQUEO)
  if (mode === 'lockscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-neutral-950 to-black select-none flex flex-col justify-between p-6 text-white font-sans">
        {/* Realistic Mobile Status Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-300 px-2 pt-2">
          <div className="flex items-center gap-1 font-semibold">
            <span>Telcel / Movistar</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">5G</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px]">87%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Center Clock & Lock Icon */}
        <div className="flex flex-col items-center mt-12">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur">
            <Lock className="w-4 h-4 text-zinc-300" />
          </div>
          <h1 className="text-7xl font-light tracking-tight font-sans drop-shadow-md">
            {currentTime || '21:45'}
          </h1>
          <p className="text-base text-zinc-300 capitalize mt-1 font-normal tracking-wide drop-shadow">
            {currentDate || 'Domingo, 11 de octubre'}
          </p>

          {/* Fake Realistic Notification Cards */}
          <div className="w-full max-w-sm mt-8 space-y-2.5">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="font-medium text-emerald-400">WhatsApp</span>
                <span>hace 4 min</span>
              </div>
              <p className="text-sm font-semibold text-zinc-100">Mamá</p>
              <p className="text-xs text-zinc-300">¿Ya vas de camino a casa?</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="font-medium text-blue-400">Calendario</span>
                <span>Recordatorio</span>
              </div>
              <p className="text-sm font-semibold text-zinc-100">Revisión de Seguridad</p>
              <p className="text-xs text-zinc-300">Mañana a las 09:00 AM</p>
            </div>
          </div>
        </div>

        {/* Swipe Up or Tap to Unlock */}
        <div className="flex flex-col items-center pb-6">
          <button
            onClick={() => {
              triggerHapticVibrate([80, 40, 80]);
              onExit();
            }}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-1 bg-white/40 rounded-full group-hover:bg-white/80 transition-colors animate-pulse"></div>
            <span className="text-xs text-zinc-400 tracking-wider">
              Desliza o toca para desbloquear
            </span>
          </button>
        </div>
      </div>
    );
  }

  // 3. FAKE CALCULATOR DECOY (CALCULADORA FUNCIONAL CAMUFLADA)
  if (mode === 'calculator') {
    const handleDigit = (digit: string) => {
      setCalcInput((prev) => (prev === '0' ? digit : prev + digit));
    };

    const handleOp = (op: string) => {
      setCalcPrev(calcInput);
      setCalcOp(op);
      setCalcInput('0');
    };

    const handleEquals = () => {
      // Secret unlock PIN check: e.g. "1234" followed by "=" unlocks!
      if (calcInput === '1234' || calcInput === '0000' || calcInput === '9999') {
        triggerHapticVibrate([100, 50, 100]);
        setCalcUnlocked(true);
        setTimeout(onExit, 250);
        return;
      }

      if (calcPrev !== null && calcOp) {
        const num1 = parseFloat(calcPrev);
        const num2 = parseFloat(calcInput);
        let res = 0;
        if (calcOp === '+') res = num1 + num2;
        if (calcOp === '-') res = num1 - num2;
        if (calcOp === '×') res = num1 * num2;
        if (calcOp === '÷') res = num2 !== 0 ? num1 / num2 : 0;
        setCalcInput(String(Math.round(res * 10000) / 10000));
        setCalcPrev(null);
        setCalcOp(null);
      }
    };

    const handleClear = () => {
      setCalcInput('0');
      setCalcPrev(null);
      setCalcOp(null);
    };

    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-end p-4 pb-8 max-w-md mx-auto">
        {/* Stealth Hint header */}
        <div className="flex items-center justify-between text-xs text-zinc-600 mb-auto pt-2 px-2">
          <span>Calculadora</span>
          {/* Secret double tap to exit for emergencies */}
          <button
            onDoubleClick={onExit}
            className="text-[10px] text-zinc-800 hover:text-zinc-600"
            title="Doble clic para salir"
          >
            v2.4
          </button>
        </div>

        {/* Display */}
        <div className="flex flex-col items-end justify-end mb-6 px-4">
          <div className="text-sm text-zinc-500 h-5">
            {calcPrev} {calcOp}
          </div>
          <div className="text-6xl font-light tracking-tight text-white overflow-hidden text-right w-full">
            {calcInput}
          </div>
        </div>

        {/* Secret PIN hint reminder */}
        <div className="text-center text-[11px] text-zinc-700 mb-2 font-mono">
          PIN de escape secreto: <span className="text-zinc-500 font-bold">1234 =</span>
        </div>

        {/* Calculator Keypad */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={handleClear}
            className="h-16 rounded-full bg-zinc-400 text-black text-xl font-medium active:bg-zinc-300"
          >
            AC
          </button>
          <button
            onClick={() => setCalcInput((prev) => String(-parseFloat(prev)))}
            className="h-16 rounded-full bg-zinc-400 text-black text-xl font-medium active:bg-zinc-300"
          >
            ±
          </button>
          <button
            onClick={() => setCalcInput((prev) => String(parseFloat(prev) / 100))}
            className="h-16 rounded-full bg-zinc-400 text-black text-xl font-medium active:bg-zinc-300"
          >
            %
          </button>
          <button
            onClick={() => handleOp('÷')}
            className="h-16 rounded-full bg-amber-500 text-white text-2xl font-medium active:bg-amber-400"
          >
            ÷
          </button>

          <button
            onClick={() => handleDigit('7')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            9
          </button>
          <button
            onClick={() => handleOp('×')}
            className="h-16 rounded-full bg-amber-500 text-white text-2xl font-medium active:bg-amber-400"
          >
            ×
          </button>

          <button
            onClick={() => handleDigit('4')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            6
          </button>
          <button
            onClick={() => handleOp('-')}
            className="h-16 rounded-full bg-amber-500 text-white text-2xl font-medium active:bg-amber-400"
          >
            -
          </button>

          <button
            onClick={() => handleDigit('1')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            3
          </button>
          <button
            onClick={() => handleOp('+')}
            className="h-16 rounded-full bg-amber-500 text-white text-2xl font-medium active:bg-amber-400"
          >
            +
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="col-span-2 h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal text-left pl-7 active:bg-zinc-700"
          >
            0
          </button>
          <button
            onClick={() => handleDigit('.')}
            className="h-16 rounded-full bg-zinc-800 text-white text-2xl font-normal active:bg-zinc-700"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className={`h-16 rounded-full text-white text-2xl font-medium active:scale-95 transition-all ${
              calcUnlocked ? 'bg-emerald-500' : 'bg-amber-500 active:bg-amber-400'
            }`}
          >
            =
          </button>
        </div>
      </div>
    );
  }

  // 4. FAKE SYSTEM UPDATE DECOY
  if (mode === 'system-update') {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-between p-8 select-none">
        <div className="w-full flex justify-between items-center text-xs text-zinc-600">
          <span>Modo Seguro</span>
          <button
            onDoubleClick={onExit}
            className="text-zinc-800 hover:text-zinc-600 text-[10px]"
            title="Doble clic para salir"
          >
            #8942-OS
          </button>
        </div>

        <div className="flex flex-col items-center max-w-xs text-center">
          <div className="relative mb-6">
            <RotateCw className="w-16 h-16 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
            <Shield className="w-6 h-6 text-zinc-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <h2 className="text-lg font-medium text-zinc-100 mb-1">
            Instalando actualización del sistema
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            El dispositivo se reiniciará automáticamente. Por favor no apague ni retire la batería.
          </p>

          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${updatePercent}%` }}
            ></div>
          </div>
          <span className="text-sm font-mono text-cyan-400">{updatePercent}% completado</span>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              triggerHapticVibrate([100, 50]);
              onExit();
            }}
            className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 underline underline-offset-4"
          >
            Toca aquí para cancelar y volver al panel
          </button>
        </div>
      </div>
    );
  }

  // 5. FAKE TERMINAL PRIVACY MODE (MODO PRIVACIDAD PANTALLA TERMINAL NEGRA)
  if (mode === 'terminal') {
    return (
      <PrivacyTerminalOverlay
        onExit={onExit}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        config={privacyConfig}
        onUpdateConfig={onUpdatePrivacyConfig}
      />
    );
  }

  return null;
};
