// OpenMonk — Speech API Route
// POST /api/audio/speech
// Generates OM and breath-like vocal material via ElevenLabs TTS.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildBreathText, buildOmText } from "@/lib/openmonk/audio-prompts";
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
  mode: z.enum(["om", "air"]),
  durationSeconds: z.number().int().min(60).max(3600),
  params: z.object({
    density: z.enum(["sparse", "regular", "dense"]).optional(),
    distance: z.enum(["near", "room", "far"]).optional(),
    texture: z.enum(["clean", "breathy", "granular", "resonant"]).optional(),
    pitch: z.enum(["low", "mid", "high", "adaptive"]).optional(),
    stability: z.enum(["stable", "wavering", "dissolving"]).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_OM_VOICE_ID?.trim();

  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const limited = enforceAudioRateLimit(request, "speech");
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
  const text = mode === "air" ? buildBreathText(params) : buildOmText(params);
  const primaryModel = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_v3";
  const fallbackModel = process.env.ELEVENLABS_TTS_FALLBACK_MODEL ?? "eleven_multilingual_v2";

  const result = await tryTTS(apiKey, voiceId, text, primaryModel);
  if (result.ok) {
    return audioResponse(result.data, result.contentType);
  }

  // Fallback model
  const fallbackResult = await tryTTS(apiKey, voiceId, text, fallbackModel);
  if (fallbackResult.ok) {
    return audioResponse(fallbackResult.data, fallbackResult.contentType);
  }

  const errorMsg = fallbackResult.message || result.message || "Audio generation failed.";
  console.error("[OpenMonk] TTS failed:", errorMsg);
  return NextResponse.json({ error: errorMsg }, { status: fallbackResult.status === 504 || result.status === 504 ? 504 : 502 });
}

async function tryTTS(
  apiKey: string,
  voiceId: string,
  text: string,
  modelId: string
): Promise<{ ok: true; data: ArrayBuffer; contentType: string } | { ok: false; status: number; message?: string }> {
  const cacheKey = audioCacheKey({ route: "speech", voiceId, text, modelId });
  const cached = getServerAudioCache(cacheKey);
  if (cached) {
    return { ok: true, data: cached.data.slice(0), contentType: cached.contentType };
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.9,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const message = await readUpstreamError(response);
      return { ok: false, status: response.status, message };
    }

    if (!response.body) {
      return { ok: false, status: 500, message: "No audio data received." };
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    setServerAudioCache(cacheKey, data.slice(0), contentType);
    return { ok: true, data, contentType };
  } catch (err) {
    if (isAbortError(err)) {
      return { ok: false, status: 504, message: "Audio generation timed out." };
    }
    return { ok: false, status: 500, message: String(err) };
  }
}
