# Q5 · naming — the binding distinction

**Status: OPEN. Not decided.**

> Correction on the record: an earlier version of this file closed this question with a
> recommendation ("icm-architect → unchanged, not renamed, not absorbed"). That was taken, not
> agreed. Gavin's words were *"we should **consider** that in the architecture decision in Q5"* —
> an input to a discussion, not a verdict. The verdict is his. This file now holds the trade-space
> only.

## Gavin's input (verbatim)

> "there is a difference between spectrum in prism running the invariant contracts and a
> carte blanche tool like what was icm-architect. so we should consider that in the
> architecture decision in Q5"

## The observation the input rests on

| | **Spectrum** (in Prism) | **icm-architect** (carte blanche) |
|---|---|---|
| Binds to | a repo with `.prism/` — stories, plans, invariants, gates | nothing |
| Does | **runs** contracts: walks stages, heartbeats, enforces I1–I6, gates | **authors** a contract for work that has none |
| Requires | Prism installed | only the ICM protocol |
| Fails without | Prism's state dirs | never — it is a writing tool |

## The trade-space — three live positions, none chosen

**P1 · Split them.** Different binding = different tools. `prism-spectrum` → `spectrum` (execution);
the authoring tool stays separate and Prism-independent so it can be reached for in Cinopsis,
Lucid, Fragment, or a client repo with no `.prism/`.
*Cost:* two names to remember; the authoring tool keeps a third-party-sounding prefix.

**P2 · Fold them.** If Spectrum *is* Griot's implementation of ICM, authoring is part of that
implementation. One name, one front door, on every surface. Gavin has already locked that
ICM/Spectrum are interchangeable for us going forward — under that, `icm-architect` is arguably
`spectrum-architect`, or just part of `spectrum`.
*Cost:* implies a Prism dependency the authoring tool does not have; may stop it being used
outside Prism.

**P3 · One name, two verbs.** `spectrum` authors when no contract exists and runs when one does,
degrading gracefully in a repo with no `.prism/`. Single thing to reach for; the binding difference
becomes an internal detail rather than a naming problem.
*Cost:* unexplored. Needs thinking through — what does "run" mean with no state dirs?

## Separate finding (mechanical, not a decision)

- `prism-spectrum`'s own frontmatter still self-describes as the **Ralph-loop** identity:
  *"Spectrum-style single-story execution … Used by `spectrum.sh` orchestrator."* The re-founding
  on ICM has not happened in the skill itself. Whatever the name resolves to, this is the substance.
- **386 files** mention `prism-spectrum` (includes node_modules noise). Any hard rename would break
  references across docs, stories, mobile, CLI and website at once — and trip **I6** on contact.
  This constrains *how* a rename lands; it does not decide *what* the names are.

## Not in question

`icm/` is a verbatim MIT-licensed third-party port. It keeps the ICM name — attribution, not
preference.
