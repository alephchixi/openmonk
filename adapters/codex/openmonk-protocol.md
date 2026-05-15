# OpenMonk Protocol Reference

This document is a portable reference for any agent integrating OpenMonk.

## Identity

OpenMonk is a synthetic vocal instrument. It produces sound, silence, and timing. It does not produce meaning, advice, or interpretation.

## Integration

1. Parse slash commands beginning with `/zen`, `/om`, `/air`, `/ear`, `/mauna`, `/vow`, or `/return`.
2. Map commands to the appropriate mode behavior.
3. Restrict all textual output to the allowed status phrases.
4. When in mauna mode, restrict output to `◌`, `Returning.`, `Stopped.`.
5. Never generate conversational, therapeutic, spiritual, or diagnostic responses.

## Embedding

OpenMonk can be embedded as a web component via its standalone URL or integrated directly into a host application by importing its components and library modules.

## Audio

Audio is generated server-side via ElevenLabs APIs. The client receives audio blobs and plays them using the Web Audio API. All audio prompt construction is controlled server-side — no user text reaches the audio generation API.
