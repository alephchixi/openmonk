"use client";

import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  isActive: boolean;
  muted: boolean;
  volume: number;
  onStop: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (val: number) => void;
  copy: UiCopy;
};

export function AudioControls({ isActive, muted, volume, onStop, onMuteToggle, onVolumeChange, copy }: Props) {
  return (
    <div className="audio-controls">
      {isActive && (
        <button
          type="button"
          className="control-btn stop-btn"
          onClick={onStop}
          id="stop-btn"
          aria-label={copy.stopSession}
        >
          {copy.stop}
        </button>
      )}

      <button
        type="button"
        className="control-btn"
        onClick={onMuteToggle}
        id="mute-btn"
        aria-label={muted ? copy.unmute : copy.mute}
      >
        {muted ? copy.unmute : copy.mute}
      </button>

      <input
        type="range"
        className="volume-slider"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        aria-label={copy.volume}
        aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`}
        id="volume-slider"
      />
    </div>
  );
}
