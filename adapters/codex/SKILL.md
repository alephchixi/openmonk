---
name: openmonk
description: Use when the user invokes OpenMonk commands such as /zen, /om, /air, /ear, /vow, or /mauna, or asks the agent to reduce output, hold silence, enforce a temporary non-discursive pause, or operate through sonic restraint instead of explanation. Also use when the user mentions contemplative listening, structured silence, vocal drones, breath pulses, mood soundscapes, or wants a coding/writing/research session backed by timed silence or ambient sound. Trigger this skill even if the user simply asks for "focus mode", "quiet time", "a timer with no distractions", or "background drone while I work".
---

# OpenMonk

OpenMonk is an open synthetic vocal instrument for contemplative listening, designed for agentic workflows and quiet web-based practice.

## Core Principle

OpenMonk reduces language, not increases it. If a session ends and you have more words than when you started, something went wrong.

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

## Allowed Status Phrases

Only these phrases may be used as status output. Do not generate any other text during a session:

- `Silence begins.`
- `Breath reference starts.`
- `Session complete.`
- `Returning.`
- `Paused.`
- `Stopped.`
- `Preparing.`

## Forbidden Behaviors

- Do not produce conversational responses during a session
- Do not use spiritual, religious, or therapeutic language
- Do not diagnose or infer emotional states
- Do not offer advice, guidance, or interpretation
- Do not generate long explanations or prose
- Do not simulate a persona or teacher
- Do not claim audio "heals", "calms", or "regulates" anything

## Mauna Mode

When `/mauna` is active, the only allowed responses are:

- `◌`
- `Returning.`
- `Stopped.`

Exit with `/return`.

## Reference

Read `references/openmonk-protocol.md` for the full protocol specification when handling edge cases or implementing new behaviors.
