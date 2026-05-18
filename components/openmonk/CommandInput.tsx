"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  onSubmit: (command: string) => void;
  error: string;
  disabled: boolean;
  copy: UiCopy;
};

const HISTORY_KEY = "openmonk-command-history";
const HISTORY_MAX = 10;

function loadHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export function CommandInput({ onSubmit, error, disabled, copy }: Props) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const savedInputRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    const cmd = value.trim();
    onSubmit(cmd);

    setHistory((prev) => {
      const next = [cmd, ...prev.filter((h) => h !== cmd)].slice(0, HISTORY_MAX);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    setHistoryIndex(-1);
    savedInputRef.current = "";
    setValue("");
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) return;
      if (historyIndex === -1) savedInputRef.current = value;
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex <= -1) return;
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      if (nextIndex < 0) {
        setValue(savedInputRef.current);
      } else {
        setValue(history[nextIndex]);
      }
    }
  }, [history, historyIndex, value]);

  return (
    <div className="command-input-container">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          name="openmonk-command"
          value={value}
          onChange={(e) => { setValue(e.target.value); setHistoryIndex(-1); }}
          onKeyDown={handleKeyDown}
          placeholder={copy.commandPlaceholder}
          disabled={disabled}
          aria-label={copy.commandInput}
          id="command-input"
          autoComplete="off"
          inputMode="text"
          spellCheck={false}
        />
      </form>
      <div className="command-error" aria-live="polite">{error}</div>
    </div>
  );
}
