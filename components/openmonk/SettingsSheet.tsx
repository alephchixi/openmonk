"use client";

import { useCallback, useRef, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  muted: boolean;
  onMuteToggle: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
  language: "en" | "es";
  onLanguageToggle: () => void;
};

export function SettingsSheet({
  open,
  onClose,
  volume,
  onVolumeChange,
  muted,
  onMuteToggle,
  isDark,
  onThemeToggle,
  language,
  onLanguageToggle,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleVolumeInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  }, [onVolumeChange]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-sheet"
        role="dialog"
        aria-label="Settings"
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className="settings-row">
          <label className="settings-label" htmlFor="settings-volume">Volume</label>
          <div className="settings-control">
            <input
              type="range"
              id="settings-volume"
              className="settings-slider"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeInput}
            />
            <span className="settings-value">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label">Mute</span>
          <button
            type="button"
            className={`settings-toggle ${muted ? "active" : ""}`}
            onClick={onMuteToggle}
            aria-pressed={muted}
          >
            {muted ? "ON" : "OFF"}
          </button>
        </div>

        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <button
            type="button"
            className="settings-toggle"
            onClick={onThemeToggle}
          >
            {isDark ? "Dark" : "Light"}
          </button>
        </div>

        <div className="settings-row">
          <span className="settings-label">Language</span>
          <button
            type="button"
            className="settings-toggle"
            onClick={onLanguageToggle}
          >
            {language === "en" ? "EN" : "ES"}
          </button>
        </div>
      </div>
    </div>
  );
}
