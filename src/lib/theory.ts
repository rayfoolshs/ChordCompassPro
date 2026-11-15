/**
 * Pure music theory engine for Chord Compass Pro.
 * Supports 12 keys with proper enharmonic spelling, 5 modes, diatonic & chromatic chords,
 * inversions, tendency-tone analysis, cadence detection, tension scoring, and ranked suggestions.
 */

export type KeyMode = 'major' | 'minor' | 'harmonicMinor' | 'dorian' | 'mixolydian';

export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant' | 'chromatic';

export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | 'maj7' | 'min7' | 'dom7' | 'hdim7' | 'dim7' | 'minMaj7';

export type ChordCategory = 'diatonic' | 'secondary' | 'mixture' | 'tritone';

export interface KeyOption {
  id: string;
  label: string;
  pitchClass: number; // 0 = C .. 11 = B
  preferFlats: boolean;
}

export const KEY_OPTIONS: KeyOption[] = [
  { id: 'C', label: 'C', pitchClass: 0, preferFlats: false },
  { id: 'Db', label: 'D♭ / C♯', pitchClass: 1, preferFlats: true },
  { id: 'D', label: 'D', pitchClass: 2, preferFlats: false },
  { id: 'Eb', label: 'E♭', pitchClass: 3, preferFlats: true },
  { id: 'E', label: 'E', pitchClass: 4, preferFlats: false },
  { id: 'F', label: 'F', pitchClass: 5, preferFlats: true },
  { id: 'Gb', label: 'F♯ / G♭', pitchClass: 6, preferFlats: false },
  { id: 'G', label: 'G', pitchClass: 7, preferFlats: false },
  { id: 'Ab', label: 'A♭', pitchClass: 8, preferFlats: true },
  { id: 'A', label: 'A', pitchClass: 9, preferFlats: false },
  { id: 'Bb', label: 'B♭', pitchClass: 10, preferFlats: true },
  { id: 'B', label: 'B', pitchClass: 11, preferFlats: false },
];

