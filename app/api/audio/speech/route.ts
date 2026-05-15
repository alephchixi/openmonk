// OpenMonk — Speech API Route
// POST /api/audio/speech
// Generates OM-like vocal material via ElevenLabs TTS.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildOmText } from "@/lib/openmonk/audio-prompts";
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
  mode: z.literal("om"),
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
  const voiceId = process.env.ELEVENLABS_OM_VOICE_ID;

  if (!apiKey) {
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

  const params: OpenMonkParams = parsed.data.params ?? {};
  const text = buildOmText(params);
  const primaryModel = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_v3";
  const fallbackModel = process.env.ELEVENLABS_TTS_FALLBACK_MODEL ?? "eleven_multilingual_v2";

  // Use a default voice if no specific voice ID is configured
  const effectiveVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM"; // "Rachel" default

  const result = await tryTTS(apiKey, effectiveVoiceId, text, primaryModel);
  if (result.ok) {
    return audioResponse(result.data, result.contentType);
  }

  // Fallback model
  const fallbackResult = await tryTTS(apiKey, effectiveVoiceId, text, fallbackModel);
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
            stability: 0.8,
            similarity_boost: 0.5,
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
