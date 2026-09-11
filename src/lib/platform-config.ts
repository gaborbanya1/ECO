
/**
 * Centralized hardware and platform configurations for cross-platform parity.
 */
export const PLATFORM_CONFIG = {
  AUDIO: {
    MASTER_GAIN: 0.5,
    FADE_IN_DURATION: 0.02, // seconds
    DEFAULT_VOLUME: 0.7,
    RESONANCE_DURATION: 10000, // ms
  },
  VIBRATION: {
    ENABLED: true,
    PATTERN: [100, 50, 100], // Simple pulse
  },
  SAFE_AREAS: {
    BOTTOM_PADDING: "env(safe-area-inset-bottom, 2rem)",
    TOP_PADDING: "env(safe-area-inset-top, 2rem)",
  },
  COLORS: {
    ECO_GREEN: "#4A6741",
    ECO_WHITE: "#FCFDFB",
    SAGE_DARK: "#2C3E26",
  }
};
