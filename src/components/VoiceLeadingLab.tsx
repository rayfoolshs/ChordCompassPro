import { Volume2, Wand2 } from 'lucide-react';
import {
  KeyMode,
  ProgressionSlot,
  resolveChord,
} from '../lib/theory';
import { VoicedChord, VoiceTransition } from '../lib/voiceLeading';
import { VoiceLeadingCanvas } from './VoiceLeadingCanvas';

interface VoiceLeadingLabProps {
  keyId: string;
  mode: KeyMode;
  useSevenths: boolean;
  progression: ProgressionSlot[];
  voicings: VoicedChord[];
  transitions: VoiceTransition[];
  selectedIndex: number;
  playingIndex: number | null;
  onSelectSlot: (index: number) => void;
  onAuditionTransition: (fromIdx: number, toIdx: number) => void;
  onSmoothInversions: () => void;
}

export function VoiceLeadingLab({
  keyId,
  mode,
  useSevenths,
  progression,
  voicings,
  transitions,
  selectedIndex,
  playingIndex,
  onSelectSlot,
  onAuditionTransition,
  onSmoothInversions,
}: VoiceLeadingLabProps) {
  if (progression.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Voice Leading Lab
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Add chords in the Studio tab to analyze 4-voice SATB transitions, common tones, and bass contour.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900 text-balance">
            SATB Voice Leading &amp; Part-Writing Breakdown
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Inspect how each chord tone connects smoothly to the next. Use Auto-Smooth Bass to turn boxy root-position leaps into singing stepwise bass lines.
          </p>
        </div>

        <button
          type="button"
          onClick={onSmoothInversions}
          disabled={progression.length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Auto-Smooth Bass Inversions</span>
        </button>
      </div>

      <VoiceLeadingCanvas
        keyId={keyId}
        mode={mode}
        useSevenths={useSevenths}
        progression={progression}
        voicings={voicings}
        transitions={transitions}
        selectedIndex={selectedIndex}
        playingIndex={playingIndex}
        onSelectSlot={onSelectSlot}
      />

      {/* Transition-by-transition analytical table */}
      <section
        aria-label="Transition voice movement table"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <h2 className="font-display text-base font-semibold text-slate-900">
          Voice-by-Voice Transition Matrix
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Signed semitone shifts (+ up, − down, 0 common tone held) across Bass, Tenor, Alto, and Soprano.
        </p>

        {transitions.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            Add at least two chords to inspect transitions between them.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Progression Step</th>
                  <th className="py-2.5 px-3 font-semibold">Bass</th>
                  <th className="py-2.5 px-3 font-semibold">Tenor</th>
                  <th className="py-2.5 px-3 font-semibold">Alto</th>
                  <th className="py-2.5 px-3 font-semibold">Soprano</th>
                  <th className="py-2.5 px-3 font-semibold">Travel</th>
                  <th className="py-2.5 px-3 font-semibold">Pedagogical Note</th>
                  <th className="py-2.5 pl-3 text-right font-semibold">Hear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transitions.map((tr) => {
                  const fromSlot = progression[tr.fromIndex];
                  const toSlot = progression[tr.toIndex];
                  const fromRes = resolveChord(
                    keyId,
                    mode,
                    fromSlot.templateId,
                    useSevenths,
                    fromSlot.inversion,
                    fromSlot.forceSeventh
                  );
                  const toRes = resolveChord(
                    keyId,
                    mode,
                    toSlot.templateId,
                    useSevenths,
                    toSlot.inversion,
                    toSlot.forceSeventh
                  );
                  const fromV = voicings[tr.fromIndex];
                  const toV = voicings[tr.toIndex];

                  const formatDelta = (d: number) =>
                    d === 0 ? '0 (hold)' : `${d > 0 ? '+' : ''}${d} st`;

                  return (
                    <tr key={`${tr.fromIndex}-${tr.toIndex}`} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {fromRes.roman} ({fromRes.symbol}) → {toRes.roman} ({toRes.symbol})
                      </td>
                      {[0, 1, 2, 3].map((vIdx) => (
                        <td key={vIdx} className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                          <div className="text-slate-800">
                            {fromV.noteLabels[vIdx]} → {toV.noteLabels[vIdx]}
                          </div>
                          <div
                            className={`text-[11px] ${
                              tr.voiceDeltas[vIdx] === 0
                                ? 'text-sky-700 font-medium'
                                : Math.abs(tr.voiceDeltas[vIdx]) <= 2
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                            }`}
                          >
                            {formatDelta(tr.voiceDeltas[vIdx])}
                          </div>
                        </td>
                      ))}
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {tr.totalSemitones} st · {tr.commonToneCount} hold
                      </td>
                      <td className="py-3 px-3 text-slate-600 min-w-[200px]">
                        {tr.tendencyNotes.length > 0
                          ? tr.tendencyNotes.join(' · ')
                          : tr.bassMotionLabel}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onAuditionTransition(tr.fromIndex, tr.toIndex)}
                          aria-label={`Hear transition ${fromRes.symbol} to ${toRes.symbol}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Volume2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                          <span>Play Pair</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
