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
/om [duration_minutes] [--pitch] [--density] [--distance] [--texture]
```

Duration: 1, 3, 5, 15, 30, or 60 minutes. Default: 5.

Parameters:
- Pitch: `--low`, `--mid`, `--high`, `--adaptive`. Default: low.
- Density: `--sparse`, `--regular`, `--dense`. Default: sparse.
- Distance: `--near`, `--room`, `--far`. Default: far.
- Texture: `--clean`, `--breathy`, `--granular`, `--resonant`. Default: breathy.

## Behavior

1. Generate OM-like vocal/drone via API.
2. Decode audio.
3. Loop with long fade-in (2s).
4. Run for specified duration.
5. Fade out (3s).
6. Status: `Session complete.`

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
/om 5 --low --sparse --far
→ Preparing. → [drone starts, fading in] → [05:00 countdown] → [fade out] → Session complete.
```
