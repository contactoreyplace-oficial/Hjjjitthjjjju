import React, { useState, useEffect, useRef } from 'react';
import { PrivacyTerminalConfig } from '../types';
import { triggerHapticVibrate } from '../utils/audioAlerts';
import {
  Terminal as TerminalIcon,
  Settings,
  Shield,
  Save,
  CheckCircle2,
  X,
  Play,
  Pause,
  Key,
  Maximize2,
  Minimize2,
  Lock,
} from 'lucide-react';

interface PrivacyTerminalOverlayProps {
  onExit: () => void;
  isRecording: boolean;
  recordingDuration: number;
  config: PrivacyTerminalConfig;
  onUpdateConfig: (newConfig: Partial<PrivacyTerminalConfig>) => void;
}

interface LogLine {
  id: string;
  type: 'system' | 'input' | 'output' | 'error' | 'success';
  text: string;
}

const SAMPLE_KERNEL_LOGS = [
  '[kern.info] kernel: [  28.91023] usb 1-1.2: high-speed interface stream OK',
  '[sys.notice] systemd-timesyncd[412]: Synchronized to time server 192.168.1.1:123',
  '[audit.log] pam_unix(cron:session): session closed for user daemon (uid=1001)',
  '[net.stat] eth0: packets rx: 29482, tx: 27104, drops: 0, errors: 0',
  '[sys.mem] kswapd0: memory pages balanced; free alloc: 12.8 GB',
  '[daemon.io] stealth-worker[1042]: background worker cycle finished in 0.8ms',
  '[sec.guard] iptables: rule #4 applied; input policy ACCEPT (filter: local)',
  '[fs.journal] ext4: committed journal checkpoint 84920 to disk block 410',
  '[dev.poll] evdev: input device event polling active (buffer size: 64)',
  '[sys.perf] loadavg: 0.18 0.22 0.19 1/142 (pid pool synced)',
];

