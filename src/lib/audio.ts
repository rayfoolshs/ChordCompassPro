/**
 * Zero-dependency Web Audio polyphonic synthesizer for Chord Compass.
 * Provides Electric Piano, Acoustic Piano, Nylon Guitar, and Warm Pad timbres
 * plus single-note melody audition and multi-chord preview without external CDN reliance.
 */

export type InstrumentId = 'epiano' | 'piano' | 'guitar' | 'pad';

export const INSTRUMENT_OPTIONS: { id: InstrumentId; label: string }[] = [
  { id: 'epiano', label: 'Electric Piano' },
  { id: 'piano', label: 'Studio Piano' },
  { id: 'guitar', label: 'Nylon Guitar' },
  { id: 'pad', label: 'Warm Strings' },
];

class ChordAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.38;

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public stopAll(): void {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.activeNodes = [];
  }

  public playNote(midi: number, durationSec = 0.9, instrument: InstrumentId = 'epiano', delaySec = 0): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime + delaySec;
    const freq = this.midiToFreq(midi);

    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    if (instrument === 'epiano') {
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + durationSec);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.22, now);
      osc2Gain.gain.exponentialRampToValueAtTime(0.02, now + 0.35);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.26, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
    } else if (instrument === 'piano') {
      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.setValueAtTime(3.5, now);

      filter.frequency.setValueAtTime(3400, now);
      filter.frequency.exponentialRampToValueAtTime(650, now + durationSec * 0.9);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.18, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.25, now + 0.01);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
    } else if (instrument === 'guitar') {
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + durationSec * 0.75);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.14, now);
      osc2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.28, now + 0.008);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.95);

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
    } else {
      // Warm pad
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-5, now);
      osc2.detune.setValueAtTime(5, now);

      filter.frequency.setValueAtTime(1150, now);
      filter.Q.value = 0.8;

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.16, now + Math.min(0.25, durationSec * 0.3));
      noteGain.gain.setValueAtTime(0.14, now + Math.max(0.26, durationSec - 0.25));
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc1.connect(filter);
      osc2.connect(filter);
    }

    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    const stopAt = now + durationSec + 0.05;
    osc1.stop(stopAt);
    osc2.stop(stopAt);

    this.activeNodes.push(osc1, osc2);
    if (this.activeNodes.length > 64) {
      this.activeNodes = this.activeNodes.slice(-32);
    }
  }

  public playChord(midiNotes: number[], durationSec = 1.2, instrument: InstrumentId = 'epiano'): void {
    const strumStep = instrument === 'guitar' ? 0.032 : 0.012;
    midiNotes.forEach((midi, idx) => {
      this.playNote(midi, durationSec, instrument, idx * strumStep);
    });
  }

  public playComparison(
    firstNotes: number[],
    secondNotes: number[],
    instrument: InstrumentId = 'epiano'
  ): void {
    firstNotes.forEach((midi, idx) => {
      this.playNote(midi, 0.72, instrument, idx * 0.01);
    });
    secondNotes.forEach((midi, idx) => {
      this.playNote(midi, 1.05, instrument, 0.75 + idx * 0.01);
    });
  }
}

export const audioEngine = new ChordAudioEngine();
