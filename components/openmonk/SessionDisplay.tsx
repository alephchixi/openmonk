"use client";

import type { SessionState, AllowedStatusPhrase } from "@/lib/openmonk/types";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  state: SessionState;
  status?: AllowedStatusPhrase;
  elapsed: number;
  duration: number;
  copy: UiCopy;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function SessionDisplay({ state, status, elapsed, duration, copy }: Props) {
  const showTimer = state === "playing" || state === "silent" || state === "paused";
  const remaining = Math.max(0, duration - elapsed);
  const statusText = status ? copy.status[status] : "";

  return (
    <div className="session-display">
      {showTimer && duration > 0 && (
        <div className="session-timer" aria-label={`${formatTime(remaining)} ${copy.remaining}`}>
          {formatTime(remaining)}
        </div>
      )}

      {status && state !== "idle" && (
        <div className="session-status">{statusText}</div>
      )}

      {/* Hidden live region for screen readers */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusText}
      </div>
    </div>
  );
}
