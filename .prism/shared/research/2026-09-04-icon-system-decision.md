# The canonical DGS icon system - research + deferred decision

**Date:** 2026-09-04
**Status:** OPEN - deferred deliberately. An interim set is in use so work continues.
**Scope:** ecosystem-wide. 24+ Griot apps, every surface, every feature that needs a glyph.
**Why it is deferred:** the trigger was one rail needing seven glyphs. Gavin correctly escalated it -
this is a design-system decision, not a component decision, and it should not be closed under the
pressure of an unrelated task.

---

## S1 - The reframe that changed the question

The first pass optimised for the wrong thing. Asked "which pack is crispest at 10-14px," the answer
is Heroicons' 16px micro set - glyphs *redrawn*, not scaled, for tiny rendering.

But at 24-app scale the criteria invert:

> **A missing glyph in Audion or R3F Studio is a worse failure than a slightly soft one at 12px.**

Coverage, weight range, and licence-at-scale dominate. Small-size crispness is a tiebreak, not the
criterion. Heroicons (~300 glyphs) is disqualified by breadth alone.

## S2 - The constraint nobody asked for: Morphicons

**Morphicons** (`guillermolg00/morphicons`) was already on the Potluck shelf, undecided/later,
tagged to Lucid / Sigil / R3F Studio. Gavin remembered it; the shelf had it.

**It is not an icon pack.** It is a morphing engine - MIT, zero-dependency, ~7 KB gzip - that
animates transitions between icons *you supply*, using spring physics with optimal path alignment
and polar interpolation. Playground: https://www.morphicons.com

So it does not answer the question. It **constrains** it:

> the canonical set must be **stroke-based**, or Morphicons cannot operate on it.

Confirmed compatible out of the box: **Lucide / Tabler / Heroicons (outline) / Iconoir**, plus 200+
libraries via the shadcn registry. Heroicons *solid* and Carbon need a grid adjustment (`fitIcon`).

**Consequences:**
- Material Symbols (variable font) is a poor morph substrate.
- Heroicons' micro set is *solid* - the one thing that made it win the narrow question makes it lose
  the wide one.
- **How hard this constraint binds depends on an unanswered question:** is morphing a suite-wide
  interaction language, or a Lucid/Sigil flourish? If it is a flourish, stroke-based stops being
  mandatory and Streamline re-enters at full strength.

## S3 - The field

| Pack | Glyphs | Licence | Stroke | Weights | Small-size | Morph |
|---|---|---|---|---|---|---|
| **Streamline** | **449,332** across 14+ families | **Freemium - premium families are PAID** | varies (Line families yes) | enormous; incl. a purpose-built **Micro** family | best available (Micro is designed for it) | Line families yes |
| **Phosphor** | ~1,500 x **6 weights** | MIT | yes | **Thin / Light** / Regular / Bold / Fill / Duotone | weak in Thin at <=12px | yes |
| **Tabler** | 6,184 | MIT | yes, uniform 2px | one | thins out below 14px | yes |
| **Lucide** | ~1,500 | ISC (native) / MIT (Feather-derived) | yes | one (2px on 24 grid) | acceptable | **yes - named first by Morphicons** |
| **Iconoir** | ~1,600 | MIT | yes | one | acceptable | yes |
| Heroicons | ~300/size; 16px **solid** micro | MIT | outline yes, micro no | 16/20/24 | **best**, but solid | outline only |
| Material Symbols | ~2,500 | Apache 2.0 | variable font | opsz/FILL/wght axes | good (opsz=20) | poor |

### Streamline - the "buy" option, assessed honestly

- **Deepest by an order of magnitude.** 449k assets: Ultimate (80,843) / Core (54,680) / Flex
  (50,168) / Sharp (49,085) / Plump (48,949) / Material (37,080) / plus Micro, Freehand, Nova, Cyber,
  Vault, Logos, Pixel. Styles: Line, Solid, Duotone, Colors, Pop, Remix, Neon, Flat, Gradient.
- **It bundles the OSS sets** - Material Symbols, Tabler, Remix, Feather, Iconoir, Carbon, Solar,
  **Lucide**. That is strategically important: *an interim built on Lucide has a migration path INTO
  Streamline rather than away from it.*
- **The catch:** freemium. Free tiers exist; the strong families are paid, and per-family commercial
  terms were **not verifiable from the marketing page** - they need reading before any commitment.
- **The honest case for paying:** 24+ apps across 3D, audio, video, knowledge, planning and dev
  tooling will exhaust any 1,500-glyph set. The recurring cost of *not* having the glyph is
  improvisation, inconsistency, and per-app drift - which is exactly the "canonical" this decision
  exists to prevent.

## S4 - Interim decision (reversible by construction)

**Interim set: Lucide.** Chosen for **lowest regret**, not for being best:

1. **MIT/ISC** - no licence question to resolve before shipping.
2. **Morphicons names it first** - if morphing becomes suite-wide, it already works.
3. **Streamline bundles Lucide** - so if the canonical answer turns out to be Streamline, this is a
   migration *inward*, not a rewrite.
4. **Holds at 10-12px** better than Phosphor Thin, which is the aesthetic favourite but disappears at
   rail sizes.

**Made reversible in code, not in intention.** The glyphs live in ONE swappable map
(`LAYER_ICONS` in `skills/prism-brainstorm/scripts/helper.js`) as inline SVG. Swapping packs is
editing one block - not hunting glyphs across 24 apps. *This is the part that matters: an "interim"
with scattered call sites is a permanent decision wearing a temporary label.*

## S5 - What must be answered before this closes

1. **Is morphing a suite-wide interaction language or a Lucid/Sigil flourish?** This is the hinge.
   Everything else follows from it. Playing with https://www.morphicons.com answers it faster than
   any analysis.
2. **Does griotwave demand a hairline weight?** If yes, Phosphor Thin/Light is the only OSS pack that
   genuinely has one - and the small-size weakness becomes a real cost to weigh.
3. **What do Streamline's per-family commercial terms actually say?** Unverified. Must be read from
   the licence, not the marketing page.
4. **Coverage test against the HARD apps, not the easy ones.** Every pack has `settings` and
   `folder`. Search each candidate for: *waveform / spectrogram / mesh / vertex / lattice / timeline /
   transcript / graph / ledger / gavel*. Audion, R3F Studio, Synaptiq and Sigil are where a set runs
   out. **Do this before deciding - it is the only test that predicts the failure mode.**

## S6 - Links

| | |
|---|---|
| Streamline | https://www.streamlinehq.com |
| Phosphor | https://phosphoricons.com |
| Tabler | https://tabler.io/icons |
| Lucide | https://lucide.dev/icons |
| Iconoir | https://iconoir.com |
| Heroicons | https://heroicons.com |
| Material Symbols | https://fonts.google.com/icons |
| Morphicons - playground | https://www.morphicons.com |
| Morphicons - repo | https://github.com/guillermolg00/morphicons |

## S7 - Closing this decision

Two decisions close together, into the DGS plan's `oss-inspo` store via `dgs-plan-update` (the same
store the Gavel cockpit reads):

| Item | Axes to set |
|---|---|
| the canonical icon set | `decision` / `role: component` / `stage` |
| **Morphicons** | currently `undecided/later` - decide alongside; `role: component` if the motion layer ships, `pattern` if only the alignment maths is harvested |

Until then the interim stands, and it is swappable in one place.
