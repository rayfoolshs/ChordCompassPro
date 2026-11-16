import { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import manualPdf from '../assets/Chord-Compass-Pro-User-Manual.pdf';

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; head: string[]; rows: TableRow[] };

interface TableRow {
  cells: string[];
  swatch?: string;
}

interface Chapter {
  id: string;
  number: string;
  title: string;
  blocks: Block[];
}

const CHAPTERS: Chapter[] = [
  {
    id: 'chapter-00',
    number: '00',
    title: 'Contents & Quick-Start Guide',
    blocks: [
      {
        kind: 'p',
        text: 'Sixty seconds from an empty phrase to an exported file. The contents list on the left mirrors the chapters of the printed manual; each chapter maps onto one area of the app.',
      },
      { kind: 'h', text: '60-Second Quick-Start Workflow' },
      {
        kind: 'ol',
        items: [
          'Set Your Key & Mode — Choose from 12 chromatic keys and 5 modes (Major, Natural Minor, Harmonic Minor, Dorian, Mixolydian) in the top workbench bar.',
          'Choose Chord Density — Toggle between Triads and 7th Chords. Individual slots can also toggle inversions (Root, 1st, 2nd, 3rd) and 2- or 4-beat lengths.',
          'Audition & Arrange — Click Play Phrase (60–160 BPM) with Loop enabled, or load any of the 6 curated Presets from the Progression Phrase header.',
          'Consult the Advisor — Filter suggestions (All, Diatonic, Secondary V/, Mixture, Tritone), click Preview to hear the 2-chord move, then + Add.',
          'Smooth & Export — Click Auto-Smooth Bass Inversions for stepwise bass lines, then click Export MIDI in the top bar to download a .mid file.',
        ],
      },
    ],
  },
  {
    id: 'chapter-01',
    number: '01',
    title: 'Interface Architecture & Global Controls',
    blocks: [
      {
        kind: 'p',
        text: 'Chord Compass Pro separates workspace navigation (top bar) from musical configuration (global workbench toolbar), keeping key, mode, timbre, and playback transport immediately accessible above your progression.',
      },
      { kind: 'h', text: 'Supported Keys & Five Modal Palettes' },
      {
        kind: 'p',
        text: 'All 12 pitch classes are supported with automatic enharmonic flat/sharp spelling (C, D♭/C♯, D, E♭, E, F, F♯/G♭, G, A♭, A, B♭, B). Switching modes recalculates every diatonic chord, Roman numeral, cadence rule, and Melody Keyboard scale highlight.',
      },
      {
        kind: 'table',
        head: ['Mode', 'Semitone Intervals', 'Diatonic Triads'],
        rows: [
          { cells: ['Major (Ionian)', '0 · 2 · 4 · 5 · 7 · 9 · 11', 'I · ii · iii · IV · V · vi · vii°'] },
          { cells: ['Natural Minor (Aeolian)', '0 · 2 · 3 · 5 · 7 · 8 · 10', 'i · ii° · III · iv · v · VI · VII'] },
          { cells: ['Harmonic Minor', '0 · 2 · 3 · 5 · 7 · 8 · 11', 'i · ii° · III⁺ · iv · V · VI · vii°'] },
          { cells: ['Dorian Mode', '0 · 2 · 3 · 5 · 7 · 9 · 10', 'i · ii · III · IV · v · vi° · VII'] },
          { cells: ['Mixolydian Mode', '0 · 2 · 4 · 5 · 7 · 9 · 10', 'I · ii · iii° · IV · v · vi · VII'] },
        ],
      },
      { kind: 'h', text: 'Built-in Web Audio Synth & Transport Controls' },
      {
        kind: 'table',
        head: ['Timbre', 'Acoustic Profile & Best Use'],
        rows: [
          {
            cells: [
              'Electric Piano',
              'Triangle fundamental + octave harmonic triangle through low-pass sweep (2600 Hz → 900 Hz). Balanced jazz voicings, 7th chords, and clean voice-leading audition.',
            ],
          },
          {
            cells: [
              'Studio Piano',
              'Triangle + slightly detuned sawtooth (+3.5 cents) with crisp percussive attack. Classical SATB chorales, inversion clarity, and cadence listening.',
            ],
          },
          {
            cells: [
              'Nylon Guitar',
              'Fast 8 ms pluck envelope with warm low-pass decay (2200 Hz → 480 Hz). Pop axis progressions, folk patterns, and Dorian/Mixolydian grooves.',
            ],
          },
          {
            cells: [
              'Warm Strings',
              'Detuned sawtooth/triangle pair (±5 cents) with slow attack and sustained 1150 Hz filter. Film-score modal mixture, long sustained harmonies, and tension curves.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter-02',
    number: '02',
    title: 'Studio Workspace & Progression Board',
    blocks: [
      {
        kind: 'p',
        text: 'The Progression Phrase Board displays your phrase as color-coded harmonic cards. Clicking any card selects it for the Voice-Leading Canvas and Melody Keyboard, and auditions the voiced chord immediately.',
      },
      { kind: 'h', text: 'Harmonic Function Color-Coding' },
      {
        kind: 'table',
        head: ['Function', 'Core Chords', 'Phrase Role'],
        rows: [
          {
            swatch: '#0ea5e9',
            cells: [
              'T · Tonic',
              'I, i, vi, VI, iii, III',
              'Establishes tonal center and receives resolutions from Dominant or Subdominant chords.',
            ],
          },
          {
            swatch: '#f59e0b',
            cells: [
              'S · Pre-dominant',
              'ii, ii°, IV, iv',
              'Creates motion away from tonic and prepares Dominant tension or Half Cadences.',
            ],
          },
          {
            swatch: '#f43f5e',
            cells: [
              'D · Dominant',
              'V, V7, vii°, vii°7, ♭II7',
              'Contains the leading tone (7̂) and tritone tension demanding resolution back to Tonic.',
            ],
          },
          {
            swatch: '#8b5cf6',
            cells: [
              'C · Chromatic',
              'V/V, V/ii, V/vi, iv (borrowed), ♭VII',
              'Temporarily tonicizes non-tonic chords or borrows color from parallel modes.',
            ],
          },
        ],
      },
      { kind: 'h', text: 'Curated Progression Presets' },
      {
        kind: 'table',
        head: ['Preset Name', 'Mode / Density', 'Progression & Tempo'],
        rows: [
          { cells: ['Classic Phrase Arc', 'Major · Triads', 'I → ii⁶ → V → I (96 BPM)'] },
          { cells: ['Pop Axis Loop', 'Major · Triads', 'I → V → vi → IV (108 BPM)'] },
          { cells: ['Jazz ii7 – V7 – Imaj7', 'Major · 7th Chords', 'ii7 → V7 → Imaj7 → V7/ii (112 BPM)'] },
          {
            cells: [
              'Secondary Dominant Lift',
              'Major · 7th Chords',
              'Imaj7 → V7/V → V7 → iv (mix) (88 BPM)',
            ],
          },
          {
            cells: [
              'Andalusian Minor Descent',
              'Harmonic Minor · Triads',
              'i → VI⁶ → iv⁶ → V (94 BPM)',
            ],
          },
          {
            cells: ['Dorian Soul Vamp', 'Dorian · 7th Chords', 'i7 → IV7 → i7 → VII7 (102 BPM)'],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter-03',
    number: '03',
    title: 'Next-Chord Advisor & Harmonic Palette',
    blocks: [
      {
        kind: 'p',
        text: 'Located in the right-hand deck of the Studio workspace, the Next-Chord Advisor evaluates your final chord and ranks every candidate continuation by harmonic function compatibility, cadential pull, tendency-tone resolution, and voice-leading smoothness.',
      },
      { kind: 'h', text: 'Palette Filter Categories' },
      {
        kind: 'ul',
        items: [
          'All — Shows the full ranked list combining diatonic chords and chromatic color options.',
          'Diatonic — Restricts suggestions strictly to chords built from the 7 notes of your active key and mode.',
          'Secondary V/ — Displays tonicizing dominant chords (such as V7/V, V7/ii, V7/vi) that inject chromatic leading tones toward target degrees.',
          'Mixture — Offers modal mixture chords borrowed from the parallel minor or major mode (e.g., borrowed minor iv or ♭VII).',
          'Tritone — Presents tritone substitutions (such as ♭II7) that share the active 3rd and 7th tritone of V7 for smooth half-step bass motion.',
        ],
      },
      { kind: 'h', text: 'Interpreting Suggestion Cards' },
      {
        kind: 'ul',
        items: [
          'Harmonic Fit (%) — Ranks each option (#1, #2, etc.) using a percentage score reflecting tonal syntax and minimal semitone travel.',
          'Preview Button (labelled Hear) — Plays the transition from your current final chord directly into the candidate chord without modifying your phrase.',
          '+ Add Button — Appends the candidate chord (defaulting to 4 beats) to the end of your Progression Phrase.',
        ],
      },
    ],
  },
  {
    id: 'chapter-04',
    number: '04',
    title: 'SATB Voice Leading Canvas & Lab',
    blocks: [
      {
        kind: 'p',
        text: 'Every chord change in Chord Compass Pro is automatically voiced in 4-part SATB harmony (Bass, Tenor, Alto, Soprano) by a real-time solver that minimizes semitone movement while honoring your chosen bass inversion.',
      },
      { kind: 'h', text: '4-Voice SATB Color & Range Specification' },
      {
        kind: 'table',
        head: ['Voice', 'Color Indicator', 'Solver Rules & Musical Role'],
        rows: [
          {
            swatch: '#0f172a',
            cells: [
              'Bass',
              'Slate Black (#0F172A)',
              'Grounded strictly on the pitch class required by the slot inversion (Root, 3rd, 5th, or 7th).',
            ],
          },
          {
            swatch: '#0369a1',
            cells: [
              'Tenor',
              'Deep Sky (#0369A1)',
              'Upper-voice range C3–A5; kept within 12 semitones of Alto to preserve cohesive spacing.',
            ],
          },
          {
            swatch: '#b45309',
            cells: [
              'Alto',
              'Amber (#B45309)',
              'Bridges Tenor and Soprano; holds common tones steady wherever harmonic overlap permits.',
            ],
          },
          {
            swatch: '#be123c',
            cells: [
              'Soprano',
              'Crimson (#BE123C)',
              'Top melodic voice; traced alongside the dashed Tension Curve (0.0 rest to 1.0 pull).',
            ],
          },
        ],
      },
      { kind: 'h', text: 'Voice Leading Lab & Auto-Smooth Bass' },
      {
        kind: 'ul',
        items: [
          'Layer Modes — Switch the canvas between Combined (voices + tension), 4-Voice SATB, or Tension Arc.',
          'Transition Breakdown — The Voice Leading tab lists each chord-to-chord step with Total Semitone Cost, Common Tones held, signed Voice Deltas (+1, 0, −2), Bass Motion label, and Tendency Resolutions.',
          'Auto-Smooth Bass Inversions — Available when 3 or more chords exist; evaluates inversions across interior chords to convert wide root leaps into stepwise bass lines.',
        ],
      },
    ],
  },
  {
    id: 'chapter-05',
    number: '05',
    title: 'Melody Note Guide & Keyboard',
    blocks: [
      {
        kind: 'p',
        text: 'Positioned beneath the Voice-Leading Canvas in the Studio tab, the Melody Note Guide & Keyboard spans two full octaves from C4 to B5. It dynamically updates whenever you click a progression slot or step through playback.',
      },
      { kind: 'h', text: 'Key Color Classification' },
      {
        kind: 'table',
        head: ['Key Visual State', 'Musical Meaning & Usage'],
        rows: [
          {
            cells: [
              'Exact Voiced Chord Tone',
              'Highlights the exact MIDI pitches currently assigned to the active SATB voicing in the C4–B5 range.',
            ],
          },
          {
            cells: [
              'Chord Tone (Other Octave)',
              'Notes belonging to the active chord (root, 3rd, 5th, or 7th) in a different octave — ideal for stable melody leaps.',
            ],
          },
          {
            cells: [
              'Diatonic Scale Note',
              'Notes inside the current key and mode that act as smooth passing tones or neighbor tensions against the active chord.',
            ],
          },
          {
            cells: [
              'Outside / Chromatic',
              'Non-diatonic pitches outside both the chord and parent mode, usable for chromatic approach notes.',
            ],
          },
        ],
      },
      { kind: 'h', text: 'Auditioning Melodies Against Harmony' },
      {
        kind: 'p',
        text: 'Click any piano key while paused to hear it with the currently selected synth timbre, or press Play Phrase with Loop enabled and improvise melodic motifs on the C4–B5 keyboard in real time as the highlight tracks each chord.',
      },
    ],
  },
  {
    id: 'chapter-06',
    number: '06',
    title: 'Cadence Detection & Harmony Reference',
    blocks: [
      {
        kind: 'p',
        text: 'As you build phrases on the Progression Board, the theory engine scans every adjacent pair of chords and annotates cadence events directly between slots.',
      },
      { kind: 'h', text: 'Detected Cadence Types' },
      {
        kind: 'table',
        head: ['Code', 'Cadence Name', 'Harmonic Trigger & Effect'],
        rows: [
          {
            cells: [
              'PAC',
              'Authentic Cadence',
              'Root-position V → Root-position I (or i) — Strongest possible harmonic punctuation; delivers complete tonal closure.',
            ],
          },
          {
            cells: [
              'IAC',
              'Imperfect Cadence',
              'Inverted V, vii°, or ♭II7 → I/i (or inverted I) — Dominant tension resolves home, softened by inversion or diminished/tritone color.',
            ],
          },
          {
            cells: [
              'DC',
              'Deceptive Cadence',
              'V → vi (or VI) — Expected tonic arrival pivots to the submediant, extending the musical phrase.',
            ],
          },
          {
            cells: [
              'PC',
              'Plagal Cadence',
              'IV, iv, or borrowed iv → I (or i) — Subdominant gently releases into tonic without relying on a leading-tone pull.',
            ],
          },
          {
            cells: [
              'HC',
              'Half Cadence',
              'Pre-dominant (S) → V or v at the final slot — Phrase pauses openly on the dominant, creating an unanswered harmonic question.',
            ],
          },
          {
            cells: [
              'SEC',
              'Secondary Tonicization',
              'Secondary V/x → Target chord x — Temporarily treats a diatonic chord (e.g., ii, V, or vi) as a local home.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter-07',
    number: '07',
    title: 'Challenges & Theory Guide Workspaces',
    blocks: [
      {
        kind: 'p',
        text: 'Beyond open composition, Chord Compass Pro provides structured ear-training challenges and interactive theory demonstrations.',
      },
      { kind: 'h', text: 'Interactive Theory & Ear Challenges' },
      {
        kind: 'table',
        head: ['Challenge', 'Level & Key', 'Key Takeaway'],
        rows: [
          {
            cells: [
              'The Surprise Ending (Deceptive Cadence)',
              'Foundation · C Major · Triads',
              'vi (Am): A Deceptive Cadence (V → vi) keeps melody resolution 7̂ → 1̂ intact while swapping the bass to 6̂.',
            ],
          },
          {
            cells: [
              'Spotlight the Dominant',
              'Intermediate · G Major · 7th Chords',
              'V7/V (A7): Raising the 3rd of minor ii produces V7/V, creating a chromatic leading tone (C♯ → D) into V7.',
            ],
          },
          {
            cells: [
              'Bittersweet Plagal Sigh',
              'Intermediate · F Major · Triads',
              'iv (B♭m): Major IV followed by borrowed minor iv creates an expressive half-step line (6̂ → ♭6̂ → 5̂) into I.',
            ],
          },
          {
            cells: [
              'Jazz Half-Step Slide Home',
              'Advanced · C Major · 7th Chords',
              '♭II7 (D♭7): Two dominant 7ths a tritone apart share the same 3rd and 7th, letting ♭II7 slide chromatically to Imaj7.',
            ],
          },
        ],
      },
      { kind: 'h', text: 'Theory Guide Demonstrations' },
      {
        kind: 'table',
        head: ['Concept', 'Roman Pattern', 'Pedagogical Focus'],
        rows: [
          {
            cells: [
              'Functional Harmony Cycle (T → S → D → T)',
              'Imaj7 → ii7 → V7 → Imaj7',
              'Classic tonal departure from Tonic into Pre-dominant motion, peaking on Dominant tension before resolving home.',
            ],
          },
          {
            cells: [
              'Deceptive Cadence (V → vi)',
              'I → IV → V → vi',
              'Shares scale degrees 1̂ and 3̂ with I, satisfying melodic expectation while shifting mood to the relative minor.',
            ],
          },
          {
            cells: [
              'Secondary Dominant (V7/V → V7)',
              'Imaj7 → V7/V → V7 → Imaj7',
              'Introduces ♯4̂ to pull magnetically toward the dominant chord.',
            ],
          },
          {
            cells: [
              'Modal Mixture (IV → iv → I)',
              'I → IV → iv → I',
              'Borrows minor iv from the parallel minor key to craft a falling 6̂ → ♭6̂ → 5̂ line.',
            ],
          },
          {
            cells: [
              'Smooth Bass via First Inversion (I → V⁶ → vi → IV)',
              'I → V⁶ → vi → IV',
              'Places the 3rd in the bass of V to create a lyrical stepwise descending bass line (1̂ → 7̂ → 6̂).',
            ],
          },
          {
            cells: [
              'Tritone Substitution (ii7 → ♭II7 → Imaj7)',
              'ii7 → ♭II7 → Imaj7',
              'Preserves the active 3rd/7th tritone while transforming root motion into a smooth chromatic half-step descent.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter-08',
    number: '08',
    title: 'MIDI Export, Chart Copy & Persistence',
    blocks: [
      {
        kind: 'p',
        text: 'Finished progressions can be transferred directly into any Digital Audio Workstation (Logic Pro, Ableton Live, FL Studio, GarageBand, Reaper) or shared as clean Roman-numeral text.',
      },
      { kind: 'h', text: 'Standard MIDI File (.mid) Binary Specification' },
      {
        kind: 'table',
        head: ['Parameter', 'Specification'],
        rows: [
          {
            cells: ['SMF Format', 'Standard MIDI File Format 0 (single MTrk track, MThd header).'],
          },
          {
            cells: [
              'Timing Resolution',
              '480 ticks per quarter note; 2-beat slots = 960 ticks, 4-beat slots = 1,920 ticks.',
            ],
          },
          {
            cells: [
              'Tempo Meta Event',
              'FF 51 03 encoded from your active workbench BPM slider (clamped 40–240 BPM).',
            ],
          },
          {
            cells: [
              'Program & Velocities',
              'GM Program 4 (Electric Piano 1); Bass velocity = 84, Upper SATB voices = 76.',
            ],
          },
          {
            cells: [
              'Voiced Pitch Data',
              'Exports exact solved SATB MIDI note numbers (including inversions), not raw root-position blocks.',
            ],
          },
        ],
      },
      { kind: 'h', text: 'Copy Chart, Local Persistence & Troubleshooting' },
      {
        kind: 'ul',
        items: [
          'Copy Chart — Copies both the Roman numeral progression and absolute chord symbols to your clipboard for lead sheets or notes.',
          'Automatic Persistence — Key, mode, 7th-chord toggle, synth instrument, BPM, and slots save automatically to browser localStorage under the key "chord-compass-studio-v2".',
          'No Sound on First Load — Modern browsers block Web Audio until a user gesture occurs. Click Play Phrase, Audition, or any piano key to unlock audio.',
        ],
      },
    ],
  },
];

const WORKSPACES: TableRow[] = [
  {
    cells: [
      'Studio',
      'Build progressions slot-by-slot, apply presets, audition chords, read inline cadence labels, inspect melody notes, and add ranked chords from the Advisor.',
    ],
  },
  {
    cells: [
      'Voice Leading',
      'Examine SATB voice motion per transition, inspect common tones, view total semitone travel, and run Auto-Smooth Bass Inversions.',
    ],
  },
  {
    cells: [
      'Challenges',
      'Practice deceptive cadences, secondary dominants, modal mixture, and tritone substitutions with instant audio feedback and Studio handoff.',
    ],
  },
  {
    cells: [
      'Theory Guide',
      'Audition foundational harmonic concepts (functional cycles, smooth inversions, chromatic color) in your active musical key.',
    ],
  },
];

const SECTIONS = [{ id: 'manual-overview', number: '—', title: 'Overview' }, ...CHAPTERS.map((c) => ({
  id: c.id,
  number: c.number,
  title: c.title,
}))];

export function ManualView() {
  const [activeId, setActiveId] = useState('manual-overview');

  useEffect(() => {
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -65% 0px', threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Contents rail */}
      <nav aria-label="Manual contents" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            User Manual
          </p>
          <ul className="mt-3 space-y-0.5 border-l border-slate-200">
            {SECTIONS.map((section) => {
              const isActive = activeId === section.id;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`-ml-px flex gap-2 border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors ${
                      isActive
                        ? 'border-sky-600 font-semibold text-sky-700'
                        : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-5 shrink-0 font-mono text-[11px] text-slate-400">
                      {section.number}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          <a
            href={manualPdf}
            download="Chord-Compass-Pro-User-Manual.pdf"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-white"
          >
            <Download aria-hidden="true" size={14} />
            Download PDF
          </a>
        </div>
      </nav>

      <div className="min-w-0 space-y-6">
        {/* Cover */}
        <section
          id="manual-overview"
          className="scroll-mt-28 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-inset ring-sky-200">
                Official Application Manual · Edition 2.0
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Chord Compass Pro
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Theory-Guided Progression Builder, Voice-Leading Studio &amp; Harmony Lab
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Author: Ray Foo · Live web app:{' '}
                <a
                  href="https://rayfoolshs.github.io/ChordCompassPro/"
                  className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
                >
                  rayfoolshs.github.io/ChordCompassPro
                </a>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={manualPdf}
                download="Chord-Compass-Pro-User-Manual.pdf"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
              >
                <Download aria-hidden="true" size={14} />
                Download PDF
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Printer aria-hidden="true" size={14} />
                Print
              </button>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-700">
            Chord Compass Pro is a zero-backend, browser-based harmonic composition studio created by
            Ray Foo for music students, composers, and educators. Build chord progressions slot by slot
            by Roman numeral, audition voicings with a custom Web Audio synthesizer, inspect 4-voice
            SATB part-writing in real time, and export voice-led phrases as Standard MIDI (.mid) files.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Core Workspaces Overview
              </h2>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700">
                        Workspace
                      </th>
                      <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700">
                        Primary Capabilities
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {WORKSPACES.map((row) => (
                      <tr key={row.cells[0]} className="align-top">
                        <td className="border border-slate-200 px-3 py-2 font-semibold whitespace-nowrap text-slate-900">
                          {row.cells[0]}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 leading-relaxed text-slate-700">
                          {row.cells[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Document Specifications
              </h2>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-slate-700">
                <li>
                  <span className="font-semibold text-slate-900">Target URL:</span>{' '}
                  https://rayfoolshs.github.io/ChordCompassPro/
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Client Architecture:</span> 100%
                  client-side ES2022 + Web Audio API; automatic persistence via localStorage.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Supported Browsers:</span> Current
                  Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {CHAPTERS.map((chapter) => (
          <section
            key={chapter.id}
            id={chapter.id}
            className="scroll-mt-28 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <header className="flex items-baseline gap-3 border-b border-slate-200 pb-3">
              <span className="font-mono text-xs font-semibold text-sky-700">{chapter.number}</span>
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                {chapter.title}
              </h2>
            </header>
            <div className="mt-4 space-y-4">
              {chapter.blocks.map((block, index) => (
                <BlockView key={`${chapter.id}-${index}`} block={block} />
              ))}
            </div>
          </section>
        ))}

        <p className="pb-4 text-center text-xs text-slate-500">
          Chord Compass Pro · User Manual · Edition 2.0 · © Ray Foo
        </p>
      </div>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{block.text}</p>;
    case 'h':
      return (
        <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {block.text}
        </h3>
      );
    case 'ul':
      return (
        <ul className="space-y-1.5">
          {block.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>{withStrongLead(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="space-y-2.5">
          {block.items.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <span>{withStrongLead(item)}</span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                {block.head.map((heading) => (
                  <th
                    key={heading}
                    className="border border-slate-200 px-3 py-2 font-semibold whitespace-nowrap text-slate-700"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.cells.join('|')} className="align-top">
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      key={`${row.cells[0]}-${cellIndex}`}
                      className={`border border-slate-200 px-3 py-2 leading-relaxed ${
                        cellIndex === 0 ? 'font-semibold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {cellIndex === 0 && row.swatch ? (
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: row.swatch }}
                          />
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** Renders "Label — detail" list items with the label emphasised. */
function withStrongLead(item: string) {
  const match = item.match(/^([^—:]{1,60}?)\s+—\s+([\s\S]+)$/);
  if (!match) return item;
  return (
    <>
      <span className="font-semibold text-slate-900">{match[1].replace(/\s+$/, '')}</span>
      {' — '}
      {match[2]}
    </>
  );
}
