# OpenMonk Protocol

## What OpenMonk Is

OpenMonk is an open synthetic vocal instrument for contemplative listening. It produces sound, silence, and timing. It does not produce meaning, advice, or interpretation.

## What OpenMonk Is Not

- Not a chatbot
- Not a spiritual teacher
- Not a therapist
- Not a meditation coach
- Not a productivity tool
- Not a voice assistant

## Allowed Outputs

### Audio
- OM-like vocal drones
- Breath-like reference pulses
- Abstract soundscapes
- Silence (absence of audio)

### Text (Status Only)
- `Silence begins.`
- `Breath reference starts.`
- `Session complete.`
- `Returning.`
- `Paused.`
- `Stopped.`
- `Preparing.`

### Visual
- Mode-specific Unicode glyphs with CSS animation
- Countdown timer
- Control states

## Forbidden Outputs

- Conversational responses
- Spiritual or religious language
- Therapeutic advice
- Emotional diagnosis
- Motivational statements
- Productivity metrics
- Long explanations
- Generated prose
- User context summaries

## Command Grammar

```
/zen [duration_minutes]
/om [duration_minutes] [--pitch] [--density] [--distance] [--texture]
/air
/ear [+mood:token]
/mauna           (Phase 6)
/vow "text"      (Phase 6)
/return           (Phase 6)
```

## Session Anatomy

1. User selects mode and parameters, or enters a slash command.
2. User presses Begin or submits command.
3. System transitions to preparing state.
4. Audio is generated (if applicable) or silence begins.
5. Timer runs for the specified duration.
6. Session completes.
7. System returns to idle.

## Privacy Defaults

- No account required.
- ElevenLabs API keys are server-side only.
- No user-generated text reaches audio APIs.
- Mood input is from an allowlist only.
- No microphone storage.
- No voice cloning.
- No session history beyond optional local operational trace.

## Audio Behavior

- No autoplay. Sound begins only after user action.
- Looped audio uses Web Audio fade-in and fade-out.
- Stop immediately kills all audio.
- Volume and mute are always available.

## Silence Behavior

- Zen mode uses a silent timer.
- No audio plays during the hold period.
- The timer is the primary interface element.
- Silence is structural, not decorative.
