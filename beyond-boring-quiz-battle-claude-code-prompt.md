# CLAUDE CODE PROMPT — "BEYOND BORING: BATTLE OF THE BACKLOG"

We are building a front-end only educational game with no server side components, published to a GitHub pages page.
---
## 0. Additional data and notes

Use `/art-direction/` images for art style for the robots.
Use the curriculum.md file for additional content to create quiz questions from.
Feel free to be very sarcastic. See https://github.com/kolatts/pncli/blob/main/site/src/pages/notice.astro
for the style of the humor.
Creating a github repository named beyond-boring-battle-bots is the first step, then commit and push your plan, and continue, keeping track of the timing of each phase. At the end, indicate in the README.md how this was created (Fable 5) and how long each phase of the plan took.

## 1. What we're building

A browser-based **quiz battler**: same Boring vs. Brilliant universe as
"The Insurrection," different genre. Think Street Fighter character-select
screen crossed with a trivia night crossed with a corporate performance
review from hell.

**Premise:** BRILLIANT (player-controlled) faces off against BORING across
9 rounds — one per topic in the "Agentic Coding for Total Beginners"
curriculum. Every correct answer fires a **Beam of Soul-Crushing Monotony**
back at Boring (it was his weapon first, Brilliant's just returning it with
interest). Every wrong answer lets Boring's beam land on Brilliant instead.
Get through all 9 rounds without depleting Brilliant's HP, and Boring
short-circuits into a pile of TPS reports.

**Tone:** deadpan corporate horror, snarky, a little exhausted, ultimately
positive about the material. The jokes are the delivery mechanism for real
learning, not a substitute for it — every question needs a real explanation
that actually teaches the concept, not just a punchline.

---

## 2. Core loop (per round)

1. **Face-off screen** — Brilliant and Boring, Street Fighter-style,
   mirrored on opposite sides of the screen, both idle-animating. Round
   title + topic banner between them (e.g. "ROUND 4: CONTEXT ENGINEERING").
2. **Question card** — question + 4 multiple-choice answers. Player clicks
   one. No timer for v1 — this is about learning, not reflexes. (Open
   question for a v2: optional timed mode.)
3. **Resolution beat:**
   - Correct → Brilliant fires the beam, Boring's HP bar drops, a short
     "hit" animation plays, **then the full explanation is shown** (why
     it's right, why the distractors are wrong, one sentence tying it back
     to real practice).
   - Incorrect → Boring fires the beam, Brilliant's HP bar drops, **the
     full explanation is still shown** — this is non-negotiable, wrong
     answers are the highest-leverage teaching moment in the whole game.
4. **Next question** until the round's question set is exhausted or a
   health bar hits zero.
5. **Round-clear screen** — one-liner from Brilliant, HP carries into next
   round (partial healing between rounds is a tuning knob, not a given).
6. **Round 9 (final)** — Boring's "Change Advisory Board" boss form: same
   mechanic, higher stakes framing, bigger beam VFX, a proper defeat
   cutscene when cleared.

