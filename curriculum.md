# Teaching Agentic Coding to Total Beginners: A Research Report & Curriculum for "Beyond Boring"

## TL;DR

- **Agentic coding is a teachable discipline, not a magic trick.** The field has converged in 2026 on a stable core: treat the coding agent like a junior engineer, engineer its *context* (not just prompts), and run every task through a structured **research → plan → implement → verify → commit** loop with the human owning architecture, quality, and correctness. A beginner curriculum should teach these tool-agnostic concepts first and map GitHub Copilot's features onto them second.
- **The single highest-leverage skill to teach is verification.** Anthropic's own guidance states the most important practice is giving the agent "a way to verify its work" (tests, builds, screenshots); the second is planning before coding. These two habits, plus disciplined context management, separate reliable "agentic engineering" from unreliable "vibe coding."
- **A 9-module curriculum works well**: LLM foundations → the agentic loop → prompting/instruction-writing → context engineering → project memory (AGENTS.md/CLAUDE.md/copilot-instructions) → agent skills/MCP/tools → research-plan-implement in depth → safety, review & security → GitHub Copilot in practice. Each module maps to primary sources from Anthropic, GitHub/Microsoft, OpenAI, and independent practitioners (Simon Willison, Addy Osmani).

---

## Key Findings

1. **"Context engineering" has replaced "prompt engineering" as the central discipline.** Anthropic's September 29, 2025 engineering post, *Effective context engineering for AI agents*, defines context engineering as "the set of strategies for curating and maintaining the optimal set of tokens (information) during LLM inference" and frames prompt engineering as one subset of it. This is the conceptual backbone of any modern curriculum.

2. **The research→plan→implement loop is now documented doctrine, not folklore.** Anthropic's official Claude Code best-practices docs prescribe a four-phase workflow — **Explore → Plan → Implement → Commit** — and state that the highest-leverage practice is giving the agent a runnable way to verify its own work. GitHub's Spec Kit generalizes the same idea into "spec-driven development."

3. **Reusable agentic capability is being standardized around a few open formats**: Anthropic's **Agent Skills** (a `SKILL.md`-based open standard), the **Model Context Protocol (MCP)** for tool/data connectivity (now adopted by OpenAI, Google, and GitHub), and **AGENTS.md** (a tool-agnostic project-instructions file). Per the Linux Foundation's December 9, 2025 announcement of the Agentic AI Foundation (AAIF), AGENTS.md was "released by OpenAI in August 2025... [and] has already been adopted by more than 60,000 open source projects and agent frameworks including Amp, Codex, Cursor, Devin, Factory, Gemini CLI, GitHub Copilot, Jules and VS Code." Teaching these gives skills that transfer across Copilot, Claude Code, and Codex.

4. **GitHub Copilot in 2026 has two distinct agentic surfaces**: in-editor **agent mode** (autonomous multi-file edits + terminal + self-correction inside VS Code) and the cloud **coding agent** (assign a GitHub issue, get a draft PR back, running in GitHub Actions). Both map cleanly onto the general concepts, which validates the "concepts first, tool second" approach.

5. **Beginner failure modes are well-characterized and predictable**: over-trusting plausible-looking output, skipping planning, letting context rot accumulate, writing vague/over-stuffed instruction files, and "vibing past" bad decisions. A curriculum should teach these explicitly as anti-patterns.

