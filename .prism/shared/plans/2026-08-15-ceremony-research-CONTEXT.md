# research stage — headless-aware release-cycle skills (Prism)

One job: map every interactive gate in the release-cycle skills and DESIGN (do NOT implement) a non-interactive answer-injection mechanism so the closing ceremony can run headless from Cowork. Research only. Do not edit or commit.

Repo: C:\Users\digit\GriotApps\Prism. Skills of interest: skills/prism-bookend, skills/prism-closing-ceremony, skills/prism-release, skills/prism-docs-update, and skills/prism-commit if the ceremony calls it.

## Inputs (pull via code-intel, do not inline whole files)
- The SKILL.md + any scripts/references of those skills; how prism-closing-ceremony orchestrates them.
- Any existing non-interactive or CI code paths already present.
- Precedent that already survives headless: the digital-griot-mcp file-bus (brainstorm/gavel run headless), and the passive-bus section of cl-plugin-structure/references/channel-patterns.md.
- Use codebase-analyzer / graph-navigator for exact gate call-sites and the orchestration flow.

## Questions to answer
1. Enumerate EVERY interactive gate across the four skills — literal AskUserQuestion calls AND prose approval/confirmation gates (bump type, docs version, push yes/no, GitHub release yes/no, native-build confirmations, prism-commit approval). For each: which skill, what it asks, valid answers, safe default.
2. How does prism-closing-ceremony sequence bookend -> docs-update -> release (fail-fast? how is state passed? how does it honor each sub-skill gate)?
3. The cleanest INJECTION mechanism so a headless run supplies answers up front and the skills skip prompts, while interactive TTY use stays the default and unchanged. Weigh: an answers file in .prism (e.g. .prism/release-answers.json), an env var (PRISM_NONINTERACTIVE + answers path), a --answers flag, or the existing file-bus. Recommend one, grounded in how brainstorm/gavel already survive headless.
4. Blast radius: what breaks if done wrong (accidental push/release, wrong bump). How to keep it additive and safe (a dry-run mode?).

## Output
Write .prism/shared/research/2026-08-15-headless-release-cycle-research.md: a gate-inventory table, the orchestration map, 2-3 injection-mechanism options with a recommendation, risks, and open questions. No implementation.

## Heartbeat
Append one timestamped line to .prism/ceremony-research-progress.txt per step. Tokens: research-start, mapped-gates, mapped-orchestration, designed-injection, wrote-research-doc, DONE path=<file>. On block: BLOCKED-<short reason> then stop.