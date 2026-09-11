
export type SoundEffectType = "bell" | "gong";

export interface IAudioService {
  initialize(): Promise<void>;
  play(type: SoundEffectType): void;
  setVolume(volume: number): void;
  setSoundType(type: SoundEffectType): void;
}
