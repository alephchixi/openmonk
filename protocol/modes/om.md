---
mode: om
phase: mvp
status: active
---

# /om

## Purpose

Sustained synthetic vocal drone. Low, distant, non-verbal.

## Allowed Inputs

```
/om [duration_minutes]
```

Duration: 1, 3, 5, 15, 30, or 60 minutes. Default: 5.

## Behavior

1. Generate OM-like vocal/drone via local synthesis or the configured voice API.
2. Decode audio.
3. Sustain the nasal M tail into a 15-20 second mantra loop.
4. Loop with long fade-in (2s).
5. Run for specified duration.
6. Fade out (3s).
7. Status: `Session complete.`

## Allowed Outputs

- Audio: sustained vowel drone, no words, no speech
- Status: `Preparing.`, `Session complete.`, `Stopped.`, `Paused.`
- Visual: `◉` with slow scale and blur pulse
- Timer: countdown display

## Forbidden Outputs

- Spoken words or sentences
- Melodic content
- Religious chanting
- Instructional narration

## Failure / Stop Behavior

- Escape key stops immediately (no fade).
- Stop button stops immediately.
- If API fails, status shows `Stopped.`

## Examples

```
/om 5
→ Preparing. → [drone starts, fading in] → [05:00 countdown] → [fade out] → Session complete.
```
