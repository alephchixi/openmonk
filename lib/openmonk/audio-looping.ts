// OpenMonk — Audio Loop Preparation
// Decoded-buffer utilities for making generated provider audio repeat cleanly.

export const OM_LOOP_SECONDS = 15;
export const OM_LOOP_OVERLAP_SECONDS = 1.25;
export const SOUNDSCAPE_LOOP_OVERLAP_SECONDS = 1.5;

export type PreparedLoopBuffer = {
  buffer: AudioBuffer;
  loopStartSeconds?: number;
  loopEndSeconds?: number;
};

type FrameRange = {
  start: number;
  end: number;
};

function createAudioBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
  return new AudioBuffer({ numberOfChannels, length, sampleRate });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function findActiveRange(buffer: AudioBuffer, threshold = 0.004): FrameRange {
  const data = buffer.getChannelData(0);
  const guardFrames = Math.floor(buffer.sampleRate * 0.04);
  let start = 0;
  let end = data.length - 1;

  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) >= threshold) {
      start = i;
      break;
    }
  }

  for (let i = Math.max(0, data.length - guardFrames - 1); i >= start; i--) {
    if (Math.abs(data[i]) >= threshold) {
      end = i;
      break;
    }
  }

  if (end <= start) {
    return { start: 0, end: Math.max(1, data.length - 1) };
  }

  return { start, end };
}

function resolveTailRange(buffer: AudioBuffer): FrameRange {
  const active = findActiveRange(buffer);
  const sampleRate = buffer.sampleRate;
  const activeFrames = active.end - active.start;
  const minFrames = Math.min(Math.floor(sampleRate * 0.45), activeFrames);
  const maxFrames = Math.min(Math.floor(sampleRate * 2.4), activeFrames);
  const preferredFrames = clamp(Math.floor(sampleRate * 1.4), minFrames, maxFrames);
  const end = Math.max(active.start + preferredFrames, active.end);
  const start = Math.max(active.start, end - preferredFrames);

  return { start, end };
}

function mixSamples(a: number, b: number, mix: number): number {
  return a * (1 - mix) + b * mix;
}

function renderRepeatedSegment(
  sourceBuffer: AudioBuffer,
  range: FrameRange,
  targetSeconds: number,
  overlapSeconds: number
): AudioBuffer {
  const sampleRate = sourceBuffer.sampleRate;
  const targetFrames = Math.max(1, Math.floor(sampleRate * targetSeconds));
  const overlapFrames = Math.max(1, Math.floor(sampleRate * overlapSeconds));
  const outputLength = targetFrames + overlapFrames;
  const output = createAudioBuffer(sourceBuffer.numberOfChannels, outputLength, sampleRate);
  const segmentFrames = Math.max(1, range.end - range.start);
  const internalCrossfadeFrames = Math.max(
    1,
    Math.min(Math.floor(sampleRate * 0.16), Math.floor(segmentFrames / 3))
  );

  for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
    const source = sourceBuffer.getChannelData(channel);
    const target = output.getChannelData(channel);

    for (let i = 0; i < outputLength; i++) {
      const segmentIndex = i % segmentFrames;
      let sample = source[range.start + segmentIndex] ?? 0;

      if (segmentIndex < internalCrossfadeFrames && i >= internalCrossfadeFrames) {
        const previous = source[range.end - internalCrossfadeFrames + segmentIndex] ?? sample;
        const mix = segmentIndex / Math.max(1, internalCrossfadeFrames - 1);
        sample = mixSamples(previous, sample, mix);
      }

      target[i] = sample;
    }
  }

  return output;
}

export function applyLoopOverlap(buffer: AudioBuffer, overlapSeconds: number): PreparedLoopBuffer {
  const sampleRate = buffer.sampleRate;
  const overlapFrames = Math.max(
    1,
    Math.min(Math.floor(sampleRate * overlapSeconds), Math.floor(buffer.length / 3))
  );
  const output = createAudioBuffer(buffer.numberOfChannels, buffer.length, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel);
    const target = output.getChannelData(channel);
    target.set(source);

    for (let i = 0; i < overlapFrames; i++) {
      const endIndex = output.length - overlapFrames + i;
      const mix = i / Math.max(1, overlapFrames - 1);
      target[endIndex] = mixSamples(source[endIndex] ?? 0, source[i] ?? 0, mix);
    }
  }

  return {
    buffer: output,
    loopStartSeconds: overlapFrames / sampleRate,
    loopEndSeconds: output.duration,
  };
}

export function createSustainedVocalLoop(buffer: AudioBuffer): PreparedLoopBuffer {
  const tailRange = resolveTailRange(buffer);
  const sustained = renderRepeatedSegment(
    buffer,
    tailRange,
    OM_LOOP_SECONDS,
    OM_LOOP_OVERLAP_SECONDS
  );

  return applyLoopOverlap(sustained, OM_LOOP_OVERLAP_SECONDS);
}

export function prepareSoundscapeLoop(buffer: AudioBuffer): PreparedLoopBuffer {
  return applyLoopOverlap(buffer, SOUNDSCAPE_LOOP_OVERLAP_SECONDS);
}
