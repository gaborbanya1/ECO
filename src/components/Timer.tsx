/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, ChevronUp, ChevronDown, Volume2, Volume1, VolumeX, Infinity as InfinityIcon } from "lucide-react";
import { THEME } from "../types";
import { webAudioService } from "../lib/WebAudioService";
import { PLATFORM_CONFIG } from "../lib/platform-config";
import { SoundEffectType } from "../lib/IAudioService";

interface TimerProps {
  isDarkMode: boolean;
}

export default function Timer({ isDarkMode }: TimerProps) {
  const [intervalMins, setIntervalMins] = useState(1);
  const [intervalInput, setIntervalInput] = useState("1");
  const [timeLeft, setTimeLeft] = useState(1 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalCycles, setTotalCycles] = useState<number | null>(null);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [cycleInput, setCycleInput] = useState("");
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ecogong_volume");
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
    }
    return PLATFORM_CONFIG.AUDIO.DEFAULT_VOLUME;
  });
  const [soundType, setSoundType] = useState<SoundEffectType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ecogong_sound_type");
      if (saved === "gong" || saved === "bell") return saved as SoundEffectType;
    }
    return "bell";
  });
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const colors = isDarkMode ? THEME.dark : THEME.light;

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    webAudioService.setVolume(clamped);
    if (typeof window !== "undefined") {
      localStorage.setItem("ecogong_volume", clamped.toString());
    }
  };

  useEffect(() => {
    webAudioService.setVolume(volume);
    webAudioService.setSoundType(soundType);
  }, [volume, soundType]);

  const toggleSoundType = () => {
    const nextType: SoundEffectType = soundType === "bell" ? "gong" : "bell";
    setSoundType(nextType);
    webAudioService.setSoundType(nextType);
    webAudioService.play(nextType);
    if (typeof window !== "undefined") {
      localStorage.setItem("ecogong_sound_type", nextType);
    }
  };

  // Screen Wake Lock API to prevent sleep
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isRunning) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.warn('Wake Lock is disallowed by permissions policy in this environment.');
        } else {
          console.warn('Wake Lock error:', err.name, err.message);
        }
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      if (wakeLock) {
        wakeLock.release().then(() => setWakeLock(null));
      }
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => setWakeLock(null)).catch(() => {});
      }
    };
  }, [isRunning]);

  // Néma hang trükk a háttérben futáshoz
  useEffect(() => {
    if (isRunning) {
      webAudioService.enableBackgroundMode();
    } else {
      webAudioService.disableBackgroundMode();
    }
    
    return () => {
      webAudioService.disableBackgroundMode();
    };
  }, [isRunning]);

  // Web Worker for background-resilient countdown
  useEffect(() => {
    let worker: Worker;
    
    if (typeof window !== 'undefined' && isRunning) {
      // ITT VAN A JAVÍTOTT ÚTVONAL
      worker = new Worker(import.meta.env.BASE_URL + 'timer-worker.js');
      
      worker.onmessage = (e) => {
        if (e.data.type === 'tick') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              webAudioService.play(soundType);
              
              setCurrentCycle((curr) => {
                const next = curr + 1;
                if (totalCycles !== null && next >= totalCycles) {
                  setIsRunning(false);
                  return curr; 
                }
                return next;
              });
              
              return intervalMins * 60;
            }
            return prev - 1;
          });
        }
      };

      worker.postMessage({ command: 'start', interval: 1000 });
    }

    return () => {
      if (worker) worker.terminate();
    };
  }, [isRunning, intervalMins, soundType, totalCycles]); 

  const handleIntervalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIntervalInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      const clamped = Math.min(999, num);
      setIntervalMins(clamped);
      if (!isRunning) setTimeLeft(clamped * 60);
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      if (timeLeft === 0 || timeLeft === intervalMins * 60) {
        setTimeLeft(intervalMins * 60);
        webAudioService.play(soundType);
        setCurrentCycle(0);
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(intervalMins * 60);
    setCurrentCycle(0);
  };

  const hasActiveSession = isRunning || timeLeft < intervalMins * 60;

  const adjustInterval = (delta: number) => {
    const newVal = Math.max(1, intervalMins + delta);
    setIntervalMins(newVal);
    setIntervalInput(newVal.toString());
    if (!isRunning) {
      setTimeLeft(newVal * 60);
    }
  };

  const handleCycleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setTotalCycles(null);
      setCycleInput("");
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      const clamped = Math.min(999, Math.max(1, num));
      setTotalCycles(clamped);
      setCycleInput(clamped.toString());
    }
  };

  const adjustCycles = (delta: number) => {
    if (totalCycles === null) {
      setTotalCycles(1);
      setCycleInput("1");
    } else {
      const newVal = totalCycles + delta;
      if (newVal < 1) {
        setTotalCycles(null);
        setCycleInput("");
      } else {
        const clamped = Math.min(999, newVal);
        setTotalCycles(clamped);
        setCycleInput(clamped.toString());
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = (timeLeft / (intervalMins * 60)) * 100;

  return (
    <div className="flex flex-col items-center">
      {/* Circle Progress Counter */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeOut" }}
              className={`absolute inset-0 rounded-full ${colors.accent} opacity-20`}
            />
          )}
        </AnimatePresence>

        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            className="opacity-10"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="754"
            initial={{ strokeDashoffset: 754 }}
            animate={{ strokeDashoffset: 754 - (754 * (100 - progress)) / 100 }}
            transition={{ duration: 1, ease: "linear" }}
            className="opacity-40"
          />
        </svg>
        
        <div className="text-center">
          <span className="block text-6xl font-bold tracking-tighter mb-1">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs uppercase tracking-widest opacity-50 block">
            Until next {soundType}
          </span>
          {totalCycles && (
            <span className="text-[10px] uppercase tracking-wider opacity-40 mt-1">
              Cycle {currentCycle + 1} of {totalCycles}
            </span>
          )}
        </div>
      </div>

      {/* Main Function Buttons: Immediately after the Counter */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-4">
          <button
            id="timer-toggle-btn"
            onClick={toggleTimer}
            className={`h-16 px-10 rounded-full flex items-center justify-center gap-3 transition-all ${colors.primary} text-white shadow-lg active:scale-95 ${colors.primaryHover}`}
          >
            {isRunning ? (
              <>
                <Square size={20} fill="white" />
                <span className="font-medium tracking-wide">Pause</span>
              </>
            ) : hasActiveSession ? (
              <>
                <Play size={20} fill="white" />
                <span className="font-medium tracking-wide">Resume</span>
              </>
            ) : (
              <>
                <Play size={20} fill="white" />
                <span className="font-medium tracking-wide">Start Session</span>
              </>
            )}
          </button>
          
          {hasActiveSession && (
            <button
              id="timer-reset-btn"
              onClick={resetTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center border ${colors.border} opacity-60 hover:opacity-100 transition-opacity`}
              aria-label="Stop and Reset Session"
              title="Stop and Reset Session"
            >
              <motion.div whileTap={{ rotate: 180 }}>
                <Square size={20} />
              </motion.div>
            </button>
          )}
        </div>

        {/* Sound Selection: Slideable Boolean */}
        <div className="mt-5">
          <button
            id="sound-boolean-toggle"
            type="button"
            role="switch"
            aria-checked={soundType === "gong"}
            aria-label={`Sound effect: currently ${soundType}. Click to switch to ${soundType === "bell" ? "Gong" : "Bell"}`}
            onClick={toggleSoundType}
            className={`relative inline-flex items-center h-11 w-48 p-1 rounded-full border transition-all duration-300 ${colors.border} ${colors.surface} shadow-sm cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDarkMode ? "focus:ring-[#7AA370]" : "focus:ring-[#4A6741]"
            }`}
          >
            <motion.div
              className={`absolute top-1 bottom-1 w-[92px] rounded-full ${colors.primary} shadow-sm`}
              animate={{ x: soundType === "bell" ? 0 : 92 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
            <span className={`relative z-10 w-[92px] text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${soundType === "bell" ? "text-white" : "opacity-60"}`}>
              Bell
            </span>
            <span className={`relative z-10 w-[92px] text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${soundType === "gong" ? "text-white" : "opacity-60"}`}>
              Gong
            </span>
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="w-full max-w-xs space-y-4 mb-[20px]">
        <div id="interval-setting-card" className={`p-6 rounded-3xl border ${colors.border} ${colors.surface} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium opacity-70">Interval</span>
            <div className="flex items-center gap-4">
              <button onClick={() => adjustInterval(-1)} className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                <ChevronDown size={20} />
              </button>
              <div className="w-16 flex justify-center items-center">
                <input 
                  type="number" inputMode="numeric" value={intervalInput}
                  onChange={handleIntervalChange} onBlur={() => setIntervalInput(intervalMins.toString())}
                  className="text-xl font-light w-full text-center bg-transparent border-none outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm font-light opacity-40 ml-0.5">m</span>
              </div>
              <button onClick={() => adjustInterval(1)} className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                <ChevronUp size={20} />
              </button>
            </div>
          </div>
        </div>

        <div id="repetitions-setting-card" className={`p-6 rounded-3xl border ${colors.border} ${colors.surface} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium opacity-70">Repetitions</span>
            <div className="flex items-center gap-4">
              <button onClick={() => adjustCycles(-1)} className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                <ChevronDown size={20} />
              </button>
              <div className="w-16 flex justify-center items-center">
                {totalCycles === null ? (
                  <button onClick={() => adjustCycles(1)} className="opacity-60 hover:opacity-100 transition-opacity">
                    <InfinityIcon size={24} />
                  </button>
                ) : (
                  <input 
                    type="number" inputMode="numeric" value={cycleInput}
                    onChange={handleCycleChange}
                    onBlur={() => setCycleInput(totalCycles ? totalCycles.toString() : "")}
                    className="text-xl font-light w-full text-center bg-transparent border-none outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                )}
              </div>
              <button onClick={() => adjustCycles(1)} className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                <ChevronUp size={20} />
              </button>
            </div>
          </div>
        </div>

        <div id="volume-setting-card" className={`p-6 rounded-3xl border ${colors.border} ${colors.surface} shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-70">Volume</span>
            <span className="text-sm font-light opacity-60 tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)} className="opacity-50 hover:opacity-100 transition-opacity p-1">
              {volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range" min="0" max="100" value={Math.round(volume * 100)}
              onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
              className={`w-full h-2 rounded-full appearance-none cursor-pointer ${isDarkMode ? "bg-[#374C32] accent-[#7AA370]" : "bg-[#E5EBE4] accent-[#4A6741]"} focus:outline-none`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}