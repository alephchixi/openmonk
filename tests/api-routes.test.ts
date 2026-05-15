// OpenMonk — API Route Tests

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as speechPost } from "../app/api/audio/speech/route";
import { POST as soundPost } from "../app/api/audio/sound/route";
import { resetAudioApiStateForTests } from "../lib/openmonk/server/audio-api";

function jsonRequest(path: string, body: unknown, headers?: HeadersInit): NextRequest {
  return new Request(`http://openmonk.test${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function rawRequest(path: string, body: string): NextRequest {
  return new Request(`http://openmonk.test${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body,
  }) as NextRequest;
}

function audioFetchResponse(bytes = [1, 2, 3]): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "Content-Type": "audio/mpeg" },
  });
}

beforeEach(() => {
  resetAudioApiStateForTests();
  vi.stubEnv("ELEVENLABS_API_KEY", "test-key");
  vi.stubEnv("ELEVENLABS_TTS_MODEL", "primary-model");
  vi.stubEnv("ELEVENLABS_TTS_FALLBACK_MODEL", "fallback-model");
  vi.stubEnv("OPENMONK_AUDIO_RATE_LIMIT", "100");
});

afterEach(() => {
  resetAudioApiStateForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/audio/speech", () => {
  it("returns a configuration error when the API key is missing", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");

    const response = await speechPost(jsonRequest("/api/audio/speech", {
      mode: "om",
      durationSeconds: 300,
      params: {},
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Server configuration error." });
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await speechPost(rawRequest("/api/audio/speech", "{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request body." });
  });

  it("uses the fallback TTS model when the primary model fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: { message: "primary failed" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(audioFetchResponse([9, 8, 7]));
    vi.stubGlobal("fetch", fetchMock);

    const response = await speechPost(jsonRequest("/api/audio/speech", {
      mode: "om",
      durationSeconds: 300,
      params: { density: "sparse" },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("audio/mpeg");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.body).toContain("fallback-model");
  });

  it("returns 504 when upstream generation times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "AbortError")));

    const response = await speechPost(jsonRequest("/api/audio/speech", {
      mode: "om",
      durationSeconds: 300,
      params: {},
    }));

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({ error: "Audio generation timed out." });
  });
});

describe("POST /api/audio/sound", () => {
  it("rejects invalid modes", async () => {
    const response = await soundPost(jsonRequest("/api/audio/sound", {
      mode: "zen",
      durationSeconds: 300,
      params: {},
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid parameters." });
  });

  it("caches identical server-side sound requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(audioFetchResponse([4, 5, 6]));
    vi.stubGlobal("fetch", fetchMock);

    const body = {
      mode: "ear",
      durationSeconds: 300,
      params: { mood: "tired", texture: "granular" },
    };

    const first = await soundPost(jsonRequest("/api/audio/sound", body));
    const second = await soundPost(jsonRequest("/api/audio/sound", body));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rate limits repeated requests before hitting upstream", async () => {
    vi.stubEnv("OPENMONK_AUDIO_RATE_LIMIT", "1");
    const fetchMock = vi.fn().mockResolvedValue(audioFetchResponse());
    vi.stubGlobal("fetch", fetchMock);

    const body = {
      mode: "air",
      durationSeconds: 300,
      params: {},
    };

    const first = await soundPost(jsonRequest("/api/audio/sound", body));
    const second = await soundPost(jsonRequest("/api/audio/sound", body));

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toEqual({ error: "Too many audio requests. Try again shortly." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
