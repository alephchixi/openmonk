// OpenMonk — Web Audio Synthesizer
// Generates drone, breath, and soundscape buffers entirely client-side.
// No API key, no network, no latency.

import type { OpenMonkParams, OpenMonkMode, Mood } from "../types";
import type { ProviderRequest, ProviderResult } from "./types";
import { stableStringify } from "../stable-json";

// --- Synthesis parameter presets ---

type SynthPreset = {
  fundamental: number;
  harmonics: number[];
  harmonicGains: number[];
  decayTime: number;
  bufferDuration: number;
  loop: boolean;
  noiseAmount: number;
  noiseBandpass: [number, number]; // [center, Q]
  lfoRate: number;
  lfoDepth: number;
};

function getOmPreset(params: OpenMonkParams): SynthPreset {
  const pitchMap = { low: 65, mid: 130, high: 260, adaptive: 98 };
  const fundamental = pitchMap[params.pitch ?? "low"];
  const densityLfo = { sparse: 0.08, regular: 0.15, dense: 0.25 };

  return {
    fundamental,
    harmonics: [1, 2, 3, 1.5],
    harmonicGains: [1.0, 0.5, 0.2, 0.35],
    decayTime: 0, // sustain, no decay
    bufferDuration: 10,
    loop: true,
    noiseAmount: params.texture === "breathy" ? 0.08 : params.texture === "granular" ? 0.12 : 0.02,
    noiseBandpass: [fundamental * 3, 2],
    lfoRate: densityLfo[params.density ?? "sparse"],
    lfoDepth: 0.3,
  };
}

const AIR_PRESET: SynthPreset = {
  fundamental: 0,
  harmonics: [],
  harmonicGains: [],
  decayTime: 0,
  bufferDuration: 10,
  loop: true,
  noiseAmount: 1.0,
  noiseBandpass: [400, 0.8],
  lfoRate: 0.2, // ~5s breath cycle
  lfoDepth: 0.85,
};

const EAR_PRESETS: Record<Mood, Partial<SynthPreset>> = {
  tired: {
    fundamental: 55,
    harmonics: [1, 2],
    harmonicGains: [0.6, 0.2],
    noiseAmount: 0.35,
    noiseBandpass: [200, 0.5],
    lfoRate: 0.05,
    lfoDepth: 0.2,
  },
  foggy: {
    fundamental: 80,
    harmonics: [1, 1.02, 2],
    harmonicGains: [0.5, 0.45, 0.15],
    noiseAmount: 0.15,
    noiseBandpass: [300, 0.4],
    lfoRate: 0.07,
    lfoDepth: 0.35,
  },
  soft: {
    fundamental: 110,
    harmonics: [1, 2, 3],
    harmonicGains: [0.7, 0.3, 0.1],
    noiseAmount: 0.08,
    noiseBandpass: [500, 0.6],
    lfoRate: 0.1,
    lfoDepth: 0.15,
  },
  overloaded: {
    fundamental: 220,
    harmonics: [1, 2.76, 5.40],
    harmonicGains: [0.4, 0.2, 0.1],
    noiseAmount: 0.05,
    noiseBandpass: [800, 1],
    lfoRate: 0,
    lfoDepth: 0,
  },
  late: {
    fundamental: 65,
    harmonics: [1],
    harmonicGains: [0.3],
    noiseAmount: 0.1,
    noiseBandpass: [150, 0.3],
    lfoRate: 0.03,
    lfoDepth: 0.1,
  },
  neutral: {
    fundamental: 82,
    harmonics: [1, 2],
    harmonicGains: [0.4, 0.15],
    noiseAmount: 0.2,
    noiseBandpass: [250, 0.5],
    lfoRate: 0.06,
    lfoDepth: 0.2,
  },
};

function getEarPreset(params: OpenMonkParams): SynthPreset {
  const mood = params.mood ?? "neutral";
  const moodOverrides = EAR_PRESETS[mood];
  return {
    fundamental: 82,
    harmonics: [1, 2],
    harmonicGains: [0.4, 0.15],
    decayTime: 0,
    bufferDuration: 10,
    loop: true,
    noiseAmount: 0.2,
    noiseBandpass: [250, 0.5],
    lfoRate: 0.06,
    lfoDepth: 0.2,
    ...moodOverrides,
  };
}

