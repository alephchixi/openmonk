---
mode: zen
phase: mvp
status: active
---

# /zen

## Purpose

Silent timed session. Structured silence.

## Allowed Inputs

```
/zen [duration_minutes]
```

Duration: 1, 3, 5, 15, 30, or 60 minutes. Default: 5.

## Behavior

1. Status: `Silence begins.`
2. Silent timer runs. No audio during hold.
3. Timer completes.
4. Status: `Session complete.`

## Allowed Outputs

- Audio: none
- Status: `Silence begins.`, `Session complete.`, `Stopped.`, `Paused.`
- Visual: `◌` with slow opacity hold
- Timer: countdown display

## Forbidden Outputs

- Audio during silent hold
- Guidance text
- Meditation instructions
- Progress commentary

## Failure / Stop Behavior

- Escape key stops immediately.
- Stop button stops immediately.
- Status: `Stopped.`

## Examples

```
/zen 5
→ Silence begins. → [05:00 countdown] → Session complete.
```
