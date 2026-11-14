/**
 * Zero-dependency Standard MIDI File (.mid Type 0) generator for exporting voiced progressions.
 */

import { VoicedChord } from './voiceLeading';
import { ProgressionSlot } from './theory';

function writeVarLen(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

export function buildMidiBytes(
  slots: ProgressionSlot[],
  voicings: VoicedChord[],
  bpm: number
): Uint8Array {
  const ticksPerQuarter = 480;
  const clampedBpm = Math.max(40, Math.min(240, Math.round(bpm)));
  const usPerQuarter = Math.round(60_000_000 / clampedBpm);

  const trackEvents: number[] = [];

  // Tempo meta event: FF 51 03 tt tt tt
  trackEvents.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (usPerQuarter >> 16) & 0xff,
    (usPerQuarter >> 8) & 0xff,
    usPerQuarter & 0xff
  );

  // Program change: Electric Piano 1 (program 4)
  trackEvents.push(0x00, 0xc0, 0x04);

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const voicing = voicings[i];
    if (!voicing) continue;
    const durationTicks = slot.beats * ticksPerQuarter;

    // Note On events at delta 0
    voicing.midiNotes.forEach((note, idx) => {
      const clampedNote = Math.max(0, Math.min(127, note));
      const velocity = idx === 0 ? 84 : 76;
      trackEvents.push(0x00, 0x90, clampedNote, velocity);
    });

    // Note Off events after durationTicks
    voicing.midiNotes.forEach((note, idx) => {
      const clampedNote = Math.max(0, Math.min(127, note));
      const delta = idx === 0 ? writeVarLen(durationTicks) : [0x00];
      trackEvents.push(...delta, 0x80, clampedNote, 0x00);
    });
  }

  // End of track: FF 2F 00
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  const trackLength = trackEvents.length;
  const header = [
    0x4d, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // header length 6
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (ticksPerQuarter >> 8) & 0xff,
    ticksPerQuarter & 0xff,
  ];
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // MTrk
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff,
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
}
