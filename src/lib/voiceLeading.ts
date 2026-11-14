/**
 * Smooth 4-voice (SATB) Voice-Leading Solver & Analyzer.
 * Calculates optimal voice assignments across consecutive chords to minimize semitone travel,
 * keeps bass grounded on the chosen inversion, and identifies common tones & tendency resolutions.
 */

import {
  formatPitchClass,
  getQualityIntervals,
  KeyMode,
  ProgressionSlot,
  resolveChord,
  shouldUseFlats,
} from './theory';

export interface VoicedChord {
  slotUid: string;
  midiNotes: [number, number, number, number]; // [Bass, Tenor, Alto, Soprano]
  noteLabels: [string, string, string, string];
  bassPc: number;
}

export interface VoiceTransition {
  fromIndex: number;
  toIndex: number;
  totalSemitones: number;
  commonToneCount: number;
  voiceDeltas: [number, number, number, number]; // signed semitone shift per voice
  tendencyNotes: string[];
  bassMotionLabel: string;
}

function midiToLabel(midi: number, preferFlats: boolean): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${formatPitchClass(pc, preferFlats)}${octave}`;
}

/**
 * Generates candidate upper-voice [Tenor, Alto, Soprano] MIDI trios for a chord's pitch classes.
 */
function generateUpperVoicings(
  pitchClasses: number[],
  bassMidi: number
): [number, number, number][] {
  const results: [number, number, number][] = [];
  const required = pitchClasses.length === 4 ? pitchClasses : [pitchClasses[0], pitchClasses[1], pitchClasses[2]];

  // Candidate MIDI notes in comfortable Tenor/Alto/Soprano range (C3=48 .. A5=81)
  const pool: number[] = [];
  for (let m = Math.max(48, bassMidi + 3); m <= 79; m++) {
    if (required.includes(m % 12)) pool.push(m);
  }

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (pool[j] - pool[i] > 12) break; // keep adjacent upper voices within an octave
      for (let k = j + 1; k < pool.length; k++) {
        if (pool[k] - pool[j] > 12) break;
        const pcs = new Set([bassMidi % 12, pool[i] % 12, pool[j] % 12, pool[k] % 12]);
        // For triads, all 3 chord tones must appear across the 4 voices.
        // For 7th chords, root/3rd/7th must appear (5th may be omitted if needed, though 4 distinct voices usually fit all 4).
        const mustHave =
          pitchClasses.length === 4
            ? [pitchClasses[0], pitchClasses[1], pitchClasses[3]]
            : pitchClasses;
        if (mustHave.every((pc) => pcs.has(pc))) {
          results.push([pool[i], pool[j], pool[k]]);
        }
      }
    }
  }

  return results;
}

function chooseBassMidi(bassPc: number, prevBassMidi?: number): number {
  // Prefer C2 (36) .. B3 (59), centered around E2..G3 (40..55)
  const candidates: number[] = [];
  for (let m = 38; m <= 58; m++) {
    if (m % 12 === bassPc) candidates.push(m);
  }
  if (candidates.length === 0) return 48 + bassPc;
  if (prevBassMidi === undefined) {
    // Pick closest to C3 (48)
    return candidates.reduce((best, cur) =>
      Math.abs(cur - 48) < Math.abs(best - 48) ? cur : best
    );
  }
  return candidates.reduce((best, cur) =>
    Math.abs(cur - prevBassMidi) < Math.abs(best - prevBassMidi) ? cur : best
  );
}

export function solveVoiceLeading(
  keyId: string,
  mode: KeyMode,
  progression: ProgressionSlot[],
  useSevenths: boolean
): { voicings: VoicedChord[]; transitions: VoiceTransition[] } {
  const preferFlats = shouldUseFlats(keyId, mode);
  const voicings: VoicedChord[] = [];
  const transitions: VoiceTransition[] = [];

  for (let idx = 0; idx < progression.length; idx++) {
    const slot = progression[idx];
    const resolved = resolveChord(
      keyId,
      mode,
      slot.templateId,
      useSevenths,
      slot.inversion,
      slot.forceSeventh
    );
    const pcs = resolved.pitchClasses;
    const clampedInv = resolved.inversion;
    const bassPc = pcs[clampedInv];
    const prev = idx > 0 ? voicings[idx - 1] : undefined;
    const bassMidi = chooseBassMidi(bassPc, prev?.midiNotes[0]);

    const upperCandidates = generateUpperVoicings(pcs, bassMidi);

    let bestUpper: [number, number, number] = [60, 64, 67];
    if (upperCandidates.length > 0) {
      if (!prev) {
        // Choose balanced close-mid position around C4-G4 (60-67)
        bestUpper = upperCandidates.reduce((best, cur) => {
          const curCenter = Math.abs((cur[0] + cur[1] + cur[2]) / 3 - 64) + (cur[2] - cur[0]) * 0.15;
          const bestCenter = Math.abs((best[0] + best[1] + best[2]) / 3 - 64) + (best[2] - best[0]) * 0.15;
          return curCenter < bestCenter ? cur : best;
        });
      } else {
        bestUpper = upperCandidates.reduce((best, cur) => {
          const scoreUpper = (u: [number, number, number]) => {
            const d1 = Math.abs(u[0] - prev.midiNotes[1]);
            const d2 = Math.abs(u[1] - prev.midiNotes[2]);
            const d3 = Math.abs(u[2] - prev.midiNotes[3]);
            const total = d1 + d2 + d3;
            // Small penalty for very wide jumps or missing 5th in 7th chords
            const uniqueCount = new Set([bassMidi % 12, u[0] % 12, u[1] % 12, u[2] % 12]).size;
            const completenessPenalty = pcs.length === 4 && uniqueCount < 4 ? 2.5 : 0;
            const sopranoJumpPenalty = d3 > 5 ? (d3 - 5) * 1.5 : 0;
            return total + completenessPenalty + sopranoJumpPenalty;
          };
          return scoreUpper(cur) < scoreUpper(best) ? cur : best;
        });
      }
    } else {
      const ivs = getQualityIntervals(resolved.isSeventh ? resolved.template.seventhQuality : resolved.template.triadQuality);
      const r = 60 + resolved.rootPc;
      bestUpper = [r + ivs[0], r + ivs[1], r + (ivs[3] ?? ivs[2])];
    }

    const midiNotes: [number, number, number, number] = [
      bassMidi,
      bestUpper[0],
      bestUpper[1],
      bestUpper[2],
    ];
    const noteLabels: [string, string, string, string] = [
      midiToLabel(midiNotes[0], preferFlats),
      midiToLabel(midiNotes[1], preferFlats),
      midiToLabel(midiNotes[2], preferFlats),
      midiToLabel(midiNotes[3], preferFlats),
    ];

    voicings.push({
      slotUid: slot.uid,
      midiNotes,
      noteLabels,
      bassPc,
    });

    if (prev) {
      const voiceDeltas: [number, number, number, number] = [
        midiNotes[0] - prev.midiNotes[0],
        midiNotes[1] - prev.midiNotes[1],
        midiNotes[2] - prev.midiNotes[2],
        midiNotes[3] - prev.midiNotes[3],
      ];
      const upperTravel =
        Math.abs(voiceDeltas[1]) + Math.abs(voiceDeltas[2]) + Math.abs(voiceDeltas[3]);
      const commonToneCount = [1, 2, 3].filter((v) => voiceDeltas[v] === 0).length;
      const tendencyNotes: string[] = [];

      const voiceNames = ['Bass', 'Tenor', 'Alto', 'Soprano'];
      for (let v = 1; v < 4; v++) {
        if (voiceDeltas[v] === 0) {
          tendencyNotes.push(`${voiceNames[v]} holds common tone ${noteLabels[v]}`);
        } else if (voiceDeltas[v] === 1) {
          tendencyNotes.push(`${voiceNames[v]} rises half-step (${prev.noteLabels[v]} → ${noteLabels[v]})`);
        } else if (voiceDeltas[v] === -1) {
          tendencyNotes.push(`${voiceNames[v]} resolves down half-step (${prev.noteLabels[v]} → ${noteLabels[v]})`);
        }
      }

      const bassAbs = Math.abs(voiceDeltas[0]);
      const bassMotionLabel =
        bassAbs === 0
          ? 'Pedal bass'
          : bassAbs <= 2
            ? `Stepwise bass (${voiceDeltas[0] > 0 ? '+' : ''}${voiceDeltas[0]} st)`
            : bassAbs === 5 || bassAbs === 7
              ? '4th/5th root leap'
              : `Bass leap (${voiceDeltas[0] > 0 ? '+' : ''}${voiceDeltas[0]} st)`;

      transitions.push({
        fromIndex: idx - 1,
        toIndex: idx,
        totalSemitones: upperTravel,
        commonToneCount,
        voiceDeltas,
        tendencyNotes: tendencyNotes.slice(0, 3),
        bassMotionLabel,
      });
    }
  }

  return { voicings, transitions };
}

/**
 * Optimizes chord inversions across interior chords to favor stepwise bass motion
 * while preserving root position on the opening tonic and final cadence chord.
 */
export function suggestSmoothInversions(
  keyId: string,
  mode: KeyMode,
  progression: ProgressionSlot[],
  useSevenths: boolean
): ProgressionSlot[] {
  if (progression.length <= 2) return progression;

  const updated = progression.map((slot) => ({ ...slot }));
  // Keep slot 0 and final slot grounded in root position if they are tonic/dominant
  let prevBassMidi = chooseBassMidi(
    resolveChord(keyId, mode, updated[0].templateId, useSevenths, updated[0].inversion, updated[0].forceSeventh).pitchClasses[updated[0].inversion]
  );

  for (let i = 1; i < updated.length; i++) {
    const slot = updated[i];
    const resolvedRoot = resolveChord(keyId, mode, slot.templateId, useSevenths, 0, slot.forceSeventh);

    // Keep final chord in root position for a grounded cadence unless already inverted deliberately
    if (i === updated.length - 1) {
      updated[i] = { ...slot, inversion: 0 };
      continue;
    }

    const maxInv = resolvedRoot.pitchClasses.length === 4 ? 2 : 2; // root, 1st, 2nd
    let bestInv: 0 | 1 | 2 | 3 = 0;
    let bestCost = Infinity;

    for (let inv = 0; inv <= maxInv; inv++) {
      const bassPc = resolvedRoot.pitchClasses[inv];
      const bassMidi = chooseBassMidi(bassPc, prevBassMidi);
      const stepDist = Math.abs(bassMidi - prevBassMidi);
      // Slight preference for root (0) or 1st inversion (1) over 6/4 (2)
      const invPenalty = inv === 2 ? 1.8 : inv === 1 ? 0.35 : 0;
      const repeatPenalty = stepDist === 0 ? 1.2 : 0;
      const cost = stepDist + invPenalty + repeatPenalty;
      if (cost < bestCost) {
        bestCost = cost;
        bestInv = inv as 0 | 1 | 2 | 3;
      }
    }

    updated[i] = { ...slot, inversion: bestInv };
    const chosenBassPc = resolvedRoot.pitchClasses[bestInv];
    prevBassMidi = chooseBassMidi(chosenBassPc, prevBassMidi);
  }

  return updated;
}

