"use client";

import { useState, useCallback } from "react";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  onSubmit: (command: string) => void;
  error: string;
  disabled: boolean;
  copy: UiCopy;
};

export function CommandInput({ onSubmit, error, disabled, copy }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue("");
  }, [value, disabled, onSubmit]);

  return (
    <div className="command-input-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="command-input"
          name="openmonk-command"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
