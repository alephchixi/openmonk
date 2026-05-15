// OpenMonk — Audio Provider Types

import type { OpenMonkMode, OpenMonkParams } from "../types";

export type AudioProvider = "synth" | "elevenlabs";

export type ProviderRequest = {
  mode: OpenMonkMode;
  durationSeconds: number;
  params: OpenMonkParams;
  signal?: AbortSignal;
};

export type ProviderResult = {
  buffer: AudioBuffer;
  loop: boolean;
};
