import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

export const CombatTimer: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [initialSeconds, setInitialSeconds] = useState<number>(90);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      setIsFinished(true);
      // Play web audio synth beep if browser permits
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch alert
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch {
        // Fallback silently if audio context restricted
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const handleStartPreset = (seconds: number) => {
    setInitialSeconds(seconds);
    setSecondsLeft(seconds);
    setIsRunning(true);
    setIsFinished(false);
    setIsCollapsed(false);
  };

  const handleTogglePlay = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(initialSeconds);
      setIsFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
    setIsFinished(false);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent =
    initialSeconds > 0 ? ((initialSeconds - secondsLeft) / initialSeconds) * 100 : 0;

  return (
    <div
      className={`transition-all duration-200 border rounded-sm ${
        isFinished
          ? 'border-combat-crimson bg-combat-crimson/20 shadow-hud-crimson animate-pulse'
          : isRunning
          ? 'border-solo-blue/70 bg-obsidian-charcoal/95 shadow-hud-blue'
          : 'border-tactical-border bg-obsidian-charcoal/90'
      }`}
    >
      {/* Minimized Bar */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-ayanokoji-secondary hover:text-white transition-colors"
          title="Open Combat Rest Timer"
        >
          <Timer className="w-3.5 h-3.5 text-solo-blue" />
          <span className="font-bold text-white">REST TIMER</span>
          {secondsLeft > 0 && (
            <span className="text-solo-blue font-bold tabular-nums">
              [{formatTime(secondsLeft)}]
            </span>
          )}
        </button>
      ) : (
        /* Expanded HUD Timer */
        <div className="p-3 space-y-2.5 max-w-xs select-none">
          <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-white">
              <Timer className="w-4 h-4 text-solo-blue" />
              <span>COMBAT REST TIMER</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-[10px] font-mono text-ayanokoji-muted hover:text-white px-1"
            >
              MINIMIZE
            </button>
          </div>

          {/* Big Digital Display */}
          <div className="text-center py-1">
            <div
              className={`font-mono text-3xl font-black tracking-wider tabular-nums ${
                isFinished
                  ? 'text-combat-crimson'
                  : isRunning
                  ? 'text-solo-blue'
                  : 'text-white'
              }`}
            >
              {formatTime(secondsLeft)}
            </div>
            <div className="text-[9px] font-mono text-ayanokoji-muted uppercase tracking-widest mt-0.5">
              {isFinished
                ? 'REST OVER // COMMENCE SET'
                : isRunning
                ? 'RECOVERY WINDOW ACTIVE'
                : 'STANDBY'}
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full h-1 bg-obsidian-void border border-tactical-border rounded-sm overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFinished ? 'bg-combat-crimson' : 'bg-solo-blue'
              }`}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1">
            {[45, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => handleStartPreset(sec)}
                className={`py-1 text-[10px] font-mono font-bold rounded-sm border transition-colors ${
                  initialSeconds === sec && (isRunning || secondsLeft > 0)
                    ? 'border-solo-blue bg-solo-blue/20 text-solo-blue'
                    : 'border-tactical-border bg-obsidian-void text-ayanokoji-muted hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Control Triggers */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-tactical-border/60">
            <button
              onClick={handleTogglePlay}
              className={`flex-1 py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase rounded-sm border transition-colors ${
                isRunning
                  ? 'border-combat-crimson bg-combat-crimson/20 text-combat-crimson hover:bg-combat-crimson/30'
                  : 'border-solo-blue bg-solo-blue/20 text-solo-blue hover:bg-solo-blue/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{secondsLeft === 0 ? 'START 90s' : 'RESUME'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-obsidian-void border border-tactical-border hover:border-white text-ayanokoji-muted hover:text-white rounded-sm"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
