# Chord Compass Pro

A theory-guided chord progression and voice-leading studio for music students. Build progressions by
Roman numeral, hear them with a small built-in synth, watch the voices move, and export the result as
MIDI.

**Live app:** https://rayfoolshs.github.io/ChordCompassPro/

---

## What it does

| Workspace | Purpose |
| --- | --- |
| **Studio** | Build a progression slot by slot, audition chords, read cadence analysis, and get ranked next-chord suggestions. |
| **Voice Leading** | Inspect each transition between chords: voice movement, common tones, and total motion cost. |
| **Challenges** | Work through harmony exercises (e.g. build a cadence) and load a solution into the Studio. |
| **Theory Guide** | Reference material for the chords and functions in the current key. |
| **Manual** | The full in-app user manual (Edition 2.0), with a downloadable PDF. |

Core features:

- **Diatonic palettes for five modes** — major, natural minor, harmonic minor, Dorian, Mixolydian.
- **Triads or seventh chords**, with inversions (root, 1st, 2nd, 3rd) per slot.
- **Voice-leading solver** that revoices each chord to minimise movement from the previous one, plus a
  one-click "smooth inversions" pass over the whole progression.
- **Cadence detection** (authentic, half, plagal, deceptive) shown inline on the progression board.
- **Next-chord advisor** ranking candidates by harmonic function, cadential pull, and voice-leading
  cost — with audio preview of the transition.
- **Playback** with adjustable tempo (60–160 BPM), looping, and four synth timbres.
- **Export to MIDI** and **copy the chart** as Roman numerals plus chord symbols.
- Progressions persist in `localStorage`, so a reload keeps your work.

Everything runs client-side. There is no backend, no account, and no network calls at runtime.

## Getting started

Requires Node.js 20.19+ or 22.12+ (Vite 8).

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 3000. |
| `npm run build` | Type-check-free production build into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Type check only (`tsc --noEmit`). |
| `npm run clean` | Remove `dist/`. |

## Deployment

Pushes to `main` deploy automatically to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow installs with `npm ci`,
type-checks, builds, and publishes `dist/` as the Pages artifact.

Because this is a *project* site served from a subpath, `vite.config.ts` sets
`base: '/ChordCompassPro/'` whenever it runs inside GitHub Actions, and keeps `/` for local
development. If the repository is renamed or moved to a custom domain, update that base path.

To deploy manually, run the workflow from the Actions tab (`workflow_dispatch`), or build and serve
`dist/` yourself.

## Project structure

```
src/
  App.tsx                      # Workspace shell, playback transport, persistence
  components/
    Header.tsx                 # Brand, tab navigation, Export MIDI
    ProgressionBoard.tsx       # Slot editor, presets, cadence markers
    VoiceLeadingCanvas.tsx     # Piano-roll style voice movement
    VoiceLeadingLab.tsx        # Per-transition analysis view
    NextChordAdvisor.tsx       # Ranked suggestions + preview
    MelodyKeyboard.tsx         # Playable keyboard for the active chord
    ChallengesView.tsx         # Harmony exercises
    TheoryGuideView.tsx        # Reference material
  lib/
    theory.ts                  # Chord templates, resolution, suggestions, cadences
    voiceLeading.ts            # Voicing solver and smooth-inversion pass
    audio.ts                   # Web Audio synth engine
    midi.ts                    # Standard MIDI file writer
    challenges.ts              # Challenge definitions
    theory.test.ts             # Unit tests for the theory layer
```

The `lib/` layer is deliberately UI-free: `theory.ts` and `voiceLeading.ts` are pure functions over
plain data, so they can be tested and reused without a DOM. Unit tests for that layer live in
`src/lib/theory.test.ts`; no test runner is wired into `package.json` yet.

## Browser support

Needs the Web Audio API and ES2022. Current Chrome, Edge, Firefox, and Safari all work. Audio starts
only after a user gesture, per browser autoplay policy.

## License

No license file is included. The source is publicly readable, but all rights are reserved by the
author unless a license is added.

---

Created by Ray Foo.
