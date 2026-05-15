"use client";

import type { OpenMonkMode } from "@/lib/openmonk/types";
import { MODE_GLYPHS, MODE_ANIMATIONS } from "@/lib/openmonk/constants";

type Props = {
  mode: OpenMonkMode;
  active: boolean;
};

export function GlyphAnimation({ mode, active }: Props) {
  const glyph = MODE_GLYPHS[mode];
  const animClass = active ? MODE_ANIMATIONS[mode] : "";

  return (
    <div className="glyph-container">
      <span
        className={`glyph ${animClass}`}
        aria-hidden="true"
        key={active ? `${mode}-active` : `${mode}-idle`}
      >
        {glyph}
      </span>
    </div>
  );
}
