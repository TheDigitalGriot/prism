# ICM — Interpretable Context Methodology (sandbox)

Verbatim port of Jake Van Clief & David McDermott's ICM work, dropped into Prism as an
**isolated evaluation sandbox**. Nothing in Prism's Ideate→Research→Plan→Design→Implement→Validate
workflow depends on this. Delete `icm/` and `skills/icm-architect/` to remove it entirely.

Method: ICM (Van Clief & McDermott, arXiv:2603.16021, MIT). "Folder structure as agent
architecture": numbered folders carry sequencing, hierarchy carries context scoping, plain
markdown carries state.

## What's here
- `skills/icm-architect/` — the ICM Architect skill (registered via `skills/` auto-discovery; "ICM this").
- `icm/methodology/` — the Interpretable-Context-Methodology repo, verbatim: canonical `_core/CONVENTIONS.md`,
  templates, and example workspaces (course-deck-production, script-to-animation, workspace-builder).
- `icm/cost-of-remembering/` — the harness + paper measuring filesystem-memory vs long-context
  (~97% fewer tokens on LongMemEval).
- `icm/paper/2603.16021v2.pdf` — "Folder Structure as Agent Architecture".

## How to test it (Option A evaluation harness)
1. **Standalone sandbox** — run an ICM example workspace end to end; feel the 5-layer loading,
   numbered stages, stage contracts, and review gates.
2. **Real task, isolated** — "ICM this" a small Realtor/Griot job → `icm-architect` scaffolds a
   workspace in its own folder → run it → compare against doing it in raw Prism.

Watch the overlaps with what Prism already has (icm-architect vs prism-init/Fragment;
cost-of-remembering vs handoff/daemon memory; stage contracts vs stories). Those overlaps are the
integration map for a later, deliberate fuse into the pipeline (Option C) — **not** done here.

## Note
Conformance validated via `cl-plugin-structure`: `claude plugin validate .` passes; the skill
auto-discovers and is Cowork-compatible. The project-context cousin of this method already lives in
`skills/cl-plugin-structure/references/folder-architecture-routing.md` (the routing-table reformulation).

Ported 2026-08-04. MIT-licensed sources; each subfolder retains its `LICENSE`.
