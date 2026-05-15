// OpenMonk — Sound API Route
// POST /api/audio/sound
// Generates air and ear soundscape material via ElevenLabs sound generation.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildSoundPrompt, getSoundGenerationDuration } from "@/lib/openmonk/audio-prompts";
import type { OpenMonkParams } from "@/lib/openmonk/types";
import {
  audioCacheKey,
  audioResponse,
  enforceAudioRateLimit,
  fetchWithTimeout,
  getServerAudioCache,
  isAbortError,
  readUpstreamError,
  setServerAudioCache,
} from "@/lib/openmonk/server/audio-api";

const RequestSchema = z.object({
  mode: z.enum(["air", "ear"]),
  durationSeconds: z.number().int().min(0).max(3600),
  params: z.object({
    density: z.enum(["sparse", "regular", "dense"]).optional(),
    distance: z.enum(["near", "room", "far"]).optional(),
    texture: z.enum(["clean", "breathy", "granular", "resonant"]).optional(),
    pitch: z.enum(["low", "mid", "high", "adaptive"]).optional(),
    stability: z.enum(["stable", "wavering", "dissolving"]).optional(),
    mood: z.enum(["tired", "foggy", "soft", "overloaded", "late", "neutral"]).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const limited = enforceAudioRateLimit(request, "sound");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  }

  const { mode } = parsed.data;
  const params: OpenMonkParams = parsed.data.params ?? {};

  let prompt: string;
  try {
    prompt = buildSoundPrompt(mode, params);
  } catch {
    return NextResponse.json({ error: "Invalid mode or parameters." }, { status: 400 });
  }

  const durationSeconds = getSoundGenerationDuration(mode);
  const cacheKey = audioCacheKey({ route: "sound", mode, prompt, durationSeconds });
  const cached = getServerAudioCache(cacheKey);
  if (cached) {
    return audioResponse(cached.data.slice(0), cached.contentType);
  }

  try {
    const response = await fetchWithTimeout("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: durationSeconds,
        prompt_influence: 0.5,
      }),
    });

    if (!response.ok) {
      const errorMsg = await readUpstreamError(response);
      console.error("[OpenMonk] Sound generation failed:", errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 502 });
    }

    if (!response.body) {
      return NextResponse.json({ error: "No audio data received." }, { status: 502 });
    }

    const audioData = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    setServerAudioCache(cacheKey, audioData.slice(0), contentType);
    return audioResponse(audioData, contentType);
  } catch (err) {
    if (isAbortError(err)) {
      return NextResponse.json({ error: "Audio generation timed out." }, { status: 504 });
    }
    console.error("[OpenMonk] Sound generation error:", err);
    return NextResponse.json({ error: "Audio generation failed." }, { status: 502 });
  }
}
