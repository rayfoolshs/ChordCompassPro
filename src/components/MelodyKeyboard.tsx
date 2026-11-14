import { useState } from 'react';
import {
  formatPitchClass,
  getScalePitchClasses,
  KeyMode,
  ResolvedChord,
  shouldUseFlats,
} from '../lib/theory';
import { VoicedChord } from '../lib/voiceLeading';

interface MelodyKeyboardProps {
  keyId: string;
  mode: KeyMode;
  activeChord: ResolvedChord | null;
  activeVoicing: VoicedChord | null;
  onPlayNote: (midi: number) => void;
}

const WHITE_KEY_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_SPECS = [
  { pc: 1, whiteIndexAfter: 0 },
  { pc: 3, whiteIndexAfter: 1 },
  { pc: 6, whiteIndexAfter: 3 },
  { pc: 8, whiteIndexAfter: 4 },
  { pc: 10, whiteIndexAfter: 5 },
];

export function MelodyKeyboard({
  keyId,
  mode,
  activeChord,
  activeVoicing,
  onPlayNote,
}: MelodyKeyboardProps) {
  const [lastPlayedMidi, setLastPlayedMidi] = useState<number | null>(null);
  const preferFlats = shouldUseFlats(keyId, mode);
  const scalePcs = getScalePitchClasses(keyId, mode);

  // Render 2 octaves from C4 (60) to B5 (83)
  const octaves = [4, 5];
  const whiteKeys: { midi: number; pc: number; label: string }[] = [];
  octaves.forEach((oct) => {
    WHITE_KEY_OFFSETS.forEach((pc) => {
      const midi = (oct + 1) * 12 + pc;
      whiteKeys.push({
        midi,
        pc,
        label: `${formatPitchClass(pc, preferFlats)}${oct}`,
      });
    });
  });

  const blackKeys: { midi: number; pc: number; label: string; leftPercent: number }[] = [];
  const totalWhite = whiteKeys.length; // 14
  octaves.forEach((oct, octIdx) => {
    BLACK_KEY_SPECS.forEach(({ pc, whiteIndexAfter }) => {
      const midi = (oct + 1) * 12 + pc;
      const whitePos = octIdx * 7 + whiteIndexAfter + 1;
      const leftPercent = (whitePos / totalWhite) * 100;
      blackKeys.push({
        midi,
        pc,
        label: `${formatPitchClass(pc, preferFlats)}${oct}`,
        leftPercent,
      });
    });
  });

  const classifyPitch = (
    pc: number,
    midi: number
  ): {
    role: 'chord' | 'scale' | 'outside';
    roleLabel: string;
    isExactVoiced: boolean;
  } => {
    const isExactVoiced = activeVoicing ? activeVoicing.midiNotes.includes(midi) : false;
    if (activeChord) {
      const idx = activeChord.pitchClasses.indexOf(pc);
      if (idx !== -1) {
        const names = ['Root', '3rd', '5th', '7th'];
        return { role: 'chord', roleLabel: names[idx] ?? 'Chord tone', isExactVoiced };
      }
    }
    if (scalePcs.includes(pc)) {
      return { role: 'scale', roleLabel: 'Scale passing tone', isExactVoiced: false };
    }
    return { role: 'outside', roleLabel: 'Chromatic color', isExactVoiced: false };
  };

  const handlePress = (midi: number) => {
    setLastPlayedMidi(midi);
    onPlayNote(midi);
  };

  const lastPlayedInfo =
    lastPlayedMidi !== null
      ? {
          label: `${formatPitchClass(lastPlayedMidi % 12, preferFlats)}${Math.floor(lastPlayedMidi / 12) - 1}`,
          ...classifyPitch(lastPlayedMidi % 12, lastPlayedMidi),
        }
      : null;

  return (
    <section
      aria-label="Melody note guide and playable piano keyboard"
      className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Melody Note Guide &amp; Keyboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeChord
              ? `Click keys to test melody notes over ${activeChord.roman} (${activeChord.symbol})`
              : 'Select a chord to highlight chord tones and passing scale notes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-xs bg-sky-600" aria-hidden="true" />
            <span>Chord Tone</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-xs bg-emerald-500" aria-hidden="true" />
            <span>Scale Tone</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-xs bg-slate-300" aria-hidden="true" />
            <span>Outside Tension</span>
          </span>
        </div>
      </div>

      {/* Playable 2-octave keyboard */}
      <div className="relative mt-2 h-36 w-full select-none rounded-lg border border-slate-200 bg-slate-100 p-1">
        <div className="relative flex h-full w-full">
          {whiteKeys.map((wk) => {
            const info = classifyPitch(wk.pc, wk.midi);
            const isPressed = lastPlayedMidi === wk.midi;
            const bgClass = isPressed
              ? 'bg-sky-100'
              : info.role === 'chord'
                ? 'bg-sky-50 hover:bg-sky-100/80'
                : info.role === 'scale'
                  ? 'bg-emerald-50/55 hover:bg-emerald-50'
                  : 'bg-white hover:bg-slate-50';
            const dotClass =
              info.role === 'chord'
                ? 'bg-sky-600 text-white'
                : info.role === 'scale'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-transparent text-slate-400';

            return (
              <button
                key={wk.midi}
                type="button"
                onClick={() => handlePress(wk.midi)}
                aria-label={`Play ${wk.label} (${info.roleLabel})`}
                className={`relative flex-1 flex flex-col items-center justify-end pb-2 border-r border-slate-200 last:border-r-0 first:rounded-l-md last:rounded-r-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${bgClass}`}
              >
                {info.isExactVoiced && (
                  <span
                    className="mb-1 text-[9px] font-mono font-semibold text-sky-700"
                    title="Active voiced note"
                  >
                    ●
                  </span>
                )}
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-semibold ${dotClass}`}
                >
                  {wk.label.replace(/[0-9]/g, '')}
                </span>
              </button>
            );
          })}

          {blackKeys.map((bk) => {
            const info = classifyPitch(bk.pc, bk.midi);
            const isPressed = lastPlayedMidi === bk.midi;
            const keyBg = isPressed
              ? 'bg-sky-600'
              : info.role === 'chord'
                ? 'bg-sky-800 hover:bg-sky-700'
                : info.role === 'scale'
                  ? 'bg-emerald-800 hover:bg-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700';

            return (
              <button
                key={bk.midi}
                type="button"
                onClick={() => handlePress(bk.midi)}
                aria-label={`Play ${bk.label} (${info.roleLabel})`}
                style={{ left: `calc(${bk.leftPercent}% - 2.3%)`, width: '4.6%' }}
                className={`absolute top-0 z-10 flex h-[58%] flex-col items-center justify-end rounded-b-md pb-1.5 text-white shadow-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${keyBg}`}
              >
                <span className="font-mono text-[9px] font-medium leading-none">
                  {bk.label.replace(/[0-9]/g, '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Melody Feedback Line */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 min-h-[20px]">
        {lastPlayedInfo ? (
          <p>
            Last played: <strong className="font-mono text-slate-900">{lastPlayedInfo.label}</strong>
            <span aria-hidden="true"> · </span>
            <span className="font-medium text-slate-800">{lastPlayedInfo.roleLabel}</span>
            {activeChord && ` against ${activeChord.symbol}`}
          </p>
        ) : (
          <p className="text-slate-500">
            Chord tones anchor melodies; scale tones connect them smoothly on weak beats.
          </p>
        )}
        {activeChord && (
          <span className="font-mono text-[11px] text-slate-500">
            Chord tones: {activeChord.noteNames.join(' · ')}
          </span>
        )}
      </div>
    </section>
  );
}
