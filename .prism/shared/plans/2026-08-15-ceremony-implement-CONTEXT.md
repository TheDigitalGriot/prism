# implement stage — headless-aware release-cycle skills (Prism)

One job: make the release-cycle skills headless-aware via answer-injection (research Option A). Additive ONLY — interactive TTY behavior must be byte-for-byte unchanged when PRISM_NONINTERACTIVE is unset. This is a Griot plugin change: conform to cl-plugin-structure. Do NOT bump versions. Do NOT commit.

Repo: C:\Users\digit\GriotApps\Prism.

## Inputs
- Working: .prism/shared/research/2026-08-15-headless-release-cycle-research.md (gate inventory + design; follow its §1 table and §3 recommendation).
- Reference (pull via code-intel, do not inline): skills/prism-bookend/SKILL.md, skills/prism-docs-update/SKILL.md, skills/prism-release/SKILL.md, skills/prism-closing-ceremony/SKILL.md (+ references/review-audit-gate.md), scripts/digital-griot-mcp/digital-griot-mcp.ts (resolveStateDir precedence), skills/cl-plugin-structure/references/channel-patterns.md.

## Decisions (locked — do not re-litigate, do not ask)
- Activation: env PRISM_NONINTERACTIVE=1. Absent ⇒ ignore the answers file entirely, keep today's interactive gates.
- Answers file discovery precedence: --answers <path> arg → PRISM_RELEASE_ANSWERS env → default .prism/local/release-answers.json. Add a .gitignore entry so .prism/local/release-answers.json is never committed.
- Shared resolver: scripts/resolve-answer.mjs — loads the answers file, exposes resolve(key, safeDefault) returning answers[key] when defined else safeDefault; for destructive gates (push, githubRelease, syncMirror) with no answer it returns false (fail-closed); tagCollision defaults to abort. Include a tiny self-test.
- Version: mirror the existing bookend B1 gate — the answers file supplies either confirmVersion:true (accept the suggested bump) or version:"X.Y.Z" (explicit override via bump-version.py --set). Do NOT invent a new version mechanism; do NOT auto-derive a bump silently.
- dryRun default true in the template — first headless run rehearses, stopping before commit/tag/push/GH-release.
- Gavin intent note (document, do not hard-code as the skill default): when Gavin invokes the closing ceremony he means a FULL push release (push, githubRelease, changelog, docs = true) unless he narrows it. This lives in the answers the ORCHESTRATOR writes, NOT in the skill mechanism — the mechanism stays fail-closed on missing keys.
- The single literal AskUserQuestion (prism-release Step 1 bump type): wrap it — if PRISM_NONINTERACTIVE, resolve from answers (version/confirmVersion); else AskUserQuestion exactly as today.

## Process
1. Add scripts/resolve-answer.mjs (the shared resolver + self-test).
2. Add a shared reference skills/prism-release/references/answers-resolution.md (or a repo-level doc) describing the schema, precedence, and per-gate keys — the four skills point at it.
3. Add release-answers.template.json (dryRun:true default) + a full-push example, in a documented location; add the .gitignore entry for .prism/local/release-answers.json.
4. Edit each gate in prism-bookend, prism-docs-update, prism-release, prism-closing-ceremony to add a short "if PRISM_NONINTERACTIVE, resolve <key> via resolve-answer (else prompt as today)" preamble — per the research §1 gate table (keys + safe defaults). Wrap the one AskUserQuestion accordingly.
5. Run cl-plugin-structure validation (claude plugin validate . + porter) and fix any conformance issue minimally.

## Success criteria
- Interactive path intact: every gate still prompts when PRISM_NONINTERACTIVE is unset (grep the gates; they remain).
- A headless resolution smoke test: with PRISM_NONINTERACTIVE=1 and a sample .prism/local/release-answers.json (dryRun:true), node scripts/resolve-answer.mjs self-test passes and resolves push/githubRelease to false when omitted.
- claude plugin validate . passes.
- git status shows only NEW files + the intended SKILL edits; NO version bump; nothing committed.

## Heartbeat
Append one timestamped line to .prism/ceremony-implement-progress.txt per step. Tokens: implement-start, wrote-resolver, wrote-schema-doc, wrote-template-gitignore, edited-bookend, edited-docs-update, edited-release, edited-ceremony, ran-cl-plugin-structure, selfcheck-pass, selfcheck-fail, DONE files=N. On block: BLOCKED-<short reason> then stop.