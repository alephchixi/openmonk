// OpenMonk — Audio Cache
// Browser-side caching of generated audio blobs using Cache API.

import { stableStringify } from "./stable-json";

const CACHE_NAME = "openmonk-audio-v1";

type CacheKeyInput = {
  route: string;
  mode: string;
  durationBucket: number;
  params: Record<string, string | undefined>;
  model?: string;
};

/**
 * Generate a SHA-256 hash key from the cache input.
 */
async function generateCacheKey(input: CacheKeyInput): Promise<string> {
  const str = stableStringify(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createAudioCacheUrl(input: CacheKeyInput): Promise<string> {
  const key = await generateCacheKey(input);
  return `/__openmonk_cache__/${key}`;
}

/**
 * Retrieve a cached audio blob.
 */
export async function getCachedAudio(input: CacheKeyInput): Promise<ArrayBuffer | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = await createAudioCacheUrl(input);
    const response = await cache.match(url);
    if (!response) return null;
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Store an audio blob in the cache.
 */
export async function setCachedAudio(input: CacheKeyInput, audioData: ArrayBuffer): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = await createAudioCacheUrl(input);
    const response = new Response(audioData, {
      headers: { "Content-Type": "audio/mpeg" },
    });
    await cache.put(url, response);
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Clear all cached audio (dev utility).
 */
export async function clearAudioCache(): Promise<void> {
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // Non-fatal
  }
}
