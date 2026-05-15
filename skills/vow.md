# /vow

> Phase 6 — Not available in MVP.

## Purpose

Temporary operational constraint. Not moral, not spiritual, not punitive.

## Allowed Inputs

```
/vow "text"
```

Text describes the constraint. Stored in local session state only.

## Behavior

1. Parse vow text from quoted string.
2. Store constraint in local session state.
3. Display constraint with timer.
4. Constraint expires at end of timer.

## Allowed Outputs

- Visual: `▢` static field with timer
- Timer: countdown display
- Stored constraint text (local only)

## Forbidden Outputs

- Judgment on vow completion
- Motivational language
- Punishment for breaking vow
- Spiritual framing

## Failure / Stop Behavior

- Escape/Stop ends vow immediately.
- No judgment on early exit.

## Examples

```
/vow "one task only for 25 minutes"
→ ▢ → [25:00 countdown] → Session complete.

/vow "no new files until current bug is fixed"
→ ▢ → [constraint displayed]
```
