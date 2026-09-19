/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MEDITATION_BELL_URL,
  MEDITATION_BELL_FALLBACK_URL,
  DEEP_GONG_URL,
  DEEP_GONG_FALLBACK_URL,
} from "../types";
import { IAudioService, SoundEffectType } from "./IAudioService";
import { PLATFORM_CONFIG } from "./platform-config";

// GitHub Pages kompatibilis útvonal generáló a hangfájlokhoz
const resolveUrl = (url: string) => {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return import.meta.env.BASE_URL + cleanUrl;
};

class WebAudioService implements IAudioService {
  private bellAudio: HTMLAudioElement | null = null;
  private gongAudio: HTMLAudioElement | null = null;
  private volume: number = PLATFORM_CONFIG.AUDIO.DEFAULT_VOLUME;
  private soundType: SoundEffectType = "bell";
  private audioContext: AudioContext | null = null;
  private silentGain: GainNode | null = null;
  private silentOsc: OscillatorNode | null = null;

  constructor() {
    // App indulásakor AZONNAL betöltjük az MP3-akat a háttérben
    if (typeof window !== "undefined") {
      this.initAudioElement("bell");
      this.initAudioElement("gong");
    }
  }

  async initialize(): Promise<void> {}

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.bellAudio) this.bellAudio.volume = this.volume;
    if (this.gongAudio) this.gongAudio.volume = this.volume;
  }

  setSoundType(type: SoundEffectType) {
    this.soundType = type;
  }

  private stopAll() {
    if (this.bellAudio) {
      this.bellAudio.pause();
      this.bellAudio.currentTime = 0;
    }
    if (this.gongAudio) {
      this.gongAudio.pause();
      this.gongAudio.currentTime = 0;
    }
  }

  private initAudioElement(type: SoundEffectType): HTMLAudioElement {
    if (type === "bell") {
      if (!this.bellAudio) {
        this.bellAudio = new Audio(resolveUrl(MEDITATION_BELL_URL));
        this.bellAudio.preload = "auto"; // Előre betöltés
        this.bellAudio.volume = this.volume;
        this.bellAudio.addEventListener("error", () => {
          if (this.bellAudio && !this.bellAudio.src.includes(MEDITATION_BELL_FALLBACK_URL)) {
            this.bellAudio.src = resolveUrl(MEDITATION_BELL_FALLBACK_URL);
            this.bellAudio.load();
          }
        });
      }
      return this.bellAudio;
    } else {
      if (!this.gongAudio) {
        this.gongAudio = new Audio(resolveUrl(DEEP_GONG_URL));
        this.gongAudio.preload = "auto"; // Előre betöltés
        this.gongAudio.volume = this.volume;
        this.gongAudio.addEventListener("error", () => {
          if (this.gongAudio && !this.gongAudio.src.includes(DEEP_GONG_FALLBACK_URL)) {
            this.gongAudio.src = resolveUrl(DEEP_GONG_FALLBACK_URL);
            this.gongAudio.load();
          }
        });
      }
      return this.gongAudio;
    }
  }

  enableBackgroundMode() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      if (this.silentOsc) return; 
      
      this.silentGain = this.audioContext.createGain();
      this.silentGain.gain.value = 0.00001; 
      this.silentGain.connect(this.audioContext.destination);
      
      this.silentOsc = this.audioContext.createOscillator();
      this.silentOsc.type = 'sine';
      this.silentOsc.connect(this.silentGain);
      this.silentOsc.start();
    } catch(e) {
      console.error("Background mode failed", e);
    }
  }

  disableBackgroundMode() {
    if (this.silentOsc) {
      try { this.silentOsc.stop(); } catch(e) {}
      this.silentOsc.disconnect();
      this.silentOsc = null;
    }
    if (this.silentGain) {
      this.silentGain.disconnect();
      this.silentGain = null;
    }
  }

  private playWebAudioFallback(type: SoundEffectType) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }
      
      const ctx = this.audioContext!;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * PLATFORM_CONFIG.AUDIO.MASTER_GAIN, now);

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-1, now);
      limiter.knee.setValueAtTime(40, now);
      limiter.ratio.setValueAtTime(12, now);
      limiter.attack.setValueAtTime(0, now);
      limiter.release.setValueAtTime(0.25, now);

      masterGain.connect(limiter);
      limiter.connect(ctx.destination);

      if (type === "bell") {
        const frequencies = [440, 440 * 2.76, 440 * 5.4, 440 * 8.93];
        const decays = [1.0, 0.5, 0.3, 0.2]; 
        const gains = [0.6, 0.25, 0.12, 0.05];

        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(gains[idx], now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + decays[idx]);
        });
      } else {
        const frequencies = [110, 164.81, 220, 277.18, 330, 440];
        const decays = [7.0, 5.0, 3.0, 1.0, 0.5, 0.5];
        const gains = [0.6, 0.4, 0.3, 0.2, 0.15, 0.1];

        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(gains[idx], now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + decays[idx]);
        });
      }
    } catch (e) {
      console.error("Web Audio fallback error:", e);
    }
  }

  play(type: SoundEffectType) {
    if (this.volume <= 0) return;

    this.stopAll();

    const audio = this.initAudioElement(type);
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Ha gyorsan kattintasz (AbortError), ne szólaljon meg a csúnya mű-hang!
        if (error.name === 'AbortError') return;
        this.playWebAudioFallback(type);
      });
    }
  }
}

export const webAudioService = new WebAudioService();