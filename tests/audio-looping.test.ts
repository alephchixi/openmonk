// OpenMonk — Audio Looping Tests

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OM_LOOP_SECONDS,
  createSustainedVocalLoop,
  prepareSoundscapeLoop,
} from "../lib/openmonk/audio-looping";

class TestAudioBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  private readonly channels: Float32Array[];

  constructor(options: { numberOfChannels: number; length: number; sampleRate: number }) {
    this.numberOfChannels = options.numberOfChannels;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.channels = Array.from(
      { length: options.numberOfChannels },
      () => new Float32Array(options.length)
    );
  }

  get duration(): number {
    return this.length / this.sampleRate;
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel];
  }
}

function makeSineBuffer(seconds: number, sampleRate = 1000): AudioBuffer {
  const buffer = new AudioBuffer({
    numberOfChannels: 1,
    length: Math.floor(seconds * sampleRate),
    sampleRate,
  });
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.sin((2 * Math.PI * 30 * i) / sampleRate) * 0.35;
  }
  return buffer;
}

function sampleAt(buffer: AudioBuffer, seconds: number): number {
  const index = Math.min(buffer.length - 1, Math.floor(seconds * buffer.sampleRate));
  return buffer.getChannelData(0)[index];
}

beforeEach(() => {
  vi.stubGlobal("AudioBuffer", TestAudioBuffer);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSustainedVocalLoop", () => {
  it("creates a 15 second loop cycle from vocal tail material", () => {
    const source = makeSineBuffer(3);
    const result = createSustainedVocalLoop(source);

    expect(result.loopStartSeconds).toBeGreaterThan(0);
    expect(result.loopEndSeconds).toBeCloseTo(result.buffer.duration, 3);
    expect(result.loopEndSeconds! - result.loopStartSeconds!).toBeCloseTo(OM_LOOP_SECONDS, 1);
  });

  it("prepares a smooth jump from loop end back to loop start", () => {
    const source = makeSineBuffer(3);
    const result = createSustainedVocalLoop(source);
    const endSample = sampleAt(result.buffer, result.loopEndSeconds! - 0.001);
    const restartSample = sampleAt(result.buffer, result.loopStartSeconds!);

    expect(Math.abs(endSample - restartSample)).toBeLessThan(0.08);
  });
});

describe("prepareSoundscapeLoop", () => {
  it("keeps the generated soundscape duration and adds a loop window", () => {
    const source = makeSineBuffer(30);
    const result = prepareSoundscapeLoop(source);

    expect(result.buffer.duration).toBe(30);
    expect(result.loopStartSeconds).toBeGreaterThan(0);
    expect(result.loopEndSeconds).toBe(30);
  });
});
