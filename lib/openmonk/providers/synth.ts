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
  vocalShape?: "aum";
};

function getOmPreset(): SynthPreset {
  return {
    fundamental: 82,
    harmonics: [1, 2, 3, 4, 5],
    harmonicGains: [0.9, 0.38, 0.2, 0.12, 0.08],
    decayTime: 0, // sustain, no decay
    bufferDuration: 23,
    loop: true,
    noiseAmount: 0.035,
    noiseBandpass: [260, 1.4],
    lfoRate: 0.035,
    lfoDepth: 0.08,
    vocalShape: "aum",
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

async function renderAumPreset(preset: SynthPreset, sampleRate: number): Promise<AudioBuffer> {
  const duration = preset.bufferDuration;
  const length = Math.floor(sampleRate * duration);
  const ctx = new OfflineAudioContext(1, length, sampleRate);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, 0);
  masterGain.gain.linearRampToValueAtTime(0.48, 1.2);
  masterGain.gain.setValueAtTime(0.48, duration - 1.4);
  masterGain.gain.linearRampToValueAtTime(0, duration);
  masterGain.connect(ctx.destination);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.58, 0);
  bodyGain.gain.linearRampToValueAtTime(0.7, 3.2);
  bodyGain.gain.linearRampToValueAtTime(0.84, 5.8);
  bodyGain.gain.setValueAtTime(0.84, duration - 1.6);
  bodyGain.connect(masterGain);

  if (preset.lfoRate > 0 && preset.lfoDepth > 0) {
    const lfoNode = ctx.createOscillator();
    lfoNode.type = "sine";
    lfoNode.frequency.setValueAtTime(preset.lfoRate, 0);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(preset.lfoDepth, 0);
    lfoNode.connect(lfoGain);
    lfoGain.connect(bodyGain.gain);
    lfoNode.start(0);
  }

  const vowelSource = ctx.createOscillator();
  vowelSource.type = "sawtooth";
  vowelSource.frequency.setValueAtTime(preset.fundamental, 0);

  const vowelGain = ctx.createGain();
  vowelGain.gain.setValueAtTime(0.2, 0);
  vowelGain.gain.linearRampToValueAtTime(0.16, 3.8);
  vowelGain.gain.linearRampToValueAtTime(0.08, 5.8);
  vowelGain.gain.setValueAtTime(0.08, duration - 1.6);

  const formantOne = ctx.createBiquadFilter();
  formantOne.type = "peaking";
  formantOne.frequency.setValueAtTime(720, 0);
  formantOne.frequency.linearRampToValueAtTime(380, 3.8);
  formantOne.frequency.linearRampToValueAtTime(250, 5.8);
  formantOne.Q.setValueAtTime(5.5, 0);
  formantOne.gain.setValueAtTime(8, 0);

  const formantTwo = ctx.createBiquadFilter();
  formantTwo.type = "peaking";
  formantTwo.frequency.setValueAtTime(1150, 0);
  formantTwo.frequency.linearRampToValueAtTime(780, 3.8);
  formantTwo.frequency.linearRampToValueAtTime(520, 5.8);
  formantTwo.Q.setValueAtTime(4, 0);
  formantTwo.gain.setValueAtTime(5, 0);

  vowelSource.connect(vowelGain);
  vowelGain.connect(formantOne);
  formantOne.connect(formantTwo);
  formantTwo.connect(bodyGain);
  vowelSource.start(0);

  for (let h = 0; h < preset.harmonics.length; h++) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(preset.fundamental * preset.harmonics[h], 0);

    const oscGain = ctx.createGain();
    const gain = preset.harmonicGains[h] ?? 0.08;
    oscGain.gain.setValueAtTime(gain * 0.05, 0);
    oscGain.gain.linearRampToValueAtTime(gain * 0.08, 3.6);
    oscGain.gain.linearRampToValueAtTime(gain * 0.18, 5.8);
    oscGain.gain.setValueAtTime(gain * 0.18, duration - 1.6);

    osc.connect(oscGain);
    oscGain.connect(bodyGain);
    osc.start(0);
  }

  if (preset.noiseAmount > 0) {
    const noiseBuffer = generateNoiseBuffer(ctx, duration);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(preset.noiseBandpass[0], 0);
    filter.Q.setValueAtTime(preset.noiseBandpass[1], 0);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(preset.noiseAmount, 0);
    noiseGain.gain.linearRampToValueAtTime(preset.noiseAmount * 0.35, 5.8);
    noiseGain.gain.setValueAtTime(preset.noiseAmount * 0.25, duration - 1.6);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(bodyGain);
    noiseSource.start(0);
  }

  return ctx.startRendering();
}

async function renderPreset(preset: SynthPreset, sampleRate: number): Promise<AudioBuffer> {
  if (preset.vocalShape === "aum") {
    return renderAumPreset(preset, sampleRate);
  }

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
      return getOmPreset();
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

  const cacheKey = mode === "om" ? stableStringify({ mode }) : stableStringify({ mode, params });
  let cached = synthCache.get(cacheKey);

  if (cached) {
    // LRU: move to most-recent position
    synthCache.delete(cacheKey);
    synthCache.set(cacheKey, cached);
    return cached;
  }

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
