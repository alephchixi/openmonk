# OpenMonk — Mode Reference

Detailed specifications for each OpenMonk mode. This file is loaded on demand by the SKILL.md when handling edge cases or implementing mode-specific behavior.

## Table of Contents

1. [/zen — Silent Timer](#zen)
2. [/om — Vocal Drone](#om)
3. [/air — Breath Pulse](#air)
4. [/ear — Mood Soundscape](#ear)
5. [/mauna — Non-Discursive Mode](#mauna)
6. [/vow — Operational Constraint](#vow)

---

## /zen {#zen}

**Phase:** MVP | **Status:** Active

Silent timed session. Structured silence.

### Inputs
```
/zen [duration_minutes]
```

### Behavior
1. Status: `Silence begins.`
2. Silent timer runs. No audio during hold.
3. Timer completes.
4. Status: `Session complete.`

### Allowed Outputs
- Audio: none
- Status: `Silence begins.`, `Session complete.`, `Stopped.`, `Paused.`
- Visual: `◌` with slow opacity hold
- Timer: countdown display

### Forbidden Outputs
- Audio during silent hold
- Guidance text
- Meditation instructions
- Progress commentary

### Failure / Stop
- Escape/Stop kills immediately. Status: `Stopped.`

---

## /om {#om}

**Phase:** MVP | **Status:** Active

Sustained synthetic vocal drone. Low, distant, non-verbal.

### Inputs
```
/om [duration_minutes] [--pitch] [--density] [--distance] [--texture]
```

Parameters:
- Pitch: `--low`, `--mid`, `--high`, `--adaptive`. Default: low.
- Density: `--sparse`, `--regular`, `--dense`. Default: sparse.
- Distance: `--near`, `--room`, `--far`. Default: far.
- Texture: `--clean`, `--breathy`, `--granular`, `--resonant`. Default: breathy.

### Behavior
1. Generate OM-like vocal/drone via API.
2. Decode audio.
3. Loop with long fade-in (2s).
4. Run for specified duration.
5. Fade out (3s).
6. Status: `Session complete.`

### Allowed Outputs
- Audio: sustained vowel drone, no words, no speech
- Status: `Preparing.`, `Session complete.`, `Stopped.`, `Paused.`
- Visual: `◉` with slow scale and blur pulse
- Timer: countdown display

### Forbidden Outputs
- Spoken words or sentences
- Melodic content
- Religious chanting
- Instructional narration

### Failure / Stop
- Escape/Stop kills immediately (no fade). If API fails, status: `Stopped.`

---

## /air {#air}

**Phase:** MVP | **Status:** Active

Breath-like reference pulse. A timing reference, not medical advice.

### Inputs
```
/air
```

Duration: default 5 minutes. Density and texture may be specified.

### Behavior (MVP)
1. Generate a slow breath-like reference pulse via sound API.
2. Status: `Breath reference starts.`
3. Loop with fade-in.
4. Run for duration.
5. Fade out.

### Behavior (Phase 4 Extension)
1. Optionally request microphone permission.
2. If granted, analyze amplitude rhythm locally for 15 seconds.
3. Generate a slower reference from broad timing values.
4. No raw audio stored. No mic data sent externally.
5. If denied, fall back to generated reference.

### Allowed Outputs
- Audio: breath-like air pulse, no words
- Status: `Breath reference starts.`, `Session complete.`, `Stopped.`
- Visual: `∿` with vertical breath wave

### Forbidden Outputs
- "Regulates breathing"
- "Calms anxiety"
- Medical or therapeutic language
- Instructional speech, spoken words

### Failure / Stop
- Mic denial does not break the mode. Escape/Stop kills audio immediately.

---

## /ear {#ear}

**Phase:** MVP | **Status:** Active

Abstract soundscape mapped to declared mood. User declares mood, system does not infer.

### Inputs
```
/ear [+mood:token]
```

Allowed mood tokens: `tired`, `foggy`, `soft`, `overloaded`, `late`, `neutral`.

### Behavior
1. Validate mood token against allowlist.
2. Map mood to abstract sound parameters.
3. Generate soundscape via sound API.
4. Loop with fade-in.
5. Run for duration.
6. Fade out.

### Allowed Outputs
- Audio: abstract soundscape, no voice, no melody
- Status: `Preparing.`, `Session complete.`, `Stopped.`
- Visual: `⋯` with sparse granular flicker

### Forbidden Outputs
- "You seem tired"
- Emotional diagnosis
- Therapeutic language
- Spoken words, emotional music

### Failure / Stop
- Unknown mood is rejected with minimal error. Escape/Stop kills audio immediately.

---

## /mauna {#mauna}

**Phase:** 6 | **Status:** Planned

Non-discursive agent mode. Restricts all output to minimal symbolic responses.

### Inputs
```
/mauna
```

No duration. No parameters.

### Behavior
1. Agent enters non-discursive mode.
2. All responses restricted to minimal set.
3. Remains active until `/return`.

### Allowed Outputs
- `◌`
- `Returning.`
- `Stopped.`

### Forbidden Outputs
- Any discursive response
- Explanations of silence
- Apologies for silence
- Generated prose

### Failure / Stop
- `/return` exits mauna.
- If agent produces discursive response, mauna has failed.
- Urgent operational needs require explicit `/return` first.

---

## /vow {#vow}

**Phase:** 6 | **Status:** Planned

Temporary operational constraint. Not moral, not spiritual, not punitive.

### Inputs
```
/vow "text"
```

Text describes the constraint. Stored in local session state only.

### Behavior
1. Parse vow text from quoted string.
2. Store constraint in local session state.
3. Display constraint with timer.
4. Constraint expires at end of timer.

### Allowed Outputs
- Visual: `▢` static field with timer
- Timer: countdown display
- Stored constraint text (local only)

### Forbidden Outputs
- Judgment on vow completion
- Motivational language
- Punishment for breaking vow
- Spiritual framing

### Failure / Stop
- Escape/Stop ends vow immediately. No judgment on early exit.
