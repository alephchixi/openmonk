// OpenMonk — Safety Module
// Allowlist enforcement for status phrases, moods, and prompt sanitization.

import type { AllowedStatusPhrase, Mood } from "./types";
import { ALLOWED_STATUS_PHRASES, ALLOWED_MOODS } from "./constants";

/**
 * Check if a string is one of the allowed status phrases.
 * No component should display arbitrary generated prose as status.
 */
export function isAllowedStatus(text: string): text is AllowedStatusPhrase {
  return (ALLOWED_STATUS_PHRASES as readonly string[]).includes(text);
}

/**
 * Validate a mood token against the allowlist.
 * Returns the mood if valid, null if not.
 */
export function validateMood(mood: string): Mood | null {
  if ((ALLOWED_MOODS as readonly string[]).includes(mood)) {
    return mood as Mood;
  }
  return null;
}

/**
 * Reject arbitrary user text for audio prompt generation.
 * Audio prompts must be built from controlled templates only.
 * Returns true if the input appears to be a raw user prompt (not a controlled template call).
 */
export function isRawUserPrompt(text: string): boolean {
  // Controlled prompts are short template outputs — reject anything
  // that looks like freeform user input
  if (text.length > 200) return true;
  if (text.includes("<") || text.includes(">")) return true;
  if (text.includes("http://") || text.includes("https://")) return true;

  // Check for injection-style patterns
  const injectionPatterns = [
    /ignore\s+(previous|above|all)/i,
    /you\s+are\s+(now|a)/i,
    /pretend\s+to/i,
    /act\s+as/i,
    /system\s*prompt/i,
  ];

  return injectionPatterns.some((p) => p.test(text));
}

/**
 * Sanitize and validate a prompt template output before sending to audio API.
 * Throws if the prompt appears to contain raw user text.
 */
export function sanitizePrompt(templateOutput: string): string {
  if (isRawUserPrompt(templateOutput)) {
    throw new Error("Rejected: audio prompts must use controlled templates only.");
  }
  return templateOutput.trim();
}
