import { Volume2 } from 'lucide-react';
import { KeyMode, ProgressionSlot } from '../lib/theory';
import { solveVoiceLeading } from '../lib/voiceLeading';
import { audioEngine, InstrumentId } from '../lib/audio';

interface TheoryGuideViewProps {
  keyId: string;
  instrument: InstrumentId;
}

interface ConceptExample {
  title: string;
  category: string;
  summary: string;
  mode: KeyMode;
  useSevenths: boolean;
  slots: Omit<ProgressionSlot, 'uid'>[];
  romanLabel: string;
}

const GUIDE_EXAMPLES: ConceptExample[] = [
  {
    title: 'Functional Harmony Cycle (T → S → D → T)',
    category: 'Phrase Grammar',
    summary:
      'Most tonal phrases travel from stable Tonic (I) into Pre-dominant motion (ii or IV), peak on Dominant tension (V7), and resolve home to I.',
    mode: 'major',
    useSevenths: true,
    romanLabel: 'Imaj7 → ii7 → V7 → Imaj7',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'ii', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'I', inversion: 0, beats: 4 },
    ],
  },
  {
    title: 'Deceptive Cadence (V → vi)',
    category: 'Cadences',
    summary:
      'Instead of landing on I, V resolves to vi. Because vi shares scale degrees 1̂ and 3̂ with I, the melody resolves naturally while the mood pivots minor.',
    mode: 'major',
    useSevenths: false,
    romanLabel: 'I → IV → V → vi',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'vi', inversion: 0, beats: 4 },
    ],
  },
  {
    title: 'Secondary Dominant (V7/V → V7)',
    category: 'Chromatic Harmony',
    summary:
      'Turning minor ii into major V7/V introduces the raised ♯4̂ leading tone of V, creating magnetic forward momentum toward the dominant.',
    mode: 'major',
    useSevenths: true,
    romanLabel: 'Imaj7 → V7/V → V7 → Imaj7',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'V/V', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 0, beats: 4 },
      { templateId: 'I', inversion: 0, beats: 4 },
    ],
  },
  {
    title: 'Modal Mixture (IV → iv → I)',
    category: 'Chromatic Color',
    summary:
      'Borrowing the minor subdominant (iv) from the parallel minor key creates an expressive falling half-step line (6̂ → ♭6̂ → 5̂) back to tonic.',
    mode: 'major',
    useSevenths: false,
    romanLabel: 'I → IV → iv → I',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
      { templateId: 'iv_mix', inversion: 0, beats: 4 },
      { templateId: 'I', inversion: 0, beats: 4 },
    ],
  },
  {
    title: 'Smooth Bass via First Inversion (I → V⁶ → vi)',
    category: 'Voice Leading',
    summary:
      'Placing the 3rd in the bass of V (V⁶) turns a 4th/5th bass leap into a lyrical descending step-by-step bass line: 1̂ → 7̂ → 6̂.',
    mode: 'major',
    useSevenths: false,
    romanLabel: 'I → V⁶ → vi → IV',
    slots: [
      { templateId: 'I', inversion: 0, beats: 4 },
      { templateId: 'V', inversion: 1, beats: 4 },
      { templateId: 'vi', inversion: 0, beats: 4 },
      { templateId: 'IV', inversion: 0, beats: 4 },
    ],
  },
  {
    title: 'Tritone Substitution (ii7 → ♭II7 → Imaj7)',
    category: 'Jazz Harmony',
    summary:
      'Replacing V7 with the dominant 7th a tritone away preserves the exact 3rd-and-7th tritone while letting the bass slide down chromatically by half step.',
    mode: 'major',
    useSevenths: true,
    romanLabel: 'ii7 → ♭II7 → Imaj7',
    slots: [
      { templateId: 'ii', inversion: 0, beats: 4 },
      { templateId: 'bII7', inversion: 0, beats: 4 },
      { templateId: 'I', inversion: 0, beats: 4 },
    ],
  },
];

export function TheoryGuideView({ keyId, instrument }: TheoryGuideViewProps) {
  const playExample = (ex: ConceptExample) => {
    const slots: ProgressionSlot[] = ex.slots.map((s, i) => ({
      ...s,
      uid: `guide-${i}`,
    }));
    const { voicings } = solveVoiceLeading(keyId, ex.mode, slots, ex.useSevenths);
    audioEngine.stopAll();
    voicings.forEach((v, idx) => {
      v.midiNotes.forEach((midi, noteIdx) => {
        audioEngine.playNote(midi, 0.72, instrument, idx * 0.75 + noteIdx * 0.012);
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h1 className="font-display text-xl font-bold text-slate-900 text-balance">
          Student Harmony Reference
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Every concept below plays live in your currently selected key ({keyId}) with smooth 4-voice leading so you can connect theory terms directly to sound.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDE_EXAMPLES.map((ex) => (
          <article
            key={ex.title}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div>
              <p className="text-xs font-medium text-sky-800">{ex.category}</p>
              <h2 className="mt-1 font-display text-base font-bold text-slate-900">
                {ex.title}
              </h2>
              <p className="mt-2 font-mono text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
                {ex.romanLabel}
              </p>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                {ex.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => playExample(ex)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Volume2 className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
                <span>Hear in {keyId}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
