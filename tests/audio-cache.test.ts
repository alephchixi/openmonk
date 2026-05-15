// OpenMonk — Audio Cache Tests

import { describe, expect, it } from "vitest";
import { createAudioCacheUrl } from "../lib/openmonk/audio-cache";
import { stableStringify } from "../lib/openmonk/stable-json";

describe("stableStringify", () => {
  it("serializes nested objects deterministically", () => {
    const left = stableStringify({
      mode: "ear",
      params: { mood: "tired", texture: "granular" },
    });
    const right = stableStringify({
      params: { texture: "granular", mood: "tired" },
      mode: "ear",
    });

    expect(left).toBe(right);
  });

  it("keeps different nested params distinct", () => {
    const tired = stableStringify({ params: { mood: "tired" } });
    const foggy = stableStringify({ params: { mood: "foggy" } });

    expect(tired).not.toBe(foggy);
  });
});

describe("createAudioCacheUrl", () => {
  it("includes nested params in the hash input", async () => {
    const tired = await createAudioCacheUrl({
      route: "sound",
      mode: "ear",
      durationBucket: 300,
      params: { mood: "tired" },
      model: "elevenlabs",
    });

    const foggy = await createAudioCacheUrl({
      route: "sound",
      mode: "ear",
      durationBucket: 300,
      params: { mood: "foggy" },
      model: "elevenlabs",
    });

    expect(tired).not.toBe(foggy);
  });
});
