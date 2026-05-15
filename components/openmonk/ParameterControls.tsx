"use client";

import type { OpenMonkMode, OpenMonkParams, Density, Distance, Texture } from "@/lib/openmonk/types";
import { ALLOWED_DURATIONS_MIN } from "@/lib/openmonk/constants";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  mode: OpenMonkMode;
  durationMin: number;
  params: OpenMonkParams;
  onDurationChange: (min: number) => void;
  onParamChange: (key: keyof OpenMonkParams, value: string) => void;
  copy: UiCopy;
};

const densities: Density[] = ["sparse", "regular", "dense"];
const distances: Distance[] = ["near", "room", "far"];
const textures: Texture[] = ["clean", "breathy", "granular", "resonant"];

// Which controls to show per mode
function getVisibleControls(mode: OpenMonkMode) {
  switch (mode) {
    case "zen":
      return { duration: true, density: false, distance: false, texture: false };
    case "om":
      return { duration: true, density: true, distance: true, texture: true };
    case "air":
      return { duration: true, density: true, distance: false, texture: true };
    case "ear":
      return { duration: true, density: true, distance: false, texture: true };
    default:
      return { duration: true, density: false, distance: false, texture: false };
  }
}

/** Density visual: bars of increasing height */
function DensityIcon({ level }: { level: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="9" width="2.5" height="4" rx="0.5" fill="currentColor" opacity={level >= 1 ? 1 : 0.2} />
      <rect x="5.5" y="5" width="2.5" height="8" rx="0.5" fill="currentColor" opacity={level >= 2 ? 1 : 0.2} />
      <rect x="10" y="1" width="2.5" height="12" rx="0.5" fill="currentColor" opacity={level >= 3 ? 1 : 0.2} />
    </svg>
  );
}

/** Distance visual: concentric arcs */
function DistanceIcon({ level }: { level: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="2" fill="currentColor" opacity={level >= 1 ? 1 : 0.2} />
      <path d="M 7 2.5 A 4.5 4.5 0 0 1 11.5 7" fill="none" stroke="currentColor" strokeWidth="1" opacity={level >= 2 ? 1 : 0.2} />
      <path d="M 7 0.5 A 6.5 6.5 0 0 1 13.5 7" fill="none" stroke="currentColor" strokeWidth="0.8" opacity={level >= 3 ? 1 : 0.2} />
    </svg>
  );
}

/** Texture visual: different dot patterns */
function TextureIcon({ type }: { type: Texture }) {
  const patterns: Record<Texture, React.ReactNode> = {
    clean: (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
    breathy: (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
      </svg>
    ),
    granular: (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="4" cy="4" r="1" fill="currentColor" />
        <circle cx="9" cy="5" r="0.8" fill="currentColor" />
        <circle cx="6" cy="9" r="1.2" fill="currentColor" />
        <circle cx="10" cy="10" r="0.6" fill="currentColor" />
        <circle cx="3" cy="8" r="0.7" fill="currentColor" />
      </svg>
    ),
    resonant: (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="0.4" />
      </svg>
    ),
  };
  return <>{patterns[type]}</>;
}

export function ParameterControls({ mode, durationMin, params, onDurationChange, onParamChange, copy }: Props) {
  const visible = getVisibleControls(mode);

  return (
    <div className="param-group">
      {/* Duration — dot timeline */}
      {visible.duration && (
        <div className="duration-track" role="group" aria-label={copy.labels.duration}>
          <div className="duration-line" />
          {ALLOWED_DURATIONS_MIN.map((min) => (
            <button
              type="button"
              key={min}
              className={`duration-dot${durationMin === min ? " active" : ""}`}
              onClick={() => onDurationChange(min)}
              aria-pressed={durationMin === min}
              aria-label={`${min} min`}
              id={`dur-${min}`}
            >
              <span className="duration-tooltip">{min}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sound params — graphical icons with hover labels */}
      {(visible.density || visible.distance || visible.texture) && (
        <div className="sound-params">
          {visible.density && (
            <div className="icon-param-group" role="group" aria-label={copy.labels.density}>
              {densities.map((d, i) => (
                <button
                  type="button"
                  key={d}
                  className={`icon-param${params.density === d ? " active" : ""}`}
                  onClick={() => onParamChange("density", d)}
                  aria-pressed={params.density === d}
                  aria-label={copy.density[d]}
                  id={`density-${d}`}
                >
                  <DensityIcon level={i + 1} />
                  <span className="icon-tooltip">{copy.density[d]}</span>
                </button>
              ))}
            </div>
          )}

          {visible.distance && (
            <div className="icon-param-group" role="group" aria-label={copy.labels.distance}>
              {distances.map((d, i) => (
                <button
                  type="button"
                  key={d}
                  className={`icon-param${params.distance === d ? " active" : ""}`}
                  onClick={() => onParamChange("distance", d)}
                  aria-pressed={params.distance === d}
                  aria-label={copy.distance[d]}
                  id={`distance-${d}`}
                >
                  <DistanceIcon level={i + 1} />
                  <span className="icon-tooltip">{copy.distance[d]}</span>
                </button>
              ))}
            </div>
          )}

          {visible.texture && (
            <div className="icon-param-group" role="group" aria-label={copy.labels.texture}>
              {textures.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`icon-param${params.texture === t ? " active" : ""}`}
                  onClick={() => onParamChange("texture", t)}
                  aria-pressed={params.texture === t}
                  aria-label={copy.texture[t]}
                  id={`texture-${t}`}
                >
                  <TextureIcon type={t} />
                  <span className="icon-tooltip">{copy.texture[t]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
