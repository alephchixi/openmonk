// OpenMonk — ElevenLabs Provider
// Fetches audio from the server-side ElevenLabs API routes.

import type { ProviderRequest, ProviderResult } from "./types";
import { getAudioRoute } from "../audio-prompts";
import { getCachedAudio, setCachedAudio } from "../audio-cache";

const OM_SUSTAIN_SECONDS = 18;
const OM_TAIL_SAMPLE_SECONDS = 0.9;
const OM_PREFIX_MAX_SECONDS = 3.5;
const OM_RELEASE_SECONDS = 1.2;

function createAudioBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
  return new AudioBuffer({ numberOfChannels, length, sampleRate });
}

function findLastActiveFrame(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const threshold = 0.004;
  const guardFrames = Math.floor(buffer.sampleRate * 0.05);

  for (let i = data.length - guardFrames - 1; i >= 0; i--) {
    if (Math.abs(data[i]) >= threshold) return i;
  }

  return data.length - 1;
}

function sustainOmTail(buffer: AudioBuffer): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const lastActive = findLastActiveFrame(buffer);
  const sampleFrames = Math.max(
    Math.floor(sampleRate * 0.35),
    Math.min(Math.floor(sampleRate * OM_TAIL_SAMPLE_SECONDS), lastActive)
  );
  const tailStart = Math.max(0, lastActive - sampleFrames);
  const tailEnd = Math.max(tailStart + 1, lastActive);
  const segmentFrames = tailEnd - tailStart;
  const prefixFrames = Math.min(tailStart, Math.floor(sampleRate * OM_PREFIX_MAX_SECONDS));
  const sustainFrames = Math.floor(sampleRate * OM_SUSTAIN_SECONDS);
  const releaseFrames = Math.floor(sampleRate * OM_RELEASE_SECONDS);
  const outputLength = prefixFrames + sustainFrames + releaseFrames;
  const output = createAudioBuffer(buffer.numberOfChannels, outputLength, sampleRate);
  const fadeInFrames = Math.max(1, Math.floor(sampleRate * 0.25));
  const releaseStart = prefixFrames + sustainFrames;
  const crossfadeFrames = Math.max(1, Math.min(Math.floor(sampleRate * 0.12), Math.floor(segmentFrames / 2)));

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel);
    const target = output.getChannelData(channel);

    for (let i = 0; i < prefixFrames; i++) {
      const fade = Math.min(1, i / fadeInFrames);
      target[i] = source[i] * fade;
    }

    for (let i = prefixFrames; i < outputLength; i++) {
      const sustainIndex = i - prefixFrames;
      const segmentIndex = sustainIndex % segmentFrames;
      let sample = source[tailStart + segmentIndex] ?? 0;

      if (segmentIndex < crossfadeFrames && sustainIndex >= crossfadeFrames) {
        const previous = source[tailEnd - crossfadeFrames + segmentIndex] ?? sample;
        const mix = segmentIndex / crossfadeFrames;
        sample = previous * (1 - mix) + sample * mix;
      }

      if (i >= releaseStart) {
        const releaseProgress = (i - releaseStart) / releaseFrames;
        sample *= Math.max(0, 1 - releaseProgress);
      }

      target[i] = sample;
    }
  }

  return output;
}

export async function generateElevenLabsAudio(request: ProviderRequest): Promise<ProviderResult> {
  const { mode, durationSeconds, params, signal, decode } = request;

  const audioRoute = getAudioRoute(mode);
  if (audioRoute === "none") {
    throw new Error("ElevenLabs: mode does not use audio.");
  }

  const cacheKey = {
    route: audioRoute,
    mode,
    durationBucket: durationSeconds,
    params: params as Record<string, string | undefined>,
    model: "elevenlabs",
  };

  let audioData = await getCachedAudio(cacheKey);

  if (!audioData) {
    const response = await fetch(`/api/audio/${audioRoute}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, durationSeconds, params }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = (errorBody as { error?: string }).error || "Audio generation failed.";
      throw new Error(msg);
    }

    audioData = await response.arrayBuffer();
    await setCachedAudio(cacheKey, audioData);
  }

  // Decode using the engine's context (Safari-safe) or fall back to a standalone context
  let buffer: AudioBuffer;
  if (decode) {
    buffer = await decode(audioData);
  } else {
    const audioCtx = new AudioContext();
    buffer = await audioCtx.decodeAudioData(audioData.slice(0));
    await audioCtx.close();
  }

  if (mode === "om") {
    buffer = sustainOmTail(buffer);
  }

  return { buffer, loop: true };
}
