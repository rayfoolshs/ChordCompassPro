import {
  ArrowLeft,
  ArrowRight,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  Wand2,
} from 'lucide-react';
import {
  CadenceEvent,
  HarmonicFunction,
  KeyMode,
  ProgressionPreset,
  ProgressionSlot,
  PROGRESSION_PRESETS,
  ResolvedChord,
  resolveChord,
} from '../lib/theory';
import { VoicedChord } from '../lib/voiceLeading';

interface ProgressionBoardProps {
  keyId: string;
  mode: KeyMode;
  useSevenths: boolean;
  progression: ProgressionSlot[];
  voicings: VoicedChord[];
  cadences: CadenceEvent[];
  selectedIndex: number;
  playingIndex: number | null;
  onSelectSlot: (index: number) => void;
  onAuditionSlot: (index: number) => void;
  onUpdateInversion: (index: number, inversion: 0 | 1 | 2 | 3) => void;
  onToggleBeats: (index: number) => void;
  onMoveSlot: (index: number, direction: -1 | 1) => void;
  onRemoveSlot: (index: number) => void;
  onClearProgression: () => void;
  onLoadPreset: (preset: ProgressionPreset) => void;
  onSmoothInversions: () => void;
}

export function getFunctionMeta(func: HarmonicFunction): {
  label: string;
  cardBg: string;
  cardBorder: string;
  selectedRing: string;
  textAccent: string;
} {
  switch (func) {
    case 'tonic':
      return {
        label: 'T · Tonic',
        cardBg: 'bg-sky-50/55',
        cardBorder: 'border-sky-200',
        selectedRing: 'ring-2 ring-sky-600 border-sky-600 bg-sky-50/90',
        textAccent: 'text-sky-800',
      };
    case 'subdominant':
      return {
        label: 'S · Pre-dominant',
        cardBg: 'bg-amber-50/55',
        cardBorder: 'border-amber-200',
        selectedRing: 'ring-2 ring-amber-600 border-amber-600 bg-amber-50/90',
        textAccent: 'text-amber-800',
      };
    case 'dominant':
      return {
        label: 'D · Dominant',
        cardBg: 'bg-rose-50/55',
        cardBorder: 'border-rose-200',
        selectedRing: 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/90',
        textAccent: 'text-rose-800',
      };
    case 'chromatic':
      return {
        label: 'C · Chromatic',
        cardBg: 'bg-violet-50/55',
        cardBorder: 'border-violet-200',
        selectedRing: 'ring-2 ring-violet-600 border-violet-600 bg-violet-50/90',
        textAccent: 'text-violet-800',
      };
  }
}