export const MODE_OPTIONS: { id: KeyMode; label: string; shortLabel: string; intervals: number[] }[] = [
  { id: 'major', label: 'Major (Ionian)', shortLabel: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', label: 'Natural Minor (Aeolian)', shortLabel: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonicMinor', label: 'Harmonic Minor', shortLabel: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'dorian', label: 'Dorian Mode', shortLabel: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'mixolydian', label: 'Mixolydian Mode', shortLabel: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
];

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const ASCII_SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ASCII_FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface ChordTemplate {
  id: string;
  romanBase: string;       // e.g. 'I', 'ii', 'V', 'V/V', 'bVI', 'bII'
  romanSeventh: string;    // e.g. 'Imaj7', 'ii7', 'V7', 'V7/V', 'bVImaj7', 'bII7'
  degreeOffset: number;    // semitones above tonic (0-11)
  letterStep: number;      // diatonic letter steps above tonic (0-6)
  triadQuality: ChordQuality;
  seventhQuality: ChordQuality;
  func: HarmonicFunction;
  category: ChordCategory;
  targetId?: string;       // for secondary dominants or tritone subs
  tension: number;         // 0.0 (rest) to 1.0 (maximum harmonic pull)
  description: string;
}

export interface ProgressionSlot {
  uid: string;
  templateId: string;
  inversion: 0 | 1 | 2 | 3;
  beats: 2 | 4;
  forceSeventh?: boolean;
}

export interface ResolvedChord {
  template: ChordTemplate;
  roman: string;
  symbol: string;
  bassNote: string;
  rootPc: number;
  pitchClasses: number[]; // ordered [root, 3rd, 5th, (7th)]
  noteNames: string[];    // spelled note names
  isSeventh: boolean;
  inversion: 0 | 1 | 2 | 3;
}

export interface CadenceEvent {
  afterIndex: number; // index of the dominant/prep chord; resolves into afterIndex + 1
  type: 'PAC' | 'IAC' | 'HC' | 'PC' | 'DC' | 'SEC';
  label: string;
  explanation: string;
}

export interface RankedSuggestion {
  template: ChordTemplate;
  resolved: ResolvedChord;
  score: number;
  reason: string;
  tags: string[];
}

export interface ProgressionPreset {
  id: string;
  name: string;
  genre: string;
  mode: KeyMode;
  useSevenths: boolean;
  bpm: number;
  slots: Omit<ProgressionSlot, 'uid'>[];
  lessonNote: string;
}

export function shouldUseFlats(keyId: string, mode: KeyMode): boolean {
  const key = KEY_OPTIONS.find((k) => k.id === keyId) ?? KEY_OPTIONS[0];
  if (mode === 'major' || mode === 'mixolydian') {
    if (keyId === 'Gb') return true;
    return key.preferFlats;
  }
  // Minor / Dorian modes introduce 3 extra flats relative to parallel major
  const flatMinorRoots = new Set([0, 1, 2, 3, 5, 6, 7, 8, 10]); // C, C#/Db, D, Eb, F, F#/Gb, G, Ab, Bb
  if (mode === 'dorian') {
    return new Set([0, 1, 3, 5, 8, 10]).has(key.pitchClass);
  }
  return flatMinorRoots.has(key.pitchClass);
}

export function formatPitchClass(pc: number, preferFlats: boolean, ascii = false): string {
  const norm = ((pc % 12) + 12) % 12;
  if (ascii) return preferFlats ? ASCII_FLAT_NAMES[norm] : ASCII_SHARP_NAMES[norm];
  return preferFlats ? FLAT_NAMES[norm] : SHARP_NAMES[norm];
}

export function spellNoteFromStep(
  tonicPc: number,
  tonicLetterIdx: number,
  semitoneOffset: number,
  letterStep: number,
  preferFlats: boolean
): string {
  const targetPc = ((tonicPc + semitoneOffset) % 12 + 12) % 12;
  const letter = LETTERS[(tonicLetterIdx + letterStep) % 7];
  const naturalPc = LETTER_SEMITONES[letter];
  let diff = (targetPc - naturalPc + 12) % 12;
  if (diff > 6) diff -= 12;

  if (diff === 0) return letter;
  if (diff === 1) return `${letter}♯`;
  if (diff === -1) return `${letter}♭`;
  if (diff === 2) return `${letter}𝄪`;
  if (diff === -2) return `${letter}𝄫`;
  return formatPitchClass(targetPc, preferFlats);
}

export function getTonicLetterIndex(keyId: string, mode: KeyMode): number {
  const preferFlats = shouldUseFlats(keyId, mode);
  const key = KEY_OPTIONS.find((k) => k.id === keyId) ?? KEY_OPTIONS[0];
  const name = formatPitchClass(key.pitchClass, preferFlats, true);
  return LETTERS.indexOf(name[0]);
}

export function getQualityIntervals(quality: ChordQuality): number[] {
  switch (quality) {
    case 'maj': return [0, 4, 7];
    case 'min': return [0, 3, 7];
    case 'dim': return [0, 3, 6];
    case 'aug': return [0, 4, 8];
    case 'maj7': return [0, 4, 7, 11];
    case 'min7': return [0, 3, 7, 10];
    case 'dom7': return [0, 4, 7, 10];
    case 'hdim7': return [0, 3, 6, 10];
    case 'dim7': return [0, 3, 6, 9];
    case 'minMaj7': return [0, 3, 7, 11];
  }
}

function qualitySymbolSuffix(quality: ChordQuality): string {
  switch (quality) {
    case 'maj': return '';
    case 'min': return 'm';
    case 'dim': return 'dim';
    case 'aug': return 'aug';
    case 'maj7': return 'maj7';
    case 'min7': return 'm7';
    case 'dom7': return '7';
    case 'hdim7': return 'm7♭5';
    case 'dim7': return 'dim7';
    case 'minMaj7': return 'm(maj7)';
  }
}

export function getPaletteForMode(mode: KeyMode): ChordTemplate[] {
  const majorDiatonic: ChordTemplate[] = [
    {
      id: 'I', romanBase: 'I', romanSeventh: 'Imaj7', degreeOffset: 0, letterStep: 0,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'tonic', category: 'diatonic', tension: 0.12,
      description: 'Home tonic — stable point of rest and harmonic resolution.'
    },
    {
      id: 'ii', romanBase: 'ii', romanSeventh: 'ii7', degreeOffset: 2, letterStep: 1,
      triadQuality: 'min', seventhQuality: 'min7', func: 'subdominant', category: 'diatonic', tension: 0.45,
      description: 'Primary pre-dominant — sets up V with smooth fifth root motion.'
    },
    {
      id: 'iii', romanBase: 'iii', romanSeventh: 'iii7', degreeOffset: 4, letterStep: 2,
      triadQuality: 'min', seventhQuality: 'min7', func: 'tonic', category: 'diatonic', tension: 0.34,
      description: 'Mediant tonic substitute — shares two tones with I, gentle lift toward vi or IV.'
    },
    {
      id: 'IV', romanBase: 'IV', romanSeventh: 'IVmaj7', degreeOffset: 5, letterStep: 3,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'subdominant', category: 'diatonic', tension: 0.48,
      description: 'Subdominant — opens outward from home, leads naturally to V or back to I (plagal).'
    },
    {
      id: 'V', romanBase: 'V', romanSeventh: 'V7', degreeOffset: 7, letterStep: 4,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'dominant', category: 'diatonic', tension: 0.88,
      description: 'Dominant — contains the leading tone (7̂) pulling strongly up to tonic.'
    },
    {
      id: 'vi', romanBase: 'vi', romanSeventh: 'vi7', degreeOffset: 9, letterStep: 5,
      triadQuality: 'min', seventhQuality: 'min7', func: 'tonic', category: 'diatonic', tension: 0.3,
      description: 'Relative minor tonic — softens resolution in deceptive cadences (V → vi).'
    },
    {
      id: 'viio', romanBase: 'vii°', romanSeventh: 'viiø7', degreeOffset: 11, letterStep: 6,
      triadQuality: 'dim', seventhQuality: 'hdim7', func: 'dominant', category: 'diatonic', tension: 0.92,
      description: 'Leading-tone chord — rootless V7 color with urgent pull into I.'
    },
  ];

  const minorDiatonic: ChordTemplate[] = [
    {
      id: 'i', romanBase: 'i', romanSeventh: 'im7', degreeOffset: 0, letterStep: 0,
      triadQuality: 'min', seventhQuality: 'min7', func: 'tonic', category: 'diatonic', tension: 0.14,
      description: 'Minor tonic — dark, grounded point of rest.'
    },
    {
      id: 'iio', romanBase: 'ii°', romanSeventh: 'iiø7', degreeOffset: 2, letterStep: 1,
      triadQuality: 'dim', seventhQuality: 'hdim7', func: 'subdominant', category: 'diatonic', tension: 0.56,
      description: 'Half-diminished supertonic — poignant pre-dominant leading into V.'
    },
    {
      id: 'III', romanBase: 'III', romanSeventh: 'IIImaj7', degreeOffset: 3, letterStep: 2,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'tonic', category: 'diatonic', tension: 0.28,
      description: 'Relative major — brightens a minor phrase while staying diatonic.'
    },
    {
      id: 'iv', romanBase: 'iv', romanSeventh: 'iv7', degreeOffset: 5, letterStep: 3,
      triadQuality: 'min', seventhQuality: 'min7', func: 'subdominant', category: 'diatonic', tension: 0.5,
      description: 'Minor subdominant — tender downward pull of scale degree ♭6 toward 5.'
    },
    {
      id: 'v', romanBase: 'v', romanSeventh: 'v7', degreeOffset: 7, letterStep: 4,
      triadQuality: 'min', seventhQuality: 'min7', func: 'dominant', category: 'diatonic', tension: 0.68,
      description: 'Natural minor dominant — modal, understated pull without a raised leading tone.'
    },
    {
      id: 'V', romanBase: 'V', romanSeventh: 'V7', degreeOffset: 7, letterStep: 4,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'dominant', category: 'diatonic', tension: 0.9,
      description: 'Harmonic-minor dominant — raised leading tone creates crisp classical resolution to i.'
    },
    {
      id: 'VI', romanBase: 'VI', romanSeventh: 'VImaj7', degreeOffset: 8, letterStep: 5,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'subdominant', category: 'diatonic', tension: 0.42,
      description: 'Submediant major — dramatic lift for deceptive minor cadences (V → VI).'
    },
    {
      id: 'VII', romanBase: 'VII', romanSeventh: 'VII7', degreeOffset: 10, letterStep: 6,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'dominant', category: 'diatonic', tension: 0.72,
      description: 'Subtonic major — classic rock/folk step-wise arrival into i or III.'
    },
  ];

  const harmonicMinorDiatonic: ChordTemplate[] = [
    ...minorDiatonic.filter((c) => c.id !== 'v' && c.id !== 'VII'),
    {
      id: 'viio', romanBase: 'vii°', romanSeventh: 'vii°7', degreeOffset: 11, letterStep: 6,
      triadQuality: 'dim', seventhQuality: 'dim7', func: 'dominant', category: 'diatonic', tension: 0.95,
      description: 'Diminished 7th on raised 7̂ — symmetric tension resolving urgently to i.'
    },
  ];

  const dorianDiatonic: ChordTemplate[] = [
    {
      id: 'i', romanBase: 'i', romanSeventh: 'im7', degreeOffset: 0, letterStep: 0,
      triadQuality: 'min', seventhQuality: 'min7', func: 'tonic', category: 'diatonic', tension: 0.14,
      description: 'Dorian minor tonic — balanced minor mood with bright natural 6th color.'
    },
    {
      id: 'ii', romanBase: 'ii', romanSeventh: 'ii7', degreeOffset: 2, letterStep: 1,
      triadQuality: 'min', seventhQuality: 'min7', func: 'subdominant', category: 'diatonic', tension: 0.42,
      description: 'Dorian minor ii — smooth stepwise oscillation with i.'
    },
    {
      id: 'III', romanBase: 'III', romanSeventh: 'IIImaj7', degreeOffset: 3, letterStep: 2,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'tonic', category: 'diatonic', tension: 0.3,
      description: 'Mediant major — warm modal lift.'
    },
    {
      id: 'IV', romanBase: 'IV', romanSeventh: 'IV7', degreeOffset: 5, letterStep: 3,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'subdominant', category: 'diatonic', tension: 0.54,
      description: 'Signature Dorian major IV — features the bright natural 6th degree.'
    },
    {
      id: 'v', romanBase: 'v', romanSeventh: 'v7', degreeOffset: 7, letterStep: 4,
      triadQuality: 'min', seventhQuality: 'min7', func: 'dominant', category: 'diatonic', tension: 0.65,
      description: 'Modal minor dominant — keeps the Dorian groove intact.'
    },
    {
      id: 'VII', romanBase: 'VII', romanSeventh: 'VIImaj7', degreeOffset: 10, letterStep: 6,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'dominant', category: 'diatonic', tension: 0.66,
      description: 'Subtonic VII — soulful whole-step turnaround back to i.'
    },
  ];

  const mixolydianDiatonic: ChordTemplate[] = [
    {
      id: 'I', romanBase: 'I', romanSeventh: 'I7', degreeOffset: 0, letterStep: 0,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'tonic', category: 'diatonic', tension: 0.16,
      description: 'Mixolydian tonic — bright major with relaxed blues/folk bounce.'
    },
    {
      id: 'ii', romanBase: 'ii', romanSeventh: 'ii7', degreeOffset: 2, letterStep: 1,
      triadQuality: 'min', seventhQuality: 'min7', func: 'subdominant', category: 'diatonic', tension: 0.44,
      description: 'Pre-dominant minor ii — pairs smoothly with bVII or IV.'
    },
    {
      id: 'IV', romanBase: 'IV', romanSeventh: 'IVmaj7', degreeOffset: 5, letterStep: 3,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'subdominant', category: 'diatonic', tension: 0.48,
      description: 'Subdominant IV — classic Mixolydian rock pillar alongside bVII.'
    },
    {
      id: 'v', romanBase: 'v', romanSeventh: 'v7', degreeOffset: 7, letterStep: 4,
      triadQuality: 'min', seventhQuality: 'min7', func: 'dominant', category: 'diatonic', tension: 0.62,
      description: 'Minor v — avoids leading-tone urgency for an open, driving modal sound.'
    },
    {
      id: 'vi', romanBase: 'vi', romanSeventh: 'vi7', degreeOffset: 9, letterStep: 5,
      triadQuality: 'min', seventhQuality: 'min7', func: 'tonic', category: 'diatonic', tension: 0.32,
      description: 'Relative minor — adds reflective contrast before IV or bVII.'
    },
    {
      id: 'bVII', romanBase: '♭VII', romanSeventh: '♭VIImaj7', degreeOffset: 10, letterStep: 6,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'dominant', category: 'diatonic', tension: 0.74,
      description: 'Signature Mixolydian ♭VII — strong backdoor cadence into I.'
    },
  ];

  const secondaryMajor: ChordTemplate[] = [
    {
      id: 'V/V', romanBase: 'V/V', romanSeventh: 'V7/V', degreeOffset: 2, letterStep: 1,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'secondary', targetId: 'V', tension: 0.84,
      description: 'Secondary dominant of V — raises 4̂ to ♯4̂ to intensify arrival on the dominant.'
    },
    {
      id: 'V/vi', romanBase: 'V/vi', romanSeventh: 'V7/vi', degreeOffset: 4, letterStep: 2,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'secondary', targetId: 'vi', tension: 0.82,
      description: 'Secondary dominant of vi — spotlighted by raised 5̂ pulling up to 6̂.'
    },
    {
      id: 'V/ii', romanBase: 'V/ii', romanSeventh: 'V7/ii', degreeOffset: 9, letterStep: 5,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'secondary', targetId: 'ii', tension: 0.8,
      description: 'Secondary dominant of ii — turns vi into a bright turnaround into ii.'
    },
    {
      id: 'V/IV', romanBase: 'V/IV', romanSeventh: 'V7/IV', degreeOffset: 0, letterStep: 0,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'secondary', targetId: 'IV', tension: 0.78,
      description: 'Secondary dominant of IV — adds bluesy ♭7̂ to propel I directly into IV.'
    },
  ];

  const chromaticColor: ChordTemplate[] = [
    {
      id: 'iv_mix', romanBase: 'iv', romanSeventh: 'iv7', degreeOffset: 5, letterStep: 3,
      triadQuality: 'min', seventhQuality: 'min7', func: 'chromatic', category: 'mixture', tension: 0.62,
      description: 'Borrowed minor iv (modal mixture) — poignant ♭6̂ → 5̂ sigh back to I.'
    },
    {
      id: 'bVI_mix', romanBase: '♭VI', romanSeventh: '♭VImaj7', degreeOffset: 8, letterStep: 5,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'chromatic', category: 'mixture', tension: 0.64,
      description: 'Borrowed flat-six — cinematic lift borrowed from parallel minor.'
    },
    {
      id: 'bVII_mix', romanBase: '♭VII', romanSeventh: '♭VII7', degreeOffset: 10, letterStep: 6,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'mixture', tension: 0.74,
      description: 'Borrowed flat-seven — anthemic backdoor dominant resolving up by whole step to I.'
    },
    {
      id: 'bII7', romanBase: '♭II', romanSeventh: '♭II7', degreeOffset: 1, letterStep: 1,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'tritone', targetId: 'I', tension: 0.94,
      description: 'Tritone substitution for V7 — shares the exact same 3rd/7th tritone while sliding down by half step to I.'
    },
  ];

  const minorChromatic: ChordTemplate[] = [
    {
      id: 'V/iv', romanBase: 'V/iv', romanSeventh: 'V7/iv', degreeOffset: 0, letterStep: 0,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'secondary', targetId: 'iv', tension: 0.8,
      description: 'Secondary dominant of iv — brightens the tonic briefly to pull strongly into iv.'
    },
    {
      id: 'V/III', romanBase: 'V/III', romanSeventh: 'V7/III', degreeOffset: 10, letterStep: 6,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'secondary', targetId: 'III', tension: 0.78,
      description: 'Secondary dominant of III — pivots cleanly toward the relative major.'
    },
    {
      id: 'bII7_min', romanBase: '♭II', romanSeventh: '♭II7', degreeOffset: 1, letterStep: 1,
      triadQuality: 'maj', seventhQuality: 'maj7', func: 'chromatic', category: 'tritone', targetId: 'V', tension: 0.88,
      description: 'Neapolitan / Tritone sub — lush chromatic chord sliding smoothly to V or i.'
    },
    {
      id: 'IV_picardy', romanBase: 'IV', romanSeventh: 'IV7', degreeOffset: 5, letterStep: 3,
      triadQuality: 'maj', seventhQuality: 'dom7', func: 'chromatic', category: 'mixture', tension: 0.56,
      description: 'Dorian borrowed major IV — introduces a hopeful natural 6̂ in minor.'
    },
  ];

  switch (mode) {
    case 'major':
      return [...majorDiatonic, ...secondaryMajor, ...chromaticColor];
    case 'minor':
      return [...minorDiatonic, ...minorChromatic];
    case 'harmonicMinor':
      return [...harmonicMinorDiatonic, ...minorChromatic];
    case 'dorian':
      return [...dorianDiatonic, ...minorChromatic.filter((c) => c.id !== 'IV_picardy')];
    case 'mixolydian':
      return [...mixolydianDiatonic, ...secondaryMajor.filter((c) => c.id !== 'V/IV'), ...chromaticColor.filter((c) => c.id !== 'bVII_mix')];
  }
}

export function findTemplate(mode: KeyMode, templateId: string): ChordTemplate {
  const palette = getPaletteForMode(mode);
  return (
    palette.find((t) => t.id === templateId) ??
    palette.find((t) => t.id.toLowerCase() === templateId.toLowerCase()) ??
    palette[0]
  );
}

export function resolveChord(
  keyId: string,
  mode: KeyMode,
  templateId: string,
  useSeventhGlobal: boolean,
  inversion: 0 | 1 | 2 | 3 = 0,
  forceSeventh?: boolean
): ResolvedChord {
  const key = KEY_OPTIONS.find((k) => k.id === keyId) ?? KEY_OPTIONS[0];
  const preferFlats = shouldUseFlats(keyId, mode);
  const tonicLetterIdx = getTonicLetterIndex(keyId, mode);
  const template = findTemplate(mode, templateId);
  const isSeventh = forceSeventh ?? useSeventhGlobal;
  const quality = isSeventh ? template.seventhQuality : template.triadQuality;
  const intervals = getQualityIntervals(quality);

  const rootPc = (key.pitchClass + template.degreeOffset) % 12;
  const pitchClasses = intervals.map((iv) => (rootPc + iv) % 12);
  const noteNames = intervals.map((iv, idx) =>
    spellNoteFromStep(
      key.pitchClass,
      tonicLetterIdx,
      template.degreeOffset + iv,
      template.letterStep + idx * 2,
      preferFlats
    )
  );

  const clampedInv = (inversion >= pitchClasses.length ? 0 : inversion) as 0 | 1 | 2 | 3;
  const rootName = noteNames[0];
  const bassNote = noteNames[clampedInv];
  const baseSymbol = `${rootName}${qualitySymbolSuffix(quality)}`;
  const symbol = clampedInv === 0 ? baseSymbol : `${baseSymbol}/${bassNote}`;

  const invSuffix = getInversionFigure(isSeventh, clampedInv);
  const baseRoman = isSeventh ? template.romanSeventh : template.romanBase;
  const roman = invSuffix ? `${baseRoman}${invSuffix}` : baseRoman;

  return {
    template,
    roman,
    symbol,
    bassNote,
    rootPc,
    pitchClasses,
    noteNames,
    isSeventh,
    inversion: clampedInv,
  };
}

function getInversionFigure(isSeventh: boolean, inversion: 0 | 1 | 2 | 3): string {
  if (inversion === 0) return '';
  if (!isSeventh) {
    return inversion === 1 ? '⁶' : '⁶⁄₄';
  }
  switch (inversion) {
    case 1: return '⁶⁄₅';
    case 2: return '⁴⁄₃';
    case 3: return '⁴⁄₂';
    default: return '';
  }
}

export function isMinorMode(mode: KeyMode): boolean {
  return mode === 'minor' || mode === 'harmonicMinor' || mode === 'dorian';
}

export function getHomeId(mode: KeyMode): string {
  return isMinorMode(mode) ? 'i' : 'I';
}

/**
 * Ranks all available palette chords as next-chord suggestions after `current`
 * (or as opening chords if `current` is null).
 */
export function getRankedSuggestions(
  keyId: string,
  mode: KeyMode,
  progression: ProgressionSlot[],
  useSevenths: boolean
): RankedSuggestion[] {
  const palette = getPaletteForMode(mode);
  const lastSlot = progression.length > 0 ? progression[progression.length - 1] : null;
  const prevSlot = progression.length > 1 ? progression[progression.length - 2] : null;
  const lastTemplate = lastSlot ? findTemplate(mode, lastSlot.templateId) : null;
  const prevTemplate = prevSlot ? findTemplate(mode, prevSlot.templateId) : null;
  const homeId = getHomeId(mode);

  const suggestions: RankedSuggestion[] = palette.map((candidate) => {
    const resolved = resolveChord(keyId, mode, candidate.id, useSevenths, 0);
    let score = 40;
    const reasons: string[] = [];
    const tags: string[] = [];

    if (!lastTemplate) {
      if (candidate.id === homeId) {
        score = 98;
        reasons.push('Anchors the listener in the home key right from bar 1.');
        tags.push('Strong Opener');
      } else if (candidate.func === 'subdominant') {
        score = 76;
        reasons.push('Starts in motion away from tonic for a dramatic delayed arrival.');
        tags.push('In Medias Res');
      } else if (candidate.id === 'vi' || candidate.id === 'VI') {
        score = 80;
        reasons.push('Opens with a reflective relative chord before building toward V.');
        tags.push('Storytelling');
      } else {
        score = 54;
        reasons.push('Creates immediate harmonic tension on beat one.');
      }
      return { template: candidate, resolved, score, reason: reasons[0], tags };
    }

    // Avoid repeating the identical chord unless intentionally cycling
    if (candidate.id === lastTemplate.id) {
      score -= 30;
    }

    const rootDropFifth = ((lastTemplate.degreeOffset - candidate.degreeOffset + 12) % 12) === 7;
    const rootStepUp = ((candidate.degreeOffset - lastTemplate.degreeOffset + 12) % 12) === 2 ||
      ((candidate.degreeOffset - lastTemplate.degreeOffset + 12) % 12) === 1;
    const rootThirdDown = ((lastTemplate.degreeOffset - candidate.degreeOffset + 12) % 12) === 3 ||
      ((lastTemplate.degreeOffset - candidate.degreeOffset + 12) % 12) === 4;

    // 1. Pending secondary dominant resolution!
    if (lastTemplate.targetId && candidate.id.toLowerCase() === lastTemplate.targetId.toLowerCase()) {
      score += 55;
      reasons.push(`Directly resolves the pending ${lastTemplate.romanBase} secondary dominant down a fifth.`);
      tags.push('Target Resolution');
    }

    // 2. Tritone sub resolution (bII7 -> I or i)
    if ((lastTemplate.id === 'bII7' || lastTemplate.id === 'bII7_min') && candidate.id === homeId) {
      score += 54;
      reasons.push('Chromatic half-step bass slide resolves the shared tritone directly home.');
      tags.push('Tritone Resolution');
    }

    // 3. Classical functional cycle: T -> S -> D -> T
    if (lastTemplate.func === 'dominant') {
      if (candidate.id === homeId) {
        score += 50;
        reasons.push('Authentic cadence: leading tone rises by half-step to resolve dominant tension.');
        tags.push('Cadential Home');
      } else if (candidate.id === 'vi' || candidate.id === 'VI') {
        score += 38;
        reasons.push('Deceptive cadence: surprises the ear by substituting the relative chord for tonic.');
        tags.push('Deceptive Lift');
      } else if (candidate.id === 'IV' && lastTemplate.id === 'V') {
        score += 18;
        reasons.push('Retrograde rock move that delays full resolution.');
      }
    } else if (lastTemplate.func === 'subdominant') {
      if (candidate.id === 'V' || candidate.id === 'v' || candidate.id === 'viio' || candidate.id === 'VII' || candidate.id === 'bVII') {
        score += 46;
        reasons.push('Classic pre-dominant to dominant build — concentrates tension before resolving home.');
        tags.push('Builds Tension');
      } else if (candidate.id === 'V/V') {
        score += 36;
        reasons.push('Intensifies the pre-dominant by chromaticizing it into a dominant of V.');
        tags.push('Chromatic Push');
      } else if (candidate.id === homeId && (lastTemplate.id === 'IV' || lastTemplate.id === 'iv' || lastTemplate.id === 'iv_mix')) {
        score += 34;
        reasons.push('Plagal cadence: warm, hymn-like release without leading-tone urgency.');
        tags.push('Plagal Release');
      } else if (candidate.id === 'ii' || candidate.id === 'iio') {
        score += 24;
        reasons.push('Extends subdominant area while stepping smoothly toward V.');
      }
    } else if (lastTemplate.func === 'tonic') {
      if (candidate.func === 'subdominant') {
        score += 42;
        reasons.push('Leaves home smoothly into pre-dominant territory to start a phrase arc.');
        tags.push('Phrase Departure');
      } else if (candidate.id === 'V' || candidate.id === 'v' || candidate.id === 'bVII') {
        score += 34;
        reasons.push('Jumps straight to dominant tension for an immediate call-and-response.');
        tags.push('Direct Tension');
      } else if (candidate.category === 'secondary') {
        score += 30;
        reasons.push('Introduces chromatic pull to spotlight the upcoming chord.');
        tags.push('Harmonic Color');
      } else if (candidate.func === 'tonic' && candidate.id !== lastTemplate.id) {
        score += 28;
        reasons.push('Tonic prolongation — shifts harmonic color while keeping stability.');
      }
    }

    // Root motion bonuses
    if (rootDropFifth && candidate.id !== lastTemplate.id) {
      score += 14;
      if (reasons.length === 0) reasons.push('Descending fifth root motion gives effortless classical momentum.');
      if (!tags.includes('Circle of 5ths')) tags.push('Circle of 5ths');
    } else if (rootStepUp && candidate.id !== lastTemplate.id) {
      score += 8;
      if (reasons.length === 0) reasons.push('Stepwise root lift keeps bass motion energetic.');
    } else if (rootThirdDown && candidate.id !== lastTemplate.id) {
      score += 10;
      if (reasons.length === 0) reasons.push('Descending third shares two common tones for silky voice leading.');
      tags.push('Common Tones');
    }

    // Phrase awareness: if progression already has 3+ chords and hasn't closed home yet, boost home
    if (progression.length >= 3 && candidate.id === homeId && lastTemplate.func === 'dominant') {
      score += 8;
    }
    // Avoid immediate 2-chord oscillation unless tonic/dominant
    if (prevTemplate && prevTemplate.id === candidate.id && lastTemplate.id !== 'V') {
      score -= 8;
    }

    if (reasons.length === 0) {
      reasons.push(candidate.description);
    }

    return {
      template: candidate,
      resolved,
      score: Math.max(10, Math.min(99, score)),
      reason: reasons[0],
      tags: tags.slice(0, 2),
    };
  });

  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Detects formal cadences and harmonic milestones between adjacent slots.
 */
export function detectCadences(mode: KeyMode, progression: ProgressionSlot[]): CadenceEvent[] {
  const events: CadenceEvent[] = [];
  const homeId = getHomeId(mode);

  for (let i = 0; i < progression.length - 1; i++) {
    const curr = findTemplate(mode, progression[i].templateId);
    const next = findTemplate(mode, progression[i + 1].templateId);
    const nextInv = progression[i + 1].inversion;
    const currInv = progression[i].inversion;

    if ((curr.id === 'V' || curr.id === 'viio' || curr.id === 'bII7') && next.id === homeId) {
      const isPac = curr.id === 'V' && currInv === 0 && nextInv === 0;
      events.push({
        afterIndex: i,
        type: isPac ? 'PAC' : 'IAC',
        label: isPac ? 'Authentic Cadence (PAC)' : 'Imperfect Cadence (IAC)',
        explanation: isPac
          ? 'Both chords are in root position for maximum tonal finality.'
          : 'Dominant tension resolves home, softened by chord inversion or vii°.',
      });
    } else if (curr.id === 'V' && (next.id === 'vi' || next.id === 'VI')) {
      events.push({
        afterIndex: i,
        type: 'DC',
        label: 'Deceptive Cadence',
        explanation: 'Expected tonic arrival is redirected to the submediant, extending the phrase.',
      });
    } else if ((curr.id === 'IV' || curr.id === 'iv' || curr.id === 'iv_mix') && next.id === homeId) {
      events.push({
        afterIndex: i,
        type: 'PC',
        label: 'Plagal Cadence',
        explanation: 'Subdominant gently releases into tonic without a leading tone.',
      });
    } else if (curr.targetId && next.id.toLowerCase() === curr.targetId.toLowerCase()) {
      events.push({
        afterIndex: i,
        type: 'SEC',
        label: `Tonicizes ${next.romanBase}`,
        explanation: `${curr.romanBase} briefly treats ${next.romanBase} as a temporary home.`,
      });
    } else if (curr.func === 'subdominant' && (next.id === 'V' || next.id === 'v') && i === progression.length - 2) {
      events.push({
        afterIndex: i,
        type: 'HC',
        label: 'Half Cadence',
        explanation: 'Phrase pauses on the dominant, creating an open question.',
      });
    }
  }

  return events;
}

/**
 * Returns scale pitch classes (0-11) for the Melody Note Guide.
 */
export function getScalePitchClasses(keyId: string, mode: KeyMode): number[] {
  const key = KEY_OPTIONS.find((k) => k.id === keyId) ?? KEY_OPTIONS[0];
  const modeDef = MODE_OPTIONS.find((m) => m.id === mode) ?? MODE_OPTIONS[0];
  return modeDef.intervals.map((iv) => (key.pitchClass + iv) % 12);
}

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  {
    id: 'classic-arc',
    name: 'Classic Phrase Arc',
    genre: 'Foundational Harmony',
    mode: 'major',
    useSevenths: false,
    bpm: 96,
    lessonNote: 'Home (I) departs to pre-dominant (ii), builds tension on V, and resolves cleanly home.',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'ii', inversion: 1, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'I', inversion: 0, beats: 4 },
    ],
  },
  {
    id: 'pop-axis',
    name: 'Pop Axis Loop',
    genre: 'Contemporary Pop',
    mode: 'major',
    useSevenths: false,
    bpm: 108,
    lessonNote: 'Balances major stability with relative minor emotion before cycling from IV.',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'vi', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
    ],
  },
  {
    id: 'jazz-ii-v-i',
    name: 'Jazz ii7 – V7 – Imaj7',
    genre: 'Jazz Standard',
    mode: 'major',
    useSevenths: true,
    bpm: 112,
    lessonNote: 'Guide tones (3rds and 7ths) slide down by step across consecutive chords.',
    slots: [
      { templateId: 'ii', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'V/ii', inversion: 0, beats: 4 },
    ],
  },
  {
    id: 'chromatic-lift',
    name: 'Secondary Dominant Lift',
    genre: 'Film & Neo-Soul',
    mode: 'major',
    useSevenths: true,
    bpm: 88,
    lessonNote: 'Uses V7/V to spotlight the dominant, then borrows minor iv for a bittersweet return.',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'V/V', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'iv_mix', inversion: 0, beats: 4 },
    ],
  },
  {
    id: 'andalusian',
    name: 'Andalusian Minor Descent',
    genre: 'Classical / Flamenco',
    mode: 'harmonicMinor',
    useSevenths: false,
    bpm: 94,
    lessonNote: 'Stepwise falling bass line from i through VII and VI into a bright harmonic V.',
    slots: [
      { templateId: 'i', inversion: 0, beats: 4 },
      { templateId: 'VI', inversion: 1, beats: 4 },
      { templateId: 'iv', inversion: 1, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
    ],
  },
  {
    id: 'dorian-groove',
    name: 'Dorian Soul Vamp',
    genre: 'Modal / Funk',
    mode: 'dorian',
    useSevenths: true,
    bpm: 102,
    lessonNote: 'Contrasts minor tonic with the signature bright major IV7 chord of Dorian mode.',
    slots: [
      { templateId: 'i', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
      { templateId: 'i', inversion: 0, beats: 4 },
      { templateId: 'VII', inversion: 0, beats: 4 },
    ],
  },
];
