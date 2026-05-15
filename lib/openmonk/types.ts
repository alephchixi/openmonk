// OpenMonk — Public Types
// All type definitions for the synthetic vocal instrument.

export type OpenMonkMode =
  | "zen"
  | "om"
  | "air"
  | "ear"
  | "mauna"
  | "vow";

export type SessionState =
  | "idle"
  | "preparing"
  | "playing"
  | "silent"
  | "paused"
  | "complete"
  | "error";

export type Density = "sparse" | "regular" | "dense";
export type Distance = "near" | "room" | "far";
export type Texture = "clean" | "breathy" | "granular" | "resonant";
export type Pitch = "low" | "mid" | "high" | "adaptive";
export type Stability = "stable" | "wavering" | "dissolving";

export type Mood = "tired" | "foggy" | "soft" | "overloaded" | "late" | "neutral";

export type OpenMonkParams = {
  density?: Density;
  distance?: Distance;
  texture?: Texture;
  pitch?: Pitch;
  stability?: Stability;
  mood?: Mood;
};

export type AllowedStatusPhrase =
  | "Silence begins."
  | "Breath reference starts."
  | "Session complete."
  | "Returning."
  | "Paused."
  | "Stopped."
  | "Preparing.";

export type OpenMonkSession = {
  id: string;
  mode: OpenMonkMode;
  durationSeconds: number;
  state: SessionState;
  params: OpenMonkParams;
  startedAt?: string;
  endedAt?: string;
  status: AllowedStatusPhrase;
};

export type ParsedCommand = {
  mode: OpenMonkMode;
  durationSeconds: number;
  params: OpenMonkParams;
  vowText?: string;
};

export type ParseError = {
  error: true;
  message: string;
};

export type AudioRequestBody = {
  mode: OpenMonkMode;
  durationSeconds: number;
  params: OpenMonkParams;
};
