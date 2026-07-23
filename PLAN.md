# PLAN — Beyond Boring: Battle of the Backlog

A front-end-only educational quiz battler. BRILLIANT vs. BORING, 9 rounds,
one per module of the "Agentic Coding for Total Beginners" curriculum.
Street Fighter staging, trivia-night mechanics, corporate-horror tone.
Static site, deployed to GitHub Pages via GitHub Actions.

## Architecture

- **Vite + TypeScript + Three.js** — same stack as "The Insurrection"
  (beyond-boring-the-game). The voxel model format from that repo is
  directly reusable: box-mesh builders + canvas-texture CRT faces.
- **Three.js** renders only the face-off scene (two voxel robots, beam
  VFX, screen shake). All quiz UI, HP bars, and the state machine are
  plain DOM/CSS overlaid on the canvas.
- **Question bank** lives in a single editable data file:
  `src/data/questions.json` — 9 rounds × 8-12 questions, each with a
  prompt, 4 choices, correctIndex, and a full explanation (why right,
  why the distractors are wrong, one tie-back to practice).
- Per round, a random subset of the pool is drawn so replays differ.

## Game flow (state machine)

TITLE → ROUND_INTRO (Boring's compliance quip) → QUESTION → RESOLVE
(beam animation + HP change) → EXPLANATION (always shown, right or
wrong — non-negotiable) → next QUESTION | ROUND_CLEAR → next round |
GAME_OVER (retry round, HP restored to round-start value) → VICTORY
(Boring short-circuits into TPS reports; boss round 9 = Change
Advisory Board form with bigger beam VFX and a defeat cutscene).

## Phases

| Phase | Work | Status |
|-------|------|--------|
| 0 | Research: art direction, Insurrection voxel format, humor reference | done |
| 1 | Repo + scaffold + this plan, committed and pushed | in progress |
| 2 | Question bank: subagent fan-out, 9 rounds × 8-12 questions | pending |
| 3 | Game build: voxel robots, quiz UI, state machine, VFX | pending |
| 4 | Deploy: GitHub Actions → GitHub Pages | pending |
| 5 | Verification: playwright-cli locally + on production URL | pending |
| 6 | README with provenance (Fable 5) + per-phase timing | pending |

Timing of each phase is tracked and reported in README.md at the end.

## Definition of done

- All 9 rounds playable start to finish, no dead ends.
- Every question shows its full explanation before moving on — on both
  the right and wrong path.
- Voxel robots render and animate idle/attack/hit.
- Retry-on-loss works; losing never gatekeeps the material.
- Question bank in one data file.
- Deployed and reachable on a public GitHub Pages URL, playtested there
  with playwright-cli.
