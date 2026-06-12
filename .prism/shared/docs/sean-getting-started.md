# Hey Sean — Your Prism Starter Guide

*A gift from your friend. You've got this.*

---

Prism is a Claude Code plugin that gives Claude a **disciplined creative workflow** instead of letting it dive straight into writing code or generating content at random. For a corporate website, this matters a lot — you want something that feels considered, not bolted together.

The core idea is simple:

```
Brainstorm  →  Design  →  Plan  →  Build
  (decide)    (architect)  (contract)  (execute)
```

Each stage has a hard gate: Claude cannot move forward until *you* approve what it produces. You stay in the driver's seat.

---

## Part 1 — Setup (10 minutes)

### 1.1 · Prerequisites

You need:
- **Claude Code** installed: `npm install -g @anthropic-ai/claude-code` (or via the desktop app)
- A **Max, Team, or Enterprise** Claude plan (plugins require it)
- **Claude Code v2.1.154 or later**: run `claude update` to check

### 1.2 · Install the Prism Plugin

From any terminal with `claude` available:

```bash
claude plugin install prism-marketplace/prism
```

That's it. No build step. Prism is pure markdown — it's a set of instructions that load into Claude's context when you invoke a skill.

### 1.3 · Open your project

Navigate to your corporate website project folder:

```bash
cd path/to/your/corporate-website
claude  # opens Claude Code in this directory
```

### 1.4 · Initialize Prism for this project

Once inside Claude Code, type:

```
/prism-init
```

Claude will create a `.prism/` folder in your project. This is where all your brainstorms, designs, plans, and research will live — committed to git alongside your code.

```
.prism/
├── shared/
│   ├── brainstorms/   ← decision ledgers from /prism-brainstorm
│   ├── designs/       ← architecture + .pen visual files from /prism-design
│   ├── plans/         ← implementation contracts from /prism-plan
│   ├── research/      ← codebase maps from /prism-research
│   └── ...
└── local/             ← your personal notes (gitignored)
```

You're set up. Now let's talk about how to actually use it.

---

## Part 2 — Brainstorm: Where Every Feature Starts

**The command:** `/prism-brainstorm`

Use this at the very beginning of any feature or design decision. For a corporate website, you might open a brainstorm session when you're deciding:
- "What should the hero section communicate?"
- "How should the nav work — sidebar or top bar?"
- "Should we have a case studies page or weave proof into the homepage?"

### What happens when you run it

Claude will ask you one clarifying question at a time. Not five at once — one. Answer it, and it asks the next. This feels slow at first but it produces something much better than a wall of questions.

After enough clarity, Claude proposes 2–3 approaches with trade-offs. You pick, discuss, refine.

At the end, Claude saves a **decision ledger** to `.prism/shared/brainstorms/`. This is a permanent record of what you decided and why. Future sessions can read it — so you don't re-litigate the same questions.

### The Visual Companion 🖥️

For layout and UI decisions, Claude will offer to open a **browser-based visual companion**:

> "This design involves visual choices. I can show interactive mockups in your browser for comparing options. Want me to start the visual companion?"

Say yes. It opens a live browser tab at `http://127.0.0.1:52341` and starts rendering actual mockups there as you talk.

**How fidelity works:**

As the session progresses, the mockups get progressively more polished. There are three levels:

| Level | What you see | When |
|-------|-------------|------|
| `lo` — Sketch | Dashed borders, desaturated, wireframe energy | Early throwaway exploration |
| `mid` — Structured | Solid borders, light blur, functional | Once a direction is forming |
| `hi` — Polished | Full glass-effect, ember bloom, neural-blue | Confirmed picks, final sign-off |

The levels escalate automatically as you make decisions. When you say something like "I like option A," Claude advances to the next question and might bump the fidelity. If you want to see something more polished right now, just type `/hi` and the next render goes full polish. Use `/lo` to go back to wireframe mode if you want to explore fresh.

**The drawer on the right side** of the companion shows your confirmed decisions and anything you've deferred ("parked"). When it reaches the **final confirmed decision**, Claude renders one last hi-fidelity screen — the ceremonial sign-off render. After that, the brainstorm is complete.

