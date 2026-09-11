---
date: 2026-09-11
topic: diagram-design - the VISUAL GRAMMAR (vendored aesthetic reference)
target: apps/prism-viz-engine/vendor/diagram-design
status: harvest
---

# diagram-design - the visual grammar

Scope: the *look*. Packaging + the brand-token consent gate were harvested previously and are not
repeated. Every claim is `file:line` against
`C:\Users\digit\GriotApps\Prism\apps\prism-viz-engine\vendor\diagram-design\`.

Vendored footprint: 224 files - `SKILL.md` (587 lines), 40 `references/type-*.md`,
4 `references/primitive-*.md`, `references/style-guide.md` (182 lines), 4 `scripts/*.py`,
162 HTML files in `assets/` (40 types x {light, dark, full} + extra sub-forms + 5 templates +
`index.html` gallery + `icons.html` specimen).

---

## What the rendered examples actually look like

Five read end to end. They are the aesthetic, already drawn.

### `assets/example-architecture.html` (183 lines) - the reference figure

- **Page shell** (`:10-54`): body is `display:flex; align-items:center; justify-content:center;
  padding:3rem 2rem`, background `#f5f5f5`. One `.frame { max-width:1200px; width:100% }`.
  `svg { width:100%; min-width:900px; display:block }` (`:53`) - the figure never squeezes below
  900px; it scrolls instead of reflowing.
- **Header, two lines of type** (`:58-59`): an eyebrow `Architecture . Diagram Design` in
  Geist Mono, `0.66rem`, weight 500, `letter-spacing:0.18em`, uppercase, muted `#4f5d75`; then an
  H1 in **Instrument Serif 400**, `clamp(1.5rem, 2.4vw + 0.75rem, 2rem)`, `letter-spacing:-0.02em`,
  `line-height:1.15`, `margin-bottom:1.5rem`. Mono all-caps whisper over a serif headline - that
  contrast is the editorial signature.
- **Canvas** (`:73-74`): `viewBox="0 0 1000 480"`; a flat `#f5f5f5` rect, then the **dotted paper**
  overlay - `<pattern id="dots" width="22" height="22">` with `<circle r="0.9"
  fill="rgba(45,49,66,0.10)"/>` at `opacity="0.55"` (`:65-67`). Barely-there graph-paper tooth.
- **Zone before arrows before nodes** (`:76-81`): a `CONTENT` zone rect at 2% ink wash
  (`fill="rgba(45,49,66,0.02)"`, `stroke="rgba(45,49,66,0.10)"`, `stroke-width="0.8"`, `rx=8`),
  its eyebrow label sitting on a **paper-coloured mask rect** that punches a hole in the zone
  stroke (`:79`) - the label interrupts the border rather than floating over it.
- **Connectors** (`:84-93`): horizontals are plain `<line>`; the two off-axis runs are orthogonal
  elbows with quarter-arc corners - `d="M 496,240 H 692 Q 700,240 700,232 V 224"` - exiting the
  source side and entering the destination's **bottom/top**. Widths: link-blue `#2e5aa8` at 1.2,
  accent `#eb6c36` at **1.4** (the primary flow is the one heavier stroke), muted `#4f5d75` at 1.2,
  and the dashed cached-response return at `stroke-width="1"` + `stroke-dasharray="4,3"`.
- **Arrow labels** (`:96-109`): each is a 12px-tall paper `rect rx="2"` with 8px Geist Mono
  all-caps text at `letter-spacing:0.08em`, coloured to match its stroke (`HTTPS` blue, `SSR`
  coral, `RESP` / `READ MDX` / `QUERY` muted), floated ~8px clear of the line.
- **Nodes** (`:111-151`) are five 64px-tall boxes, `rx=6`, always drawn as a **pair**: an opaque
  `#f5f5f5` mask rect, then the styled rect. Each carries (a) a small **rectangular** type tag
  `rx="2"`, 12px tall, transparent fill, 0.8 hairline stroke, holding 7px tracked mono -
  `EXT` / `EDGE` / `ORIG` / `BUN` / `CMS`; (b) a 12px **Geist 600** human name; (c) a 9px Geist
  Mono sublabel (`Browser`, `Pages . cache`, `SSR + MDX`, `src/content/*.mdx`, `assets . og images`).
  Two nodes carry a **32px mono watermark numeral** (`01`, `02`) bottom-right at
  `rgba(45,49,66,0.06)` (`:124`, `:133`) - a ghost index, not a label.
- **Exactly one coral node**: Astro Origin, `fill="rgba(235,108,54,0.08)" stroke="#eb6c36"`
  (`:130`). Everything else is white / ink-wash / slate. Four other treatments sit side by side:
  external `rgba(79,93,117,0.10)` + `#7a8399`; cloud `rgba(45,49,66,0.03)` + `rgba(45,49,66,0.30)`;
  backend pure `#ffffff` + `#2d3142`; store `rgba(45,49,66,0.05)` + `#4f5d75`.
- **Legend** (`:154-179`): a horizontal strip below everything, opened by a full-width hairline
  `rgba(45,49,66,0.10)` at width 0.8 (y=404), the word `LEGEND` in 8px mono tracked 0.18em, then
  eight items on one row - 14x10 `rx=2` chips for fills, 28px stroke samples with real markers for
  arrows - labels in **8.5px Geist sans**. Item x-positions (40/180/340/436/528/636/784/900) are
  packed to content width, not a uniform grid.

### `assets/example-loop.html` (100 lines) - the radial form, and the one CSS-class example

- Unlike the others this one **styles by CSS class** (`:21-31`): `.ring`, `.spoke`, `.station`,
  `.station.focal`, `.hub`, `.node-name`, `.focal-name`, `.sublabel`, `.hub-name`, `.hub-sub`,
  `.arrow-label`, using shorthand `font:` declarations - `.node-name { font: 600 12px var(--sans) }`,
  `.sublabel { font: 400 8px var(--mono) }`, `.hub-name { font: 600 16px var(--sans) }`.
- **The form** (`:52-96`): six 160x64 `rx=6` stations sit on a single `r=240` circle inside a
  `1040x680` viewBox. The ring is drawn as **six separate arcs** on that radius
  (`A240 240 0 0 1 ...`), each carrying its own arrowhead - the clockwise direction is stated six
  times, never once. Six **dashed spokes** run station-to-hub (`stroke-dasharray:5 4`, soft
  `#7a8399`, their own `arrow-soft` marker) stopping 6px short of the hub stroke (`:60`).
- **The hub is inverted**: a solid ink `#2d3142` 200x104 `rx=8` block with **paper-coloured type on
  it** - `Shared memory` 16px Geist 600, `one record, every loop` 8px mono at `opacity:0.72`
  (`:29-30`, `:94-96`). Inversion, not colour, marks the centre.
- **Focal**: `Decide` only - accent-tint fill, `#eb6c36` stroke at `stroke-width:1.2`, and its
  *name text* also turns coral via `.focal-name` (`:24`, `:27`, `:81-82`).
- Only **two of six spokes are labelled** (`SIGNALS`, `OUTCOMES`) on 16px-tall `rx=4` paper masks
  (`:69-72`); the comment at `:68` states the rule - "sit beside the line with an 8px visible gap."

### `assets/example-sankey.html` (151 lines) - the quantitative form

- Three column eyebrows in 8px tracked mono: `BUDGET`, `TEST STAGE`, `OUTCOME` (`:68-70`).
- Nodes are **12px-wide solid ink bars** whose heights *are* the values (240 / 104 / 80 / 40 / 16 /
  20 / 188 / 32 px, `:95-102`).
- Ribbons are filled cubic paths at `rgba(79,93,117,0.18)` with **no stroke** (`:74-88`); the
  comment at `:72-73` states the geometry rule - both Bezier control points sit on the midpoint x so
  every band **meets its bar horizontally**, never at a slant. The two flaky-rerun ribbons are the
  single accent at `rgba(235,108,54,0.28)` (`:91-92`).
- Labels: outer columns anchored `end` / `start` outside the bars; the middle column centred **in
  the gutter above the bar** (`:108`). Name 12px Geist 600 + value 9px Geist Mono, every time.
- The legend (`:134-146`) closes with an **italic sans sentence** - "Two coral ribbons - flaky
  reruns burn ~8% of the monthly CI budget." An editorial caption inside the figure.

### `assets/example-venn.html` (111 lines) - the set form, with zero accent

- Three `r=140` circles at (500,180), (428,320), (572,320) - one up, two down (`:78-82`). Fills are
  near-nothing tints that compound in the overlaps: ink `0.04`, muted `0.05`, soft `0.05`; strokes
  are the three greys `#2d3142` / `#4f5d75` / `#7a8399` at width 1.
- The triple intersection is isolated by **chained clipPaths** (clip to Desirable, then Feasible,
  fill with Viable, `:65-89`) and filled **solid ink** so white type reads on it - `Shippable`
  14px Geist 600 `#ffffff` over `THE SWEET SPOT` 9px tracked mono `rgba(245,245,245,0.75)`
  (`:105-106`). The focal is inverted, not coral. **This example uses no accent colour at all.**
- Set labels sit inside each non-overlapping lobe: 14px Geist 600 name + 9px mono all-caps gloss at
  `letter-spacing:0.14em` (`PEOPLE WANT IT`, `WE CAN BUILD IT`, `BUSINESS SUSTAINS`).

### `assets/example-bar.html` (129 lines) - the chart form

- Gridlines first at `rgba(45,49,66,0.08)` width 0.8, topmost at 0.06 (`:47-52`); axes at
  `rgba(45,49,66,0.25)` width 1 (`:55-56`). Axis title `STORY POINTS` is 7px mono tracked 0.14em,
  **rotated -90 degrees** (`:44`) - the only sanctioned rotated text (the ban is on `writing-mode`).
- Bars: pitch 110, width 72, pad 19, stated in the comment (`:66`); each bar is again a paper mask
  rect then a styled rect at `rgba(79,93,117,0.15)` + `#4f5d75` width 1 - **no radius on bars**.
- One focal bar (S5): `rgba(235,108,54,0.12)` + `#eb6c36`, its value label coral **and weight 600**
  while every other value is 8px mono muted, and its category label `S5` alone turns coral
  (`:88-90`, `:112`) - the accent propagates to the axis, so the highlight survives cropping.

---

## The token system (real values)

`references/style-guide.md` is the single source of truth (`:3`): "Every diagram draws from this -
not from hex values inlined in other reference files."

### Semantic roles - all 10, light x dark (`style-guide.md:17-28`)

| Role | Purpose | Light | Dark |
|---|---|---|---|
| `paper` | Page background, default node fill | `#f5f5f5` (white-smoke) | `#2d3142` (jet-black) |
| `paper-2` | Diagram container bg, secondary fill | `#ececec` | `#393e53` |
| `ink` | Primary text, primary stroke | `#2d3142` | `#f5f5f5` |
| `muted` | Secondary text, default arrow stroke | `#4f5d75` (blue-slate) | `#bfc0c0` (silver) |
| `soft` | Sublabels, boundary labels | `#7a8399` | `#8e98ac` |
| `rule` | Hairline borders | `rgba(45,49,66,0.12)` | `rgba(245,245,245,0.12)` |
| `rule-solid` | Stronger borders, baselines | `#bfc0c0` (silver) | `rgba(191,192,192,0.25)` |
| `accent` | Focal / 1-2 max per diagram | `#eb6c36` (atomic-tangerine) | `#f08a59` |
| `accent-tint` | Fill for accent-bordered boxes | `rgba(235,108,54,0.08)` | `rgba(240,138,89,0.10)` |
| `link` | HTTP/API calls, external arrows | `#2e5aa8` | `#6a95d8` |

Brand source (`:30`): a five-colour palette - `jet-black #2d3142`, `silver #bfc0c0`,
`white-smoke #f5f5f5`, `atomic-tangerine #eb6c36`, `blue-slate #4f5d75`. `soft`, `rule` and `link`
are *derived* (lighter slate / ink-at-opacity / a saturated blue-slate) to cover roles the brand
palette does not name.

**Inversion rule** (`:34-36`): "Any `rgba(28,25,23, X)` in light becomes `rgba(250,247,242, X)` in
dark. Same opacities, RGB flipped. The accent gets a slight hue-shift brighter to read on dark
paper." (Note the rule text still cites the *previous* skin's ink RGB - see What NOT to copy.)

**The system, read as a whole:** a four-value greyscale with one warm spike. paper/ink are a
near-symmetrical pair (`#f5f5f5` <-> `#2d3142`); `muted` and `soft` are the same blue-slate hue
stepped lighter; everything structural is ink-at-opacity (0.02 / 0.03 / 0.05 / 0.06 / 0.08 / 0.10 /
0.12 / 0.20 / 0.25 / 0.30 / 0.40). Exactly two hues exist beyond the greys: coral for *editorial
focus*, one desaturated blue for *network calls*. Nothing else is ever coloured.

### Series palette - chart types only (`style-guide.md:42-50`)

| Token | Light | Dark |
|---|---|---|
| `series-1` | `#7c8f6f` (sage) | `#9caf8f` |
| `series-2` | `#5e7a9b` (dusty-blue) | `#82a0c0` |
| `series-3` | `#b8915a` (mustard) | `#d3ad7a` |
| `series-4` | `#9c6b50` (rust-brown) | `#b88670` |
| `series-5` | `#6e6479` (slate) | `#8d8298` |

Fills `0.18` light / `0.22` dark, strokes full colour. Authorised for **radar only** today (`:40`),
and explicitly "not a license to add color elsewhere" (`:50`).

### Terminal skin - a second fixed skin (`style-guide.md:56-66`)

`terminal-page #0a0a0a` . `terminal-paper #141414` . `terminal-bar #1b1b1b` .
`terminal-border #2b2b2b` . `terminal-ink #f5f5f5` . `terminal-muted #9a9a9a` .
`terminal-soft #5c5c5c` . `terminal-accent #ff5a36` . `terminal-accent-tint rgba(255,90,54,0.12)`.
Not brand-tokenised, outside the light/dark inversion (`primitive-terminal.md:5`). No pure black:
"true black clips on OLED and in print" (`primitive-terminal.md:62`).

### Typography - the 6 roles (`style-guide.md:74-81`)

| Role | Family | Size | Weight | Usage |
|---|---|---|---|---|
| `title` | Instrument Serif | 1.75rem | 400 | Page H1 |
| `node-name` | Geist (sans) | 12px | 600 | Human-readable labels |
| `sublabel` | Geist Mono | 9px | 400 | Port, protocol, URL, field type |
| `eyebrow` | Geist Mono | 7-8px | 500, tracked 0.18em, uppercase | Type tags, axis labels |
| `arrow-label` | Geist Mono | 8px | 400, tracked 0.06em | Arrow annotations |
| `callout` | Instrument Serif *italic* | 14px | 400 | Editorial asides only |

### Geometry tokens - all 7 (`style-guide.md:138-145`)

| Token | Value | Use |
|---|---|---|
| `stroke-thin` | `0.8` | Tag-box outlines, leaf nodes |
| `stroke-default` | `1` | Most strokes |
| `stroke-strong` | `1.2` | Emphasis strokes |
| `radius-sm` | `4` | Small tags |
| `radius-md` | `6` | Node boxes |
| `radius-lg` | `8` | Containers, rings |
| `grid` | `4` | Every coord, size and gap divisible by 4 (hard rule) |

### Node type -> treatment - all 7 (`style-guide.md:153-161`, mirrored at `SKILL.md:185-193`)

| Type | Fill | Stroke |
|---|---|---|
| `focal` (1-2 max) | `accent-tint` | `accent` |
| `backend` | `#ffffff` (white) | `ink` |
| `store` | `ink @ 0.05` | `muted` |
| `external` | `ink @ 0.03` | `ink @ 0.30` |
| `input` | `muted @ 0.10` | `soft` |
| `optional` | `ink @ 0.02` | `ink @ 0.20` dashed `4,3` |
| `security` | `accent @ 0.05` | `accent @ 0.50` dashed `4,4` |

The rendered examples match: `example-architecture.html:113` uses `rgba(79,93,117,0.10)` + `#7a8399`
for the user node (`input`), `:139` uses `#ffffff` + `#2d3142` (`backend`), `:147` uses
`rgba(45,49,66,0.05)` + `#4f5d75` (`store`).

### Shipped defaults as a system

`SKILL.md:25` names them as the gate trigger: paper `#f5f5f5`, ink `#2d3142`, accent `#eb6c36`
(atomic-tangerine). `style-guide.md:5` states the intent - "a cool editorial palette - white-smoke
paper, jet-black ink, atomic-tangerine accent, blue-slate muted." The constraints that hold it
together (`:176-181`): `ink` hits WCAG AA on `paper`; **one** accent only ("Two accents erases the
focal signal"); no rainbow - "if your brand ships 8 colors, pick 3"; exactly three families
(serif + sans + mono); and **paper is warm-neutral, never pure white** - "pure white turns the
design sterile."

---

## The geometry language

Stated once in `SKILL.md` section 6 (`:270-293`) and section 7 (`:350-365`); every type reference
inherits it rather than restating it.

- **4px grid, non-negotiable** (`SKILL.md:352`): all font sizes, padding, node dimensions, gaps and
  x/y coords divisible by 4. Allowed font sizes `8, 12, 16, 20, 24, 28, 32, 40`; node
  widths/heights `80, 96, 112, 120, 128, 140, 144, 160, 180, 200, 240, 320`; gaps `20, 24, 32, 40,
  48`; padding `8, 12, 16`; radius `4, 6, 8`. Exempt: stroke widths (0.8 / 1 / 1.2), opacities, and
  the 22x22 dot pattern (`:363`). The check is stated as a glance test - "if a coordinate ends in
  1, 2, 3, 5, 6, 7, 9 - fix it" (`:365`).
- **Radii**: 4 for tags, 6 for node boxes, 8 for containers / rings / zones. `rounded-2xl` is an
  explicit anti-pattern (`SKILL.md:155`) - "Max radius 6-10px or none."
- **Stroke rhythm**: 0.8 hairline (zone borders, tag outlines, gridlines, the legend rule), 1
  default (node strokes, axes), 1.2 emphasis (most connectors), with 1.4 used in practice for the
  single primary accent flow (`example-architecture.html:85`).
- **Arrowheads are one shape in three colours** (`SKILL.md:248-258`): `markerWidth="8"
  markerHeight="6" refX="7" refY="3" orient="auto"` around `polygon points="0 0, 8 3, 0 6"` - an
  8x6 flat triangle, no fletching, no curve. `arrow` (muted), `arrow-accent` (coral) and
  `arrow-link` (blue) are **always all three defined**, used or not. `example-loop.html:47` adds a
  fourth, `arrow-soft`, for the write-back spokes.
- **Dash vocabulary**: `4,3` optional / return / async and annotation leaders; `4,4` security
  boundary; `5,4` dashed arrows and loop spokes; `6,4` region boundary
  (`template-full.html:262`). The dash pattern "communicates semantic weight, not a different
  routing grammar" (`type-architecture.md:34`).
- **The six mandatory connector rules** (`SKILL.md:273-293`), each an automatic fail:
  1. Rounded right-angle elbows at `r=8` (6 minimum for tight layouts); **diagonals banned** unless
     endpoints share an axis.
  2. Label-to-connector gap of **6-10px**; the mask rect must never touch the stroke.
  3. **No overlapping connectors**; crossings use the bridge/hop arc; parallel runs offset >=12px.
  4. **Shared edge -> fan the attach points**: for N connectors on an edge of length L, point k
     sits at `L * k / (N + 1)`, >=12px apart (8px minimum on very small boxes).
  5. A connector must not pass behind a non-endpoint box; the single exception must be **dashed**,
     labelled at the visible end, with no arrowhead landing on the intervening box.
  6. A label mask must not overlap a node drawn *after* it (nodes paint last and would clip the
     text). Verified by `scripts/verify-geometry.py`.
- **Elbow and hop formulas** (`type-architecture.md:18`, `:44-48`):
  `M x1,y1 H mid-8 Q mid,y1 mid,y1+8 V y2-8 Q mid,y2 mid+8,y2 H x2` for the two-bend elbow, and
  `a 8,8 0 0,1 16,0` for the hop - an 8px-radius semicircular bump, applied to the *less important*
  line only, never to both.
- **Port selection** (`type-architecture.md:24-32`): vertical travel exits and enters top/bottom
  edges; left/right ports are reserved for mainly-horizontal runs, because "entering a node from
  the side on a mainly-vertical path looks like the arrow punctures the node face."
- **Z-order is fixed**: background -> zones -> arrows -> nodes (`type-architecture.md:54`;
  "Draw arrows before boxes", `SKILL.md:267`).
- **Every node is two rects**: an opaque paper mask, then the styled box (`SKILL.md:298-301`), so
  arrows cannot bleed through a translucent fill.
- **Zone wash and header gap** (`type-architecture.md:36`, `:64-68`): zone fill
  `rgba(45,49,66,0.02)` - "any stronger competes with node fills"; >=16px between the zone eyebrow
  and the first enclosed node; `zone y = node_top - 32`, `label mask y = zone_y + 4`; max 3 zones.
- **Complexity budget** (`SKILL.md:369-411`): 9 nodes, 12 arrows, **2 coral elements**, then ~40
  per-type ceilings (5 swimlane lanes, 12 quadrant items, 8 ER entities, tree depth 4, 6 layers,
  3 venn circles, 5 radar axes, 8 bars, 30 scatter points, 2 annotation callouts, and so on).
  Target density is stated as **4/10** (`:46`) - "Above 9 nodes, it's probably two diagrams."
- **Page rhythm** (`SKILL.md:417-420`): eyebrow -> serif title -> optional muted subtitle -> diagram
  -> 2-3 summary cards **with varied widths** (`1.1fr 1fr 0.9fr`) -> mono colophon footer above a
  hairline. Three equal-width cards are named as slop (`:153`).
- **Legend** is always a horizontal strip at the bottom, after all nodes, opened by a hairline, with
  the `viewBox` height expanded ~60px (`SKILL.md:332-344`).

---

## The motion controller

`assets/template-motion.html` (435 lines) is **the** controller. `animation.md:93` is explicit:
"Use `assets/template-motion.html` rather than inventing another controller. Its inline controller
is the executable implementation contract: copy that script body verbatim. The skin linter rejects
modified or additional controllers, even when they carry `data-diagram-controls`."

### What the motion actually looks like

One clock, five variables (`template-motion.html:20-24`): `--motion-fast:160ms`,
`--motion-step:480ms`, `--motion-hold:720ms`, `--motion-total:3600ms`,
`--motion-ease: cubic-bezier(.2,.8,.2,1)`.

The whole visible motion is: an item **fades from `opacity:.12` with `translateY(8px)` up to full**
over 480ms (`:48-61`). Not hidden (0.12 - a ghost of itself), not sliding far (8px - two grid
units). Two decorative extras exist: `.draw-path`, a duplicate connector stroked in accent at
`stroke-width:3` via `pathLength="1"` plus animated dash offset (`:62-72`, `:81`), and
`.flow-token`, a 6px coral circle travelling `translateX(240px)` over 3.2s (`:73-85`, `:221`) -
infinite only in `loop` mode (`:78-80`). Both are `aria-hidden` duplicates carrying no meaning
(`:219`).

Banned outright (`animation.md:46`): animating layout coordinates, connector routes, `viewBox`,
node dimensions or semantic text; and "zoom, parallax, bounce, shake, glow, particles, and
indefinite blinking." Four modes only (`animation.md:9-14`): `none` (default, no JS), `reveal`
(one autoplay run, never re-runs on viewport re-entry), `step` (paused semantic states), `loop`
(one decorative token, >=3s cycle).

### The controller itself

- Markup contract: `[data-motion-root]` carrying `data-motion-mode`, `data-step-count`,
  `data-step-current`, `data-frame`, `data-static-frame`; items marked
  `data-motion-item data-step="N"` each with a human `aria-label` (`:175`, `:194-217`).
- One IIFE per root (`:237-431`). Reads `?motion=static` and `?motion=step&step=N`, awaits
  `document.fonts.ready`, derives its hold from the computed `--motion-hold`, and builds the step
  announcement labels from the non-decorative items' `aria-label`s (`:251-254`).
- `render()` toggles `.is-visible` on every item with `step <= current`, `.is-current` on the exact
  step, and sets `data-frame` to `start | step | end` (`:274-288`). `play()` is a single
  `setTimeout` chain - never `setInterval` - cleared on pause, replay, page-hide and immediately
  after the final step (`:305-321`).
- Controls: Play / Pause / Replay / Previous / Next, min 44x44px, `aria-pressed` on play and pause,
  disabled at the ends, focus ring `outline: 3px solid var(--color-accent)` (`:98-114`, `:224-232`).
  Keyboard: left/right step, Home/End jump, Space toggles, unmodified `R` replays and is never
  intercepted under Ctrl/Cmd/Alt (`:334-351`).
- A visually-hidden `role="status" aria-live="polite" aria-atomic="true"` paragraph announces
  "Step 3 of 5: ..." (`:233`, `:266`), deliberately kept outside `[data-motion-controls]` so hiding
  the controls cannot hide announcements (`animation.md:91`).
- Auto-pauses on `visibilitychange` to hidden (`:353-355`) and live-reacts to a
  `prefers-reduced-motion` change by jumping to the complete frame, disabling **and** hiding
  controls, and writing "playback controls unavailable" (`:356-392`).
- Static-first is enforced structurally: only selectors under `.motion-ready` may hide anything
  (`:47`), and `.motion-ready` is added **last**, after binding succeeds (`:429`) - a script error
  leaves the complete diagram visible. `@media print` and `prefers-reduced-motion` both force every
  item to `opacity:1; transform:none` and hide controls plus decorative tokens (`:151-170`).
  `<noscript>` states the complete final diagram is shown above (`:234`).
- Capture contract (`animation.md:109`): two captures from the same URL, viewport, fonts and device
  scale must be **pixel-identical**; random delays, generated IDs, clocks and runtime path
  measurement are forbidden.

---

## Light / dark / full - how the variants differ

- **dark is a pure token swap; the geometry is untouched.** `diff example-architecture.html
  example-architecture-dark.html` changes only: the four `:root` hexes (`#f5f5f5` <-> `#2d3142`,
  `#4f5d75` -> `#bfc0c0`, `#eb6c36` -> `#f08a59`), the three marker fills, the dot pattern
  (`rgba(45,49,66,0.10)` -> `rgba(245,245,245,0.10)`), every ink-opacity wash flipped to
  white-opacity (zone `0.02` -> `0.03`, zone label `0.40` -> `0.35`), every mask-rect fill, and
  `link` `#2e5aa8` -> `#6a95d8`. **Zero coordinate changes.** IDs are re-slugged
  `architecture-title` -> `architecture-dark-title` (the per-variant ID rule, `SKILL.md:578`).
- **full is a different page composition around an identical SVG.** The diagram body is
  byte-identical apart from re-slugged IDs. What changes is the wrapper: the full token set appears
  in `:root` (paper-2, soft, rule, accent-tint, link); the header gains a **subtitle**
  (`max-width:58ch`, muted); the H1 scales up to `clamp(1.75rem, 3vw + 1rem, 2.5rem)`; the SVG
  moves into a **framed** `.diagram-container` (`paper-2` bg + 1px rule + 8px radius + 1.5rem
  padding + `overflow-x:auto`); and the page gains a **3-card grid at `1.1fr 1fr 0.9fr`** (white
  cards, 6px radius, 1px rule, **no shadow**, a 7px coloured dot beside a 0.875rem/600 title over a
  hairline, `li::before { content: '-' }` em-dash bullets in 0.8125rem muted) plus a mono colophon
  footer. Cards collapse to one column at 820px.
- **terminal is the only true re-skin**: `template-terminal.html` drops serif and sans entirely and
  sets everything in Geist Mono, wraps the figure in a 12px-radius window with a titlebar of three
  10px dots - **exactly one accent dot, never a traffic-light triad** (`primitive-terminal.md:58`) -
  an H1 prefixed `# ` through `::before`, and a `$` prompt line with the sign in accent
  (`template-terminal.html:84-108`). Type runs 1-2px *above* the default scale because monospace
  reads small next to the sans/serif mix it replaces (`primitive-terminal.md:54`).

---

## The 40 types (visual forms)

The catalogue is `SKILL.md:86-125` - Architecture, IT current-state, Flowchart, Sequence, State,
ER, Timeline, Swimlane, Quadrant, Radar, Polar, Loop, Nested, Tree, Org chart, Layer stack, Venn,
Pyramid, Bar, Waterfall, Treemap, Line, Gantt, Scatter, High-level, Process, Medallion, Data flow,
DP integration, DP security matrix, Sankey, Fishbone, Wardley, Kanban, Journey, Deployment,
Dependency, UML class, Story map, DB schema. Every type reference has the same four-part shape:
**Best for** -> **Layout conventions** -> **Anti-patterns** -> **Examples** (three asset paths).
The sample below is nine, spanning system / temporal / hierarchical / analytic families.

**Architecture** (`type-architecture.md`). Boxes and orthogonal connectors, grouped by tier or
trust boundary, primary flow left-to-right or top-down, "pick one and hold it" (`:7`). Dashed
boundary rectangles mark VPC / security group / trust zone, with their labels on a paper mask over
the boundary line (`:10`). It is architecture rather than data-flow because the nodes are
*components* and the zones are *trust*, not stages. Owns the elbow, bridge/hop and zone formulas
the whole skill borrows (`:14-68`).

**Swimlane** (`type-swimlane.md`, 20 lines). Horizontal lanes, one per actor, labelled in the left
margin with a Geist Mono eyebrow; lane dividers are **1px hairlines** (`:7`). Steps are rectangles
sitting *inside* the owning lane. The defining rule: "Handoffs (arrows crossing lane boundaries)
are the most important edges - consider coral on the handoff that introduces the most coupling or
latency" (`:9`). A step drawn across two lanes is an anti-pattern - pick one owner (`:14`).

**Timeline** (`type-timeline.md`, 20 lines). A horizontal hairline baseline at `stroke-width=1`
across the middle; tick marks at time boundaries with Geist Mono dates below; events as **filled
circles `r=4`** on the baseline with labels alternating above and below and a 1px hairline drop
connecting label to dot; major milestones get a **coral `r=6` circle** plus a bold Geist label
(`:6-9`). The honesty clause: "if intervals are non-equal, space the circles non-equally. Don't
fake linear spacing for aesthetics. Break the axis visibly if a region is too dense" (`:10`).

**Layer stack** (`type-layers.md`, 26 lines). 4-6 full-width bands, identical x and width, layer
height **56-72px**, width 800-880 inside a 1000 viewBox (`:6-7`). Each row reads left to right:
index tag (`L3`, `07`, `APPLICATION`) in 8-9px mono eyebrow -> layer name in Geist 14-16px/600 ->
sublabel in 9-10px mono muted, far right (`:8-11`). Divider `1px rgba(45,49,66,0.12)`, outer
silhouette 1px ink or muted. Fills: "either alternating subtle shades (paper / paper-2) OR all
paper with hairline dividers. Pick one and hold it" (`:13`). A direction indicator sits in the
LEFT margin *outside* the stack (`abstraction up`, `packets down`, `:14`). Coral on one layer.

**Nested containment** (`type-nested.md`, 22 lines). 3-5 rounded rects (`rx=8`) with consistent
inset padding (24-32px horizontal, 32-36px vertical). Level labels top-left in 7-8px mono tracked
0.14em, on a paper mask over the ring's top border (`:7`). The gradient *is* the hierarchy:
strokes run faint `rgba(..,0.30-0.45)` -> muted -> ink -> coral innermost, while fills step up
`0.015` -> `0.025` -> accent-tint (`:8-9`). Outer = broader, inner = more specific (`:3`).

**Pyramid / funnel** (`type-pyramid.md`, 33 lines). 4-6 trapezoids, each an SVG `<polygon>` of four
points, consistent 56-72px layer height, widths decreasing **linearly and honestly** (`:12-14`).
Name centred in Geist 12-14px/600, mono sublabel, optional side annotation carrying the drop-off
percentage. Two orientations that must never be mixed: pyramid (point up, apex = rarest) or funnel
(point down, narrow = conversion) (`:5-9`). Coral on exactly one layer, **never the base** -
"dilutes the apex = rare signal" (`:28`).

**State machine** (`type-state.md`, 21 lines). Rounded rects `rx=8`; start is a **filled ink dot
`r=6`**, end is a **ringed dot** (outer `r=8` outline + inner filled `r=5`) (`:7`). Transitions are
curved arrows labelled in Geist Mono in the form `event [guard] / action`; self-loops curve above
the state (`:8-9`). This is one of the few types where connectors are curves rather than elbows.
Coral on the state the reader should notice - "typically the error state, or happy completion".

**Tree** (`type-tree.md`, 24 lines). Root at top (or left), nodes 120-180 x 40-52px, `rx=6`, Geist
12px/600 name + optional 9px mono sublabel. The connector grammar is a **bus**: parent drops a short
vertical, a horizontal bus spans the siblings, each child takes a short vertical drop into its top
edge, all at 1px muted, never diagonal (`:8`). Leaves are marked by a thinner 0.8 stroke or simply
by terminal position. Max depth 4, max breadth 5, "pick 2 widths max" (`:10`, `:16`).

**Fishbone** (`type-fishbone.md`, 75 lines - the most geometrically specified). A 1.2px ink spine
runs left to right into an accent **effect box** at the head; category bones are straight diagonals
at a fixed **60 degrees**, alternating above and below; sub-causes are 32px horizontal ticks in
`soft` with 9px mono labels past the open end (`:7-9`). It carries the one explicit **diagonal
exemption** from the mandatory-elbow rule - "they are this type's defining grammar" - scoped to
bones and ticks only (`:10`). The math is pre-computed: `attach_x(k) = HEAD - 160 - k * 160`,
`dx = -96`, `dy = +/-168` (a true 60 degrees, integer-rounded), ticks at `m/6` along the bone via
`tick_x = attach_x - 16m`, `tick_y = CY -/+ 28m` - chosen so every coordinate lands on the 4px grid
(`:16-50`). It even states why five bones is the ceiling at `HEAD=1200` (the sixth tag clips the
viewBox at `x=-40`) and what must move together to add a sixth (`:41`). Its two accents - the
root-cause bone+tag and the effect box - are the entire budget (`:11`).

**Cross-type constants.** Every type: 1-2 coral maximum and usually exactly one; a mono eyebrow or
index tag as the machine-readable handle; Geist 12px/600 for the human name; 9px mono for the
technical gloss; hairline dividers rather than fills for structure; "draw connectors before nodes";
and an honesty clause wherever a shape encodes a quantity (timeline spacing, funnel widths, sankey
band heights, bar heights).

---

## The primitives (4 atoms)

### 1. `primitive-annotation.md` (36 lines) - the italic-serif aside

Three elements, always together (`:8-16`): (1) **italic Instrument Serif** text at `font-size="14"`,
`text-anchor="end"`, ink `#2d3142`; (2) a **dashed Bezier leader** -
`path d="M 820 44 Q 700 84 520 216"` at `stroke="rgba(45,49,66,0.40)" stroke-width="1"
stroke-dasharray="4,3"`; (3) a **landing dot**, `circle r="2"` filled ink. It is marginalia - the
examples given are *"structure IS the index"*, *"no imports, no configuration"* (`:3`).

Rules (`:19-22`): "Italic + serif together signal editorial voice against the diagram's sans/mono
body. Don't substitute italic sans or italic mono - the combination is load-bearing." Dashed
distinguishes the leader from primary arrows, which are solid. Callouts live in margins (top-right,
bottom-left), never inside the active diagram area. **Max 2 per diagram** - "More becomes
commentary, not signal."

Three colour intents (`:26-30`): neutral = ink text + `rgba(45,49,66,0.40)` leader; focal = coral
`#eb6c36` + `rgba(235,108,54,0.50)`; tertiary = muted `#4f5d75` + `rgba(45,49,66,0.30)`.
Anti-patterns (`:32-36`): a solid leader (reads as flow), italic sans or mono, crossing a primary
arrow or lifeline, and "using a callout to label something the diagram should label directly."

### 2. `primitive-sketchy.md` (43 lines) - the hand-drawn register

A single SVG displacement filter (`:8-13`):
`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4"` into
`feDisplacementMap scale="1.5"`, on a filter box of `x="-2%" y="-2%" width="104%" height="104%"`.
Tuning table (`:26-31`): `baseFrequency` 0.01-0.04 ("lower = lazy wavy lines; higher = jittery"),
`numOctaves` 1-3 ("2 is plenty"), `scale` 1-6 ("1 barely-there, 1.5 default, 2 visible, 4+
cartoon"), `seed` any integer for a different wobble.

**The critical rule** (`:33-34`): filter shapes, **not text** - "Displacement-mapped text becomes
illegible. Structure your SVG so text is in a sibling group outside the filtered group." Layout is
untouched; only strokes wobble. For essays and "working sketch" register; not for technical docs,
not for dense labels, and not for dark variants - "wobble reads as artifact on dark backgrounds"
(`:36-43`).

### 3. `primitive-icons.md` (827 lines) - the monochrome 24x24 set

See Typography + icons below. 87 icons, all `currentColor`.

### 4. `primitive-terminal.md` (76 lines) - the CLI-window skin

A full-page alternate skin, not a diagram element: a `.terminal` div at `border-radius: 12px` with
`terminal-paper` fill and a `terminal-border` hairline; a `.titlebar` strip in `terminal-bar` with
three 10px dots and a centred `titlebar-name`; a `.frame` body opening with a `$` prompt line
(`:9-46`). Inside the SVG the default tokens swap 1:1 onto their `terminal-*` equivalents and "the
hub/focal-node pattern (inverted fill for the one highlighted element) still applies" (`:48`).

Typography (`:50-54`): **everything is monospace** - "this is the one variant where that's correct."
Instrument Serif and Geist sans are dropped entirely; the page title is mono, bold, prefixed `# `
so it reads as a comment line; the eyebrow becomes a shell prompt with `$` in accent. Every role
runs **1-2px above** the default scale (node-name 12 -> 14, sublabel/arrow-label 8-9 -> 9-10, hub
label 16 -> 18).

Critical rules (`:60-64`): no pure `#000000` ("true black clips on OLED and in print"); one accent
only - a second focal uses white weight/size, never a second hue; the background dot grid stays
`rgba(255,255,255,0.06-0.08)`, "barely visible texture, not a visual competitor to the titlebar
chrome." Three titlebar dots, exactly one accent - "Do not use a red/yellow/green traffic-light
triad - that's a second and third hue, which the palette forbids" (`:58`).

---

## Typography + icons

### Faces

Three families, never more (`style-guide.md:179`): **Instrument Serif** (title 1.75rem/400, and
italic 14px for callouts only), **Geist** sans (node names, 12px/600), **Geist Mono** (sublabels
9px, eyebrows 7-8px tracked 0.18em uppercase, arrow labels 8px tracked 0.06em). One Google Fonts
link carries all of it (`style-guide.md:86`, repeated verbatim in every template):
`Instrument+Serif:ital@0;1`, `Geist:wght@400;500;600`, `Geist+Mono:wght@400;500;600`, plus
`Noto Sans KR` / `Noto Serif KR` / `Noto Sans TC` / `Noto Serif TC`. **No fonts are vendored** -
the only permitted external dependency is `fonts.googleapis.com/css2`, allowlisted by exact
hostname and exact path (`onboarding.md:95`); the shipped Latin-only examples carry the shorter
link without the Noto faces (`style-guide.md:97`).

**The load-bearing typography rule** (`style-guide.md:109`): "Mono is for *technical* content
(ports, commands, URLs, field types). Names go in Geist sans. Page title is Instrument Serif.
Italic Instrument Serif is reserved for annotation callouts. **Never JetBrains Mono** as a blanket
dev font."

**CJK** (`style-guide.md:89-131`): Geist and Instrument Serif carry no Hangul or Han, so a CJK
`<text>` *extends* its own family rather than swapping the skin. Three rules follow from the
metrics: sublabels stay Latin; a hard **12px floor** ("If a Korean name doesn't fit at 12px, cut
the name - don't shrink the type"); and arrow labels / eyebrows / legend text **switch register** -
a CJK label in a 7-8px tracked mono slot becomes 12px sans at weight 500, no tracking, no
uppercase, with its mask rect grown to 16px tall. The width budget is per *character*, not per
script: every wide or full-width character costs 1em, everything else costs its face's Latin
advance (0.60em sans, 0.62em mono), marks cost nothing; sum, multiply by size, add padding, round
up to the next multiple of 4 (`:99`). `verify-treemap.py` enforces exactly this for treemap cells.

### Icons

`references/primitive-icons.md` holds **87 icons as inline `<svg>` snippets** - counted by source
line: **55 Tabler** (MIT), **22 Simple Icons** (CC0), **3 log-z/logos** (MIT), **2 Devicon** (MIT)
(`:820-827`). Grouped under nine headings: Compute (6), People (4), Network (8), Data (8),
Kubernetes (6), Action (7), DevOps (6), Brand (20), Data stack (11), Language (3), Statistical
tools (5), File formats (3).

Selection, size, colour, placement (`:3`, `:7-9`):
- Every icon is 24x24 on `viewBox="0 0 24 24"` and uses **`currentColor`** so it "inherits ink from
  its parent SVG and adapts to the editorial skin or any user-onboarded brand palette."
- Selection is by name - the `### name` headings are the index; copy the fenced snippet.
- Resize and position by wrapping in `<g transform="translate(x,y) scale(s)">` - never by editing
  the path.
- Colour by setting `color`, `fill` or `stroke` on the parent group.
- **Two styles, kept apart**: generic icons are **stroked** at `stroke-width="1.5"` with
  `stroke-linecap="round" stroke-linejoin="round"` and `fill="none"` - "hairline, like the rest of
  the skill"; brand silhouettes are **filled**. "Don't mix the two styles in the same diagram
  unnecessarily."
- Each carries `aria-hidden="true"`; the specimen gallery `assets/icons.html` (108KB) is decorative
  by contract (`SKILL.md:581`).

**Note:** there is no `scripts/vendor/icons/` directory in this vendored copy - `scripts/` holds
only `drawio_extract.py`, `mermaid_extract.py`, `excalidraw_extract.py`, `self_check.py`. The 87
icons exist solely as inline snippets in `primitive-icons.md` plus the rendered `assets/icons.html`.

---

## The aesthetic stance

The phrases "no mermaid-slop" and "editorial diagrams your designer won't hate" do **not** appear
anywhere in the vendored bytes (grep for `slop|designer` returns only `SKILL.md:143`); they belong
to the upstream marketing copy, which was not vendored. The stance itself is stated plainly, in
four places.

**1. Deletion is the technique** (`SKILL.md:37-46`). "**The highest-quality move is usually
deletion.**" Applied: "Every node represents a distinct idea. Two nodes that always travel together
are one node. Every connection carries information. If the relationship is obvious from layout,
remove the line. Coral is **editorial, not a flag.** ... The schematic isn't done when everything is
added. It's done when nothing can be removed." Target density **4/10**.

**2. Refusing to draw at all** (`SKILL.md:54-61`). "Don't use for: quick unicode diagrams (use
wiretext); lists of things (table or bullets); simple before/after (table); one-shape diagrams
(just write the sentence)." The gate question: "*Would the reader learn more from this than from a
well-written paragraph?* If no, don't draw." The taste gate repeats it as a checkbox - "Would a
table / paragraph do the same job? (If yes - don't draw.)" (`:458`).

**3. The named enemy is "AI slop"** (`SKILL.md:143-158`). The universal anti-pattern table, verbatim:

| Anti-pattern | Why it fails |
|---|---|
| Dark mode + cyan/purple glow | Looks "technical" without design decisions |
| JetBrains Mono as blanket "dev" font | Mono is for *technical* content - ports, commands, URLs. Names go in Geist sans. |
| Identical boxes for every node | Erases hierarchy |
| Legend floating inside the diagram area | Collides with nodes |
| Arrow labels with no masking rect | Bleeds through the line |
| Vertical `writing-mode` text on arrows | Unreadable |
| 3 equal-width summary cards as default | Generic grid - vary widths |
| Shadow on any element | Shadows are out. Borders are in. |
| `rounded-2xl` on boxes | Max radius 6-10px or none |
| Coral on every "important" node | Coral is 1-2 editorial accents, not a signaling system |
| Reproducing Mermaid's renderer layout | Imports automatic spacing and routing instead of making an editorial layout |
| Any breach of the six connector rules | Diagonal slants, labels touching their stroke, masks clipped by a later node, overlapping paths, shared attach points, transit behind a non-endpoint box - each is an automatic fail |

**4. Import means redraw, never convert** (`SKILL.md:542`). "Source or renderer coordinates,
colors, fonts, and shape quirks are discarded. You keep the *content*: components, relationships,
grouping, direction." And in both import references: "**A faithful wiring dump is not an editorial
diagram**" (`import-mermaid.md:124`, `import-excalidraw.md:126`). Bounded in the other direction
too: "never invent a component to fill a layout, and never silently drop one" (`SKILL.md:545`), with
a **fidelity ledger** reported to the user.

**The positive position**, gathered: warm-neutral paper rather than white; borders rather than
shadows; hairlines rather than fills; one accent and exactly one; mono only where content is
literally technical; serif for the human voice; a clean borderless container by default because
"the extra chrome fights the figure" (`style-guide.md:182`); the dot pattern opt-in only, "visible
but quiet" (`:181`); and accessibility as part of the aesthetic, not a bolt-on - every figure
carries `role="img"`, a slug-prefixed `<title>` first child and a `<desc>` that "describes the
content, not the geometry" - "A shape-by-shape narration is worse than no useful description"
(`SKILL.md:574-581`).

Motion inherits the same stance (`animation.md:3`, `:138`): "Animation explains a complete static
diagram; it never supplies missing meaning" and "Motion that rescues an over-dense or unlabeled
static diagram" is an anti-pattern.

---

## What NOT to copy

Observed, not inferred - each is a stated or diffable fact in the vendored bytes.

1. **The shipped examples are off-skin, by the repo's own admission.** `style-guide.md:32`: "The
   pre-baked example HTML files in `assets/` were built under an earlier skin. Regenerating them
   against the current `style-guide.md` is a v5.1 task." Treat the 162 assets as *grammar*
   reference; take hex values from `style-guide.md`, not from the HTML.
2. **The inversion rule cites dead values.** `style-guide.md:36` still says "Any `rgba(28,25,23, X)`
   in light becomes `rgba(250,247,242, X)` in dark" - `#1c1917` / `#faf7f2`, the *previous* skin.
   The current ink is `#2d3142` and the examples correctly use `rgba(45,49,66,...)` ->
   `rgba(245,245,245,...)`. The same stale pair appears in the onboarding diff sample
   (`onboarding.md:134-142`, showing `#f5f4ed` / `#0b0d0b` / `#f7591f`) and at
   `style-guide.md:15` ("say `accent`, not `#f7591f`").
3. **`rule-solid` light and `paper-2` dark are effectively unused.** No example in `assets/` sets
   `#bfc0c0` as a light-mode border or `#393e53` as a dark container; `template-full.html:19`
   defines `--color-rule-solid: rgba(79,93,117,0.25)`, which does not match the `#bfc0c0` in
   `style-guide.md:25`. The token table and the templates disagree.
4. **Off-grid values survive in the shipped assets** despite the "non-negotiable" 4px rule:
   legend text at `font-size="8.5"` (`example-architecture.html:158-179`,
   `example-bar.html:122`), bar geometry at pitch 110 / pad 19 / `y=357,293,167,103`
   (`example-bar.html:47-105`), loop arc endpoints at `113.726` / `187.073` (`example-loop.html:53`,
   geometrically necessary on a circle), and sankey ribbons on 4px-clean stops but venn circles at
   `cy=320, r=140` with lobe labels at `y=386`/`402`. If a linter is written, these fail.
5. **The dot pattern is on in most examples but off by default in the spec.**
   `style-guide.md:181` and `SKILL.md:226` both say the default background is clean paper with no
   pattern; `example-architecture.html:74`, `example-bar.html:41` and `example-loop.html:50` all
   enable it at `opacity 0.55-0.6`. Copying an example inherits a non-default.
6. **`svg { min-width: 900px }`** in every template and example (`template.html:53`) - the figure
   never reflows below 900px and forces horizontal scrolling on narrow surfaces. Deliberate for
   screenshot fidelity; hostile to an embedded panel.
7. **Remote font dependency.** Every file loads `fonts.googleapis.com/css2` and nothing is
   vendored; offline or CSP-restricted surfaces fall back to `system-ui` / `ui-monospace` /
   `Times New Roman`, which loses the serif-vs-sans-vs-mono contrast the system calls load-bearing.
   `export.md` notes fonts substitute in offline tools (`output-spec.md:21`).
8. **`scripts/` is incomplete in this vendored copy.** `SKILL.md` and `animation.md` reference
   `verify-geometry.py`, `verify-motion.py`, `test-verify-motion.py`, `lint-skin.py` and
   `verify-treemap.py`; only `drawio_extract.py`, `mermaid_extract.py`, `excalidraw_extract.py` and
   `self_check.py` are present. Every geometry/motion/skin check named in the taste gate is
   currently unrunnable here. There is also no `scripts/vendor/icons/` directory.
9. **`assets/index.html` and `icons.html` are gallery chrome**, not diagram grammar - `icons.html`
   is 108KB of decorative specimens (`aria-hidden`).
10. **Consultant-special and terminal are register-locked.** `example-quadrant-consultant.html` is
    BCG/McKinsey 2x2 styling and the terminal skin is explicitly "not brand-tokenized, so skip it
    for onboarded output" (`SKILL.md:520`). Neither should be generalised.

---

## Lift notes for prism-viz-engine

Documentary observations about the shape of the thing, not recommendations.

- **The skin is one file.** `style-guide.md` is the only place hexes are authored
  (`style-guide.md:3`); type references speak in role names (`accent`, not `#eb6c36`). Any
  re-skinning surface has exactly one write target, and the SVG bodies do not change - proven by the
  light/dark diff being a pure token swap with zero coordinate deltas.
- **Three orthogonal axes** compose the 162 assets: *skin* (light / dark / terminal) x *page
  composition* (minimal / full-editorial) x *register overlay* (sketchy filter, motion, annotation
  callouts). Only the terminal skin changes typography; only the full composition changes the page
  wrapper; the SVG body is invariant across the first two.
- **The grammar is fully declarative and copy-pastable**: node = two rects + tag + name + sublabel
  (`SKILL.md:298-311`); arrow label = mask rect + 8px mono (`:318-322`); legend = hairline + LEGEND
  eyebrow + chips row (`:336-341`); three markers always defined (`:248-258`). A generator needs no
  layout engine for these, only the coordinate math each type reference already pre-computes
  (fishbone being the extreme case - `type-fishbone.md:16-50` gives closed-form attach points).
- **The motion controller is a literal artifact**, not a description: `assets/template-motion.html:
  237-431` is declared the "executable implementation contract" to be copied verbatim, with a
  linter that rejects variants (`animation.md:93`). It is surface-agnostic vanilla JS with no
  dependencies, keyed entirely off `data-*` attributes.
- **Accessibility and determinism are encoded as geometry**: slug-prefixed `<title>`/`<desc>` per
  variant (`SKILL.md:578`), `?motion=static` for pixel-identical capture (`animation.md:109`),
  static-first CSS where only `.motion-ready` may hide anything (`template-motion.html:47`, `:429`).
- **The taste gate** (`SKILL.md:449-503`) is a 40-item pre-output checklist in five groups - type
  fit, remove test, signal, technical, typography - and is the piece that makes the aesthetic
  checkable rather than advisory.
- **Griotwave comparison points** (for whoever maps the two systems): this skin is a 5-colour brand
  reduced to 10 semantic roles with a single accent; type is serif-title / sans-name / mono-technical
  at 12px-9px-8px-7px; geometry is a 4px grid with radii 4/6/8 and strokes 0.8/1/1.2; motion is
  480ms fade-plus-8px with a 720ms hold. Those four numbers sets are the whole system.
