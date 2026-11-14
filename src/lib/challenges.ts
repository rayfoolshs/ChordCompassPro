/**
 * Pedagogical Music Theory Challenges for Students.
 * Lets students practice functional harmony, cadences, secondary dominants, and modal mixture.
 */

import { KeyMode, ProgressionSlot } from './theory';

export interface TheoryChallenge {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced';
  keyId: string;
  mode: KeyMode;
  useSevenths: boolean;
  prompt: string;
  startingSlots: Omit<ProgressionSlot, 'uid'>[];
  options: {
    templateId: string;
    inversion?: 0 | 1 | 2 | 3;
    feedback: string;
    isCorrect: boolean;
  }[];
  takeaway: string;
}

export const THEORY_CHALLENGES: TheoryChallenge[] = [
  {
    id: 'challenge-deceptive',
    title: 'The Surprise Ending (Deceptive Cadence)',
    topic: 'Cadences & Expectations',
    difficulty: 'Foundation',
    keyId: 'C',
    mode: 'major',
    useSevenths: false,
    prompt: 'Your phrase builds tension on V (G). Instead of resolving directly home to I, which chord creates a classic Deceptive Cadence to extend the phrase?',
    startingSlots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
    ],
    options: [
      {
        templateId: 'vi',
        inversion: 0,
        isCorrect: true,
        feedback: 'Spot on! vi shares two tones with I (C and E), satisfying the rising leading tone B → C while shifting the emotional color to minor.',
      },
      {
        templateId: 'I',
        inversion: 0,
        isCorrect: false,
        feedback: 'I gives a strong Perfect Authentic Cadence — great for ending, but not a deceptive surprise.',
      },
      {
        templateId: 'ii',
        inversion: 0,
        isCorrect: false,
        feedback: 'ii moves backward in harmonic function without sharing tonic tones.',
      },
      {
        templateId: 'iii',
        inversion: 0,
        isCorrect: false,
        feedback: 'iii rarely follows V in classical or pop cadences because it lacks the tonic root C.',
      },
    ],
    takeaway: 'A Deceptive Cadence (V → vi) keeps the melody resolution 7̂ → 1̂ intact while swapping the bass to 6̂.',
  },
  {
    id: 'challenge-sec-dom',
    title: 'Spotlight the Dominant',
    topic: 'Secondary Dominants',
    difficulty: 'Intermediate',
    keyId: 'G',
    mode: 'major',
    useSevenths: true,
    prompt: 'Before landing on V7 (D7) in G Major, choose the chromatic secondary dominant that intensifies the pull into D7.',
    startingSlots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'vi', inversion: 0, beats: 4 },
    ],
    options: [
      {
        templateId: 'V/V',
        inversion: 0,
        isCorrect: true,
        feedback: 'Correct! V7/V (A7) introduces C♯, acting as a temporary leading tone straight up to D.',
      },
      {
        templateId: 'ii',
        inversion: 0,
        isCorrect: false,
        feedback: 'ii7 (Am7) is a smooth diatonic pre-dominant, but it does not contain the chromatic leading tone to V.',
      },
      {
        templateId: 'V/vi',
        inversion: 0,
        isCorrect: false,
        feedback: 'V7/vi (B7) targets Em (vi) rather than V7 (D7).',
      },
      {
        templateId: 'IV',
        inversion: 0,
        isCorrect: false,
        feedback: 'IVmaj7 (Cmaj7) is diatonic subdominant, without the chromatic secondary dominant pull.',
      },
    ],
    takeaway: 'Turning minor ii into major/dominant V7/V raises its 3rd by a half step, creating a bright chromatic ramp to V.',
  },
  {
    id: 'challenge-modal-mixture',
    title: 'Bittersweet Plagal Sigh',
    topic: 'Modal Mixture',
    difficulty: 'Intermediate',
    keyId: 'F',
    mode: 'major',
    useSevenths: false,
    prompt: 'You want to return from IV (B♭) back to I (F) with a poignant, film-score color by borrowing a chord from F parallel minor. Which chord completes the sigh?',
    startingSlots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
    ],
    options: [
      {
        templateId: 'iv_mix',
        inversion: 0,
        isCorrect: true,
        feedback: 'Exactly right! Moving IV → iv → I creates a chromatic line D → D♭ → C in the upper voices.',
      },
      {
        templateId: 'V',
        inversion: 0,
        isCorrect: false,
        feedback: 'V (C) is a diatonic dominant — bright and declarative rather than a borrowed minor sigh.',
      },
      {
        templateId: 'bVII_mix',
        inversion: 0,
        isCorrect: false,
        feedback: '♭VII (E♭) is also borrowed from minor, giving an anthemic rock turnaround, not the IV → iv chromatic line.',
      },
      {
        templateId: 'iii',
        inversion: 0,
        isCorrect: false,
        feedback: 'iii (Am) stays strictly inside F Major without chromatic mixture.',
      },
    ],
    takeaway: 'Major IV followed by borrowed minor iv creates an expressive chromatic half-step line (6̂ → ♭6̂ → 5̂) into I.',
  },
  {
    id: 'challenge-tritone-sub',
    title: 'Jazz Half-Step Slide Home',
    topic: 'Tritone Substitution',
    difficulty: 'Advanced',
    keyId: 'C',
    mode: 'major',
    useSevenths: true,
    prompt: 'After ii7 (Dm7), replace V7 (G7) with its tritone substitution so the bass slides chromatically Dm7 → ___ → Cmaj7.',
    startingSlots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'ii', inversion: 0, beats: 4 },
    ],
    options: [
      {
        templateId: 'bII7',
        inversion: 0,
        isCorrect: true,
        feedback: 'Yes! ♭II7 (D♭7) shares B and F — the exact same tritone as G7 — while letting the bass walk D → D♭ → C.',
      },
      {
        templateId: 'V',
        inversion: 0,
        isCorrect: false,
        feedback: 'V7 (G7) is the standard dominant; its bass jumps a 4th/5th rather than sliding by half-step.',
      },
      {
        templateId: 'bVI_mix',
        inversion: 0,
        isCorrect: false,
        feedback: '♭VImaj7 (A♭maj7) creates a cinematic lift, not a chromatic bass bridge between D and C.',
      },
      {
        templateId: 'V/V',
        inversion: 0,
        isCorrect: false,
        feedback: 'V7/V (D7) shares the same root D as Dm7 rather than sliding down to C.',
      },
    ],
    takeaway: 'Two dominant 7th chords a tritone apart share the same 3rd and 7th, making ♭II7 a silky chromatic substitute for V7.',
  },
];
