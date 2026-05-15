// OpenMonk — Constants
// All fixed values, defaults, and lookup tables.

import type { OpenMonkMode, OpenMonkParams, Mood, AllowedStatusPhrase } from "./types";

// Allowed session durations in seconds
export const ALLOWED_DURATIONS_SEC = [60, 180, 300, 900, 1800, 3600] as const;
export const ALLOWED_DURATIONS_MIN = [1, 3, 5, 15, 30, 60] as const;

// Active web modes
export const MVP_MODES: OpenMonkMode[] = ["zen", "om", "air", "ear"];

// All modes including Phase 6
export const ALL_MODES: OpenMonkMode[] = [...MVP_MODES, "mauna", "vow"];

// Allowed mood tokens
export const ALLOWED_MOODS: Mood[] = ["tired", "foggy", "soft", "overloaded", "late", "neutral"];

// Allowed status phrases — no component should print anything else
export const ALLOWED_STATUS_PHRASES: AllowedStatusPhrase[] = [
  "Silence begins.",
  "Breath reference starts.",
  "Session complete.",
  "Returning.",
  "Paused.",
  "Stopped.",
  "Preparing.",
];

// Mode → Unicode glyph mapping
export const MODE_GLYPHS: Record<OpenMonkMode, string> = {
  zen: "◌",
  om: "◉",
  air: "∿",
  ear: "⋯",
  mauna: "□",
  vow: "▢",
};

// Mode → CSS animation class
export const MODE_ANIMATIONS: Record<OpenMonkMode, string> = {
  zen: "anim-hold",
  om: "anim-pulse",
  air: "anim-breathwave",
  ear: "anim-flicker",
  mauna: "anim-static",
  vow: "anim-static",
};

// Default parameters per mode
export const MODE_DEFAULTS: Record<OpenMonkMode, { durationSeconds: number; params: OpenMonkParams }> = {
  zen: {
    durationSeconds: 300,
    params: {},
  },
  om: {
    durationSeconds: 300,
    params: { pitch: "low", density: "sparse", distance: "far", texture: "breathy", stability: "stable" },
  },
  air: {
    durationSeconds: 300,
    params: { density: "regular", texture: "breathy" },
  },
  ear: {
    durationSeconds: 300,
    params: { mood: "neutral", density: "sparse", texture: "granular" },
  },
  mauna: {
    durationSeconds: 0,
    params: {},
  },
  vow: {
    durationSeconds: 1500, // 25 minutes default
    params: {},
  },
};

// ElevenLabs model identifiers (read from env, these are fallbacks)
export const DEFAULT_TTS_MODEL = "eleven_v3";
export const DEFAULT_TTS_FALLBACK_MODEL = "eleven_multilingual_v2";
export const DEFAULT_SFX_MODEL = "eleven_text_to_sound_v2";

// Audio engine defaults
export const DEFAULT_FADE_IN_MS = 2000;
export const DEFAULT_FADE_OUT_MS = 3000;
export const DEFAULT_VOLUME = 0.7;

// Flag aliases for command parser
export const FLAG_ALIASES: Record<string, { key: keyof OpenMonkParams; value: string }> = {
  "--low": { key: "pitch", value: "low" },
  "--mid": { key: "pitch", value: "mid" },
  "--high": { key: "pitch", value: "high" },
  "--adaptive": { key: "pitch", value: "adaptive" },
  "--sparse": { key: "density", value: "sparse" },
  "--regular": { key: "density", value: "regular" },
  "--dense": { key: "density", value: "dense" },
  "--near": { key: "distance", value: "near" },
  "--room": { key: "distance", value: "room" },
  "--far": { key: "distance", value: "far" },
  "--clean": { key: "texture", value: "clean" },
  "--breathy": { key: "texture", value: "breathy" },
  "--granular": { key: "texture", value: "granular" },
  "--resonant": { key: "texture", value: "resonant" },
  "--stable": { key: "stability", value: "stable" },
  "--wavering": { key: "stability", value: "wavering" },
  "--dissolving": { key: "stability", value: "dissolving" },
};
