---
mode: mauna
phase: 6
status: planned
---

# /mauna

> Phase 6 — Not available in MVP.

## Purpose

Non-discursive agent mode. Restricts all output to minimal symbolic responses.

## Allowed Inputs

```
/mauna
```

No duration. No parameters.

## Behavior

1. Agent enters non-discursive mode.
2. All responses restricted to minimal set.
3. Remains active until `/return`.

## Allowed Outputs

- `◌`
- `Returning.`
- `Stopped.`

## Forbidden Outputs

- Any discursive response
- Explanations of silence
- Apologies for silence
- Generated prose

## Failure / Stop Behavior

- `/return` exits mauna.
- If agent produces discursive response, mauna has failed.
- Urgent operational needs require explicit `/return` first.

## Examples

```
/mauna
→ ◌

[user asks a question]
→ ◌

/return
→ Returning.
```
