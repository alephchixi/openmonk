// OpenMonk — Audio API Guards
// Small server-side utilities for rate limits, timeouts, and generated audio cache.

import { NextRequest, NextResponse } from "next/server";
import { stableStringify } from "../stable-json";

const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT = 20;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CACHE_MAX_ENTRIES = 64;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type AudioCacheEntry = {
  data: ArrayBuffer;
  contentType: string;
  expiresAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
const audioCache = new Map<string, AudioCacheEntry>();

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedHost = forwardedFor?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedHost || realIp || "local";
}

export function enforceAudioRateLimit(request: NextRequest, bucket: string): NextResponse | null {
  const maxRequests = numberFromEnv("OPENMONK_AUDIO_RATE_LIMIT", DEFAULT_RATE_LIMIT);
  const now = Date.now();
  const key = `${bucket}:${getClientKey(request)}`;
  const existing = rateLimits.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  existing.count++;
  if (existing.count <= maxRequests) return null;

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "Too many audio requests. Try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = numberFromEnv("OPENMONK_ELEVENLABS_TIMEOUT_MS", DEFAULT_TIMEOUT_MS)
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function readUpstreamError(response: Response): Promise<string> {
  let message = `ElevenLabs returned ${response.status}.`;
  try {
    const err = await response.json();
    if (err?.detail?.message) message = err.detail.message;
    else if (typeof err?.detail === "string") message = err.detail;
    else if (typeof err?.message === "string") message = err.message;
  } catch {
    // Keep the status-derived fallback.
  }
  return message;
}

export function audioResponse(data: ArrayBuffer, contentType = "audio/mpeg"): NextResponse {
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function audioCacheKey(input: unknown): string {
  return stableStringify(input);
}

export function getServerAudioCache(key: string): AudioCacheEntry | null {
  const entry = audioCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    audioCache.delete(key);
    return null;
  }

  audioCache.delete(key);
  audioCache.set(key, entry);
  return entry;
}

export function setServerAudioCache(key: string, data: ArrayBuffer, contentType = "audio/mpeg"): void {
  const maxEntries = numberFromEnv("OPENMONK_AUDIO_SERVER_CACHE_MAX", DEFAULT_CACHE_MAX_ENTRIES);
  const ttl = numberFromEnv("OPENMONK_AUDIO_SERVER_CACHE_TTL_MS", DEFAULT_CACHE_TTL_MS);

  while (audioCache.size >= maxEntries) {
    const oldestKey = audioCache.keys().next().value;
    if (!oldestKey) break;
    audioCache.delete(oldestKey);
  }

  audioCache.set(key, {
    data,
    contentType,
    expiresAt: Date.now() + ttl,
  });
}

export function resetAudioApiStateForTests(): void {
  rateLimits.clear();
  audioCache.clear();
}
