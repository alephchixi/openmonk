// OpenMonk — Provider Router
// Dispatches audio generation to the selected provider.

import type { AudioProvider, ProviderRequest, ProviderResult } from "./types";
import { generateSynthAudio } from "./synth";
import { generateElevenLabsAudio } from "./elevenlabs";

export async function generateAudio(
  provider: AudioProvider,
  request: ProviderRequest
): Promise<ProviderResult> {
  switch (provider) {
    case "synth":
      return generateSynthAudio(request);
    case "elevenlabs":
      return generateElevenLabsAudio(request);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export { type AudioProvider, type ProviderRequest, type ProviderResult } from "./types";
