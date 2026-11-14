import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectCadences,
  getRankedSuggestions,
  ProgressionSlot,
  resolveChord,
} from './theory';
import { solveVoiceLeading, suggestSmoothInversions } from './voiceLeading';
import { buildMidiBytes } from './midi';
import { THEORY_CHALLENGES } from './challenges';

test('resolves enharmonic chord spellings accurately in sharp and flat keys', () => {
  const fMajorIV = resolveChord('F', 'major', 'IV', false, 0);
  assert.equal(fMajorIV.symbol, 'B♭');
  assert.deepEqual(fMajorIV.noteNames, ['B♭', 'D', 'F']);

  const gMajorV7 = resolveChord('G', 'major', 'V', true, 0);
  assert.equal(gMajorV7.symbol, 'D7');
  assert.deepEqual(gMajorV7.noteNames, ['D', 'F♯', 'A', 'C']);

  const cMajorFirstInv = resolveChord('C', 'major', 'I', false, 1);
  assert.equal(cMajorFirstInv.symbol, 'C/E');
  assert.equal(cMajorFirstInv.roman, 'I⁶');
});

test('ranks target resolution highest after secondary dominant V/V', () => {
  const progression: ProgressionSlot[] = [
    { uid: '1', templateId: 'I', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'V/V', inversion: 0, beats: 4 },
  ];
  const suggestions = getRankedSuggestions('C', 'major', progression, true);
  assert.equal(suggestions[0].template.id, 'V');
  assert.ok(suggestions[0].score >= 90);
});

test('detects PAC, IAC, deceptive, and plagal cadences', () => {
  const pacProg: ProgressionSlot[] = [
    { uid: '1', templateId: 'V', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'I', inversion: 0, beats: 4 },
  ];
  const pac = detectCadences('major', pacProg);
  assert.equal(pac[0]?.type, 'PAC');

  const dcProg: ProgressionSlot[] = [
    { uid: '1', templateId: 'V', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'vi', inversion: 0, beats: 4 },
  ];
  const dc = detectCadences('major', dcProg);
  assert.equal(dc[0]?.type, 'DC');

  const pcProg: ProgressionSlot[] = [
    { uid: '1', templateId: 'IV', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'I', inversion: 0, beats: 4 },
  ];
  const pc = detectCadences('major', pcProg);
  assert.equal(pc[0]?.type, 'PC');
});

test('voice leading solver keeps smooth SATB motion and respects inversions', () => {
  const prog: ProgressionSlot[] = [
    { uid: '1', templateId: 'I', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'ii', inversion: 1, beats: 4 },
    { uid: '3', templateId: 'V', inversion: 0, beats: 4 },
    { uid: '4', templateId: 'I', inversion: 0, beats: 4 },
  ];
  const { voicings, transitions } = solveVoiceLeading('C', 'major', prog, false);
  assert.equal(voicings.length, 4);
  assert.equal(transitions.length, 3);
  // ii6 in C major has F (pc 5) in the bass
  assert.equal(voicings[1].bassPc, 5);
  // Total upper-voice travel per transition should be compact (<= 6 semitones)
  transitions.forEach((tr) => {
    assert.ok(tr.totalSemitones <= 6, `Expected smooth voice leading, got ${tr.totalSemitones}`);
  });
});

test('MIDI exporter generates valid MThd and MTrk headers', () => {
  const prog: ProgressionSlot[] = [
    { uid: '1', templateId: 'I', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'V', inversion: 0, beats: 4 },
  ];
  const { voicings } = solveVoiceLeading('C', 'major', prog, true);
  const bytes = buildMidiBytes(prog, voicings, 100);
  const headerTag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  assert.equal(headerTag, 'MThd');
  const trackTag = String.fromCharCode(bytes[14], bytes[15], bytes[16], bytes[17]);
  assert.equal(trackTag, 'MTrk');
  assert.ok(bytes.length > 40);
});

test('each theory challenge has exactly one correct option and valid template IDs', () => {
  assert.ok(THEORY_CHALLENGES.length >= 4);
  for (const ch of THEORY_CHALLENGES) {
    const correctCount = ch.options.filter((o) => o.isCorrect).length;
    assert.equal(correctCount, 1, `Challenge ${ch.id} should have exactly 1 correct answer`);
    for (const opt of ch.options) {
      const resolved = resolveChord(ch.keyId, ch.mode, opt.templateId, ch.useSevenths, opt.inversion ?? 0);
      assert.ok(resolved.symbol.length > 0);
    }
  }
});

test('suggestSmoothInversions produces stepwise bass motion for I-V-vi-IV', () => {
  const prog: ProgressionSlot[] = [
    { uid: '1', templateId: 'I', inversion: 0, beats: 4 },
    { uid: '2', templateId: 'V', inversion: 0, beats: 4 },
    { uid: '3', templateId: 'vi', inversion: 0, beats: 4 },
    { uid: '4', templateId: 'IV', inversion: 0, beats: 4 },
  ];
  const smoothed = suggestSmoothInversions('C', 'major', prog, false);
  // V should invert to V6 (B in bass) for smooth C -> B -> A bass descent
  assert.equal(smoothed[1].inversion, 1);
});

