---
mode: air
phase: mvp
status: active
---

# /air

## Purpose

Breath-like reference pulse. A timing reference, not medical advice.

## Allowed Inputs

```
/air [duration_minutes]
```

Duration: 1, 3, 5, 15, 30, or 60 minutes. Default: 5.

## Behavior

### MVP
1. Generate a slow breath-like reference pulse via local synthesis or the configured voice API.
2. Status: `Breath reference starts.`
3. Loop with fade-in.
4. Run for duration.
5. Fade out.

### Phase 4
1. Optionally request microphone permission.
2. If granted, analyze amplitude rhythm locally for 15 seconds.
3. Generate a slower reference from broad timing values.
4. No raw audio stored. No mic data sent externally.
5. If denied, fall back to generated reference.

## Allowed Outputs

- Audio: breath-like air pulse, no words
- Status: `Breath reference starts.`, `Session complete.`, `Stopped.`
- Visual: `∿` with vertical breath wave

## Forbidden Outputs

- "Regulates breathing"
- "Calms anxiety"
- Medical or therapeutic language
- Instructional speech
- Spoken words

## Failure / Stop Behavior

- Mic denial does not break the mode.
- Escape/Stop kills audio immediately.

## Examples

```
/air
→ Breath reference starts. → [pulse loop] → [05:00] → Session complete.
```
