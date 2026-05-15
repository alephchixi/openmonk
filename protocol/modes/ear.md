---
mode: ear
phase: mvp
status: active
---

# /ear

## Purpose

Abstract soundscape mapped to declared mood. User declares mood, system does not infer.

## Allowed Inputs

```
/ear [+mood:token]
```

Allowed mood tokens: `tired`, `foggy`, `soft`, `overloaded`, `late`, `neutral`.

Duration: default 5 minutes. Density and texture may be specified.

## Behavior

1. Validate mood token against allowlist.
2. Map mood to abstract sound parameters.
3. Generate soundscape via sound API.
4. Loop with fade-in.
5. Run for duration.
6. Fade out.

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

- Unknown mood is rejected with minimal error.
- Escape/Stop kills audio immediately.

## Examples

```
/ear +mood:tired
→ Preparing. → [soundscape loop] → [05:00] → Session complete.

/ear +mood:foggy
→ Preparing. → [soundscape loop] → [05:00] → Session complete.
```
