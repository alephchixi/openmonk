# OpenMonk

> A non-discursive sound companion for repetition, breath, silence, and attention.

**[Live demo →](https://habitatmd.net/monk)**

OpenMonk is an open synthetic vocal instrument for contemplative listening. It is not a chatbot. It does not answer, coach, heal, guide, diagnose, or perform wisdom. It rings. It holds. It fades. It stops.

## Modes

| Mode | Command | Description |
|------|---------|-------------|
| Zen | `/zen 5` | Silent timer |
| OM | `/om 5 --low --sparse --far` | Sustained vocal drone |
| Air | `/air 3 --breathy` | Breath-like reference pulse |
| Ear | `/ear 15 --granular` | Abstract soundscape |

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:4444`.

### Optional: ElevenLabs voice provider

```bash
cp .env.example .env
# Add your ELEVENLABS_API_KEY to .env
```

Without an API key, OpenMonk runs entirely client-side using the built-in Web Audio synthesizer.

## Commands

Type in the command input to start sessions immediately:

```
/zen 1 | 3 | 5 | 15 | 30 | 60
/om 5 --low --sparse --far --breathy
/air 3 --granular
/ear 15 --resonant
```

## Parameters

| Param | Values |
|-------|--------|
| Duration | 1, 3, 5, 15, 30, 60 min |
| Pitch | `--low` `--mid` `--high` |
| Density | `--sparse` `--regular` `--dense` |
| Distance | `--near` `--room` `--far` |
| Texture | `--clean` `--breathy` `--granular` `--resonant` |

## Architecture

- **Framework**: Next.js (App Router)
- **Audio**: Web Audio API synthesizer (client-side, zero dependencies)
- **Optional provider**: ElevenLabs TTS + Sound Generation (server-side)
- **Cache**: Browser Cache API with SHA-256 keys
- **Interface**: Canvas particle systems, Space Mono/Grotesk typography

## Ethics

- No therapeutic claims
- No religious simulation
- No emotional diagnosis
- No voice cloning
- No microphone access
- No account required

## Development

```bash
npm run dev          # Dev server on port 4444
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run test         # Vitest (50 tests)
npm run build        # Production build
```

## License

MIT — [aleph ch'ixi](https://github.com/alephchixi)
