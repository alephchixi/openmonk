# Audio Design

## Strategy

OpenMonk now has two audio providers:

- Local Web Audio synthesis by default for OM, Air, and Ear.
- ElevenLabs as an optional richer provider for TTS and sound generation.

The local provider keeps the instrument usable without an API key or network latency. ElevenLabs remains server-side only.

## Voice Material (OM)

- Generated via ElevenLabs text-to-speech streaming endpoint.
- Input text is a controlled A-U-M source gesture.
- After decode, OpenMonk samples the stable nasal tail and builds a 15 second circular M sustain.
- The loop end is crossfaded into the loop start, then playback jumps past the overlap window so the A-U-M attack is not repeated on every cycle.
- Voice settings: high stability (0.9), high similarity boost (0.8), no style, no speaker boost.
- Voice ID: required from `ELEVENLABS_OM_VOICE_ID`; no default public voice fallback.
- Primary model: `eleven_v3`. Fallback: `eleven_multilingual_v2`.

## Voice Material (Air)

- Generated via the same ElevenLabs text-to-speech streaming endpoint.
- Input text uses controlled breath syllables only (`haaaaaah`, `hooooooh`) so the model produces a breath-like vocal loop without spoken instructions.
- The local mock provider remains a Web Audio breath pulse.

## Sound Material (Ear)

- Generated via ElevenLabs sound generation endpoint.
- Model: `eleven_text_to_sound_v2`.
- Prompt templates are controlled server-side. No user text reaches the API.
- Ear source clips are requested as 30 second loopable sound effects (`loop: true`) and prompted as evolving abstract soundscapes.
- After decode, OpenMonk adds a small overlap loop window as a fallback against audible MP3 boundary cuts.

## Playback

- Web Audio API for decoding, gain control, fade, loop, and stop.
- AudioContext is prepared immediately after user action, before slower generation work (no autoplay).
- Fade-in: 2 seconds.
- Fade-out: 3 seconds (except emergency stop: 0ms).
- Volume: 0–1 range, independent of mute state.
- Pending remote audio generation can be aborted or ignored when a newer session starts/stops.

## Caching

- Browser Cache API with SHA-256 keys.
- Key inputs: route, mode, duration bucket, curated mode params, model.
- Cache keys use deterministic deep serialization so internal params cannot collide.
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
- Provider audio may include `loopStart`/`loopEnd` metadata so Web Audio loops over a prepared overlap window instead of the full raw clip.
- OM loops use a 15 second sustained vocal cycle. Ear loops use the 30 second ElevenLabs source with a short overlap window.
