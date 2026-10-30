import React, { useState, useEffect, useRef } from 'react';
import { VaultSecurityConfig } from '../types';
import {
  Lock,
  Unlock,
  KeyRound,
  Grid3X3,
  ShieldAlert,
  ShieldCheck,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  Settings,
  Sparkles,
} from 'lucide-react';
import { playTacticalAlertSound, triggerHapticVibrate } from '../utils/audioAlerts';

interface VaultAuthGateProps {
  securityConfig: VaultSecurityConfig;
  onUnlockSuccess: () => void;
  onFailedAttempt: (attempts: number) => void;
  onUpdateConfig: (updated: Partial<VaultSecurityConfig>) => void;
}

export const VaultAuthGate: React.FC<VaultAuthGateProps> = ({
  securityConfig,
  onUnlockSuccess,
  onFailedAttempt,
  onUpdateConfig,
}) => {
  const [authMode, setAuthMode] = useState<'pin' | 'pattern'>(securityConfig.authType || 'pin');
  const [pinInput, setPinInput] = useState<string>('');
  const [patternInput, setPatternInput] = useState<number[]>([]);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // New config temporary state
  const [tempPin, setTempPin] = useState<string>(securityConfig.pin || '1234');
  const [tempPattern, setTempPattern] = useState<number[]>(securityConfig.pattern || [0, 1, 2, 5, 8]);
  const [tempAuthType, setTempAuthType] = useState<'pin' | 'pattern'>(securityConfig.authType || 'pin');
  const [tempAutoLock, setTempAutoLock] = useState<boolean>(securityConfig.autoLockOnExit !== false);

  const patternSvgRef = useRef<SVGSVGElement | null>(null);
  const [isDrawingPattern, setIsDrawingPattern] = useState<boolean>(false);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = window.setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleKeypadPress = (digit: string) => {
    if (lockoutTime > 0) return;
    if (pinInput.length >= 6) return;

    triggerHapticVibrate([40]);
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setErrorMessage('');

    // Auto verify if matches config length (default 4 digits)
    const expectedPin = securityConfig.pin || '1234';
    if (nextPin.length === expectedPin.length) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    triggerHapticVibrate([30]);
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClearPin = () => {
    triggerHapticVibrate([30]);
    setPinInput('');
    setErrorMessage('');
  };

  const verifyPin = (pinToTest: string) => {
    const targetPin = securityConfig.pin || '1234';
    if (pinToTest === targetPin) {
      // Success!
      triggerHapticVibrate([80, 50, 80]);
      playTacticalAlertSound('access_granted');
      onUnlockSuccess();
    } else {
      // Fail!
      handleAuthFailure();
      setPinInput('');
    }
  };

  const verifyPattern = () => {
    if (lockoutTime > 0) return;
    if (patternInput.length < 3) {
      setErrorMessage('El patrón debe conectar al menos 3 puntos');
      return;
    }

    const targetPattern = securityConfig.pattern || [0, 1, 2, 5, 8];
    const isMatch =
      patternInput.length === targetPattern.length &&
      patternInput.every((val, idx) => val === targetPattern[idx]);

    if (isMatch) {
      triggerHapticVibrate([80, 50, 80]);
      playTacticalAlertSound('access_granted');
      onUnlockSuccess();
    } else {
      handleAuthFailure();
      setPatternInput([]);
    }
  };

  const handleAuthFailure = () => {
    triggerHapticVibrate([200, 100, 200]);
    playTacticalAlertSound('access_denied');
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 600);

    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    onFailedAttempt(nextAttempts);

    if (nextAttempts >= 5) {
      setLockoutTime(30);
      setErrorMessage('¡MÁXIMO DE INTENTOS EXCEDIDO! Bóveda bloqueada por 30s');
    } else {
      setErrorMessage(
        authMode === 'pin'
          ? `PIN incorrecto. Intento ${nextAttempts}/5`
          : `Patrón incorrecto. Intento ${nextAttempts}/5`
      );
    }
  };

  // Node position helper (for 3x3 pattern matrix)
  // 0 1 2
  // 3 4 5
  // 6 7 8
  const getNodeCoordinates = (index: number) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const spacing = 80;
    const padding = 50;
    return {
      x: padding + col * spacing,
      y: padding + row * spacing,
    };
  };

  const handlePatternNodeTouch = (nodeIndex: number) => {
    if (lockoutTime > 0) return;
    if (!patternInput.includes(nodeIndex)) {
      triggerHapticVibrate([30]);
      setPatternInput((prev) => [...prev, nodeIndex]);
      setErrorMessage('');
    }
  };

  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPin.length < 4) {
      alert('El PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (tempPattern.length < 3) {
      alert('El patrón debe contener al menos 3 nodos.');
      return;
    }

    onUpdateConfig({
      pin: tempPin,
      pattern: tempPattern,
      authType: tempAuthType,
      autoLockOnExit: tempAutoLock,
      isConfigured: true,
    });
    setAuthMode(tempAuthType);
    setIsConfigOpen(false);
    triggerHapticVibrate([60, 40]);
  };

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl max-w-md w-full mx-auto my-4 transition-all">
      {/* Security Header Banner */}
      <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-800/80">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Lock className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-base font-bold font-mono tracking-wider text-zinc-100 flex items-center gap-1.5">
          <span>BÓVEDA DE MÁXIMA SEGURIDAD</span>
        </h3>
        <p className="text-[11px] font-mono text-zinc-400 mt-1">
          Cifrado local AES-256 • Verificación de identidad requerida
        </p>

        {/* Lockout warning */}
        {lockoutTime > 0 && (
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>BLOQUEO TEMPORAL: Espera {lockoutTime} segundos</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && lockoutTime === 0 && (
          <div
            className={`mt-2.5 px-3 py-1 rounded bg-red-950/60 border border-red-500/60 text-red-300 text-xs font-mono flex items-center gap-1.5 ${
              errorShake ? 'animate-shake' : ''
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Auth Mode Toggle Tabs (PIN vs PATRÓN) */}
      <div className="flex items-center justify-center gap-2 my-4">
        <button
          onClick={() => {
            setAuthMode('pin');
            setErrorMessage('');
            triggerHapticVibrate([30]);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            authMode === 'pin'
              ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
              : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>PIN NUMÉRICO</span>
        </button>

        <button
          onClick={() => {
            setAuthMode('pattern');
            setErrorMessage('');
            triggerHapticVibrate([30]);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            authMode === 'pattern'
              ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
              : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>PATRÓN TÁCTICO</span>
        </button>
      </div>

      {/* MODE 1: NUMERIC PIN KEYPAD */}
      {authMode === 'pin' && (
        <div className={`space-y-4 ${errorShake ? 'animate-shake' : ''}`}>
          {/* PIN Digit Indicators */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono text-lg font-bold border transition-all duration-200 ${
                    isFilled
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-950/60 scale-105'
                      : 'bg-zinc-900/70 border-zinc-700/80 text-zinc-600'
                  }`}
                >
                  {isFilled ? (showPin ? pinInput[idx] : '•') : ''}
                </div>
              );
            })}

            <button
              onClick={() => setShowPin(!showPin)}
              className="ml-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Keypad Grid 3x4 */}
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                disabled={lockoutTime > 0}
                onClick={() => handleKeypadPress(digit)}
                className="h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 active:bg-emerald-950/60 border border-zinc-800 hover:border-zinc-700 text-zinc-100 font-mono text-lg font-semibold flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {digit}
              </button>
            ))}

            <button
              onClick={handleClearPin}
              disabled={lockoutTime > 0 || pinInput.length === 0}
              className="h-12 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-mono text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
            >
              Limpiar
            </button>

            <button
              disabled={lockoutTime > 0}
              onClick={() => handleKeypadPress('0')}
              className="h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 active:bg-emerald-950/60 border border-zinc-800 hover:border-zinc-700 text-zinc-100 font-mono text-lg font-semibold flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              disabled={lockoutTime > 0 || pinInput.length === 0}
              className="h-12 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-mono text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
            >
              ⌫ Borrar
            </button>
          </div>

          <button
            onClick={() => verifyPin(pinInput)}
            disabled={lockoutTime > 0 || pinInput.length < 4}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-black font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Unlock className="w-4 h-4" />
            <span>DESBLOQUEAR BÓVEDA</span>
          </button>
        </div>
      )}

      {/* MODE 2: PATTERN LOCK (3x3 Grid) */}
      {authMode === 'pattern' && (
        <div className={`flex flex-col items-center space-y-3 ${errorShake ? 'animate-shake' : ''}`}>
          <div className="text-[11px] font-mono text-zinc-400 text-center">
            {patternInput.length === 0
              ? 'Toca los puntos en secuencia para trazar el patrón'
              : `Puntos conectados: ${patternInput.length} (${patternInput.map((n) => n + 1).join(' → ')})`}
          </div>

          {/* Pattern Visual Canvas / SVG Grid */}
          <div className="relative w-[260px] h-[260px] bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-2 select-none touch-none flex items-center justify-center">
            {/* SVG Connecting Lines */}
            <svg
              ref={patternSvgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 260 260"
            >
              {patternInput.map((nodeIndex, idx) => {
                if (idx === 0) return null;
                const prevNode = patternInput[idx - 1];
                const p1 = getNodeCoordinates(prevNode);
                const p2 = getNodeCoordinates(nodeIndex);
                return (
                  <line
                    key={`line-${idx}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="1, 0"
                  />
                );
              })}
            </svg>

            {/* 3x3 Dot Grid Nodes */}
            <div className="grid grid-cols-3 gap-10">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                const isSelected = patternInput.includes(index);
                const orderIndex = patternInput.indexOf(index);
                return (
                  <button
                    key={index}
                    disabled={lockoutTime > 0}
                    onClick={() => handlePatternNodeTouch(index)}
                    className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 scale-110'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-zinc-400'
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[9px] font-mono font-bold flex items-center justify-center">
                        {orderIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full max-w-[260px]">
            <button
              onClick={() => {
                triggerHapticVibrate([30]);
                setPatternInput([]);
                setErrorMessage('');
              }}
              disabled={patternInput.length === 0}
              className="flex-1 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>

            <button
              onClick={verifyPattern}
              disabled={lockoutTime > 0 || patternInput.length < 3}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-black font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>VERIFICAR</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Hint & Settings Footer */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>PIN por defecto: <strong className="text-emerald-400">1234</strong></span>
        </div>

        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="text-zinc-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-2 cursor-pointer transition-colors"
        >
          <Settings className="w-3 h-3" />
          <span>Configurar Clave</span>
        </button>
      </div>

      {/* Security Key Configuration Drawer / Form */}
      {isConfigOpen && (
        <div className="mt-4 p-3.5 bg-zinc-900/90 border border-emerald-500/30 rounded-xl space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between text-zinc-200 border-b border-zinc-800 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Ajustes de Clave Maestra
            </span>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveSecuritySettings} className="space-y-3">
            <div>
              <label className="block text-zinc-400 mb-1">Nuevo PIN Numérico (4-6 dígitos):</label>
              <input
                type="password"
                maxLength={6}
                value={tempPin}
                onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono text-sm tracking-widest focus:border-emerald-500 outline-none"
                placeholder="1234"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Método de Desbloqueo Preferido:</label>
              <select
                value={tempAuthType}
                onChange={(e) => setTempAuthType(e.target.value as 'pin' | 'pattern')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:border-emerald-500 outline-none"
              >
                <option value="pin">PIN Numérico (Recomendado)</option>
                <option value="pattern">Patrón Táctico (3x3)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-300">Auto-Bloquear al salir de la pestaña:</span>
              <input
                type="checkbox"
                checked={tempAutoLock}
                onChange={(e) => setTempAutoLock(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-zinc-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg transition-all"
            >
              GUARDAR NUEVA CLAVE
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
