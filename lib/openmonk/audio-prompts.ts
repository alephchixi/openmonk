// OpenMonk — Audio Prompt Templates
// Controlled prompt builders for ElevenLabs TTS and sound generation.
// No function in this module accepts arbitrary user text.

import type { OpenMonkMode, OpenMonkParams } from "./types";
import { sanitizePrompt } from "./safety";

/**
 * Build OM vocal text for TTS.
 *
 * Produces a sustained AUM chant with the full vowel progression:
 *   A (open) -> U (transition) -> M (nasal drone)
 *
 * The client stretches the nasal tail after decode, so this text is only
 * the source vocal gesture, not the final mantra duration.
 * Ignores density/pitch params; om mode is always one sustained drone.
 */
export function buildOmText(_params: OpenMonkParams): string {
  return "aaaaauuuuummmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm.";
}

/**
 * Build breath-like vocal text for ElevenLabs TTS.
 * Uses only phonetic breath syllables so the provider is not asked to speak
 * instructions such as "inhale" or "exhale".
 */
export function buildBreathText(_params: OpenMonkParams): string {
  return [
    "haaaaaah",
    "hooooooh",
    "haaaaaah",
    "hooooooh",
  ].join("........ ");
}

/**
 * Build a sound-generation prompt for non-speech audio.
 * Returns a controlled template string — never user input.
 */
export function buildSoundPrompt(mode: OpenMonkMode, params: OpenMonkParams): string {
  const templates: Record<string, string> = {
    "ear:tired": "slow evolving abstract ambient soundscape, low warm room tone, sparse granular motion, soft transients, seamless loop, no melody, no voice, no speech",
    "ear:foggy": "generative blurred drone field, thin distant layers, drifting granular texture, quiet spectral movement, seamless loop, no voice, no speech",
    "ear:soft": "gentle generative ambient field, warm low hum, slow harmonic bloom, subtle particles, seamless loop, no melody, no voice, no words",
    "ear:overloaded": "minimal generative reset soundscape, low stable drone, wide quiet space, sparse density, slow evolving texture, seamless loop, no speech",
    "ear:late": "quiet night generative room tone, distant low hum, sparse air texture, slow drifting layers, seamless loop, no melody, no voice",
    "ear:neutral": "evolving abstract ambient soundscape, low room tone, granular air, slow spectral drift, seamless loop, no melody, no voice, no speech",
  };

  let key = mode as string;
  if (mode === "ear") {
    key = `ear:${params.mood ?? "neutral"}`;
  }

  const template = templates[key];
  if (!template) {
    throw new Error(`No sound prompt template for mode: ${key}`);
  }

  // Apply distance/texture modifiers
  let prompt = template;
  if (params.distance === "far") {
    prompt += ", distant, reverberant";
  } else if (params.distance === "near") {
    prompt += ", close, intimate, dry";
  }
  if (params.texture === "granular") {
    prompt += ", granular particles";
  } else if (params.texture === "resonant") {
    prompt += ", resonant sustain";
  }

  return sanitizePrompt(prompt);
}

/**
 * Determine which audio route to use for a given mode.
 */
export function getAudioRoute(mode: OpenMonkMode): "speech" | "sound" | "none" {
  switch (mode) {
    case "om":
    case "air":
      return "speech";
    case "ear":
      return "sound";
    case "zen":
    case "mauna":
    case "vow":
      return "none";
  }
}

/**
 * Get the duration in seconds for sound generation API calls.
 * Active sound modes use a loopable source — Air is tighter, Ear drifts more.
 */
export function getSoundGenerationDuration(mode: OpenMonkMode): number {
  return mode === "ear" ? 30 : 25;
}
