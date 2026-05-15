"use client";

import type { OpenMonkMode } from "@/lib/openmonk/types";
import { MVP_MODES } from "@/lib/openmonk/constants";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  selected: OpenMonkMode;
  onChange: (mode: OpenMonkMode) => void;
  copy: UiCopy;
};

export function ModeSelector({ selected, onChange, copy }: Props) {
  const current = copy.modes[selected];
  const selectedIndex = MVP_MODES.indexOf(selected);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + MVP_MODES.length) % MVP_MODES.length;
    const nextMode = MVP_MODES[nextIndex];
    onChange(nextMode);
    requestAnimationFrame(() => document.getElementById(`mode-${nextMode}`)?.focus());
  }

  return (
    <div className="mode-section">
      <div className="mode-selector" role="radiogroup" aria-label={copy.modeGroup}>
        {MVP_MODES.map((mode) => (
          <button
            type="button"
            key={mode}
            className={`mode-btn${selected === mode ? " active" : ""}`}
            onClick={() => onChange(mode)}
            onKeyDown={(e) => handleKeyDown(e, MVP_MODES.indexOf(mode))}
            role="radio"
            aria-checked={selected === mode}
            tabIndex={selectedIndex === MVP_MODES.indexOf(mode) ? 0 : -1}
            id={`mode-${mode}`}
          >
            {copy.modes[mode].label}
          </button>
        ))}
      </div>
      <p className="mode-desc">{current.desc}</p>
    </div>
  );
}
