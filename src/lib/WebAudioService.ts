/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAudioService, SoundEffectType } from "./IAudioService";
import { PLATFORM_CONFIG } from "./platform-config";

// GitHub Pages kompatibilis útvonal generáló a hangfájlokhoz
const resolveUrl = (url: string) => {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return import.meta.env.BASE_URL + cleanUrl;
};

// A 3 hangfájl nevei
const SOUND_URLS: Record<SoundEffectType, string> = {
  bell: 'bell.mp3',
  bowl: 'bowl.mp3',
  drum: 'drum.mp3'
};

class WebAudioService implements IAudioService {
  private audios: Partial<Record<SoundEffectType, HTMLAudioElement>> = {};
  private volume: number = PLATFORM_CONFIG.AUDIO.DEFAULT_VOLUME;
  private soundType: SoundEffectType = "bell";
  private audioContext: AudioContext | null = null;
  private silentGain: GainNode | null = null;
  private silentOsc: OscillatorNode | null = null;

  constructor() {
    // App indulásakor AZONNAL betöltjük mind a 3 MP3-at a háttérben
    if (typeof window !== "undefined") {
      this.initAudioElement("bell");
      this.initAudioElement("bowl");
      this.initAudioElement("drum");
    }
  }

  async initialize(): Promise<void> {}

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    Object.values(this.audios).forEach(audio => {
      if (audio) audio.volume = this.volume;
    });
  }

  setSoundType(type: SoundEffectType) {
    this.soundType = type;
  }

  private stopAll() {
    Object.values(this.audios).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  private initAudioElement(type: SoundEffectType): HTMLAudioElement {
    if (!this.audios[type]) {
      const audio = new Audio(resolveUrl(SOUND_URLS[type]));
      audio.preload = "auto";
      audio.volume = this.volume;
      this.audios[type] = audio;
    }
    return this.audios[type] as HTMLAudioElement;
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

      // --- ÚJ RÉSZ: Media Session API (Zenelejátszó illúzió) ---
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'EcoGong Timer',
          artist: 'Meditáció folyamatban...',
        });
        
        // Ezek a dummy gombok kellenek ahhoz, hogy a háttérben maradjon
        navigator.mediaSession.setActionHandler('play', () => {});
        navigator.mediaSession.setActionHandler('pause', () => {});
      }

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

    // --- ÚJ RÉSZ: Media Session megszüntetése ---
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
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
        if (error.name === 'AbortError') return;
        console.error("Audio play failed:", error);
      });
    }
  }
}

export const webAudioService = new WebAudioService();
