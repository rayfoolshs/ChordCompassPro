import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Play, Repeat, Square } from 'lucide-react';
import { Header, WorkspaceTab } from './components/Header';
import { ProgressionBoard } from './components/ProgressionBoard';
import { VoiceLeadingCanvas } from './components/VoiceLeadingCanvas';
import { MelodyKeyboard } from './components/MelodyKeyboard';
import { NextChordAdvisor } from './components/NextChordAdvisor';
import { VoiceLeadingLab } from './components/VoiceLeadingLab';
import { ChallengesView } from './components/ChallengesView';
import { TheoryGuideView } from './components/TheoryGuideView';
import {
  detectCadences,
  getRankedSuggestions,
  KEY_OPTIONS,
  KeyMode,
  MODE_OPTIONS,
  PROGRESSION_PRESETS,
  ProgressionPreset,
  ProgressionSlot,
  RankedSuggestion,
  resolveChord,
} from './lib/theory';
import { solveVoiceLeading, suggestSmoothInversions } from './lib/voiceLeading';
import { audioEngine, INSTRUMENT_OPTIONS, InstrumentId } from './lib/audio';
import { buildMidiBytes } from './lib/midi';
import { TheoryChallenge } from './lib/challenges';

interface SavedState {
  keyId: string;
  mode: KeyMode;
  useSevenths: boolean;
  instrument: InstrumentId;
  bpm: number;
  progression: ProgressionSlot[];
}

const STORAGE_KEY = 'chord-compass-studio-v2';

function makeUid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getDefaultSlots(): ProgressionSlot[] {
  return PROGRESSION_PRESETS[0].slots.map((s, idx) => ({
    ...s,
    uid: `init-${idx}`,
  }));
}

