// OpenMonk — Audio Prompts Tests

import { describe, it, expect } from "vitest";
import { buildOmText, buildSoundPrompt, getAudioRoute, getSoundGenerationDuration } from "../lib/openmonk/audio-prompts";

describe("buildOmText", () => {
  it("returns dense pattern for dense density", () => {
    const result = buildOmText({ density: "dense" });
    expect(result).toBe("ommm... ommm... ommm...");
  });

  it("returns regular pattern for regular density", () => {
    const result = buildOmText({ density: "regular" });
    expect(result).toBe("ommm...     ommm...");
  });

  it("returns sparse pattern for sparse or undefined density", () => {
    const result = buildOmText({ density: "sparse" });
    expect(result).toBe("ommm...             ommm...");
  });

  it("returns sparse pattern for no density specified", () => {
    const result = buildOmText({});
    expect(result).toBe("ommm...             ommm...");
  });
});

describe("buildSoundPrompt", () => {
  it("builds air prompt", () => {
    const result = buildSoundPrompt("air", {});
    expect(result).toContain("breath");
    expect(result).toContain("no spoken words");
  });

  it("builds ear:tired prompt", () => {
    const result = buildSoundPrompt("ear", { mood: "tired" });
    expect(result).toContain("low room tone");
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

  it("adds distance modifier", () => {
    const result = buildSoundPrompt("air", { distance: "far" });
    expect(result).toContain("distant");
  });

  it("adds texture modifier", () => {
    const result = buildSoundPrompt("air", { texture: "granular" });
    expect(result).toContain("granular particles");
  });

  it("throws for unknown mode", () => {
    expect(() => buildSoundPrompt("zen", {})).toThrow();
  });
});

describe("getAudioRoute", () => {
  it("returns speech for om", () => {
    expect(getAudioRoute("om")).toBe("speech");
  });

  it("returns sound for air", () => {
    expect(getAudioRoute("air")).toBe("sound");
  });

  it("returns sound for ear", () => {
    expect(getAudioRoute("ear")).toBe("sound");
  });

  it("returns none for zen", () => {
    expect(getAudioRoute("zen")).toBe("none");
  });

});

describe("getSoundGenerationDuration", () => {
  it("returns 25 for active sound modes", () => {
    expect(getSoundGenerationDuration("air")).toBe(25);
    expect(getSoundGenerationDuration("ear")).toBe(25);
  });
});