**Quick tip:** If a side-question comes up mid-session that isn't quite on topic, say "park this" and Claude will set it aside in the parking lot. Parking doesn't mean forgetting — parked items survive into the design phase as "Deferred Concerns."

### What comes out

A file like `.prism/shared/brainstorms/2026-06-08-homepage-hero.md` containing:
- **§1 Locked Decisions** — every confirmed pick with the reasoning
- **§2 Deferred Concerns** — the parking lot, deferred intentionally
- **§3 Reference Artifacts** — paths to your hi-fi mockup HTML files
- **§4 Implementation Handoff Notes** — a brief telling the next phase exactly what to do with this ledger

When the brainstorm is complete, Claude will offer: **"Ready to move to `/prism-design`?"**

---

## Part 3 — After Brainstorm: Two Paths Forward

At the end of a brainstorm session you have two complementary paths. They're not competing — they serve different layers of the same project and you can use both.

### Path A — Visual Prototype via Claude Design

**What it is:** You have Claude Design (the Anthropic desktop app at claude.ai/design). This is where your hi-fi brainstorm mockups become an interactive visual prototype with a real design system.

**The handoff tool:** `idea_init` — a companion app that runs the same brainstorm engine underneath but adds a fifth stage called **Emit**. After you've locked your decisions, the Emit view shows you a live `design_prompt.yaml` — a structured brief containing your locked decisions, design tokens (palette, typography, motion), and handoff notes.

**The handoff:**
1. In idea_init, click **"Export to Claude Design"** — it copies the `design_prompt.yaml` to your clipboard
2. Open Claude Design (the desktop app you already have, or `claude.ai/design` in browser — either works)
3. Paste and Claude Design builds your visual prototype and design system from it

One paste is the seam. There's no programmatic API yet, so clipboard is the correct ceiling.

**What comes out:** A visual prototype + exportable design system tokens that feed back into the build phase.

---

### Path B — Architecture via `/prism-design`

**The command:** `/prism-design`

This path is about *structure*, not visuals. It reads your brainstorm ledger and adds the engineering layer:

| Phase | Its job |
|-------|---------|
| **Brainstorm** | *Decides* — "We're going with top navigation" |
| **Design** | *Architects* — "Top navigation means: `Nav.tsx` with these props, this state, this responsive breakpoint contract" |

Claude reads your brainstorm ledger automatically and adds:

- **Mermaid diagrams** — page flow, component hierarchy, state machines
- **Interface contracts** — what props does each component take? What does the CMS schema look like?
- **Data models** — entities, relationships, validation rules
- **File/module boundaries** — exactly which files will be created or modified

Design does NOT re-open the questions brainstorm locked. The picks are final. This only adds the structural layer on top.

When design is done, Claude offers: **"Ready to move to `/prism-plan`?"**

---

### Which path first?

