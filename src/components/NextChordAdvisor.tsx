import { useState } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import {
  ChordCategory,
  RankedSuggestion,
  ResolvedChord,
} from '../lib/theory';
import { getFunctionMeta } from './ProgressionBoard';

interface NextChordAdvisorProps {
  lastChord: ResolvedChord | null;
  suggestions: RankedSuggestion[];
  onPreviewTransition: (suggestion: RankedSuggestion) => void;
  onAddChord: (templateId: string) => void;
}

type FilterCategory = 'all' | ChordCategory;

export function NextChordAdvisor({
  lastChord,
  suggestions,
  onPreviewTransition,
  onAddChord,
}: NextChordAdvisorProps) {
  const [category, setCategory] = useState<FilterCategory>('all');

  const filtered = suggestions.filter((s) => {
    if (category === 'all') return true;
    return s.template.category === category;
  });

  return (
    <aside
      aria-label="Ranked next-chord advisor"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="pb-3 border-b border-slate-100">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Next-Chord Advisor
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {lastChord
            ? `Ranked continuations after ${lastChord.roman} (${lastChord.symbol})`
            : 'Recommended opening chords for your phrase'}
        </p>

        {/* Interactive category segmented filter */}
        <div
          className="mt-3 flex items-center gap-1 rounded-lg bg-slate-100 p-1 overflow-x-auto"
          role="group"
          aria-label="Filter chord palette"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'diatonic', label: 'Diatonic' },
              { id: 'secondary', label: 'Secondary V/' },
              { id: 'mixture', label: 'Mixture' },
              { id: 'tritone', label: 'Tritone' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion list */}
      <div className="mt-3 flex flex-col gap-2.5 max-h-[680px] overflow-y-auto pr-0.5">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No chords in this category for the current mode.
          </p>
        ) : (
          filtered.map((item, idx) => {
            const meta = getFunctionMeta(item.template.func);
            return (
              <div
                key={item.template.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:border-slate-300 hover:bg-white"
              >
                {/* Unboxed metadata header */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className={`font-semibold ${meta.textAccent}`}>
                    {meta.label}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    #{idx + 1} · {item.score}% harmonic fit
                  </span>
                </div>

                {/* Primary chord identity + actions */}
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="font-mono text-lg font-semibold text-slate-950">
                      {item.resolved.roman}
                    </span>
                    <span className="font-display text-base font-bold text-slate-800">
                      {item.resolved.symbol}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 truncate">
                      {item.resolved.noteNames.join(' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPreviewTransition(item)}
                      aria-label={`Hear transition into ${item.resolved.symbol}`}
                      title={
                        lastChord
                          ? `Hear ${lastChord.symbol} → ${item.resolved.symbol}`
                          : `Hear ${item.resolved.symbol}`
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      <span>Hear</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddChord(item.template.id)}
                      aria-label={`Add ${item.resolved.roman} (${item.resolved.symbol}) to progression`}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Plain-language theory reason */}
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {item.reason}
                </p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
