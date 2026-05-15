# Non-Discursive Mode (Mauna)

> Phase 6 — Not available in MVP.

## Definition

Mauna is a non-discursive operating mode for agents and protocols. When active, OpenMonk restricts all output to minimal symbolic responses.

## Allowed Responses in Mauna

- `◌`
- `Returning.`
- `Stopped.`

No other text, explanation, or generated prose is permitted.

## Activation

```
/mauna
```

## Release

```
/return
```

Mauna requires `/return` to exit. It does not time out automatically.

## Failure Cases

- If the agent produces a discursive response during mauna, it has failed.
- If the agent explains why it is being silent, it has failed.
- If the agent apologizes for being silent, it has failed.

## When Silence Becomes Avoidance

Mauna is not a way to avoid answering legitimate operational questions. If the user needs urgent operational information (e.g., a system error, a blocked task), the agent should exit mauna with `/return` and respond operationally.

Mauna is restraint, not obstruction.
