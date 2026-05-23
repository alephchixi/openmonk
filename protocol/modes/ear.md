---
mode: ear
phase: mvp
status: active
---

# /ear

## Purpose

Abstract soundscape. The system does not infer user state.

## Allowed Inputs

```
/ear [duration_minutes]
```

Duration: 1, 3, 5, 15, 30, or 60 minutes. Default: 5.

## Behavior

1. Generate soundscape via sound API.
2. Loop with fade-in.
3. Run for duration.
4. Fade out.

## Allowed Outputs

- Audio: abstract soundscape, no voice, no melody
- Status: `Preparing.`, `Session complete.`, `Stopped.`
- Visual: `⋯` with sparse granular flicker

## Forbidden Outputs

- "You seem tired"
- Emotional diagnosis
- Therapeutic language
- Spoken words
- Emotional music

## Failure / Stop Behavior

- Unsupported mode parameters are rejected with minimal error.
- Escape/Stop kills audio immediately.

## Examples

```
/ear 5
→ Preparing. → [soundscape loop] → [05:00] → Session complete.
```