6. **Comparable curricula already exist** (GitHub Copilot bootcamps, Microsoft Learn paths, DeepLearning.AI's Anthropic skills course, the GH-300 and GH-600 certifications), but few are optimized for *total beginners* to agentic concepts while remaining tool-agnostic — which is the gap "Beyond Boring" can fill.

---

## Details

### Context: audience and design constraints

"Beyond Boring" is an educational community/coding-challenge series run by Sunny Kolattukudy — a principal/staff-level engineer (formerly PNC Bank, later Arcoro/Verifiable) and a Gem City TECH speaker in Dayton, Ohio. Gem City TECH is a family of free, community tech user groups. The audience is engineers who may have solid general software-engineering backgrounds but no exposure to AI coding agents, prompt/context engineering, or agentic workflows. They will primarily use GitHub Copilot, but the curriculum must teach general, transferable concepts.

This dual requirement — beginner-friendly *and* tool-agnostic — shapes everything below. The strategy: teach durable mental models grounded in primary sources, then treat Copilot (and Claude Code, Codex, Gemini CLI) as interchangeable *instantiations* of those models.

### 1. Foundational LLM concepts a developer actually needs

Beginners do not need transformer math; they need a practical mental model that explains agent behavior.

- **Tokens and the context window.** An LLM reads and writes *tokens* (sub-word chunks). The **context window** is the finite working memory holding the entire conversation — every message, every file the agent reads, every command output. Anthropic's Claude Code docs put the core constraint bluntly: "Claude's context window fills up fast, and performance degrades as it fills," and "when the context window is getting full, Claude may start 'forgetting' earlier instructions or making more mistakes."

- **Context rot.** Chroma's July 2025 technical report *Context Rot: How Increasing Input Tokens Impacts LLM Performance* (Hong, Troynikov, Huber) tested 18 frontier models including GPT-4.1, Claude Opus 4, and Gemini 2.5 and found that "models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows." This is the empirical justification for context management, and it compounds with the classic "lost in the middle" effect (Liu et al., TACL 2024), where models attend well to the beginning and end of context but poorly to the middle.

- **Attention budget.** Anthropic frames this well for learners: LLMs have an "attention budget" that every token depletes, stemming from the transformer's n² pairwise token relationships. Practical upshot: fewer, higher-signal tokens beat more tokens.

- **Non-determinism.** The same prompt can produce different outputs. Temperature controls randomness, but even at temperature 0 outputs are not guaranteed identical due to floating-point/GPU concurrency and mixture-of-experts routing effects. Teach beginners: reproduce-by-luck is not reproduce-by-design; verify outputs, don't assume repeatability.

- **Hallucination.** LLMs are trained to produce plausible continuations, so they will confidently fabricate APIs, function signatures, or facts. OpenAI's paper *Why Language Models Hallucinate* (Kalai, Nachum, Vempala & Zhang, September 4, 2025, arXiv:2509.04664) argues that "language models hallucinate because the training and evaluation procedures reward guessing over acknowledging uncertainty." Practical upshot: never trust un-verified generated code; give the model a way to say "I don't know" and a way to check itself.

- **What an "agent" is.** Simon Willison's crisp definition (which Anthropic echoes): an agent is "an LLM autonomously using tools in a loop." The "agent" software calls the LLM with your prompt plus a set of tool definitions, executes the tools the LLM requests (including running code), and feeds results back — repeating until done.

### 2. Context engineering vs. prompt engineering

**Prompt engineering** = writing and organizing the instructions you give the model (system prompts, task phrasing, examples). **Context engineering** = the broader, iterative discipline of curating *everything* in the context window across a multi-turn agent session: system instructions, tools, MCP data, message history, retrieved files, and notes. Anthropic: "In contrast to the discrete task of writing a prompt, context engineering is iterative and the curation phase happens each time we decide what to pass to the model."

Core techniques to teach (all from Anthropic's context-engineering post and Claude Code docs):

- **Find the smallest set of high-signal tokens.** "Good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."
- **Right-altitude system prompts** — specific enough to guide, flexible enough to avoid brittle hardcoded logic; organized with clear sections (Markdown headers / XML tags).
- **Just-in-time retrieval** — rather than dumping everything up front, let the agent load data on demand via file paths, grep/glob, and tools. Claude Code uses a hybrid: `CLAUDE.md` loaded up front, files pulled in just-in-time.
- **Compaction** — summarize a conversation nearing the window limit and reinitialize with the summary (Claude Code auto-compacts; `/compact` and `/clear` are manual levers).
- **Structured note-taking / agentic memory** — the agent writes notes (e.g., `NOTES.md`, a to-do list) to persistent storage outside the window and reloads them later.
- **Sub-agent architectures** — spin up focused sub-agents with clean context windows for research or review; each returns a condensed summary (often 1,000–2,000 tokens) rather than polluting the main context.

### 3. Agent skills, tools, and MCP — reusable agentic capability

- **Tools.** The atomic unit of agency. Anthropic's *Writing effective tools for AI agents* stresses building a small number of well-named, token-efficient, unambiguous tools; the most common failure is "bloated tool sets."

- **Model Context Protocol (MCP).** An open standard introduced by Anthropic on November 25, 2024 (created by David Soria Parra and Justin Spahr-Summers) for connecting LLM applications to external tools and data sources — "a universal, open standard for connecting AI systems with data sources, replacing fragmented integrations with a single protocol." It has since been adopted by OpenAI and Google, and GitHub deprecated its proprietary Copilot Extensions in favor of MCP. Beginners should understand MCP conceptually: servers expose *tools*, *resources*, and *prompts* that any MCP-compatible client (Copilot, Claude Code, etc.) can use.

- **Agent Skills.** Launched by Anthropic in October 2025 and released as an open standard (agentskills.io). A skill is "a portable bundle of instructions, resources, and executable code that an agent can discover and load only when relevant," organized as a folder with a `SKILL.md` file plus optional scripts/assets. The key mechanic is **progressive disclosure**: only the skill's name and description sit in context until a task matches, at which point the full instructions load. GitHub Copilot supports the same Agent Skills standard for its coding agent and CLI. Skills complement MCP: MCP connects tools; skills teach repeatable workflows.

- **Slash commands / prompt files.** Reusable, invocable workflows (e.g., Claude Code custom commands, GitHub Copilot `.prompt.md` files) that encode a repeatable task as a callable command.

- **Subagents/custom agents.** Named, scoped personas (e.g., a "security reviewer") with their own tools and isolated context.

Empirical note for credibility: *SkillsBench* (Li et al., "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks," arXiv:2602.12670, February 2026) found that "Curated Skills raise average pass rate by 16.2 percentage points (pp)," while "Self-generated Skills provide no benefit on average" — a result drawn from 7 agent-model configurations across 7,308 trajectories on 86 tasks in 11 domains, with software-engineering gains a more modest +4.5pp. The useful teaching caution: skill *quality* and curation matter far more than merely having skills.

### 4. The research → plan → implement loop and related structured patterns

This is the heart of the curriculum. Multiple independent sources converge here.

- **Anthropic's Explore → Plan → Implement → Commit** (official Claude Code docs): (1) Explore — read files/answer questions without editing (plan mode); (2) Plan — produce a detailed implementation plan the human reviews and edits; (3) Implement — code against the approved plan; (4) Commit — descriptive commit + PR. The docs add a pragmatic rule: "If you could describe the diff in one sentence, skip the plan." Phases 1–2 are the cheapest in tokens and the most valuable in outcome.

- **Verification loops (the #1 practice).** Anthropic: "Give Claude a way to verify its work" — tests, a build, a screenshot to compare, a lint that returns OK/FAIL. Without a check, "'looks done' is the only signal available, and you become the verification loop." Test-driven agentic development (write tests first, confirm they fail, implement until green) is widely cited as "the single strongest pattern for working with agentic coding tools." A known trap: agents may edit tests to make them pass, so commit tests first / review them.

- **Self-correction / adversarial review.** Have a fresh-context subagent review the diff against the plan and report gaps ("Report gaps, not style preferences"), guarding against the reviewer over-engineering.

- **Anthropic's workflow-vs-agent patterns** (*Building effective agents*, Dec 2024): the augmented LLM as the building block, plus five composable workflow patterns — **prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer** — with the guiding principle "find the simplest solution possible, and only increas[e] complexity when needed."

- **Spec-driven development.** GitHub's open-source **Spec Kit** formalizes writing an executable specification before code, via a gated workflow (`/specify` → `/plan` → `/tasks` → `/implement`) and a `constitution.md` of project principles. It works across 30+ agents (Copilot, Claude Code, Codex, Gemini CLI). Framed as the antidote to "vibe coding" for non-trivial or existing codebases.

- **The overarching frame: "agentic engineering," not "vibe coding."** Andrej Karpathy coined "vibe coding" (Feb 2025) for giving in to the vibes and not reviewing code; in February 2026 he proposed "agentic engineering" as the more disciplined successor term, explaining (per The New Stack, Feb 10, 2026): "'agentic' because the new default is that you are not writing the code directly 99% of the time, you are orchestrating agents who do and acting as oversight — 'engineering' to emphasize that there is an art & science and expertise to it." Addy Osmani's formulation is the cleanest teaching sound bite: "AI does the implementation, human owns the architecture, quality, and correctness." Simon Willison's *Agentic Engineering Patterns* guide lists the distinguishing practices: source-control discipline, automated testing, and written planning.

### 5. Prompting and instruction-writing for coding agents

Prompt craft is "table stakes" but still matters. Synthesized best practices from Anthropic, GitHub Docs, and practitioners:

- **Be specific; scope the task.** GitHub Docs: give "a broad description of the goal or scenario," then list specific requirements. Anthropic's before/after examples: "add tests for foo.py" → "write a test for foo.py covering the edge case where the user is logged out. avoid mocks."
- **Point to sources and patterns.** Reference specific files (`@file`), point to an existing example to mirror, and describe symptoms + likely location + what "fixed" looks like.
- **Break complex tasks into small steps.** GitHub Docs: "If you want Copilot to complete a complex or large task, break the task into multiple simple, small tasks."
- **Provide examples (few-shot).** Anthropic continues to "strongly advise" a few diverse, canonical examples over an exhaustive list of edge cases.
- **Tell it what to do, not just what to avoid**; use clear, direct language; use emphasis ("IMPORTANT," "YOU MUST") sparingly to improve adherence.
- **Let the agent interview you.** For larger features, have the agent ask clarifying questions and write a spec before coding.
- **Keep history relevant.** Start new threads for new tasks; delete stale requests.

### 6. Common beginner pitfalls and anti-patterns

Drawn directly from Anthropic's "Avoid common failure patterns" and practitioner writeups:

- **The trust-then-verify gap** — accepting plausible code that fails on edge cases. *Fix: always provide verification; if you can't verify it, don't ship it.*
- **The kitchen-sink session** — mixing unrelated tasks until context is noise. *Fix: `/clear` between tasks.*
- **Correcting over and over** — after two failed corrections, context is polluted with failed approaches. *Fix: clear and restart with a better prompt.*
- **The vague or over-specified instruction file** — GitHub's analysis "How to write a great agents.md: Lessons from over 2,500 repositories" (github.blog, Nov 2025) found that "Most agent files fail because they're too vague, not because of technical limitations" — vagueness, not length, was the single primary failure mode across 2,500+ analyzed files. Bloat is a secondary failure: an over-long `CLAUDE.md`/`copilot-instructions.md` causes the agent to ignore rules lost in the noise. *Fix: be concrete and specific; prune ruthlessly; if the agent already does it right, delete the rule.*
- **Infinite exploration** — un-scoped "investigate X" reads hundreds of files. *Fix: scope narrowly or delegate to a subagent.*
- **Vibing past a bad decision** — moving so fast that a bad architectural choice sails through. *Fix: plan and review at decision points.*
- **Skipping source control** — "vibe coding without source control is gambling" (Willison). Commit early and often.
- **Over-building** — the most common vibe-coding mistake is building too much before validating.
- **Blindly trusting security** — never assume generated code is secure or production-ready.

### 7. How GitHub Copilot maps to these concepts (2026)

Copilot in 2026 offers a spectrum of surfaces; the two agentic ones matter most:

- **Agent mode (in-editor, VS Code).** VS Code's official blog describes it as an "autonomous pair programmer that performs multi-step coding tasks... analyzing your codebase, proposing file edits, and running terminal commands," which "responds to compile and lint errors, monitors terminal output, and auto-corrects in a loop until the task is completed." It was introduced in preview February 24, 2025 and rolled out to all VS Code users April 7, 2025, complete with MCP support. This is Copilot's instantiation of the general agentic loop.

- **Coding agent (cloud, asynchronous).** GitHub's docs describe it as working "autonomously in a GitHub Actions-powered environment to complete development tasks assigned through GitHub issues or GitHub Copilot Chat prompts... make code changes on a branch, and optionally open a pull request." It became generally available for all paid Copilot subscribers on September 25, 2025. This is the "issue → draft PR" pattern and a natural home for the research-plan-implement loop.

- **Copilot Workspace was sunset (May 30, 2025)**; GitHub explicitly folded "all the great work on Copilot Workspace, and all the learnings" into the coding agent. Useful to mention so learners aren't confused by older tutorials.

- **Customization maps onto the general concepts:**
  - **Custom instructions** — `.github/copilot-instructions.md` (repo-wide) and path-specific `*.instructions.md` files = project memory / persistent context (the Copilot analog of `CLAUDE.md`). Copilot's coding agent also reads **AGENTS.md** (as well as CLAUDE.md/GEMINI.md).
  - **Prompt files** (`.prompt.md`) = reusable slash-command workflows (VS Code, Visual Studio, JetBrains).
  - **Custom agents** (`.agent.md`) = scoped personas/subagents, creatable via `/create-agent`.
  - **Agent Skills** — Copilot supports the open Agent Skills standard (`SKILL.md`) for its coding agent and CLI.
  - **MCP** — GitHub replaced proprietary Copilot Extensions with MCP; VS Code "implements the full MCP specification."
  - **Plan / Ask / Edit / Agent modes** — Copilot exposes distinct modes; "start with ask mode to scope the problem, then switch to agent mode for execution."

- **Governance and safety (built in).** GitHub's Copilot Agents responsible-use documentation emphasizes "human oversight, review of outputs, and responsible use." The coding agent "cannot approve or merge PRs," always produces a PR for human review, runs in an isolated environment, and its output is scanned (CodeQL, secret scanning). Crucially, GitHub's docs confirm the human-in-the-loop guardrail: "The developer who asks the agent to open a pull request cannot be the one to approve it," "The agent's internet access is tightly limited to a trusted list of destinations," and "GitHub Actions workflows won't run without your approval." GitHub's November 2025 security principles target data exfiltration, action attribution, and prompt injection. Copilot code review is explicitly a supplement, "not guaranteed to spot all problems."

- **Premium requests / cost.** Agent mode and the coding agent consume "premium requests" that iterate quickly; teach cost-awareness (scope tasks, use ask mode first).

### 8. Existing curricula and learning paths (for comparison/inspiration)

- **Microsoft Learn** — "GitHub Copilot Fundamentals" Parts 1 & 2, plus modules on agent mode, the coding/cloud agent, and the GitHub MCP Server. Strong on features; less on tool-agnostic concepts.
- **GitHub Copilot certifications** — **GH-300** (using Copilot: prompt engineering, responsible AI, features; delivered via Pearson VUE with associated course GH-300T00-A) and the newer **GH-600 "Agentic AI Developer"** (in beta as of mid-2026), a role-based certification "focused on how developers and teams operate, supervise, and integrate AI agents across the software development lifecycle (SDLC)," including MCP and agent customization. Useful as a competency checklist and an aspirational capstone.
- **DeepLearning.AI × Anthropic** — short course *Agent Skills with Anthropic* (Elie Schoppik): SKILL.md structure, progressive disclosure, skills vs. tools/MCP/subagents.
- **Anthropic Courses (Skilljar)** — "Introduction to agent skills"; interactive prompt-engineering tutorial.
- **Community bootcamps** — the free 4-week "GitHub Copilot Bootcamp" (Marcel Lupo/pwd9000) progresses across modes, prompt engineering, DevOps, testing, ethics; VIB's "Agentic Coding with GitHub Copilot" workshop; the Copilot Academy self-paced labs.
- **Key primary texts to assign** — Anthropic's *Effective context engineering* and *Building effective agents*; Claude Code best-practices docs; Simon Willison's *Agentic Engineering Patterns*; Addy Osmani's *Agentic Engineering*; the AGENTS.md spec; GitHub's Spec Kit.

**Gap "Beyond Boring" fills:** most existing material is either Copilot-feature-centric (Microsoft/GitHub) or assumes existing AI fluency (Anthropic courses). A concepts-first, tool-agnostic, total-beginner path built around the research-plan-implement loop and verification discipline — with Copilot as the practice vehicle — is under-served.

---

## Proposed Syllabus / Curriculum

Design principles: (1) **concepts before tools**; (2) every module ends with the learner *doing* something small; (3) **verification and safety are threaded throughout, not bolted on**; (4) build from mental models → workflow → customization → responsible practice. Nine modules, each ~60–90 minutes of instruction plus hands-on time. Exercise ideas are intentionally high-level topic prompts only (the requester will design actual mechanics separately).

### Module 0 (optional primer): Why agentic coding, and why now
- **Objectives:** Distinguish autocomplete, chat, "vibe coding," and "agentic engineering"; articulate why disciplined agent use matters.
- **Key concepts:** Karpathy's vibe coding → agentic engineering shift; Osmani's "AI does implementation, human owns architecture/quality/correctness"; the spectrum from throwaway prototype to production.
- **Exercise idea (topic-level):** Compare the same small task done "vibe" style vs. structured, and reflect on the difference.

### Module 1: How LLMs behave (the practical mental model)
- **Objectives:** Explain tokens, context window, non-determinism, and hallucination well enough to predict agent behavior; internalize "context is finite and degrades."
- **Key concepts:** Tokens; context window as working memory; context rot (Chroma) and lost-in-the-middle; attention budget; temperature/non-determinism; why models fabricate; "an agent = LLM using tools in a loop."
- **Exercise ideas:** Observe an agent "forgetting" as context fills; deliberately elicit and then catch a hallucinated API; compare two runs of an identical prompt.

### Module 2: The agentic loop and structured workflows
- **Objectives:** Run the Explore → Plan → Implement → Commit loop; know when to skip planning; recognize the five workflow patterns.
- **Key concepts:** Anthropic's four-phase loop; the one-sentence-diff rule; workflow vs. agent; prompt chaining/routing/parallelization/orchestrator-workers/evaluator-optimizer; "simplest thing that works."
- **Exercise ideas:** Take a small feature through all four phases explicitly; practice reviewing and editing an agent's plan before any code is written.

### Module 3: Prompting and instruction-writing for agents
- **Objectives:** Write specific, scoped, example-backed prompts; use file references; let the agent interview you.
- **Key concepts:** Goal-then-requirements; scope the task; point to sources/patterns; symptom + location + definition of done; few-shot examples; instructions over constraints; keeping threads clean.
- **Exercise ideas:** Rewrite a set of vague prompts into specific ones and compare outputs; run an "agent interviews me → writes a spec" session.

### Module 4: Context engineering — curating the window
- **Objectives:** Manage context as a finite resource; apply compaction, clearing, note-taking, and just-in-time retrieval.
- **Key concepts:** Context engineering vs. prompt engineering; smallest high-signal token set; just-in-time vs. up-front retrieval; compaction; structured notes/agentic memory; when to `/clear` vs. let context accumulate.
- **Exercise ideas:** Take a bloated session and practice compaction/clearing; set up a NOTES.md-style memory pattern for a multi-step task.

### Module 5: Project memory & instruction files
- **Objectives:** Author an effective, tool-agnostic project instruction file; know what belongs in it and what doesn't.
- **Key concepts:** AGENTS.md as the open, cross-tool standard; CLAUDE.md and `.github/copilot-instructions.md` as tool-specific equivalents; path-specific instructions; "would removing this cause mistakes?" pruning test; be concrete not vague; keep it short; check it into git; the vague/over-specified-file anti-pattern.
- **Exercise ideas:** Draft an AGENTS.md for a sample repo; deliberately write a vague/over-stuffed one, observe degraded adherence, then sharpen and prune.

### Module 6: Reusable capability — skills, tools, MCP, subagents
- **Objectives:** Explain and use Agent Skills, MCP, slash-command/prompt files, and subagents; choose the right mechanism for a need.
- **Key concepts:** Tools as atomic agency; MCP (servers expose tools/resources/prompts; open standard; adopted across vendors); Agent Skills (SKILL.md, progressive disclosure, open standard); prompt/slash commands; scoped subagents/custom agents; skills vs. MCP vs. subagents; curated-skill quality matters (SkillsBench).
- **Exercise ideas:** Package a repeated workflow as a skill/prompt file; connect one MCP server and reason about what it exposes; delegate a research task to a subagent.

### Module 7: The research-plan-implement loop in depth + verification
- **Objectives:** Make verification the default; practice TDD-style agentic loops, self-correction, and spec-driven development.
- **Key concepts:** Verification as the #1 practice (tests/build/screenshot/lint as an external oracle); red-green TDD with agents (and the "don't let it edit the tests" trap); adversarial/fresh-context review; spec-driven development (Spec Kit `/specify`→`/plan`→`/tasks`→`/implement`, constitution.md); evaluator-optimizer loops.
- **Exercise ideas:** Give an agent a task with and without a verification criterion and compare reliability; run a spec-first build on a small feature; add a fresh-context review pass.

### Module 8: Safety, review, security & responsible use
- **Objectives:** Apply human-in-the-loop review; understand agent security risks and organizational guardrails (relevant to a bank/enterprise audience).
- **Key concepts:** "Never assume generated code is secure or production-ready"; mandatory human review; source-control discipline; permissions/allowlists/sandboxing; prompt injection and data-exfiltration risks; GitHub's security principles (isolated environments, CodeQL/secret scanning, agent can't merge or self-approve, limited internet access); code review as supplement not replacement; enterprise concerns (content exclusions, telemetry, audit trails); cost/premium-request awareness.
- **Exercise ideas:** Review an agent-generated PR adversarially for security and edge cases; design a lightweight team policy for when agents may/may not act autonomously.

### Module 9 (capstone): GitHub Copilot in practice, end-to-end
- **Objectives:** Fluently map every concept onto Copilot's surfaces and complete a full task safely and effectively.
- **Key concepts:** Ask/Edit/Plan/Agent modes; in-editor agent mode vs. cloud coding agent (issue → draft PR); copilot-instructions.md / AGENTS.md; prompt files; custom agents; MCP in Copilot; model selection; premium requests; PR review flow; how each maps back to Modules 1–8; transferability to Claude Code/Codex/Gemini CLI.
- **Exercise ideas:** Run one realistic task end-to-end through both agent mode and the cloud coding agent; produce a reusable project setup (instruction file + one skill/prompt file) the learner keeps.
- **Optional credential path:** point motivated learners toward GH-300 (using Copilot) and GH-600 (agentic AI developer) as external validation.

**Sequencing rationale:** Modules 1–2 build the mental model and the loop; 3–4 make the learner effective at communicating and curating context; 5–6 add persistence and reusable capability; 7 deepens the loop with verification; 8 makes it safe; 9 consolidates on the actual tool. Verification, source control, and human review recur in every module from 2 onward so they become reflexes rather than a final lecture.

---

## Recommendations

1. **Anchor the entire program on two reflexes: plan-before-code and verify-before-trust.** These are the highest-leverage, most transferable habits and are endorsed by every primary source. Make them the graded backbone of every challenge. *Threshold to change:* if learners consistently ship working, reviewed code without prompting for these, you can compress Modules 7–8.

2. **Teach concepts against tool-agnostic open standards (AGENTS.md, MCP, Agent Skills) and only then demonstrate the Copilot-specific file names.** This guarantees transfer to Claude Code/Codex and future-proofs the material against Copilot UI churn (note how Copilot Workspace was already sunset).

3. **Assign primary sources as pre-reading, not summaries.** Anthropic's *Effective context engineering* and Claude Code best-practices docs, Simon Willison's *Agentic Engineering Patterns*, and the GitHub Spec Kit repo are short, current, and authoritative. Learners who read the sources internalize the "why."

4. **Front-load the failure modes.** Because the audience is competent engineers new only to agents, their fastest growth comes from recognizing anti-patterns (trust-then-verify gap, kitchen-sink session, vague/over-stuffed instruction file). Teach these early and refer back to them.

5. **Because part of the audience is enterprise/bank-adjacent (PNC lineage), weight Module 8 heavily.** Cover permissions, sandboxing, prompt injection, secret handling, content exclusions, and human-in-the-loop PR review as first-class content, not an afterthought.

6. **Keep exercises tool-real but concept-first.** Since the requester will design the actual game mechanics separately, ensure each module's learning objective is independently assessable so challenges can be slotted in without reworking the syllabus.

7. **Establish a "definition of done" rubric early** (source-controlled, tested/verified, human-reviewed, context-clean) and reuse it as the acceptance criteria for every hands-on challenge.

---

## Caveats

- **The field moves monthly.** Model names, Copilot feature availability, pricing/premium-request mechanics, and even terminology ("coding agent" was renamed "cloud agent" in some GitHub docs) change frequently. Treat all product specifics as accurate around mid-2026 and re-verify against official docs before each cohort.
- **Some product-timeline details rest on secondary sources.** The exact Copilot Workspace sunset date (May 30, 2025) and claims of agent-mode GA across JetBrains (March 2026) appear primarily in secondary reporting; the firmly official milestones are agent-mode's April 2025 VS Code rollout and the coding agent's September 25, 2025 GA. Verify before publishing hard dates.
- **Practitioner blogs vs. primary sources.** Much of the richest tactical advice (session-clearing cadence, TDD traps) comes from practitioner writeups (Medium, Substack, personal blogs). These are directionally consistent with vendor guidance but are opinions, not vendor commitments — label them as such for learners.
- **"Best practice" is partly model-dependent.** Anthropic notes that as models improve, they "require less prescriptive engineering." Some current context-engineering tactics may become unnecessary; teach the underlying principle (finite attention, verify outputs) rather than brittle rituals.
- **Copilot ≠ Claude Code feature-for-feature.** Skills/subagents/plan-mode specifics differ across tools and change often; the mapping in Module 9 is conceptual, and exact UI/commands should be checked live.
- **No internal "Beyond Boring" curriculum documents were found** in the available Google Drive, so the audience/framing here is reconstructed from public Gem City TECH and Sunny Kolattukudy sources plus the task brief; validate specifics (cohort size, session length, prior tooling) with the requester.