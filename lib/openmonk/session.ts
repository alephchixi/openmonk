// OpenMonk — Session Manager
// State machine for session lifecycle.

import type { OpenMonkMode, OpenMonkParams, OpenMonkSession, SessionState, AllowedStatusPhrase } from "./types";
import { MODE_DEFAULTS } from "./constants";

let counter = 0;

function generateId(): string {
  counter++;
  return `om-${Date.now()}-${counter}`;
}

/**
 * Create a new session with defaults merged from mode.
 */
export function createSession(
  mode: OpenMonkMode,
  durationSeconds?: number,
  params?: OpenMonkParams
): OpenMonkSession {
  const defaults = MODE_DEFAULTS[mode];
  return {
    id: generateId(),
    mode,
    durationSeconds: durationSeconds ?? defaults.durationSeconds,
    state: "idle",
    params: { ...defaults.params, ...params },
    status: "Preparing.",
  };
}

/**
 * Get the initial status phrase for a mode when it starts playing.
 */
export function getStartStatus(mode: OpenMonkMode): AllowedStatusPhrase {
  switch (mode) {
    case "zen":
      return "Silence begins.";
    case "air":
      return "Breath reference starts.";
    case "om":
    case "ear":
      return "Preparing.";
    case "mauna":
      return "Silence begins.";
    case "vow":
      return "Preparing.";
  }
}

/**
 * Transition session state. Returns new state and status, or null if transition is invalid.
 */
export function transitionSession(
  session: OpenMonkSession,
  action: "prepare" | "play" | "silence" | "pause" | "resume" | "complete" | "stop" | "error"
): { state: SessionState; status: AllowedStatusPhrase } | null {
  const transitions: Record<string, { state: SessionState; status: AllowedStatusPhrase }> = {
    "idle->prepare": { state: "preparing", status: "Preparing." },
    "preparing->play": { state: "playing", status: getStartStatus(session.mode) },
    "preparing->silence": { state: "silent", status: "Silence begins." },
    "playing->silence": { state: "silent", status: "Silence begins." },
    "playing->pause": { state: "paused", status: "Paused." },
    "playing->complete": { state: "complete", status: "Session complete." },
    "playing->stop": { state: "complete", status: "Stopped." },
    "silent->play": { state: "playing", status: "Returning." },
    "silent->complete": { state: "complete", status: "Session complete." },
    "silent->stop": { state: "complete", status: "Stopped." },
    "paused->play": { state: "playing", status: "Returning." },
    "paused->stop": { state: "complete", status: "Stopped." },
    // Error and stop from any state
    "preparing->stop": { state: "complete", status: "Stopped." },
    "preparing->error": { state: "error", status: "Stopped." },
    "playing->error": { state: "error", status: "Stopped." },
    "silent->error": { state: "error", status: "Stopped." },
    "paused->error": { state: "error", status: "Stopped." },
    "idle->stop": { state: "complete", status: "Stopped." },
  };

  const key = `${session.state}->${action}`;
  return transitions[key] ?? null;
}