export function ProgressionBoard({
  keyId,
  mode,
  useSevenths,
  progression,
  voicings,
  cadences,
  selectedIndex,
  playingIndex,
  onSelectSlot,
  onAuditionSlot,
  onUpdateInversion,
  onToggleBeats,
  onMoveSlot,
  onRemoveSlot,
  onClearProgression,
  onLoadPreset,
  onSmoothInversions,
}: ProgressionBoardProps) {
  const resolvedList: ResolvedChord[] = progression.map((slot) =>
    resolveChord(keyId, mode, slot.templateId, useSevenths, slot.inversion, slot.forceSeventh)
  );

  const totalBeats = progression.reduce((acc, s) => acc + s.beats, 0);

  return (
    <section
      aria-label="Chord progression board"
      className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Progression Phrase
          </h2>
          <p className="text-xs text-slate-500 tabular-nums mt-0.5">
            {progression.length} {progression.length === 1 ? 'chord' : 'chords'} · {totalBeats} beats · Click any chord to inspect melody &amp; voicing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 min-w-0 basis-full sm:basis-auto">
            <label htmlFor="preset-select" className="text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
              Preset:
            </label>
            <select
              id="preset-select"
              defaultValue=""
              onChange={(e) => {
                const found = PROGRESSION_PRESETS.find((p) => p.id === e.target.value);
                if (found) onLoadPreset(found);
                e.currentTarget.value = '';
              }}
              className="min-w-0 w-full sm:w-auto max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-600 cursor-pointer truncate"
            >
              <option value="" disabled>
                Load phrase template…
              </option>
              {PROGRESSION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.genre})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onSmoothInversions}
            disabled={progression.length < 3}
            title="Optimize interior chord inversions for stepwise bass voice leading"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
            <span>Auto-Smooth Bass</span>
          </button>

          <button
            type="button"
            onClick={onClearProgression}
            disabled={progression.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {progression.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center mt-4">
          <p className="font-display text-sm font-semibold text-slate-900">
            Your phrase canvas is empty
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Pick an opening chord from the Next-Chord Advisor on the right, or start from a classic harmonic template.
          </p>
          <button
            type="button"
            onClick={() => onLoadPreset(PROGRESSION_PRESETS[0])}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load Classic Phrase (I – ii⁶ – V – I)</span>
          </button>
        </div>
      ) : (
        <div
          data-testid="progression-slots"
          className="mt-4 flex items-stretch gap-2.5 overflow-x-auto pb-2 progression-scroll"
        >
          {progression.map((slot, index) => {
            const resolved = resolvedList[index];
            const meta = getFunctionMeta(resolved.template.func);
            const isSelected = index === selectedIndex;
            const isPlaying = index === playingIndex;
            const voicing = voicings[index];
            const cadenceAfter = cadences.find((c) => c.afterIndex === index);
            const maxInv = resolved.pitchClasses.length - 1;

            return (
              <div key={slot.uid} className="flex items-stretch gap-2 shrink-0">
                <div
                  className={`flex w-[174px] flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 ${
                    isPlaying
                      ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/60'
                      : isSelected
                        ? meta.selectedRing
                        : `${meta.cardBorder} ${meta.cardBg} hover:border-slate-300`
                  }`}
                >
                  {/* Top row: slot index + function label + remove */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-semibold tracking-tight ${meta.textAccent}`}>
                      {meta.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveSlot(index)}
                      aria-label={`Remove chord ${index + 1} (${resolved.symbol})`}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-white/80 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Main clickable chord body */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSlot(index);
                      onAuditionSlot(index);
                    }}
                    aria-label={`Select and hear chord ${index + 1}: ${resolved.roman}, ${resolved.symbol}`}
                    aria-pressed={isSelected}
                    className="my-2.5 flex flex-col items-start text-left rounded-lg p-1 -mx-1 transition-colors hover:bg-white/60 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600"
                  >
                    <div className="flex w-full items-baseline justify-between gap-2">
                      <span className="font-mono text-xl font-semibold text-slate-950 tracking-tight">
                        {resolved.roman}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        <Volume2 className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        <span className="font-mono tabular-nums">#{index + 1}</span>
                      </span>
                    </div>
                    <span className="font-display text-lg font-bold text-slate-800 mt-0.5">
                      {resolved.symbol}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 mt-1 truncate w-full">
                      {voicing ? voicing.noteLabels.join(' · ') : resolved.noteNames.join(' · ')}
                    </span>
                  </button>

                  {/* Bottom controls: Inversion + Beats + Reorder */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-900/10">
                    <div className="flex items-center gap-1">
                      <label htmlFor={`inv-${slot.uid}`} className="sr-only">
                        Inversion for chord {index + 1}
                      </label>
                      <select
                        id={`inv-${slot.uid}`}
                        value={slot.inversion > maxInv ? 0 : slot.inversion}
                        onChange={(e) =>
                          onUpdateInversion(index, Number(e.target.value) as 0 | 1 | 2 | 3)
                        }
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        <option value={0}>Root</option>
                        <option value={1}>1st inv</option>
                        <option value={2}>2nd inv</option>
                        {maxInv >= 3 && <option value={3}>3rd inv</option>}
                      </select>

                      <button
                        type="button"
                        onClick={() => onToggleBeats(index)}
                        aria-label={`Duration ${slot.beats} beats for chord ${index + 1}, click to toggle`}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 tabular-nums hover:bg-slate-50 cursor-pointer"
                      >
                        {slot.beats}b
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onMoveSlot(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move chord ${index + 1} left`}
                        className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveSlot(index, 1)}
                        disabled={index === progression.length - 1}
                        aria-label={`Move chord ${index + 1} right`}
                        className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Cadence Connector between chords */}
                {index < progression.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-0.5 shrink-0">
                    {cadenceAfter ? (
                      <div
                        title={cadenceAfter.explanation}
                        className="flex flex-col items-center text-center max-w-[68px]"
                      >
                        <span className="font-mono text-[10px] font-semibold text-sky-800">
                          {cadenceAfter.type}
                        </span>
                        <span className="my-0.5 h-px w-5 bg-sky-300" aria-hidden="true" />
                        <span className="text-[10px] leading-tight text-slate-500">
                          {cadenceAfter.type === 'SEC' ? 'Tonicize' : 'Cadence'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs" aria-hidden="true">
                        →
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cadence summary line when cadences are detected */}
      {cadences.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {cadences.map((cad) => (
            <div key={`${cad.afterIndex}-${cad.type}`} className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-sky-800">{cad.label}</span>
              <span className="text-slate-400">·</span>
              <span>{cad.explanation}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