// --- Buffer generation ---

function generateNoiseBuffer(ctx: OfflineAudioContext, duration: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

async function renderPreset(preset: SynthPreset, sampleRate: number): Promise<AudioBuffer> {
  const length = Math.floor(sampleRate * preset.bufferDuration);
  const ctx = new OfflineAudioContext(1, length, sampleRate);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.5, 0);
  masterGain.connect(ctx.destination);

  // LFO for amplitude modulation
  let lfoNode: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;

  if (preset.lfoRate > 0 && preset.lfoDepth > 0) {
    lfoNode = ctx.createOscillator();
    lfoNode.type = "sine";
    lfoNode.frequency.setValueAtTime(preset.lfoRate, 0);

    lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(preset.lfoDepth * 0.5, 0);

    lfoNode.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfoNode.start(0);
  }

  // Oscillators (tonal content)
  if (preset.fundamental > 0 && preset.harmonics.length > 0) {
    for (let h = 0; h < preset.harmonics.length; h++) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(preset.fundamental * preset.harmonics[h], 0);

      const oscGain = ctx.createGain();
      const gain = preset.harmonicGains[h] ?? 0.1;
      oscGain.gain.setValueAtTime(gain * 0.4, 0);

      if (preset.decayTime > 0) {
        // Exponential decay for percussive sounds
        oscGain.gain.setValueAtTime(gain * 0.4, 0);
        oscGain.gain.exponentialRampToValueAtTime(0.001, preset.decayTime * (1 + h * 0.3));
      }

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(0);
    }
  }

  // Noise component
  if (preset.noiseAmount > 0) {
    const noiseBuffer = generateNoiseBuffer(ctx, preset.bufferDuration);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(preset.noiseBandpass[0], 0);
    filter.Q.setValueAtTime(preset.noiseBandpass[1], 0);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(preset.noiseAmount * 0.3, 0);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(0);
  }

  // Fade in/out for loopable buffers
  if (preset.loop) {
    const fadeTime = 0.5;
    masterGain.gain.setValueAtTime(0, 0);
    masterGain.gain.linearRampToValueAtTime(0.5, fadeTime);
    masterGain.gain.setValueAtTime(0.5, preset.bufferDuration - fadeTime);
    masterGain.gain.linearRampToValueAtTime(0, preset.bufferDuration);
  }

  return ctx.startRendering();
}

// --- Public API ---

const synthCache = new Map<string, Promise<ProviderResult>>();
const SYNTH_CACHE_MAX_ENTRIES = 24;

function getPresetForMode(mode: OpenMonkMode, params: OpenMonkParams): SynthPreset {
  switch (mode) {
    case "om":
      return getOmPreset(params);
    case "air":
      return AIR_PRESET;
    case "ear":
      return getEarPreset(params);
    default:
      throw new Error(`Synth: no preset for mode ${mode}`);
  }
}

export async function generateSynthAudio(request: ProviderRequest): Promise<ProviderResult> {
  const { mode, params } = request;

  // Zen, Mauna, Vow don't need audio
  if (mode === "zen" || mode === "mauna" || mode === "vow") {
    throw new Error("Synth: mode does not use audio.");
  }

  const cacheKey = stableStringify({ mode, params });
  let cached = synthCache.get(cacheKey);

  if (!cached) {
    if (synthCache.size >= SYNTH_CACHE_MAX_ENTRIES) {
      const oldestKey = synthCache.keys().next().value;
      if (oldestKey) synthCache.delete(oldestKey);
    }

    cached = (async () => {
      const preset = getPresetForMode(mode, params);
      const sampleRate = 44100;
      const buffer = await renderPreset(preset, sampleRate);

      return {
        buffer,
        loop: preset.loop,
      };
    })();
    synthCache.set(cacheKey, cached);
  }

  return cached;
}
