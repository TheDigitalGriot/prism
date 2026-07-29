---
date: 2026-07-28
author: Claude
repository: prism
branch: feat/prism-gavel
ticket: N/A
status: draft
research: none (dogfooded plan-first via prism-plan)
epic: prism-gavel
---

> On finalize, this plan emits `.prism/stories/stories.json` (the executable work-definition every
> executor reads) via the `decompose_plan` engine. See `.prism/shared/contracts/stories-contract.md`.
> Stories for this epic live at `.prism/stories/prism-gavel/stories.json`.

# prism-gavel — Implementation Plan

*Dogfood via prism-plan · 2026-07-28 · plugin: prism (GriotApps/Prism)*

## Goal

Wire the Gavel decision cockpit into Prism as a sibling skill to `prism-brainstorm`, driven through the generalized `digital-griot-mcp` channel, so a card **wakes the agent to act** (open a repo/video, scan the shelf, commit a batch, verify a slug) instead of the sandboxed artifact trying to act itself. The persisted-artifact iframe blocks external navigation; the drive loop is the real fix.

## Locked decisions

- **Home:** `skills/prism-gavel/` inside the Prism plugin — sibling to `prism-brainstorm`, Prism core untouched.
- **Channel:** rename `brainstorm-channel` → **`digital-griot-mcp`**, relocated to a neutral home (out of `prism-brainstorm/scripts/`); both siblings ride the one wire; more Griot tooling routes through it later.
- **Decision state:** stays in the DGS plan data + git (`griot-live-artifacts`, GriotMeta). No new store.
- **v1 surface:** the whole cockpit as driver — use·role·stage buttons + notes box + the four verbs.
- **Governance:** it's a change to the Prism plugin → follow `cl-plugin-structure`; ship via `prism-release` + closing-ceremony.

## Architecture — the drive loop

`cockpit (popout) → button → sendPrompt/channel → agent (real tools) → reflect → cockpit`

MCP tools (the plug-into-anything contract):

| tool | does |
|------|------|
| `gavel_state` | read the store — undecided cards, counts, by axis |
| `gavel_decide` | set use · role · stage · note on a card |
| `gavel_open` | open a repo / ▶ video (Chrome MCP) |
| `gavel_scan` | route a card to `griot-potluck-search` |
| `gavel_commit` | write a batch → plan + git (`dgs-plan-update`) |
| `gavel_verify` | resolve slug + stars → promote v / u / x |

## Structural impact

- **Touches:** `plugin.json` (rename mcpServers key + register `prism-gavel`), brainstorm's channel references (repoint to new name/path), new `skills/prism-gavel/*`.
- **Blast radius:** the channel registration is the one shared dependency — brainstorm must keep driving. Everything else is additive.

## Stories

### S1 — Scaffold `prism-gavel` skill
Create `skills/prism-gavel/{SKILL.md, visual-companion.md, references/, scripts/}` mirroring brainstorm; register the skill.
**Accept:** plugin validates; `prism-gavel` loads as a skill; brainstorm unaffected.

### S2 — Generalize the channel → `digital-griot-mcp`
Rename + relocate `brainstorm-channel` to a neutral path; update `plugin.json` mcpServers key + `channels`; repoint brainstorm; add gavel intents + the six tools.
**Accept:** brainstorm still drives through the renamed channel; gavel tools are callable; one shared wire.

### S3 — Lift the Gavel cockpit into the frame
Port the existing Gavel tab cockpit into `scripts/frame.html`; wire use·role·stage, notes box, and verbs via `helper.js` to the channel.
**Accept:** cockpit renders in the popout; controls update decision state **and** emit channel intents.

### S4 — Wire the verbs
`scan`→`griot-potluck-search`, `commit`→`dgs-plan-update`, `open`→Chrome MCP, `verify`→resolver.
**Accept:** each verb round-trips — click → agent acts → reflect.

### S5 — Package, verify, release, register
Bump Prism, sideload-verify, release via `prism-release` + closing-ceremony; register `prism-gavel` as an app in the DGS plan.
**Accept:** sideload clean; released; DGS plan shows `prism-gavel`.

## Risks

- **Channel rename regresses brainstorm** → rename in one commit, verify brainstorm drive *before* adding gavel.
- **Cowork channel behavior is "undocumented"** (per cl-plugin-structure) → verify the popout drive works in Cowork early, in S3, not at the end.
- **CFA / git in the Prism repo** → route file writes through the GriotMeta root + native `Copy-Item`, git via Windows-MCP PowerShell (per dgs-plan-update Rule 3).