For a corporate website, a natural sequence is:
1. **Brainstorm** (decisions + visual companion)
2. **Claude Design** (visual prototype — get the look right while it's still cheap to change)
3. **`/prism-design`** (architecture — now that visuals are approved, spec the structure)
4. **`/prism-plan`** (implementation contract)
5. **Build**

You can also skip straight from brainstorm to `/prism-plan` if the approach is already obvious and you don't need visual prototyping.

---

## Part 4 — Research (the optional detective step)

**The command:** `/prism-research`

You don't always need research. Use it when:
- You're adding to an **existing codebase** you don't fully know yet
- You need to understand how a third-party integration works before planning
- A feature touches many files and you want a map first

For a fresh corporate website from scratch, you might skip research entirely and go:
```
/prism-brainstorm  →  /prism-design  →  /prism-plan  →  /prism-implement
```

But if you're integrating a headless CMS (Sanity, Contentful, etc.) or adding analytics, a research session will spawn agents to read the relevant docs and map out what you're working with before you plan.

**The Iron Law of Research:** Claude acts as a documentarian, not a critic. It describes what exists, never suggests improvements or critiques patterns — that would bias the plan. Pure documentation.

Research saves to `.prism/shared/research/` and is automatically available to the planning phase.

---

## Part 5 — Plan: The Contract

**The command:** `/prism-plan`

Planning is interactive and structured. Claude won't write a plan in one shot — it will:

1. **Present its understanding** — "Here's what I think we're building. Here are the key files. Here are the constraints. Does this match what you meant?"
2. **Propose phases** — "Here's a 4-phase approach. Does this structure make sense?"
3. **Write the full plan** only after you've approved both

The output is a file like `.prism/shared/plans/2026-06-08-hero-section.md`. This is the **contract** — Claude cannot deviate from it during implementation without pausing and asking you.

**Every plan has two types of success criteria:**

```markdown
#### Automated Verification:
- [ ] npm run typecheck passes
- [ ] Component renders without console errors

#### Manual Verification:
- [ ] Hero looks correct on mobile Safari
- [ ] CTA button links to the right page
```

Automated criteria can be confirmed by running commands. Manual criteria require *you* to look at the result. Prism separates these explicitly so nothing falls through the cracks.

**The No-Placeholders Gate:** Before any plan is finalized, Claude checks for `TBD`, `TODO`, or empty criteria in any step. If it finds any, it resolves them before showing you the plan. You should never see a plan with "Handle edge case TBD" in it.

---

## Part 6 — Build: Implement or Subagent

You have two choices here depending on the scale of your plan:

### Option A: `/prism-implement` — For smaller, focused plans

Claude executes the plan phase by phase, running verification at each checkpoint, and stops to ask you before moving to the next phase:

```markdown
## Phase 1 Complete

**Changes**: Created Nav.tsx, added responsive breakpoints, linked to SCSS
**Verification**: ✅ typecheck passed

**Next**: Phase 2 — Hero Section

Ready to proceed?
```

You confirm, it continues. If reality differs from the plan (a file is structured differently than expected), Claude surfaces it explicitly and offers options — it never silently deviates.

### Option B: `/prism-subagent` — For medium plans (3–10 tasks)

For more involved plans, Prism dispatches fresh subagents for each task and runs two-stage code review on every change (a spec-reviewer checks that the change matches the plan; a quality-reviewer checks for code quality issues).

You pick this when you have a plan with multiple independent tasks and want Claude to drive through them systematically with reviewers watching.

---

## Quick Reference Card

| When you want to... | Use |
|---------------------|-----|
| Start fresh on any feature | `/prism-brainstorm` |
| See layout options in browser | Accept the visual companion offer |
| Build a visual prototype from decisions | `idea_init` → "Export to Claude Design" → paste |
| Turn brainstorm into architecture | `/prism-design` |
| Map an existing codebase or API | `/prism-research` |
| Create an implementation contract | `/prism-plan` |
| Execute a small plan yourself | `/prism-implement` |
| Execute a medium plan with reviewers | `/prism-subagent` |
| Start a new project from scratch | `/prism-init` (first) → brainstorm |

### The typical flow for a corporate website feature:

```
/prism-brainstorm
    → Visual companion (pick layouts in browser, lo → mid → hi fidelity)
    → Decision ledger saved

    ├── Path A: idea_init Emit → "Export to Claude Design"
    │       → Paste design_prompt.yaml into claude.ai/design
    │       → Visual prototype + design system tokens
    │
    └── Path B: /prism-design
            → Architecture (mermaid diagrams, interface contracts)

    → /prism-plan
        → Implementation contract approved
        → /prism-implement  (or /prism-subagent for bigger plans)
            → Phases run with checkpoints
            → Done
```

---

## A Few Things Worth Knowing

**Nothing is irreversible.** Brainstorms, designs, and plans are markdown files in your git repo. You can read them, edit them, or throw them away. Claude doesn't do anything destructive without your say-so.

**The phases talk to each other.** When you run `/prism-design`, it automatically reads the most recent brainstorm ledger. When you run `/prism-plan`, it reads from the design file. You don't have to manually pass files around.

**Claude won't skip ahead.** Each phase has a hard gate that prevents implementation from starting until you've approved the plan. This might feel slow the first time, but it catches ambiguity before it becomes bugs.

**The parking lot is your friend.** During brainstorm, anything you're not sure about yet — park it. Parked items travel through design and plan as "Deferred Concerns." Nothing gets lost.

---

*Good luck with the corporate site. Reach out if anything's unclear — happy to walk you through a first session together.*
