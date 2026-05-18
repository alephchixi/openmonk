// OpenMonk — Audio Engine
// Web Audio API wrapper for playback, looping, fading, volume, and mute.

import { DEFAULT_FADE_IN_MS, DEFAULT_FADE_OUT_MS, DEFAULT_VOLUME } from "./constants";

export type AudioEngineOptions = {
  loop: boolean;
  fadeInMs?: number;
  volume?: number;
  onEnded?: () => void;
};

export class AudioUnavailableError extends Error {
  constructor() {
    super("Audio is unavailable in this browser. Try /zen for a silent session.");
    this.name = "AudioUnavailableError";
  }
}

export class OpenMonkAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private _muted = false;
  private _volume = DEFAULT_VOLUME;
  private _playing = false;
  private _pausedAt = 0;
  private _startedAt = 0;
  private _currentBuffer: AudioBuffer | null = null;
  private _currentOptions: AudioEngineOptions | null = null;

  get playing(): boolean {
    return this._playing;
  }

  get muted(): boolean {
    return this._muted;
  }

  get volume(): number {
    return this._volume;
  }

  get paused(): boolean {
    return this._pausedAt > 0 && !this._playing;
  }

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      try {
        this.ctx = new AudioContext();
      } catch {
        throw new AudioUnavailableError();
      }
    }
    return this.ctx;
  }

  /**
   * Decode an ArrayBuffer using the engine's own AudioContext.
   * Use this instead of creating throwaway contexts (Safari compatibility).
   */
  async decode(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.getContext();
    if (ctx.state === "suspended") await ctx.resume();
    return ctx.decodeAudioData(arrayBuffer.slice(0));
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
   * P3.12: Get current amplitude (0–1) from AnalyserNode.
   */
  getAmplitude(): number {
    if (!this.analyserNode || !this.analyserData) return 0;
    this.analyserNode.getByteTimeDomainData(this.analyserData);
    let sum = 0;
    for (let i = 0; i < this.analyserData.length; i++) {
      const sample = (this.analyserData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / this.analyserData.length);
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

    this._currentBuffer = buffer;
    this._currentOptions = options;
    this._pausedAt = 0;

    const fadeInMs = options.fadeInMs ?? DEFAULT_FADE_IN_MS;
    const volume = options.volume ?? this._volume;
    this._volume = volume;

    // P3.12: Create analyser node
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);

    // Create gain node
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this._muted ? 0 : volume,
      ctx.currentTime + fadeInMs / 1000
    );
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);

    // Create source
    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = options.loop;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      this._playing = false;
      options.onEnded?.();
    };

    this.sourceNode.start(0);
    this._startedAt = ctx.currentTime;
    this._playing = true;
  }

  /**
   * P3.2: Pause playback — records position for resume.
   */
  async pause(): Promise<void> {
    if (!this._playing || !this.ctx || !this._currentBuffer) return;
    const elapsed = this.ctx.currentTime - this._startedAt;
    this._pausedAt = this._currentOptions?.loop
      ? elapsed % this._currentBuffer.duration
      : elapsed;
    await this.stop({ fadeOutMs: 300 });
  }

  /**
   * P3.2: Resume from paused position.
   */
  async resume(): Promise<void> {
    if (!this._currentBuffer || !this._currentOptions || this._pausedAt <= 0) return;
    await this.prepare();
    const ctx = this.getContext();
    const options = this._currentOptions;
    const volume = this._volume;

    // Create analyser
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this._muted ? 0 : volume,
      ctx.currentTime + 0.3
    );
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this._currentBuffer;
    this.sourceNode.loop = options.loop;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      this._playing = false;
      options.onEnded?.();
    };

    this.sourceNode.start(0, this._pausedAt);
    this._startedAt = ctx.currentTime - this._pausedAt;
    this._pausedAt = 0;
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
    const analyserNode = this.analyserNode;
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
    analyserNode?.disconnect();

    if (this.sourceNode === sourceNode) {
      this.sourceNode = null;
      this.gainNode = null;
      this.analyserNode = null;
      this.analyserData = null;
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
    this._currentBuffer = null;
    this._currentOptions = null;
  }
}
