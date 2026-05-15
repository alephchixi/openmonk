// OpenMonk — ElevenLabs Provider
// Fetches audio from the server-side ElevenLabs API routes.

import type { ProviderRequest, ProviderResult } from "./types";
import { getAudioRoute } from "../audio-prompts";
import { getCachedAudio, setCachedAudio } from "../audio-cache";

export async function generateElevenLabsAudio(request: ProviderRequest): Promise<ProviderResult> {
  const { mode, durationSeconds, params, signal } = request;

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

  // Decode
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(audioData.slice(0));
  await audioCtx.close();

  return { buffer, loop: true };
}
