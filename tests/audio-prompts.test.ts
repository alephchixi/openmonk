// OpenMonk — Audio Prompts Tests

import { describe, it, expect } from "vitest";
import { buildBreathText, buildOmText, buildSoundPrompt, getAudioRoute, getSoundGenerationDuration } from "../lib/openmonk/audio-prompts";

describe("buildOmText", () => {
  it("returns sustained AUM chant text", () => {
    const result = buildOmText({});
    expect(result).toBe("aaaaauuuuummmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm.");
  });

  it("always returns the same text regardless of params", () => {
    const sparse = buildOmText({ density: "sparse" });
    const dense = buildOmText({ density: "dense" });
    const empty = buildOmText({});
    expect(sparse).toBe(dense);
    expect(sparse).toBe(empty);
  });

  it("each cycle has the full A-U-M vowel progression", () => {
    const result = buildOmText({});
    const cycles = [result.replace(/\.$/, "")];
    for (const cycle of cycles) {
      expect(cycle).toMatch(/^a+u+m+$/);
      const [aPart, uPart, mPart] = cycle.match(/^(a+)(u+)(m+)$/)?.slice(1) ?? [];
      expect(mPart.length).toBeGreaterThan(aPart.length + uPart.length);
    }
  });
});

describe("buildBreathText", () => {
  it("returns breath-like syllables for TTS", () => {
    const result = buildBreathText({});
    expect(result).toContain("haaaaaah");
    expect(result).toContain("hooooooh");
    expect(result).toContain("........ ");
  });
});

describe("buildSoundPrompt", () => {
  it("builds ear:tired prompt", () => {
    const result = buildSoundPrompt("ear", { mood: "tired" });
    expect(result).toContain("ambient soundscape");
    expect(result).toContain("no voice");
  });

  it("defaults ear prompt to neutral", () => {
    const result = buildSoundPrompt("ear", {});
    expect(result).toContain("evolving abstract ambient soundscape");
    expect(result).toContain("no voice");
  });

  it("builds ear:foggy prompt", () => {
    const result = buildSoundPrompt("ear", { mood: "foggy" });
    expect(result).toContain("drone");
    expect(result).toContain("no speech");
  });

  it("builds ear:overloaded prompt", () => {
    const result = buildSoundPrompt("ear", { mood: "overloaded" });
    expect(result).toContain("sparse");
    expect(result).toContain("no speech");
  });

  it("adds texture modifier to ear", () => {
    const result = buildSoundPrompt("ear", { texture: "resonant" });
    expect(result).toContain("resonant sustain");
  });

  it("throws for unknown mode", () => {
    expect(() => buildSoundPrompt("zen", {})).toThrow();
  });
});

describe("getAudioRoute", () => {
  it("returns speech for om", () => {
    expect(getAudioRoute("om")).toBe("speech");
  });

  it("returns speech for air", () => {
    expect(getAudioRoute("air")).toBe("speech");
  });

  it("returns sound for ear", () => {
    expect(getAudioRoute("ear")).toBe("sound");
  });

  it("returns none for zen", () => {
    expect(getAudioRoute("zen")).toBe("none");
  });

});

describe("getSoundGenerationDuration", () => {
  it("returns 30 for ear mode (richer loop)", () => {
    expect(getSoundGenerationDuration("ear")).toBe(30);
  });
});
