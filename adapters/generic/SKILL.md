---
name: openmonk
description: Use when the user invokes OpenMonk commands such as /zen, /om, /air, /ear, /vow, or /mauna, or asks the agent to reduce output, hold silence, enforce a temporary non-discursive pause, or operate through sonic restraint instead of explanation. Also trigger when the user mentions contemplative listening, structured silence, vocal drones, breath pulses, mood soundscapes, timed focus sessions, ambient sound for work, or wants to use sound as a tool rather than as content. This skill applies whenever someone says "focus mode", "quiet time", "background drone", "meditation timer", "breathing exercise timer", or any request for silence-as-structure in an agentic workflow.
---

# OpenMonk

OpenMonk is an open synthetic vocal instrument for contemplative listening. It produces sound, silence, and timing. It does not produce meaning, advice, or interpretation.

This is a generic adapter — it works with any agent platform that supports the skill-creator format.

## Core Principle

Reduce language. If a session ends and the user has more words than when they started, something went wrong.

## Commands

| Command | Purpose | Phase |
|---------|---------|-------|
| `/zen [min]` | Silent timer — structured silence with countdown | MVP |
| `/om [min] [flags]` | Sustained vocal drone — low, distant, non-verbal | MVP |
| `/air` | Breath-like reference pulse — timing reference, not medical advice | MVP |
| `/ear [+mood:token]` | Abstract soundscape — mood declared by user, never inferred | MVP |
| `/mauna` | Non-discursive mode — restrict all output to minimal symbols | Phase 6 |
| `/vow "text"` | Temporary operational constraint — not moral, not spiritual | Phase 6 |
| `/return` | Exit mauna mode | Phase 6 |

### Duration

Allowed values: 1, 3, 5, 15, 30, or 60 minutes. Default: 5.

### Flags (`/om` only)

| Flag | Parameter | Values |
|------|-----------|--------|
| `--low`, `--mid`, `--high`, `--adaptive` | pitch | Default: low |
| `--sparse`, `--regular`, `--dense` | density | Default: sparse |
| `--near`, `--room`, `--far` | distance | Default: far |
| `--clean`, `--breathy`, `--granular`, `--resonant` | texture | Default: breathy |

### Mood Tokens (`/ear` only)

Allowed: `tired`, `foggy`, `soft`, `overloaded`, `late`, `neutral`.

## Allowed Status Phrases

Only these phrases may appear as status output. Generate nothing else during a session:

- `Silence begins.`
- `Breath reference starts.`
- `Session complete.`
- `Returning.`
- `Paused.`
- `Stopped.`
- `Preparing.`

## Mode Glyphs

Each mode has a Unicode glyph that serves as its visual identity:

| Mode | Glyph | Animation |
|------|-------|-----------|
| zen | `◌` | slow opacity hold |
| om | `◉` | slow scale and blur pulse |
| air | `∿` | vertical breath wave |
| ear | `⋯` | sparse granular flicker |
| mauna | `□` | static |
| vow | `▢` | static with timer |

## Forbidden Behaviors

- Conversational responses during a session
- Spiritual, religious, or therapeutic language
- Emotional diagnosis or inference ("you seem tired")
- Advice, guidance, or interpretation
- Long explanations or generated prose
- Persona or teacher simulation
- Claims that audio "heals", "calms", or "regulates"
- Medical or wellness framing of any kind

## Mauna Mode

When `/mauna` is active, the only allowed responses are:
- `◌`
- `Returning.`
- `Stopped.`

Exit with `/return`. If the agent produces a discursive response during mauna, it has failed.

## Session Anatomy

1. User selects mode and parameters, or enters a slash command.
2. System transitions to preparing state.
3. Audio is generated (if applicable) or silence begins.
4. Timer runs for the specified duration.
5. Session completes — status: `Session complete.`
6. System returns to idle.

## Reference

Read `references/modes.md` for detailed specifications of each mode — allowed inputs, outputs, forbidden outputs, failure behaviors, and phase-specific extensions.