function loadInitialState(): SavedState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedState>;
        if (parsed && Array.isArray(parsed.progression) && parsed.keyId && parsed.mode) {
          return {
            keyId: parsed.keyId,
            mode: parsed.mode,
            useSevenths: Boolean(parsed.useSevenths),
            instrument: parsed.instrument ?? 'epiano',
            bpm: typeof parsed.bpm === 'number' ? parsed.bpm : 96,
            progression: parsed.progression,
          };
        }
      }
    } catch {
      // Ignore malformed localStorage
    }
  }
  return {
    keyId: 'C',
    mode: 'major',
    useSevenths: false,
    instrument: 'epiano',
    bpm: 96,
    progression: getDefaultSlots(),
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');
  const [keyId, setKeyId] = useState<string>(initial.keyId);
  const [mode, setMode] = useState<KeyMode>(initial.mode);
  const [useSevenths, setUseSevenths] = useState<boolean>(initial.useSevenths);
  const [instrument, setInstrument] = useState<InstrumentId>(initial.instrument);
  const [bpm, setBpm] = useState<number>(initial.bpm);
  const [progression, setProgression] = useState<ProgressionSlot[]>(initial.progression);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [copiedChart, setCopiedChart] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const playbackRef = useRef<{
    active: boolean;
    loop: boolean;
    bpm: number;
    instrument: InstrumentId;
  }>({
    active: false,
    loop: true,
    bpm,
    instrument,
  });

  playbackRef.current.loop = isLooping;
  playbackRef.current.bpm = bpm;
  playbackRef.current.instrument = instrument;

  // Persist user workbench state
  useEffect(() => {
    try {
      const payload: SavedState = {
        keyId,
        mode,
        useSevenths,
        instrument,
        bpm,
        progression,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [keyId, mode, useSevenths, instrument, bpm, progression]);

  // Derived harmonic analysis
  const { voicings, transitions } = useMemo(
    () => solveVoiceLeading(keyId, mode, progression, useSevenths),
    [keyId, mode, progression, useSevenths]
  );

  const cadences = useMemo(
    () => detectCadences(mode, progression),
    [mode, progression]
  );

  const suggestions = useMemo(
    () => getRankedSuggestions(keyId, mode, progression, useSevenths),
    [keyId, mode, progression, useSevenths]
  );

  const clampedSelectedIndex =
    progression.length === 0 ? -1 : Math.min(selectedIndex, progression.length - 1);

  const activeIndex = playingIndex !== null ? playingIndex : clampedSelectedIndex;

  const activeChord = useMemo(() => {
    if (activeIndex < 0 || activeIndex >= progression.length) return null;
    const slot = progression[activeIndex];
    return resolveChord(
      keyId,
      mode,
      slot.templateId,
      useSevenths,
      slot.inversion,
      slot.forceSeventh
    );
  }, [activeIndex, progression, keyId, mode, useSevenths]);

  const activeVoicing =
    activeIndex >= 0 && activeIndex < voicings.length ? voicings[activeIndex] : null;

  const lastChord = useMemo(() => {
    if (progression.length === 0) return null;
    const slot = progression[progression.length - 1];
    return resolveChord(
      keyId,
      mode,
      slot.templateId,
      useSevenths,
      slot.inversion,
      slot.forceSeventh
    );
  }, [progression, keyId, mode, useSevenths]);

  const stopPlayback = useCallback(() => {
    playbackRef.current.active = false;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    audioEngine.stopAll();
    setIsPlaying(false);
    setPlayingIndex(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const scheduleStep = useCallback(
    (stepIdx: number, snapshotSlots: ProgressionSlot[], snapshotVoicings: typeof voicings) => {
      if (!playbackRef.current.active || snapshotSlots.length === 0) {
        stopPlayback();
        return;
      }
      if (stepIdx >= snapshotSlots.length) {
        if (playbackRef.current.loop) {
          scheduleStep(0, snapshotSlots, snapshotVoicings);
        } else {
          stopPlayback();
        }
        return;
      }

      setPlayingIndex(stepIdx);
      const slot = snapshotSlots[stepIdx];
      const voicing = snapshotVoicings[stepIdx];
      const secPerBeat = 60 / playbackRef.current.bpm;
      const durationSec = slot.beats * secPerBeat;

      if (voicing) {
        audioEngine.playChord(
          voicing.midiNotes,
          Math.max(0.45, durationSec * 0.94),
          playbackRef.current.instrument
        );
      }

      timerRef.current = window.setTimeout(() => {
        scheduleStep(stepIdx + 1, snapshotSlots, snapshotVoicings);
      }, durationSec * 1000);
    },
    [stopPlayback]
  );

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (progression.length === 0) return;
    playbackRef.current.active = true;
    setIsPlaying(true);
    scheduleStep(0, progression, voicings);
  };

  const handleAuditionSlot = (index: number) => {
    const v = voicings[index];
    if (!v) return;
    audioEngine.playChord(v.midiNotes, 1.15, instrument);
  };

  const handleAuditionTransition = (fromIdx: number, toIdx: number) => {
    const v1 = voicings[fromIdx];
    const v2 = voicings[toIdx];
    if (!v1 || !v2) return;
    audioEngine.playComparison(v1.midiNotes, v2.midiNotes, instrument);
  };

  const handlePreviewSuggestion = (suggestion: RankedSuggestion) => {
    const previewSlots: ProgressionSlot[] = [];
    if (progression.length > 0) {
      previewSlots.push(progression[progression.length - 1]);
    }
    previewSlots.push({
      uid: 'preview-next',
      templateId: suggestion.template.id,
      inversion: 0,
      beats: 4,
    });
    const { voicings: previewVoicings } = solveVoiceLeading(
      keyId,
      mode,
      previewSlots,
      useSevenths
    );
    if (previewVoicings.length === 2) {
      audioEngine.playComparison(
        previewVoicings[0].midiNotes,
        previewVoicings[1].midiNotes,
        instrument
      );
    } else if (previewVoicings.length === 1) {
      audioEngine.playChord(previewVoicings[0].midiNotes, 1.1, instrument);
    }
  };

  const handleAddChord = (templateId: string) => {
    stopPlayback();
    const newSlot: ProgressionSlot = {
      uid: makeUid(),
      templateId,
      inversion: 0,
      beats: 4,
    };
    const nextProg = [...progression, newSlot];
    setProgression(nextProg);
    setSelectedIndex(nextProg.length - 1);

    const { voicings: nextVoicings } = solveVoiceLeading(
      keyId,
      mode,
      nextProg,
      useSevenths
    );
    const addedVoicing = nextVoicings[nextVoicings.length - 1];
    if (addedVoicing) {
      audioEngine.playChord(addedVoicing.midiNotes, 1.0, instrument);
    }
  };

  const handleUpdateInversion = (index: number, inversion: 0 | 1 | 2 | 3) => {
    stopPlayback();
    setProgression((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, inversion } : slot))
    );
  };

  const handleToggleBeats = (index: number) => {
    stopPlayback();
    setProgression((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, beats: slot.beats === 4 ? 2 : 4 } : slot
      )
    );
  };

  const handleMoveSlot = (index: number, direction: -1 | 1) => {
    stopPlayback();
    const target = index + direction;
    if (target < 0 || target >= progression.length) return;
    const next = [...progression];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setProgression(next);
    setSelectedIndex(target);
  };

  const handleRemoveSlot = (index: number) => {
    stopPlayback();
    setProgression((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((prev) => Math.max(0, Math.min(prev, progression.length - 2)));
  };

  const handleClearProgression = () => {
    stopPlayback();
    setProgression([]);
    setSelectedIndex(0);
  };

  const handleLoadPreset = (preset: ProgressionPreset) => {
    stopPlayback();
    setMode(preset.mode);
    setUseSevenths(preset.useSevenths);
    setBpm(preset.bpm);
    setProgression(
      preset.slots.map((s) => ({
        ...s,
        uid: makeUid(),
      }))
    );
    setSelectedIndex(0);
  };

  const handleSmoothInversions = () => {
    stopPlayback();
    setProgression((prev) => suggestSmoothInversions(keyId, mode, prev, useSevenths));
  };

  const handleModeChange = (nextMode: KeyMode) => {
    stopPlayback();
    setMode(nextMode);
    // Keep progression compatible by remapping I/i if switching between major and minor families
    setProgression((prev) =>
      prev.map((slot) => {
        if (nextMode === 'major' || nextMode === 'mixolydian') {
          if (slot.templateId === 'i') return { ...slot, templateId: 'I' };
          if (slot.templateId === 'iv') return { ...slot, templateId: 'IV' };
          if (slot.templateId === 'iio') return { ...slot, templateId: 'ii' };
          if (slot.templateId === 'v') return { ...slot, templateId: 'V' };
        } else {
          if (slot.templateId === 'I') return { ...slot, templateId: 'i' };
          if (slot.templateId === 'IV' && nextMode !== 'dorian') return { ...slot, templateId: 'iv' };
          if (slot.templateId === 'ii' && (nextMode === 'minor' || nextMode === 'harmonicMinor')) {
            return { ...slot, templateId: 'iio' };
          }
        }
        return slot;
      })
    );
  };

  const handleExportMidi = () => {
    if (progression.length === 0) return;
    const bytes = buildMidiBytes(progression, voicings, bpm);
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chord-compass-${keyId}-${mode}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyChart = async () => {
    if (progression.length === 0) return;
    const resolved = progression.map((s) =>
      resolveChord(keyId, mode, s.templateId, useSevenths, s.inversion, s.forceSeventh)
    );
    const romans = resolved.map((r) => r.roman).join('  |  ');
    const symbols = resolved.map((r) => r.symbol).join('  |  ');
    const text = `Key: ${keyId} ${mode} (${bpm} BPM)\nRoman: ${romans}\nChords: ${symbols}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChart(true);
      window.setTimeout(() => setCopiedChart(false), 1800);
    } catch {
      // Clipboard blocked in headless browser; ignore silently
    }
  };

  const handleLoadChallengeInStudio = (
    challenge: TheoryChallenge,
    chosenTemplateId: string
  ) => {
    stopPlayback();
    setKeyId(challenge.keyId);
    setMode(challenge.mode);
    setUseSevenths(challenge.useSevenths);
    const slots: ProgressionSlot[] = [
      ...challenge.startingSlots.map((s) => ({ ...s, uid: makeUid() })),
      { uid: makeUid(), templateId: chosenTemplateId, inversion: 0, beats: 4 },
    ];
    setProgression(slots);
    setSelectedIndex(slots.length - 1);
    setActiveTab('studio');
  };

  const handleSelectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onExportMidi={handleExportMidi}
        canExport={progression.length > 0}
      />

      {/* Workspace Control Bar (only on progression workbench tabs) */}
      {(activeTab === 'studio' || activeTab === 'voice-leading') && (
      <section
        aria-label="Key, playback, and instrument controls"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left: Harmony Settings */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="key-select" className="text-xs font-medium text-slate-600">
                Key
              </label>
              <select
                id="key-select"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-display text-xs font-semibold text-slate-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                {KEY_OPTIONS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="mode-select" className="text-xs font-medium text-slate-600">
                Mode
              </label>
              <select
                id="mode-select"
                value={mode}
                onChange={(e) => handleModeChange(e.target.value as KeyMode)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                {MODE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Triads vs 7th Chords */}
            <div
              className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
              role="group"
              aria-label="Chord extension level"
            >
              <button
                type="button"
                onClick={() => setUseSevenths(false)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  !useSevenths
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Triads
              </button>
              <button
                type="button"
                onClick={() => setUseSevenths(true)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  useSevenths
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7th Chords
              </button>
            </div>
          </div>

          {/* Right: Audio & Transport Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="instrument-select" className="text-xs font-medium text-slate-600">
                Sound
              </label>
              <select
                id="instrument-select"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as InstrumentId)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                {INSTRUMENT_OPTIONS.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="tempo-slider"
                className="font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap"
              >
                Tempo: {bpm} BPM
              </label>
              <input
                id="tempo-slider"
                type="range"
                min={60}
                max={160}
                step={2}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 accent-sky-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePlayToggle}
                disabled={progression.length === 0}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  isPlaying
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-sky-700 hover:bg-sky-800'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    <span>Play Phrase</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLooping((prev) => !prev)}
                aria-pressed={isLooping}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isLooping
                    ? 'border-sky-300 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Loop</span>
              </button>

              <button
                type="button"
                onClick={handleCopyChart}
                disabled={progression.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {copiedChart ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    <span>Copy Chart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Primary Interactive Stage (~66%) */}
            <div className="xl:col-span-8 space-y-5 min-w-0">
              <ProgressionBoard
                keyId={keyId}
                mode={mode}
                useSevenths={useSevenths}
                progression={progression}
                voicings={voicings}
                cadences={cadences}
                selectedIndex={clampedSelectedIndex}
                playingIndex={playingIndex}
                onSelectSlot={setSelectedIndex}
                onAuditionSlot={handleAuditionSlot}
                onUpdateInversion={handleUpdateInversion}
                onToggleBeats={handleToggleBeats}
                onMoveSlot={handleMoveSlot}
                onRemoveSlot={handleRemoveSlot}
                onClearProgression={handleClearProgression}
                onLoadPreset={handleLoadPreset}
                onSmoothInversions={handleSmoothInversions}
              />

              <VoiceLeadingCanvas
                keyId={keyId}
                mode={mode}
                useSevenths={useSevenths}
                progression={progression}
                voicings={voicings}
                transitions={transitions}
                selectedIndex={clampedSelectedIndex}
                playingIndex={playingIndex}
                onSelectSlot={setSelectedIndex}
              />

              <MelodyKeyboard
                keyId={keyId}
                mode={mode}
                activeChord={activeChord}
                activeVoicing={activeVoicing}
                onPlayNote={(midi) => audioEngine.playNote(midi, 0.85, instrument)}
              />
            </div>

            {/* Right Control & Advisor Deck (~34%) */}
            <div className="xl:col-span-4 space-y-5 min-w-0">
              <NextChordAdvisor
                lastChord={lastChord}
                suggestions={suggestions}
                onPreviewTransition={handlePreviewSuggestion}
                onAddChord={handleAddChord}
              />
            </div>
          </div>
        )}

        {activeTab === 'voice-leading' && (
          <VoiceLeadingLab
            keyId={keyId}
            mode={mode}
            useSevenths={useSevenths}
            progression={progression}
            voicings={voicings}
            transitions={transitions}
            selectedIndex={clampedSelectedIndex}
            playingIndex={playingIndex}
            onSelectSlot={setSelectedIndex}
            onAuditionTransition={handleAuditionTransition}
            onSmoothInversions={handleSmoothInversions}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesView
            instrument={instrument}
            onLoadInStudio={handleLoadChallengeInStudio}
          />
        )}

        {activeTab === 'guide' && (
          <TheoryGuideView keyId={keyId} instrument={instrument} />
        )}
      </main>
    </div>
  );
}
