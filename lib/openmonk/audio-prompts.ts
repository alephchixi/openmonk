// OpenMonk — Audio Prompt Templates
// Controlled prompt builders for ElevenLabs TTS and sound generation.
// No function in this module accepts arbitrary user text.

import type { OpenMonkMode, OpenMonkParams } from "./types";
import { sanitizePrompt } from "./safety";

/**
 * Build OM-like vocal text for TTS.
 * Density controls spacing/repetition.
 */
export function buildOmText(params: OpenMonkParams): string {
  if (params.density === "dense") return "ommm... ommm... ommm...";
  if (params.density === "regular") return "ommm...     ommm...";
  return "ommm...             ommm...";
}

/**
 * Build a sound-generation prompt for non-speech audio.
 * Returns a controlled template string — never user input.
 */
export function buildSoundPrompt(mode: OpenMonkMode, params: OpenMonkParams): string {
  const templates: Record<string, string> = {
    air: "soft breath-like air pulse, slow, non-medical reference, no instruction, no spoken words",
    "ear:tired": "minimal low room tone, sparse granular air, soft transients, no melody, no voice",
    "ear:foggy": "thin distant drone, blurred granular texture, quiet, no speech, no emotional narration",
    "ear:soft": "gentle ambient field, warm low hum, slow movement, no melody, no voice, no words",
    "ear:overloaded": "very sparse reset, low stable drone, reduced density, no speech",
    "ear:late": "quiet night room tone, minimal distant hum, sparse texture, no melody, no voice",
    "ear:neutral": "neutral ambient field, low room tone, sparse granular texture, no melody, no voice",
    om_fallback: "low synthetic vowel drone, distant, breathy, no words, no speech, slow fade, contemplative but not religious",
  };

  let key = mode as string;
  if (mode === "ear" && params.mood) {
    key = `ear:${params.mood}`;
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
      return "speech";
    case "air":
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
 * Active sound modes use a loopable 20-30 second source.
 */
export function getSoundGenerationDuration(mode: OpenMonkMode): number {
  void mode;
  return 25;
}
