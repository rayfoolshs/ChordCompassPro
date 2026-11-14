import { useState } from 'react';
import { ArrowRight, CheckCircle2, HelpCircle, Volume2, XCircle } from 'lucide-react';
import { THEORY_CHALLENGES, TheoryChallenge } from '../lib/challenges';
import { ProgressionSlot, resolveChord } from '../lib/theory';
import { solveVoiceLeading } from '../lib/voiceLeading';
import { audioEngine, InstrumentId } from '../lib/audio';

interface ChallengesViewProps {
  instrument: InstrumentId;
  onLoadInStudio: (challenge: TheoryChallenge, chosenTemplateId: string) => void;
}

export function ChallengesView({
  instrument,
  onLoadInStudio,
}: ChallengesViewProps) {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => new Set());

  const challenge = THEORY_CHALLENGES[challengeIdx];
  const chosenOption =
    selectedOptionIdx !== null ? challenge.options[selectedOptionIdx] : null;

  const buildPreviewSlots = (appendTemplateId?: string, inv: 0 | 1 | 2 | 3 = 0): ProgressionSlot[] => {
    const base: ProgressionSlot[] = challenge.startingSlots.map((s, idx) => ({
      ...s,
      uid: `ch-${challenge.id}-${idx}`,
    }));
    if (appendTemplateId) {
      base.push({
        uid: `ch-${challenge.id}-ans`,
        templateId: appendTemplateId,
        inversion: inv,
        beats: 4,
      });
    }
    return base;
  };

  const playPhraseWithEnding = (appendTemplateId?: string, inv: 0 | 1 | 2 | 3 = 0) => {
    const slots = buildPreviewSlots(appendTemplateId, inv);
    const { voicings } = solveVoiceLeading(
      challenge.keyId,
      challenge.mode,
      slots,
      challenge.useSevenths
    );
    audioEngine.stopAll();
    voicings.forEach((v, idx) => {
      v.midiNotes.forEach((midi, noteIdx) => {
        audioEngine.playNote(midi, 0.72, instrument, idx * 0.75 + noteIdx * 0.012);
      });
    });
  };

  const handleSelectOption = (idx: number) => {
    setSelectedOptionIdx(idx);
    const opt = challenge.options[idx];
    playPhraseWithEnding(opt.templateId, opt.inversion ?? 0);
    if (opt.isCorrect) {
      setSolvedIds((prev) => new Set(prev).add(challenge.id));
    }
  };

  const handleSelectChallenge = (idx: number) => {
    setChallengeIdx(idx);
    setSelectedOptionIdx(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Challenge Selector */}
      <aside className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h1 className="font-display text-lg font-bold text-slate-900">
            Theory &amp; Ear Challenges
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            {solvedIds.size} of {THEORY_CHALLENGES.length} completed
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {THEORY_CHALLENGES.map((ch, idx) => {
            const isActive = idx === challengeIdx;
            const isSolved = solvedIds.has(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleSelectChallenge(idx)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'border-sky-600 bg-sky-50/70'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    {ch.topic} · {ch.difficulty}
                  </span>
                  {isSolved && (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Solved</span>
                    </span>
                  )}
                </div>
                <span className="mt-1 font-display text-sm font-semibold text-slate-900">
                  {ch.title}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: Active Challenge Stage */}
      <section className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Key of {challenge.keyId} {challenge.mode === 'major' ? 'Major' : challenge.mode} · {challenge.topic}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900 text-balance">
              {challenge.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => playPhraseWithEnding()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Volume2 className="h-4 w-4 text-sky-700" aria-hidden="true" />
            <span>Hear Opening Phrase</span>
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          {challenge.prompt}
        </p>

        {/* Starting progression visual slots */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {challenge.startingSlots.map((slot, idx) => {
            const res = resolveChord(
              challenge.keyId,
              challenge.mode,
              slot.templateId,
              challenge.useSevenths,
              slot.inversion
            );
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-w-[96px]">
                  <div className="font-mono text-base font-semibold text-slate-950">
                    {res.roman}
                  </div>
                  <div className="font-display text-sm font-bold text-slate-700">
                    {res.symbol}
                  </div>
                </div>
                <span className="text-slate-300" aria-hidden="true">→</span>
              </div>
            );
          })}

          <div
            className={`rounded-xl border-2 border-dashed px-4 py-3 min-w-[110px] ${
              chosenOption
                ? chosenOption.isCorrect
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : 'border-rose-400 bg-rose-50/70'
                : 'border-sky-400 bg-sky-50/50'
            }`}
          >
            {chosenOption ? (
              (() => {
                const res = resolveChord(
                  challenge.keyId,
                  challenge.mode,
                  chosenOption.templateId,
                  challenge.useSevenths,
                  chosenOption.inversion ?? 0
                );
                return (
                  <>
                    <div className="font-mono text-base font-semibold text-slate-950">
                      {res.roman}
                    </div>
                    <div className="font-display text-sm font-bold text-slate-700">
                      {res.symbol}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 py-1.5">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                <span>Choose chord</span>
              </div>
            )}
          </div>
        </div>

        {/* Answer Options */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {challenge.options.map((opt, idx) => {
            const res = resolveChord(
              challenge.keyId,
              challenge.mode,
              opt.templateId,
              challenge.useSevenths,
              opt.inversion ?? 0
            );
            const isSelected = selectedOptionIdx === idx;
            const style = isSelected
              ? opt.isCorrect
                ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600'
                : 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70';

            return (
              <button
                key={opt.templateId}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${style}`}
              >
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-lg font-semibold text-slate-950">
                      {res.roman}
                    </span>
                    <span className="font-display text-base font-bold text-slate-800">
                      {res.symbol}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-500">
                    {res.noteNames.join(' · ')}
                  </div>
                </div>
                <Volume2 className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {/* Pedagogical Feedback */}
        {chosenOption && (
          <div
            role="status"
            className={`mt-6 rounded-xl border p-4 ${
              chosenOption.isCorrect
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                : 'border-rose-200 bg-rose-50/70 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {chosenOption.isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>Harmonic Goal Achieved</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-rose-700" aria-hidden="true" />
                  <span>Listen Closely — Try Another Harmonic Pull</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed">
              {chosenOption.feedback}
            </p>
            {chosenOption.isCorrect && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200/80 pt-3">
                <p className="text-xs font-medium text-emerald-900">
                  Key Takeaway: {challenge.takeaway}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadInStudio(challenge, chosenOption.templateId)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                  >
                    <span>Open in Studio</span>
                  </button>
                  {challengeIdx < THEORY_CHALLENGES.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleSelectChallenge(challengeIdx + 1)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span>Next Challenge</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
