// OpenMonk — ElevenLabs Provider
// Fetches audio from the server-side ElevenLabs API routes.

import type { ProviderRequest, ProviderResult } from "./types";
import { getAudioRoute } from "../audio-prompts";
import { getCachedAudio, setCachedAudio } from "../audio-cache";
import { createSustainedVocalLoop, prepareSoundscapeLoop } from "../audio-looping";

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
    loopProfile: "prepared-loop-v2",
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

  let loopStartSeconds: number | undefined;
  let loopEndSeconds: number | undefined;

  if (mode === "om") {
    const prepared = createSustainedVocalLoop(buffer);
    buffer = prepared.buffer;
    loopStartSeconds = prepared.loopStartSeconds;
    loopEndSeconds = prepared.loopEndSeconds;
  } else if (mode === "ear") {
    const prepared = prepareSoundscapeLoop(buffer);
    buffer = prepared.buffer;
    loopStartSeconds = prepared.loopStartSeconds;
    loopEndSeconds = prepared.loopEndSeconds;
  }

  return { buffer, loop: true, loopStartSeconds, loopEndSeconds };
}
