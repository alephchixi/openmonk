"use client";

import type { AudioProvider } from "@/lib/openmonk/providers/types";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  selected: AudioProvider;
  onChange: (provider: AudioProvider) => void;
  copy: UiCopy;
};

const providers: AudioProvider[] = ["synth", "elevenlabs"];

/** Compact provider toggle — two small icons with tooltip on hover */
export function ProviderSelector({ selected, onChange, copy }: Props) {
  return (
    <div className="provider-toggle" role="group" aria-label={copy.labels.audio}>
      {providers.map((provider) => (
        <button
          type="button"
          key={provider}
          className={`provider-btn${selected === provider ? " active" : ""}`}
          onClick={() => onChange(provider)}
          aria-pressed={selected === provider}
          id={`provider-${provider}`}
        >
          {provider === "synth" ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 10 L3 4 L7 2 L7 12 L3 10Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <path d="M9 5 A3 3 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="0.7" />
              <path d="M10.5 3.5 A5 5 0 0 1 10.5 10.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <circle cx="7" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <path d="M3 12 Q3 8 7 8 Q11 8 11 12" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <path d="M9.5 3 L12 1" stroke="currentColor" strokeWidth="0.6" />
            </svg>
          )}
          <span className="icon-tooltip">{copy.providers[provider].label}</span>
        </button>
      ))}
    </div>
  );
}
