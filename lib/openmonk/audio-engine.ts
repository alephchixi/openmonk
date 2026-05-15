// OpenMonk — Audio Engine
// Web Audio API wrapper for playback, looping, fading, volume, and mute.

import { DEFAULT_FADE_IN_MS, DEFAULT_FADE_OUT_MS, DEFAULT_VOLUME } from "./constants";

export type AudioEngineOptions = {
  loop: boolean;
  fadeInMs?: number;
  volume?: number;
};

export class OpenMonkAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private _muted = false;
  private _volume = DEFAULT_VOLUME;
  private _playing = false;

  get playing(): boolean {
    return this._playing;
  }

  get muted(): boolean {
    return this._muted;
  }

  get volume(): number {
    return this._volume;
  }

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  /**
   * Create/resume the AudioContext immediately after user action.
   */
  async prepare(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  /**
   * Start playing an audio buffer.
   * AudioContext is created/resumed only here, after user action.
   */
  async start(buffer: AudioBuffer, options: AudioEngineOptions): Promise<void> {
    // Stop any existing playback
    await this.stop({ fadeOutMs: 0 });

    await this.prepare();
    const ctx = this.getContext();

    const fadeInMs = options.fadeInMs ?? DEFAULT_FADE_IN_MS;
    const volume = options.volume ?? this._volume;
    this._volume = volume;

    // Create gain node
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this._muted ? 0 : volume,
      ctx.currentTime + fadeInMs / 1000
    );
    this.gainNode.connect(ctx.destination);

    // Create source
    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = options.loop;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      this._playing = false;
    };

    this.sourceNode.start(0);
    this._playing = true;
  }

  /**
   * Stop playback with optional fade-out.
   */
  async stop(options?: { fadeOutMs?: number }): Promise<void> {
    if (!this.sourceNode || !this.gainNode || !this.ctx) {
      this._playing = false;
      return;
    }

    const sourceNode = this.sourceNode;
    const gainNode = this.gainNode;
    const ctx = this.ctx;
    const fadeOutMs = options?.fadeOutMs ?? DEFAULT_FADE_OUT_MS;

    if (fadeOutMs > 0) {
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutMs / 1000);
      await new Promise((resolve) => setTimeout(resolve, fadeOutMs));
    }

    try {
      sourceNode.stop();
    } catch {
      // Already stopped
    }

    sourceNode.disconnect();
    gainNode.disconnect();

    if (this.sourceNode === sourceNode) {
      this.sourceNode = null;
      this.gainNode = null;
      this._playing = false;
    }
  }

  /**
   * Set volume (0-1). Applies immediately if playing.
   */
  setVolume(value: number): void {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.gainNode && this.ctx && !this._muted) {
      this.gainNode.gain.linearRampToValueAtTime(this._volume, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Mute output. Preserves volume setting for unmute.
   */
  mute(): void {
    this._muted = true;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Unmute output. Restores previous volume.
   */
  unmute(): void {
    this._muted = false;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(this._volume, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Dispose of the engine. Stops all audio and closes context.
   */
  async dispose(): Promise<void> {
    await this.stop({ fadeOutMs: 0 });
    if (this.ctx && this.ctx.state !== "closed") {
      await this.ctx.close();
    }
    this.ctx = null;
  }
}