Losing (Brilliant's HP hits zero) does **not** end the game permanently —
retry the round. This is a study tool wearing a fighting-game costume; it
should never gatekeep the material behind execution skill.

---

## 3. Visual style

- **Voxel robots**, same visual language as "The Insurrection" — Boring
  desaturated gray/beige, Brilliant a spark of color in a gray frame.
- **Street Fighter-style staging**: both characters full-height, facing
  each other, camera roughly at their eye line, floor plane implied or
  simple, screen split conceptually down the middle with the question card
  overlaid in the lower third (classic fighting-game HUD zone) or as a
  modal between beats — pick whichever is less fiddly to build well.
- Idle animation is enough for v1 (simple bob/hover loop). Attack = beam
  fires from one robot's chest/hand to the other + a screen-shake or flash
  on hit. Do not over-invest in animation rigging — a few keyframed poses
  (idle, wind-up, fire, hit-react) covers the whole game.
- HP bars styled like classic fighting-game health bars, Boring's labeled
  something like "COMPLIANCE INTEGRITY," Brilliant's "MORALE."

## 4. Tech stack

Keep it simple — this is a quiz game with a fighting-game skin, not an
actual fighting game. Recommended default, open to Claude Code's judgment:

- **Three.js** for the voxel character rendering only (reuse/adapt the
  approach from "The Insurrection" if that repo's voxel model format is
  reusable — check before rebuilding from scratch).
- Plain HTML/CSS/JS (or a minimal framework only if it meaningfully
  reduces complexity) for the quiz UI, state machine, and HP bars — this
  is standard DOM work and doesn't need a 3D engine.
- No backend. No build step beyond what's needed to bundle Three.js.
  Static site, deployable to GitHub Pages via GitHub Actions, same pattern
  as prior Beyond Boring builds.
- Question bank as a plain JSON/TS data file, not hardcoded in components
  — this is the part that'll get edited/extended most.

## 5. Question bank structure

9 rounds mapping 1:1 to the curriculum modules below. Each round needs a
pool of questions (aim for 8-12 per round so replay isn't identical every
time); below are a few seed examples per round to establish tone and
depth — Claude Code (or a follow-up pass) should expand each pool.

Data shape suggestion:

```json
{
  "round": 1,
  "title": "How LLMs Actually Behave",
  "boringQuip": "Per Policy 4.2(b), unpredictability is not a supported feature.",
  "questions": [
    {
      "id": "r1q1",
      "prompt": "Why does an AI coding agent sometimes 'forget' something you told it 10 minutes ago?",
      "choices": [
        "It's being lazy",
        "The context window filled up and older info got crowded out or compacted away",
        "It only remembers things you say twice",
        "It's a bug that will be patched next release"
      ],
      "correctIndex": 1,
      "explanation": "Context windows are finite. As more tokens (conversation, files, tool output) get added, older content can get pushed out, summarized, or just get less attention — this is sometimes called 'context rot.' The fix isn't yelling louder, it's managing what's in the window."
    }
  ]
}
```

### Round 1 — How LLMs Behave
- Seed Q: What's a "hallucination" in this context, and why does it happen?
  *(models are optimized to produce plausible-sounding output, not to say
  "I don't know" — so a wrong-but-fluent answer can look identical to a
  right one)*
- Seed Q: Why might the exact same prompt produce two different answers
  in two different runs? *(non-determinism — temperature, floating-point/
  concurrency effects, even at low randomness settings)*

### Round 2 — The Agentic Loop
- Seed Q: What's the correct order of Anthropic's suggested workflow?
  *(Explore → Plan → Implement → Commit)*
- Seed Q: When is it okay to skip the planning step? *(when the whole
  change could be described accurately in one sentence)*

### Round 3 — Prompting & Instructions
- Seed Q: Which is the better instruction to an agent? *("Add tests for
  foo.py" vs. "Add a test for foo.py covering the logged-out edge case,
  no mocks")* — teach specificity over vagueness.
- Seed Q: What should you do with a large, complicated task before handing
  it to an agent? *(break it into smaller, scoped steps)*

### Round 4 — Context Engineering
- Seed Q: What's the difference between prompt engineering and context
  engineering? *(prompt engineering = wording one instruction; context
  engineering = ongoing curation of everything in the window across a
  session)*
- Seed Q: What's "compaction"? *(summarizing a conversation that's
  getting full and reinitializing from the summary so the session can
  keep going without losing everything)*

### Round 5 — Project Memory & Instruction Files
- Seed Q: What's the #1 reason instruction files like AGENTS.md fail in
  practice? *(they're too vague, not because they're too long or too
  short)*
- Seed Q: True/false — a longer instruction file is always better.
  *(false — bloated files bury important rules in noise)*

### Round 6 — Skills, Tools, MCP & Subagents
- Seed Q: What does MCP stand for and what problem does it solve?
  *(Model Context Protocol — a standard way to connect an agent to
  external tools/data instead of one-off integrations per tool)*
- Seed Q: What's the point of "progressive disclosure" in Agent Skills?
  *(only the skill's name/description sits in context until it's
  actually relevant, then the full instructions load — keeps the context
  window lean)*

### Round 7 — Research-Plan-Implement & Verification
- Seed Q: What's the single most important thing you can give an agent
  to make its output trustworthy? *(a way to verify its own work — tests,
  a build, a lint check — not just "looks done")*
- Seed Q: What's a known risk of test-driven agentic loops? *(the agent
  might edit the tests to make them pass instead of fixing the code —
  review the tests, don't just trust green)*

### Round 8 — Safety, Review & Security
- Seed Q: Can a coding agent approve or merge its own pull request?
  *(no — human review is a hard requirement, not a suggestion)*
- Seed Q: Why is "the code compiles" not the same as "the code is safe to
  ship"? *(agents can produce plausible, working-looking code that's
  still insecure or wrong — never assume generated code is production-
  ready without review)*

### Round 9 (Boss) — GitHub Copilot in Practice
- Seed Q: What's the difference between Copilot's in-editor agent mode
  and its cloud coding agent? *(agent mode works live in your editor on
  what you're doing now; the cloud coding agent takes an assigned issue
  and works async, returning a draft PR)*
- Seed Q: Where does a Copilot-specific instruction file typically live
  in a repo? *(`.github/copilot-instructions.md`, alongside/parallel to
  the tool-agnostic AGENTS.md)*

## 6. Round transitions & Boring's voice

Give Boring a one-liner before each round drawn from corporate/compliance
language — deadpan, never mean-spirited toward any real person or company.
If a source of "compliance theater" flavor text is needed for inspiration,
Claude Code can look at the tone established in the existing "Insurrection"
NOTICE-style content from that project, but should generate new lines
specific to each topic here rather than reusing them verbatim.

## 7. Scope for this build

Design doc + Claude Code prompt only, per current request — no code yet.
When this moves to a build:
- v1 = all 9 rounds playable, one correct question pool each, HP bars,
  win/lose per round, retry-on-loss, final boss round distinct visually.
- Explicitly out of scope for v1: timer/speed mode, difficulty
  branching, leaderboards, sound design (nice-to-have if trivial).

## 8. Repo & deployment

Standalone repo (or a folder within the existing Beyond Boring
game-projects space — confirm with Sunny before assuming), deployed to
GitHub Pages via GitHub Actions, matching the pattern used for prior
Beyond Boring builds.

## 9. Definition of done - VERIFY with playwright-cli

- Playtested with playwright-cli locally and ultimately in deployed version.
- All 9 rounds playable start to finish with no dead ends.
- Every question (right or wrong path) shows its full explanation before
  moving on — this is the one mechanic that can't be cut for scope.
- Voxel robots render and animate through idle/attack/hit states.
- Deployed and reachable via a public GitHub Pages URL.
- Playtested with playwright-cli locally and ultimately in deployed version.
- Question bank lives in a single editable data file, not scattered
  across components.
