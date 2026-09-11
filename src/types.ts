/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppState {
  intervalMinutes: number;
  isRunning: boolean;
  isDarkMode: boolean;
  timeLeft: number;
}

export const THEME = {
  light: {
    background: "bg-[#F9F7F2]", // Creamy beige from ecokozosseg
    surface: "bg-white",
    primary: "bg-[#4A6741]",    // Sage green
    primaryHover: "hover:bg-[#3D5635]",
    text: "text-[#2C3E2D]",     // Dark forest green
    textMuted: "text-[#5C6B5E]",
    accent: "bg-[#D9E3D8]",     // Light sage
    border: "border-[#E5EBE4]",
  },
  dark: {
    background: "bg-[#1A2616]", // Deep dark green
    surface: "bg-[#243320]",
    primary: "bg-[#7AA370]",    // Brighter sage
    primaryHover: "hover:bg-[#8BB781]",
    text: "text-[#E8EFDF]",     // Off-white green
    textMuted: "text-[#A3B39C]",
    accent: "bg-[#2D4229]",
    border: "border-[#374C32]",
  }
};

export const MEDITATION_BELL_URL = "/meditation-bell.mp3";
export const MEDITATION_BELL_FALLBACK_URL = "https://cdn.freesound.org/previews/140/140128_2545754-lq.mp3";

export const DEEP_GONG_URL = "/deep-gong.mp3";
export const DEEP_GONG_FALLBACK_URL = "https://cdn.freesound.org/previews/194/194432_829962-hq.mp3";

export const ZEN_GONG_URL = MEDITATION_BELL_URL;
