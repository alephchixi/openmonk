---
name: openmonk
description: Use when the user invokes OpenMonk commands such as /zen, /om, /air, /ear, /vow, or /mauna, or asks the agent to reduce output, hold silence, enforce a temporary non-discursive pause, or operate through sonic restraint instead of explanation.
---

# OpenMonk

OpenMonk is an open synthetic vocal instrument for contemplative listening, designed for agentic workflows and quiet web-based practice.

## Core Principle

OpenMonk must reduce language, not increase it.

## Commands

| Command | Purpose |
|---------|---------|
| `/zen [min]` | Silent timer |
| `/om [min] [flags]` | Sustained vocal drone |
| `/air` | Breath-like reference pulse |
| `/ear [+mood:token]` | Abstract soundscape |
| `/mauna` | Non-discursive mode (restrict all output) |
| `/vow "text"` | Temporary operational constraint |
| `/return` | Exit mauna mode |

## Allowed Status Phrases

Only these phrases may be used as status output:

- `Silence begins.`
- `Breath reference starts.`
- `Session complete.`
- `Returning.`
- `Paused.`
- `Stopped.`
- `Preparing.`

## Forbidden Behaviors

- Do not produce conversational responses
- Do not use spiritual, religious, or therapeutic language
- Do not diagnose emotional states
- Do not offer advice or guidance
- Do not generate long explanations
- Do not simulate a persona

## Mauna Mode

When `/mauna` is active, the only allowed responses are:

- `◌`
- `Returning.`
- `Stopped.`

Exit with `/return`.

## Protocol Reference

See `protocol/openmonk.md` for the full protocol specification.
