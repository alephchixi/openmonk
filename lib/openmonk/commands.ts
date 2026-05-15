// OpenMonk — Command Parser
// Parses slash commands into structured session parameters.

import type { ParsedCommand, ParseError, OpenMonkMode, OpenMonkParams } from "./types";
import { ALL_MODES, MVP_MODES, ALLOWED_DURATIONS_MIN, FLAG_ALIASES, ALLOWED_MOODS } from "./constants";

type ParseResult = ParsedCommand | ParseError;

/**
 * Parse a slash command string into a structured command.
 * 
 * Examples:
 *   /zen 5
 *   /om 5 --low --sparse --far
 *   /ear +mood:tired
 */
export function parseCommand(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return { error: true, message: "Commands must start with /." };
  }

  const parts = trimmed.split(/\s+/);
  const modeStr = parts[0].slice(1).toLowerCase(); // remove leading /

  if (!modeStr) {
    return { error: true, message: "Missing mode." };
  }

  // Validate mode
  if (!(ALL_MODES as string[]).includes(modeStr)) {
    return { error: true, message: `Unknown mode: ${modeStr}.` };
  }

  const mode = modeStr as OpenMonkMode;

  // Phase 6 modes are not yet available
  if (!(MVP_MODES as string[]).includes(mode)) {
    return { error: true, message: `Mode /${mode} is not available yet.` };
  }

  let durationSeconds = 0;
  const params: OpenMonkParams = {};
  let vowText: string | undefined;

  // Parse remaining tokens
  for (let i = 1; i < parts.length; i++) {
    const token = parts[i];

    // Duration (plain number = minutes)
    if (/^\d+$/.test(token)) {
      const minutes = parseInt(token, 10);
      if (!(ALLOWED_DURATIONS_MIN as readonly number[]).includes(minutes)) {
        // Clamp to nearest allowed duration
        const nearest = ALLOWED_DURATIONS_MIN.reduce((prev, curr) =>
          Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev
        );
        durationSeconds = nearest * 60;
      } else {
        durationSeconds = minutes * 60;
      }
      continue;
    }

    // Flag (--key)
    if (token.startsWith("--")) {
      const alias = FLAG_ALIASES[token];
      if (!alias) {
        return { error: true, message: `Unknown flag: ${token}.` };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (params as any)[alias.key] = alias.value;
      continue;
    }

    // Mood (+mood:value)
    if (token.startsWith("+mood:")) {
      const moodValue = token.slice(6);
      if (!(ALLOWED_MOODS as readonly string[]).includes(moodValue)) {
        return { error: true, message: `Unknown mood: ${moodValue}.` };
      }
      params.mood = moodValue as OpenMonkParams["mood"];
      continue;
    }

    // Vow text (quoted string — collect remaining)
    if (token.startsWith('"') && mode === "vow") {
      const rest = parts.slice(i).join(" ");
      const match = rest.match(/^"(.+)"$/);
      if (match) {
        vowText = match[1];
        break;
      }
      return { error: true, message: "Vow text must be quoted." };
    }

    return { error: true, message: `Unknown argument: ${token}.` };
  }

  return {
    mode,
    durationSeconds,
    params,
    vowText,
  };
}

/**
 * Check if a parse result is an error.
 */
export function isParseError(result: ParseResult): result is ParseError {
  return "error" in result && result.error === true;
}

/**
 * Resolve final duration: use parsed value, or fall back to mode default.
 */
export function resolveDuration(parsed: ParsedCommand): number {
  if (parsed.durationSeconds > 0) return parsed.durationSeconds;
  // Default 5 minutes
  const defaults: Record<string, number> = {
    zen: 300,
    om: 300,
    air: 300,
    ear: 300,
    mauna: 0,
    vow: 1500,
  };
  return defaults[parsed.mode] ?? 300;
}