export const PrivacyTerminalOverlay: React.FC<PrivacyTerminalOverlayProps> = ({
  onExit,
  isRecording,
  recordingDuration,
  config,
  onUpdateConfig,
}) => {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [matrixRainActive, setMatrixRainActive] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);
  const [secretPinInput, setSecretPinInput] = useState<string>(config.secretPin || 'exit');

  // Multi-tap gesture detector (triple-tap anywhere to exit)
  const tapCountRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Theme color styles
  const themeStyles = {
    matrix: {
      text: 'text-emerald-400',
      textDim: 'text-emerald-700',
      border: 'border-emerald-800/60',
      bgHeader: 'bg-emerald-950/40',
      accent: 'text-emerald-300',
      badge: 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300',
    },
    amber: {
      text: 'text-amber-400',
      textDim: 'text-amber-700',
      border: 'border-amber-800/60',
      bgHeader: 'bg-amber-950/40',
      accent: 'text-amber-300',
      badge: 'bg-amber-900/40 border-amber-500/40 text-amber-300',
    },
    cyan: {
      text: 'text-cyan-400',
      textDim: 'text-cyan-700',
      border: 'border-cyan-800/60',
      bgHeader: 'bg-cyan-950/40',
      accent: 'text-cyan-300',
      badge: 'bg-cyan-900/40 border-cyan-500/40 text-cyan-300',
    },
    classic: {
      text: 'text-zinc-200',
      textDim: 'text-zinc-600',
      border: 'border-zinc-800',
      bgHeader: 'bg-zinc-900/50',
      accent: 'text-zinc-100',
      badge: 'bg-zinc-800 border-zinc-700 text-zinc-300',
    },
  }[config.theme || 'matrix'];

  const fontSizeClass = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  }[config.fontSize || 'sm'];

  // Initial boot logs
  useEffect(() => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const initialLogs: LogLine[] = [
      { id: '1', type: 'system', text: 'Linux stealth-srv 6.6.12-amd64 (tty1) [x86_64 SMP]' },
      { id: '2', type: 'system', text: `Boot timestamp: ${now} | Secure boot: ENABLED` },
      { id: '3', type: 'system', text: 'Initializing virtual TTY session... done.' },
      { id: '4', type: 'system', text: 'Memory: 16.0 GB RAM total | Cache page hit ratio: 99.4%' },
      { id: '5', type: 'system', text: 'Filesystem /dev/nvme0n1p2 clean, 41820/262144 files, 14% used' },
      { id: '6', type: 'system', text: 'All surveillance and recording background services running.' },
      { id: '7', type: 'success', text: `MODO PRIVACIDAD ACTIVO — Interfaz camuflada en pantalla.` },
      { id: '8', type: 'system', text: `Escribe 'help' para comandos, o escribe '${config.secretPin || 'exit'}' para salir.` },
    ];
    setLogs(initialLogs);
  }, [config.secretPin]);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Periodic simulated kernel streaming daemon (if autoStream is on)
  useEffect(() => {
    if (!config.autoStream) return;

    const interval = setInterval(() => {
      const randomLog = SAMPLE_KERNEL_LOGS[Math.floor(Math.random() * SAMPLE_KERNEL_LOGS.length)];
      const timestamp = new Date().toTimeString().split(' ')[0];
      setLogs((prev) => [
        ...prev.slice(-120), // keep last 120 lines for memory safety
        {
          id: `log-${Date.now()}-${Math.random()}`,
          type: 'system',
          text: `[${timestamp}] ${randomLog}`,
        },
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, [config.autoStream]);

  // Keyboard shortcut listener (ESC to exit immediately)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHapticVibrate([100]);
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // Auto-focus input on click anywhere on terminal
  const handleTerminalClick = () => {
    // Also track triple-tap anywhere on screen to unlock
    const now = Date.now();
    if (now - lastTapTimeRef.current < 450) {
      tapCountRef.current += 1;
      if (tapCountRef.current >= 3) {
        triggerHapticVibrate([80, 50, 80]);
        onExit();
        tapCountRef.current = 0;
        return;
      }
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (!showConfigModal) {
      inputRef.current?.focus();
    }
  };

  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Add to history
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Append input line
    const userLine: LogLine = {
      id: `in-${Date.now()}`,
      type: 'input',
      text: `root@stealth-srv:~# ${trimmed}`,
    };

    // Check unlock PIN/secret command
    const targetSecret = (config.secretPin || 'exit').trim().toLowerCase();
    const cmdLower = trimmed.toLowerCase();

    if (cmdLower === targetSecret || cmdLower === 'exit' || cmdLower === 'unlock' || cmdLower === 'quit') {
      triggerHapticVibrate([100, 60, 100]);
      setLogs((prev) => [
        ...prev,
        userLine,
        { id: `out-${Date.now()}`, type: 'success', text: 'Autenticación correcta. Cerrando sesión de privacidad...' },
      ]);
      setTimeout(onExit, 250);
      return;
    }

    let outputLines: LogLine[] = [];

    switch (cmdLower) {
      case 'help':
        outputLines = [
          { id: `h1-${Date.now()}`, type: 'output', text: 'COMANDOS DISPONIBLES EN TERMINAL:' },
          { id: `h2-${Date.now()}`, type: 'output', text: `  ${config.secretPin || 'exit'} / unlock  : Desbloquear y volver al visor de cámara` },
          { id: `h3-${Date.now()}`, type: 'output', text: '  status          : Estado de demonios de fondo y almacenamiento' },
          { id: `h4-${Date.now()}`, type: 'output', text: '  top / ps        : Procesos del sistema en tiempo real' },
          { id: `h5-${Date.now()}`, type: 'output', text: '  matrix          : Alternar lluvia de código digital Matrix' },
          { id: `h6-${Date.now()}`, type: 'output', text: '  rec             : Información discreta de grabación en segundo plano' },
          { id: `h7-${Date.now()}`, type: 'output', text: '  uname -a / os   : Especificaciones del kernel simulado' },
          { id: `h8-${Date.now()}`, type: 'output', text: '  dmesg           : Buffer de diagnóstico de hardware' },
          { id: `h9-${Date.now()}`, type: 'output', text: '  clear           : Limpiar pantalla del terminal' },
        ];
        break;

      case 'clear':
      case 'cls':
        setLogs([]);
        return;

      case 'status':
        outputLines = [
          { id: `s1-${Date.now()}`, type: 'output', text: '● stealth-cam-engine.service - Tactical Surveillance' },
          { id: `s2-${Date.now()}`, type: 'output', text: '     Loaded: loaded (/lib/systemd/system/stealth.service; enabled)' },
          { id: `s3-${Date.now()}`, type: 'success', text: '     Active: active (running) [Memory: 48.2MB, Tasks: 4]' },
          { id: `s4-${Date.now()}`, type: 'output', text: `     Guardado local: INDEXEDDB + LOCALSTORAGE PERSISTENTE` },
          { id: `s5-${Date.now()}`, type: 'output', text: `     Grabación en segundo plano: ${isRecording ? 'ACTIVA (GRABANDO)' : 'EN ESPERA'}` },
        ];
        break;

      case 'rec':
        outputLines = [
          {
            id: `r1-${Date.now()}`,
            type: isRecording ? 'success' : 'output',
            text: isRecording
              ? `[REC_DAEMON] Grabación en segundo plano: ACTIVA (${recordingDuration}s transcurridos)`
              : '[REC_DAEMON] Grabación en segundo plano: EN ESPERA (Detector activo)',
          },
        ];
        break;

      case 'top':
      case 'ps':
        outputLines = [
          { id: `t1-${Date.now()}`, type: 'output', text: 'PID   USER     PR  NI  VIRT   RES   SHR  S  %CPU %MEM  COMMAND' },
          { id: `t2-${Date.now()}`, type: 'output', text: '1042  root     20   0  382M   48M   22M  S   2.4  0.3  stealth-daemon' },
          { id: `t3-${Date.now()}`, type: 'output', text: ' 412  systemd  20   0   24M    6M    4M  S   0.1  0.1  systemd-journal' },
          { id: `t4-${Date.now()}`, type: 'output', text: ' 102  root     20   0  128M   14M   10M  S   0.0  0.1  sshd: tty1' },
          { id: `t5-${Date.now()}`, type: 'output', text: '   1  root     20   0  168M   12M    8M  S   0.0  0.1  /sbin/init' },
        ];
        break;

      case 'matrix':
        setMatrixRainActive((prev) => !prev);
        outputLines = [
          {
            id: `m-${Date.now()}`,
            type: 'success',
            text: `Matrix digital rain: ${!matrixRainActive ? 'ACTIVADO' : 'DESACTIVADO'}`,
          },
        ];
        break;

      case 'uname':
      case 'uname -a':
      case 'os':
        outputLines = [
          {
            id: `u-${Date.now()}`,
            type: 'output',
            text: 'Linux stealth-srv 6.6.12-amd64 #1 SMP PREEMPT_DYNAMIC GNU/Linux',
          },
        ];
        break;

      case 'dmesg':
        outputLines = SAMPLE_KERNEL_LOGS.map((item, idx) => ({
          id: `dm-${Date.now()}-${idx}`,
          type: 'output',
          text: item,
        }));
        break;

      default:
        outputLines = [
          {
            id: `err-${Date.now()}`,
            type: 'error',
            text: `bash: ${trimmed}: comando no reconocido. Escribe 'help' o '${config.secretPin || 'exit'}' para salir.`,
          },
        ];
        break;
    }

    setLogs((prev) => [...prev, userLine, ...outputLines]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(inputVal);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < commandHistory.length) {
          setHistoryIndex(nextIdx);
          setInputVal(commandHistory[nextIdx]);
        } else {
          setHistoryIndex(-1);
          setInputVal('');
        }
      }
    }
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      secretPin: secretPinInput.trim() || 'exit',
    });
    setSavedNotification(true);
    triggerHapticVibrate([60, 40, 60]);
    setTimeout(() => {
      setSavedNotification(false);
      setShowConfigModal(false);
    }, 1200);
  };

  return (
    <div
      onClick={handleTerminalClick}
      className={`fixed inset-0 z-50 bg-black font-mono overflow-hidden select-none flex flex-col justify-between ${themeStyles.text} transition-colors duration-200`}
    >
      {/* Background Matrix Rain Simulation if enabled */}
      {matrixRainActive && (
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden z-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.8)_100%)]"></div>
          <div className="text-[11px] leading-3 font-mono opacity-40 select-none animate-pulse">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="truncate">
                {Array.from({ length: 90 })
                  .map(() => String.fromCharCode(33 + Math.floor(Math.random() * 90)))
                  .join(' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Terminal Title Bar */}
      <div
        className={`w-full ${themeStyles.bgHeader} border-b ${themeStyles.border} px-3 py-1.5 flex items-center justify-between text-xs backdrop-blur-md z-10`}
      >
        {/* Left: Window Dots & Shell Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onExit();
              }}
              className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 cursor-pointer transition-colors"
              title="Cerrar sesión (Salir a cámara)"
            />
            <span
              onClick={(e) => {
                e.stopPropagation();
                setLogs([]);
              }}
              className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-400 cursor-pointer transition-colors"
              title="Limpiar pantalla"
            />
            <span
              onClick={(e) => {
                e.stopPropagation();
                onUpdateConfig({ autoStream: !config.autoStream });
              }}
              className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-400 cursor-pointer transition-colors"
              title={config.autoStream ? 'Pausar stream' : 'Reanudar stream'}
            />
          </div>
          <span className="font-bold tracking-wider ml-1 flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 opacity-80" />
            <span>root@stealth-srv: ~ (bash tty1)</span>
          </span>
        </div>

        {/* Right: Disguised Metrics, Local Storage indicator & Settings */}
        <div className="flex items-center gap-3">
          {/* Subtle disguised recording status */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] opacity-70">
            <span>DAEMON:</span>
            <span className={isRecording ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-500'}>
              {isRecording ? `REC-${recordingDuration}s` : 'IDLE'}
            </span>
          </div>

          {/* Local storage badge */}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${themeStyles.badge} hidden md:inline-flex items-center gap-1`}
            title="Estado y configuraciones guardadas localmente en IndexedDB"
          >
            <Save className="w-2.5 h-2.5" />
            <span>LOCAL: DB OK</span>
          </span>

          {/* Configure Terminal Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfigModal(true);
            }}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Configuración de Terminal y Guardado Local"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Secret Exit Trigger Button in corner */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticVibrate([80]);
              onExit();
            }}
            className="text-[10px] opacity-25 hover:opacity-100 hover:underline px-1.5 py-0.5 rounded border border-transparent hover:border-zinc-700 transition-all cursor-pointer"
            title="Salir a panel de control"
          >
            [SALIR]
          </button>
        </div>
      </div>

      {/* 2. Terminal Log Window Content */}
      <div
        className={`flex-1 p-3 overflow-y-auto font-mono ${fontSizeClass} space-y-1 z-10 select-text`}
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className={`leading-relaxed break-words ${
              log.type === 'input'
                ? 'font-bold ' + themeStyles.accent
                : log.type === 'success'
                ? 'text-emerald-300 font-semibold'
                : log.type === 'error'
                ? 'text-red-400'
                : themeStyles.text
            }`}
          >
            {log.text}
          </div>
        ))}

        {/* Active Command Line Input Prompt */}
        <div className="flex items-center gap-2 pt-1">
          <span className={`font-bold whitespace-nowrap ${themeStyles.accent}`}>
            root@stealth-srv:~#
          </span>
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className={`w-full bg-transparent outline-none border-none p-0 ${fontSizeClass} ${themeStyles.accent}`}
            />
          </div>
        </div>

        <div ref={terminalEndRef} />
      </div>

      {/* 3. Bottom Disguised Status Bar & Gesture Guide */}
      <div
        className={`w-full ${themeStyles.bgHeader} border-t ${themeStyles.border} px-3 py-1 flex items-center justify-between text-[11px] text-zinc-500 z-10`}
      >
        <div className="flex items-center gap-2 truncate">
          <span>SESIÓN ACTIVA</span>
          <span>•</span>
          <span className="hidden sm:inline">
            Escribe <strong className="text-zinc-400">"{config.secretPin || 'exit'}"</strong> o pulsa <strong className="text-zinc-400">ESC</strong> para volver a la cámara
          </span>
          <span className="sm:hidden">
            PIN: <strong className="text-zinc-400">"{config.secretPin || 'exit'}"</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-zinc-600 hidden md:inline">
            Triple toque en pantalla para salir
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="text-[10px] text-zinc-600 hover:text-zinc-300 underline cursor-pointer"
          >
            DESCONECTAR
          </button>
        </div>
      </div>

      {/* 4. Configuration & Local Storage Settings Modal */}
      {showConfigModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-zinc-200 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm font-mono text-zinc-100">
                  CONFIGURACIÓN DE MODO PRIVACIDAD
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                ESTILO VISUAL DEL TERMINAL
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'matrix', label: 'Matrix Fósforo Verde', color: 'bg-emerald-500' },
                  { id: 'amber', label: 'Ámbar Monocromo CRT', color: 'bg-amber-500' },
                  { id: 'cyan', label: 'Cyberpunk Cyan', color: 'bg-cyan-500' },
                  { id: 'classic', label: 'Linux Clásico Blanco', color: 'bg-zinc-200' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => onUpdateConfig({ theme: th.id as any })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-mono transition-all text-left cursor-pointer ${
                      config.theme === th.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${th.color}`}></span>
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                TAMAÑO DE FUENTE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sm', label: 'Compacto' },
                  { id: 'base', label: 'Estándar' },
                  { id: 'lg', label: 'Grande' },
                ].map((fs) => (
                  <button
                    key={fs.id}
                    onClick={() => onUpdateConfig({ fontSize: fs.id as any })}
                    className={`p-2 rounded-lg border text-xs font-mono text-center cursor-pointer transition-all ${
                      config.fontSize === fs.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                    }`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Stream Simulation */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-200 block">
                  Simular Registros en Vivo (Auto-stream)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Genera líneas periódicas de kernel para engañar a curiosos.
                </span>
              </div>
              <button
                onClick={() => onUpdateConfig({ autoStream: !config.autoStream })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.autoStream ? 'bg-emerald-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    config.autoStream ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Persist on Reload (Guardar Local) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-200 block flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mantener Modo al Recargar (Guardar Local)</span>
                </span>
                <span className="text-[11px] text-zinc-400">
                  Si se activa, la app abrirá directamente el terminal falso sin mostrar la cámara.
                </span>
              </div>
              <button
                onClick={() => onUpdateConfig({ persistOnReload: !config.persistOnReload })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.persistOnReload ? 'bg-cyan-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    config.persistOnReload ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Secret PIN / Command customizer */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">
                PALABRA O PIN SECRETO DE SALIDA
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={secretPinInput}
                  onChange={(e) => setSecretPinInput(e.target.value)}
                  placeholder="exit"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveConfig}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Escribe esta palabra en el terminal y presiona Enter para salir.
              </span>
            </div>

            {/* Local Storage Confirmation badge */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Guardado local integrado en IndexedDB y caché PWA.</span>
            </div>

            {savedNotification && (
              <div className="text-center font-mono text-xs text-emerald-400 animate-fade-in">
                ✓ Configuración guardada localmente con éxito
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
