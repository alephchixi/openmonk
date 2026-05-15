# Ethics

## No Therapeutic Claims

OpenMonk is a sound instrument. It does not treat, heal, or diagnose any condition. No copy, status phrase, or documentation may imply therapeutic effect.

## No Religious Simulation

OpenMonk uses OM as a phonetic vowel material, not as a sacred symbol. It does not simulate monks, temples, rituals, or spiritual authority.

## No Emotional Diagnosis

The system never infers user emotional state. Mood input (`+mood:tired`, etc.) is explicitly declared by the user from an allowlist. The system does not respond with "you seem anxious" or equivalent.

## Microphone Consent

- Phase 4 `/air` mode may request microphone permission.
- Permission must be explicit browser prompt.
- Denial must not break the mode — fallback to generated reference.
- Raw microphone audio is never stored.
- Raw microphone audio is never sent to any external API.
- Local amplitude analysis only.

## Voice Cloning Prohibition

No voice cloning is permitted in MVP. Future voice cloning requires:

- Explicit user consent flow
- Clear disclosure of what is being created
- User control over deletion
- No default opt-in

## Audio Prompt Safety

- Audio prompts are built from controlled server-side templates.
- User text is never passed to ElevenLabs as a prompt.
- Mood tokens are validated against an allowlist.
- Prompt injection patterns are rejected.

## Public Release Hygiene

- `.env` files must never be committed.
- Generated private audio must not be committed.
- Cache output must not be committed.
- API keys are server-side only.
- No tracking, analytics, or telemetry in MVP.
