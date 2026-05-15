# Audio Design

## Strategy

OpenMonk now has two audio providers:

- Local Web Audio synthesis by default for OM, Air, and Ear.
- ElevenLabs as an optional richer provider for TTS and sound generation.

The local provider keeps the instrument usable without an API key or network latency. ElevenLabs remains server-side only.

## Voice Material (OM)

- Generated via ElevenLabs text-to-speech streaming endpoint.
- Input text is a controlled template: `"ommm... ommm..."` with spacing controlled by density parameter.
- Voice settings: high stability (0.8), low similarity boost (0.5), no style, no speaker boost.
- Primary model: `eleven_v3`. Fallback: `eleven_multilingual_v2`.
- If TTS produces speech-like artifacts, switch to sound generation endpoint with a drone prompt.

## Sound Material (Air, Ear)

- Generated via ElevenLabs sound generation endpoint.
- Model: `eleven_text_to_sound_v2`.
- Prompt templates are controlled server-side. No user text reaches the API.
- Air/Ear/Drone: 20–30 seconds. Looped client-side with Web Audio fades.

## Playback

- Web Audio API for decoding, gain control, fade, loop, and stop.
- AudioContext is prepared immediately after user action, before slower generation work (no autoplay).
- Fade-in: 2 seconds.
- Fade-out: 3 seconds (except emergency stop: 0ms).
- Volume: 0–1 range, independent of mute state.
- Pending remote audio generation can be aborted or ignored when a newer session starts/stops.

## Caching

- Browser Cache API with SHA-256 keys.
- Key inputs: route, mode, duration bucket, params, model.
- Cache keys use deterministic deep serialization so nested params such as mood and texture cannot collide.
- ElevenLabs responses are also cached in bounded server memory for repeated identical prompts.
- No mic data stored. No private context cached.

## API Guards

- Audio API routes validate request bodies with Zod.
- Missing server config and invalid bodies return concise JSON errors.
- Upstream ElevenLabs requests have a bounded timeout.
- Per-client in-memory rate limiting protects the API key from accidental bursts.
- Audio responses use `Cache-Control: no-store`; client/server caches are explicit.

## Looping

- Sessions longer than the generated clip loop using `AudioBufferSourceNode.loop = true`.
- Loop points are handled by the browser's Web Audio implementation.
- If audible clicks occur at loop points, future work will add cross-fade overlap.
