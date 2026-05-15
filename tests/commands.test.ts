// OpenMonk — Command Parser Tests

import { describe, it, expect } from "vitest";
import { parseCommand, isParseError, resolveDuration } from "../lib/openmonk/commands";

describe("parseCommand", () => {
  it("parses /zen 5", () => {
    const result = parseCommand("/zen 5");
    expect(isParseError(result)).toBe(false);
    if (!isParseError(result)) {
      expect(result.mode).toBe("zen");
      expect(result.durationSeconds).toBe(300);
    }
  });

  it("parses /om 5 --low --sparse --far", () => {
    const result = parseCommand("/om 5 --low --sparse --far");
    expect(isParseError(result)).toBe(false);
    if (!isParseError(result)) {
      expect(result.mode).toBe("om");
      expect(result.durationSeconds).toBe(300);
      expect(result.params.pitch).toBe("low");
      expect(result.params.density).toBe("sparse");
      expect(result.params.distance).toBe("far");
    }
  });

  it("parses /ear +mood:tired", () => {
    const result = parseCommand("/ear +mood:tired");
    expect(isParseError(result)).toBe(false);
    if (!isParseError(result)) {
      expect(result.mode).toBe("ear");
      expect(result.params.mood).toBe("tired");
    }
  });

  it("clamps invalid duration to nearest allowed", () => {
    const result = parseCommand("/zen 7");
    expect(isParseError(result)).toBe(false);
    if (!isParseError(result)) {
      // 7 is closest to 5
      expect(result.durationSeconds).toBe(300);
    }
  });

  it("rejects unknown mode", () => {
    const result = parseCommand("/dance");
    expect(isParseError(result)).toBe(true);
    if (isParseError(result)) {
      expect(result.message).toContain("Unknown mode");
    }
  });

  it("rejects removed modes", () => {
    expect(isParseError(parseCommand("/bell"))).toBe(true);
    expect(isParseError(parseCommand("/still 3"))).toBe(true);
  });

  it("rejects unknown flag", () => {
    const result = parseCommand("/om 5 --turbo");
    expect(isParseError(result)).toBe(true);
    if (isParseError(result)) {
      expect(result.message).toContain("Unknown flag");
    }
  });

  it("rejects invalid mood", () => {
    const result = parseCommand("/ear +mood:angry");
    expect(isParseError(result)).toBe(true);
    if (isParseError(result)) {
      expect(result.message).toContain("Unknown mood");
    }
  });

  it("rejects commands without /", () => {
    const result = parseCommand("bell");
    expect(isParseError(result)).toBe(true);
  });

  it("rejects empty command", () => {
    const result = parseCommand("/");
    expect(isParseError(result)).toBe(true);
  });

  it("rejects phase 6 modes", () => {
    const result = parseCommand("/mauna");
    expect(isParseError(result)).toBe(true);
    if (isParseError(result)) {
      expect(result.message).toContain("not available yet");
    }
  });
});

describe("resolveDuration", () => {
  it("uses parsed duration when provided", () => {
    const result = parseCommand("/zen 15");
    if (!isParseError(result)) {
      expect(resolveDuration(result)).toBe(900);
    }
  });

  it("falls back to 300s for zen without duration", () => {
    const result = parseCommand("/zen");
    if (!isParseError(result)) {
      expect(resolveDuration(result)).toBe(300);
    }
  });
});
