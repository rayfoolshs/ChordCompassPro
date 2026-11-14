import { useState } from 'react';
import {
  findTemplate,
  KeyMode,
  ProgressionSlot,
  resolveChord,
} from '../lib/theory';
import { VoicedChord, VoiceTransition } from '../lib/voiceLeading';

interface VoiceLeadingCanvasProps {
  keyId: string;
  mode: KeyMode;
  useSevenths: boolean;
  progression: ProgressionSlot[];
  voicings: VoicedChord[];
  transitions: VoiceTransition[];
  selectedIndex: number;
  playingIndex: number | null;
  onSelectSlot: (index: number) => void;
}

const VOICE_COLORS = ['#0F172A', '#0369A1', '#B45309', '#BE123C']; // Bass, Tenor, Alto, Soprano
const VOICE_NAMES = ['Bass', 'Tenor', 'Alto', 'Soprano'];

export function VoiceLeadingCanvas({
  keyId,
  mode,
  useSevenths,
  progression,
  voicings,
  transitions,
  selectedIndex,
  playingIndex,
  onSelectSlot,
}: VoiceLeadingCanvasProps) {
  const [layerMode, setLayerMode] = useState<'both' | 'voices' | 'tension'>('both');

  if (progression.length === 0 || voicings.length === 0) {
    return null;
  }

  const width = Math.max(680, progression.length * 168);
  const height = 198;
  const padX = 76;
  const padTop = 26;
  const padBottom = 28;
  const usableW = width - padX * 2;
  const usableH = height - padTop - padBottom;

  const allMidi = voicings.flatMap((v) => v.midiNotes);
  const minMidi = Math.min(...allMidi) - 3;
  const maxMidi = Math.max(...allMidi) + 3;
  const span = Math.max(18, maxMidi - minMidi);

  const getX = (idx: number) =>
    progression.length === 1
      ? width / 2
      : padX + (idx / (progression.length - 1)) * usableW;

  const getYForMidi = (midi: number) =>
    padTop + ((maxMidi - midi) / span) * usableH;

  const getYForTension = (tension: number) =>
    padTop + (1 - tension) * usableH;

  const tensionPoints = progression.map((slot, idx) => {
    const tpl = findTemplate(mode, slot.templateId);
    return {
      x: getX(idx),
      y: getYForTension(tpl.tension),
      tension: tpl.tension,
    };
  });

  const tensionPath = tensionPoints
    .map((pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = tensionPoints[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    })
    .join(' ');

  const activeTransition =
    selectedIndex > 0 ? transitions[selectedIndex - 1] : transitions[0];

  const totalTravel = transitions.reduce((sum, t) => sum + t.totalSemitones, 0);
  const totalCommonTones = transitions.reduce((sum, t) => sum + t.commonToneCount, 0);

  return (
    <section
      aria-label="Voice leading and harmonic tension visualizer"
      className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Voice Leading &amp; Harmonic Tension Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Total upper-voice travel: <strong className="font-mono text-slate-800">{totalTravel} st</strong>
            <span aria-hidden="true"> · </span>
            Common tones held: <strong className="font-mono text-slate-800">{totalCommonTones}</strong>
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Diagram layer">
          {(
            [
              { id: 'both', label: 'Combined' },
              { id: 'voices', label: '4-Voice SATB' },
              { id: 'tension', label: 'Tension Arc' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLayerMode(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                layerMode === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="mt-3 overflow-x-auto">
        <svg
          data-testid="voice-leading-svg"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[600px] h-[198px] select-none"
          role="img"
          aria-label="Four-voice SATB pitch trajectories and harmonic tension curve"
        >
          {/* Subtle staff / register reference grid */}
          {[0.2, 0.45, 0.7, 0.9].map((ratio, idx) => {
            const y = padTop + ratio * usableH;
            return (
              <line
                key={idx}
                x1={24}
                x2={width - 24}
                y1={y}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth={1}
                strokeDasharray={idx === 2 ? '3 3' : undefined}
              />
            );
          })}

          {/* Harmonic Tension Curve */}
          {(layerMode === 'both' || layerMode === 'tension') && tensionPoints.length > 1 && (
            <g>
              <path
                d={tensionPath}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth={3}
                strokeDasharray="6 4"
              />
              {tensionPoints.map((pt, idx) => (
                <circle
                  key={`ten-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={4}
                  fill="#F8FAFC"
                  stroke="#64748B"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}

          {/* Voice Leading Lines */}
          {(layerMode === 'both' || layerMode === 'voices') && (
            <g>
              {[0, 1, 2, 3].map((voiceIdx) => {
                const points = voicings.map((v, slotIdx) => ({
                  x: getX(slotIdx),
                  y: getYForMidi(v.midiNotes[voiceIdx]),
                  label: v.noteLabels[voiceIdx],
                  midi: v.midiNotes[voiceIdx],
                }));

                return (
                  <g key={`voice-${voiceIdx}`}>
                    {points.map((pt, slotIdx) => {
                      if (slotIdx === 0) return null;
                      const prev = points[slotIdx - 1];
                      const isCommonTone = prev.midi === pt.midi;
                      const isHalfStep = Math.abs(pt.midi - prev.midi) === 1;
                      return (
                        <line
                          key={`seg-${voiceIdx}-${slotIdx}`}
                          x1={prev.x}
                          y1={prev.y}
                          x2={pt.x}
                          y2={pt.y}
                          stroke={VOICE_COLORS[voiceIdx]}
                          strokeWidth={isCommonTone ? 2.5 : isHalfStep ? 2.2 : 1.75}
                          strokeOpacity={isCommonTone ? 0.9 : 0.72}
                        />
                      );
                    })}

                    {points.map((pt, slotIdx) => {
                      const isActive = slotIdx === selectedIndex || slotIdx === playingIndex;
                      const chordNotes = voicings[slotIdx].midiNotes;
                      const closeAbove =
                        voiceIdx < 3 && chordNotes[voiceIdx + 1] - pt.midi <= 2;
                      const closeBelow =
                        voiceIdx > 0 && pt.midi - chordNotes[voiceIdx - 1] <= 2;
                      const labelDy = closeAbove && !closeBelow ? 4 : closeBelow && !closeAbove ? -2 : 3;

                      return (
                        <g
                          key={`node-${voiceIdx}-${slotIdx}`}
                          onClick={() => onSelectSlot(slotIdx)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isActive ? 5.2 : 4}
                            fill={isActive ? VOICE_COLORS[voiceIdx] : '#FFFFFF'}
                            stroke={VOICE_COLORS[voiceIdx]}
                            strokeWidth={2}
                          />
                          {(isActive || progression.length <= 6) && (
                            <text
                              x={pt.x + 9}
                              y={pt.y + labelDy}
                              style={{
                                paintOrder: 'stroke',
                                stroke: '#FFFFFF',
                                strokeWidth: 3.5,
                                strokeLinejoin: 'round',
                              }}
                              className="fill-slate-700 font-mono text-[10px] font-medium"
                            >
                              {pt.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          )}

          {/* Bottom Chord Column Labels */}
          {progression.map((slot, idx) => {
            const x = getX(idx);
            const resolved = resolveChord(
              keyId,
              mode,
              slot.templateId,
              useSevenths,
              slot.inversion,
              slot.forceSeventh
            );
            const isSelected = idx === selectedIndex;
            const isPlaying = idx === playingIndex;
            const tr = idx > 0 ? transitions[idx - 1] : null;
            return (
              <g key={`lbl-${slot.uid}`} onClick={() => onSelectSlot(idx)} className="cursor-pointer">
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`font-mono text-xs font-semibold ${
                    isPlaying
                      ? 'fill-emerald-700'
                      : isSelected
                        ? 'fill-sky-700'
                        : 'fill-slate-700'
                  }`}
                >
                  {resolved.roman} ({resolved.symbol})
                </text>
                {tr && (
                  <text
                    x={(getX(idx - 1) + x) / 2}
                    y={16}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {tr.totalSemitones} st · {tr.commonToneCount} hold
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Voice Legend + Active Transition Readout */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          {VOICE_NAMES.map((name, i) => (
            <span key={name} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-4 rounded-xs"
                style={{ backgroundColor: VOICE_COLORS[i] }}
                aria-hidden="true"
              />
              <span>{name}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-400" aria-hidden="true" />
            <span>Harmonic Tension</span>
          </span>
        </div>

        {activeTransition && (
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{activeTransition.bassMotionLabel}</span>
            {activeTransition.tendencyNotes.length > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{activeTransition.tendencyNotes[0]}</span>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
