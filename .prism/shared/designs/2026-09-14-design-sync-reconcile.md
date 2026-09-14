# Design Sync - Reconcile + Push Plan

**Date:** 2026-09-14 · **Direction:** griotwave-ui -> Claude Design · **Status:** boundary drafted, awaiting Gavin
**Project:** Griotwave Design System `019de567-c5df-7ee3-8fa2-c07c1d06dd48`

## The reconcile, and what it reversed

The premise was that the remote design system was ahead and local was stale. It is the other way round.

| | components |
|---|---|
| Remote design system | **18** |
| griotwave-ui (local) | **92** |
| in both | 11 |
| remote only | 7 (all `ui_kits/griotwave-hub` + an uploaded `_ref_Card`) |
| **local only** | **81** |

The remote project has not seen a component since 2026-07-02. The local library shipped v0.2.0, v0.2.1 and v0.3.0 since.

## Three legs, one has run

1. **muse -> griotwave-ui** — RAN. 81 local-only components, including the whole 21st capture set vendored in with `sections/` demo wrappers.
2. **re-skin into griotwave tokens** — PARTIAL. 85 files reference tokens; **57 do not**. Of the vendored `components/ui/*`, only five were skinned: circle-menu, hover-button, interactive-list, motion-footer, spotlight-card.
3. **griotwave-ui -> remote design system** — NEVER RAN. This plan is that leg.

## Corrections to yesterday's claims

- **"The muse corpus was never reconciled."** The *corpus* is stale; the *library* is not. The captures were reconciled straight into griotwave-ui as vendored components, skipping the capture list entirely. Drift 45 measured the wrong surface.
- **"radial-orbital-timeline needs a port decision."** It is already in the library at `components/ui/radial-orbital-timeline.tsx` (13,411 bytes vs the capture's 13,265) with `sections/RadialOrbitalTimelineSection.tsx` beside it. Not a port question. It is vendored-not-skinned.
- **"agent-plan would be a great pattern if ramped up."** Also already vendored (25,806 vs 25,693) with `AgentPlanSection.tsx`. Its 30 `motion.` / 9 `AnimatePresence` / 3 `LayoutGroup` are present; SVG connectors still absent.
- **"griotwave-ui has no rail."** Still true, and now sharper: 92 local components and 18 remote, and no rail in either.

## The boundary

`finalize_plan` locks **84 paths**, all under `C:/Users/digit/GriotMeta/SkillsForge/griotwave/griotwave-ui/src`.

**Included** — every file that references griotwave tokens:

- `src/components/` — Surface, Refractive, GlassSwitch, GlassSlider, GriotwaveGridBackground, HubCard, Footer, Section, Card, Ambient, ShinyButton, GlowingButton, Wrap (+ their `.module.css` and `.stories.tsx`)
- `src/sections/` — 39 files, the Storybook surface
- `src/gavel/` — GavelSurface, DecisionCardStack, DecisionDrawer, WizardStepBar, the Lucid adapter
- `src/lib/`, `src/styles/global.css`, `src/stories/` — Foundations + Showcase

**Excluded** — 57 files with no token reference, held until leg 2 runs:

- 37 under `components/` (the raw 21st vendors incl. radial-orbital-timeline and agent-plan)
- 7 under `sections/`, 6 under `glass/`, 3 under `gavel/`, 2 under `styles/`, 1 under `lib/`

Reason: a design system should not carry unskinned third-party source. Pushing them would publish someone else's component as griotwave.

## Not in this plan

- **No deletes.** `deletes[]` is empty. The 7 remote-only paths stay.
- **No `.pen` touched.** Recorded by existence and mtime only.
- **No pull.** One direction per boundary.
- **The empty second project** `019dd262` is untouched.
