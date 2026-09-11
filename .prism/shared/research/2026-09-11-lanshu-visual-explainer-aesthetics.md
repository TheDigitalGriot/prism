---
date: 2026-09-11
topic: Lanshu + visual-explainer — AESTHETIC and MOTION harvest
scope: apps/prism-viz-engine/vendor/lanshu, apps/prism-viz-engine/vendor/visual-explainer
register: documentarian (describe what exists)
prior-passes: Lanshu spec shape + .excalidraw serialiser (done); visual-explainer router (absent, done). This pass = look + motion only.
---

# Lanshu x visual-explainer — the visual layer

Two vendored trees at opposite ends of the same axis. Lanshu renders one fixed, art-directed,
black-canvas hand-drawn diagram to PNG + animated GIF + editable `.excalidraw`. visual-explainer
emits self-contained themed HTML pages. Everything below is read from source, with file:line.
Lanshu paths are relative to `apps/prism-viz-engine/vendor/lanshu/`, visual-explainer paths to
`apps/prism-viz-engine/vendor/visual-explainer/`.

---

# Lanshu

## Palette

`THEME` — `scripts/render_animated_diagram.py:19-38`. Every key, its real hex, and where the
renderer actually spends it:

| key | hex | role in the render |
|---|---|---|
| `bg` | `#000000` | pure black canvas (`:460`), and the Excalidraw `viewBackgroundColor` (`:274`). Also used as *ink* on light icon fills — the two rule-lines inside the `file` icon are drawn in `bg` on a coloured page (`:375-376`) |
| `white` | `#f4f0ee` | near-white warm off-white. Default text colour (`:284`), all main arrows/connectors (`:480`, `:492-494`, `:503`), icon outlines (`:371`, `:374`), signature top layer at alpha 245 (`:406`) |
| `muted` | `#cfc7c5` | warm grey. Title subtitle (`:468`) and the two *dashed* return paths (`:505`, `:538`) — the retry/loop edges are literally dimmer than the forward edges |
| `frame` | `#5c6265` | cool slate. The single thin outer rounded frame, 1174x994 at radius 29 (`:470`) |
| `core_stroke` | `#1d8be8` | saturated azure. Border of the Archive Core slab (`:486`), the three core cards (`:436`) and the output card (`:500`) |
| `core_fill` | `#04171e` | near-black teal-ink. Fill of the big core slab (`:486`) |
| `blue_fill` | `#081626` | near-black navy. Fill of the individual core cards + output card (`:436`, `:500`) |
| `green` | `#22c86f` | the signal colour. Title capsule text (`:467`), input box border (`:476`), decision diamond (`:497`), left + right panel borders (`:515`, `:543`), the `shield` icon body at alpha 180 (`:382`). Also the agent card `brand_color` (`agents/openai.yaml:4`, `#22C86F`) |
| `green_fill` | `#02160a` | declared `:27`; not referenced elsewhere |
| `source_fill` | `#02160a` | fill of the left "Memory Sources" panel (`:515`) — same value as `green_fill` |
| `pack_fill` | `#04180d` | fill of the right "Memory Pack" panel (`:543`) |
| `highlight` | `#124238` | deep pine. The rounded title capsule, used as BOTH stroke and fill (`:466`) so it reads as a solid block with green type on it |
| `purple` | `#bd54d3` | orchid. The 11px title tick-mark (`:464`), the centre "Archive Layers" panel border (`:522`), layer-card borders (`:529`), signature under-shadow at alpha 165 + the two scribble underlines (`:406-409`) |
| `purple_fill` | `#120814` | declared `:29`; not referenced elsewhere |
| `archive_fill` | `#080711` | fill of the centre panel and its footer chip (`:522`, `:536`) |
| `cyan` | `#7ee3d6` | default icon colour (`:369`) and the default `color` in card specs; signature mid-shadow at alpha 135 (`:406`) |
| `amber` | `#f4b64e` | the `hash` icon's two verticals (`:390-391`) and the `package` icon's interior seams (`:396-397`); the amber motion path (`:629`) |
| `pink` | `#ff7ab6` | one dot in the 8-dot brand mark (`:419`); otherwise available to specs as an icon colour |

Three ad-hoc hexes bypass `THEME` entirely: `#04200f` (pack-row and left mini-card fill, `:450`,
`:519`), `#052515` (decision-diamond fill, `:497`), `#17091d` (layer-card fill, `:529`).

**What kind of palette.** A dark-surface *signal* palette: one true black ground, one warm off-white
for all structural ink, and four saturated accents (azure / green / orchid / amber) used as
**channel identities**, not decoration — azure = the machine core, green = sources and the pass
gate, orchid = internal archive layers, amber = the reusable return. The fills are not tints of the
accent, they are near-black inks *biased* toward it (`#04171e` under azure, `#080711` under orchid,
`#04180d` under green), so each region has its own black. Saturation is high but luminance is very
low, which is what keeps a four-accent scheme from becoming a rave.

**Mood.** Studio-at-night. Chalk on a blackboard lit by an oscilloscope — the DailyDoseOfDS /
whiteboard-explainer lineage inverted to black, with the accents behaving like traced signal rather
than branding. The warm off-white (`#f4f0ee`, not `#ffffff`) and the warm grey `#cfc7c5` keep it
from going clinical-cyberpunk; the single `#5c6265` frame line reads as a printed plate edge.

## Hand-drawn treatment — two paths, two different pictures

Every draw call writes to BOTH surfaces at once: an `Excal` element list AND a PIL raster
(`draw_rect:300-302` calls `ex.rect` then `draw.rounded_rectangle`). The two outputs diverge
completely in how "hand-drawn" they actually are.

**Path A — `.excalidraw` (genuinely hand-drawn, by deferral).** `Excal.base` stamps
`"roughness": 1` on every element (`:199`) and `"fillStyle": "solid"` (`:197`). `Excal.text` sets
`"fontFamily": 5` (`:232`) and `appState.currentItemFontFamily: 5` (`:276`) — Excalidraw font id 5
is **Excalifont**, its hand-lettered face. Rectangles get `roundness: {"type": 3}` (`:218`),
arrows/lines `{"type": 2}` (`:260`), diamonds `{"type": 2}` (`:224`). Seeds and `versionNonce` come
from a fixed-seed RNG, `random.Random(2069769416930414980)` (`:182`), so the roughness jitter is
**deterministic** — the same spec re-renders to the same wobble. Lanshu does not draw the
hand-drawn look here; it emits the parameters and lets Excalidraw's rough.js do the sketching on
open. `--check` asserts every text element carries `fontFamily == 5` (`:732`), so the handwriting
is a contract, not a default.

**Path B — the PNG/GIF raster (hand-drawn only if the host has the fonts).** The raster has no
roughness at all — `draw.rounded_rectangle`, `draw.line`, `draw.polygon` produce perfectly true
geometry. The *entire* hand-drawn signal on this path is the typeface, selected by
`font_candidates` (`:54-72`):

- `hand=True` (`:56-61`): `/System/Library/Fonts/Supplemental/Chalkduster.ttf` ->
  `/System/Library/Fonts/MarkerFelt.ttc` -> `/System/Library/Fonts/Noteworthy.ttc` ->
  `/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf`
- `cjk=True` (`:62-68`): `STHeiti Medium.ttc` (bold) / `STHeiti Light.ttc`, then
  `Hiragino Sans GB.ttc`, `/Library/Fonts/Arial Unicode.ttf`,
  `/System/Library/Fonts/Supplemental/Arial Unicode.ttf`
- neutral (`:69-72`): `/System/Library/Fonts/Helvetica.ttc`, then `Arial Unicode.ttf`

All nine paths are macOS-absolute. `load_font` (`:75-81`) tries each, swallows `OSError`, and on
total failure returns `ImageFont.load_default()` — **which ignores the requested size**.
`hand=True` is requested for exactly the display copy: the title prefix at 47px (`:465`), the green
capsule at 44px (`:467`), section headings at 22-23px (`:477`, `:487`, `:516`, `:523`, `:544`),
core-card titles at 20px (`:438`), and the centre footer at 20px (`:537`). `has_cjk` (`:84-85`)
force-routes any CJK string away from the hand font to the CJK list (`:165`, `:288`), so the `@岚叔`
signature and Chinese subtitles are set in STHeiti, never in Chalkduster.

**Side by side.** On macOS: the `.excalidraw` is wobbly-stroked Excalifont on black — a true sketch,
fully editable; the PNG is *crisp* geometry carrying *hand-lettered* display type — a marker-pen
title over a precision-drawn schematic. That mixed register (loose lettering, tight rules) is the
actual Lanshu signature, and it is visible in both shipped GIFs.

### What the silent Windows fallback does to the LOOK (observed this session)

Ran the bundled renderer against the bundled spec on this Windows box (PIL 12.1.1). Every
`font_candidates` path misses, so every `load_font` call lands on `ImageFont.load_default()` —
here a fixed **10px** FreeTypeFont. Result, confirmed by rendering the PNG and looking at it:

- The 47px hand-lettered title, the 44px capsule word, the 22px section heads, the 20px card titles
  and the 11-14px body text **all render at the same 10px**. The typographic hierarchy — the thing
  that organises the whole composition — is gone; the title becomes a faint grey smear the size of
  a caption, and every card is a mostly-empty box with a speck of text centred in it.
- `fit_text` (`:157-173`) measures with the same broken font, so everything "fits" on the first
  try; the shrink ladder never engages and the art-directed text boxes sit near-empty.
- What SURVIVES intact: the palette, the panel geometry, all icons, every arrow, the glow pass, the
  grain, the vignette, and the full animation. The frame is unmistakably Lanshu — with the voice
  removed. It stops being hand-drawn and becomes a dark wireframe.
- The `.excalidraw` output is **unaffected** — `fontFamily: 5` is written regardless of host fonts,
  so opening the `.excalidraw` on Windows still gives the correct hand-lettered diagram.

On the earlier "4 of 7 tests fail" report: not reproduced here. `--check` returned `"ok": true` on
all 11 checks (exit 0) against this visually-broken PNG. The contract checks cover GIF
dimensions/frames/fps (`:704-712`), frame-diff motion (`:714-721`), Excalidraw ids/fontFamily/files
(`:728-735`) and PNG dimensions (`:741-747`) — **none inspect typography**, so the render passes its
own gate while looking wrong.

## Drawing primitives — the marks on the page

Global: `SCALE = 2` (`:16`) — the raster is composed at 2x and LANCZOS-downsampled at `:554`, so
every stroke is effectively supersampled. `c(v)` (`:46-47`) is the scale helper; `hex_rgba`
(`:41-43`) appends alpha.

- **`draw_rect` (`:300-302`)** — `radius=10` default, `width=2` default, `fill=None` means
  transparent. Emits an Excalidraw rect *and* `draw.rounded_rectangle` with `width=max(1, c(width))`
  (a "2" is a 4px stroke pre-downsample -> a true 2px mark). Real radii in use span 3 (folder tab,
  `:372`) -> 8/9 (cards) -> 14 (bottom panels, `:515`/`:522`/`:543`) -> 16 (title capsule, `:466`)
  -> 20 (core slab, `:486`) -> 29 (outer frame, `:470`): **radius encodes hierarchy** — the larger
  the container, the softer its corner. Fills are always the near-black region inks, never tints.
- **`draw_text` (`:283-297`)** — colour defaults to `white`; `fit=True` runs `fit_text`, else a
  straight `load_font`. Vertically centres inside the given box (`ty = c(y) + (c(h)-th)/2`, `:296`)
  and honours left/center/right (`:292-295`). Line `spacing` default 3 (scaled). `fit_text`
  (`:157-173`) steps the size DOWN one point at a time from requested to `min_size`, trying
  wrapped-then-raw at each step, with an emergency floor of 6px (`EMERGENCY_MIN_TEXT_SIZE`, `:144`).
  Wrapping is language-aware: CJK breaks between characters, Latin on spaces (`:115-116`).
- **`draw_line` (`:310-326`)** — `joint="curve"` on solid polylines (`:314`) so L-shaped routes get
  rounded elbows rather than mitred corners. Dashed style is hand-stepped along the path: 8 on / 8
  off for `dashed`, 2 on / 7 off for anything else (`:318-319`) — the dotted variant is much sparser
  than the dashed one. Arrowheads (`arrow_head`, `:359-365`) are open two-stroke chevrons,
  `length = 14 + width`, spread 0.52 rad (~30 deg per side) — there is no filled triangle anywhere
  in the renderer.
- **`draw_ellipse` (`:305-307`)** / **`draw_diamond` (`:329-334`)** — the diamond is a filled
  polygon then re-stroked as a closed polyline so the outline keeps the requested weight.
- **`icon` (`:368-399`)** — seven built-ins (`folder`, `file`, `scan`, `shield`, `db`, `hash`,
  `package`), all assembled from the same primitives at 2-5px weights, roughly 48-70px wide. `scan`
  is a 4px-stroked circle with a 5px handle; `shield` is a green polygon at alpha 180 with a 4px
  white check; `db` is the classic two-ellipse cylinder; `hash` mixes amber verticals with white
  horizontals. Unknown keys fall through to a filled dot (`:399`). No external icon set is ever
  fetched (`SKILL.md:19`, `references/spec-format.md:62`).
- **`draw_signature` (`:402-409`)** — a 3-pass chromatic offset: orchid at `(-1,+1)` alpha 165,
  cyan at `(+1,-1)` alpha 135, white at `(0,0)` alpha 245 — a deliberate mis-registration halo, like
  a slightly off CMYK plate. Then two hand-jitter underlines: an orchid 3px stroke through four
  irregular points, and a white 1px stroke at alpha 125 over the top.
- **`brand` (`:412-425`)** — an 8-dot 4x2 lattice of 5px filled ellipses at fixed offsets, coloured
  cyan / white / orchid / white / white / pink / white / green, anchored at (955,143) with the
  signature at (998,135).

## The glow system

`premium_finish` (`:557-596`) is the post pass that turns a flat schematic into a "premium" plate.
Three stacked effects on the downsampled 1x image:

1. **Bloom (`:560-571`).** A transparent `Image.new("RGBA")` layer; six rounded rectangles are
   stroked into it at **radius 18** and **alpha 70** — the outer frame (`frame`, 3px), the core slab
   (`core_stroke`, 3px), the centre archive panel (`purple`, 3px), the left and right panels
   (`green`, 3px), and the title capsule (`green`, 2px). The layer is then `GaussianBlur(4)`-ed and
   alpha-composited over the base (`:571`). So **only the six major container edges glow** — never
   the cards, never the text, never the arrows. The effect is a soft coloured halo hugging each
   region boundary, doing two jobs at once: separating regions on a pure-black ground without a
   second border, and reading as backlit acrylic / neon under glass. The bloom rects are hardcoded
   to the default layout's coordinates, so they track the fixed art direction rather than the spec.
2. **Film grain (`:573-581`).** 2600 single pixels at random positions, tone 120-220, alpha 4-14,
   from the *same* fixed seed (`:575`) — deterministic noise. Almost invisible individually; it
   keeps large black fields from banding and gives the plate a printed tooth.
3. **Vignette (`:583-595`).** A 180x170 luminance mask computed per-pixel as radial distance from
   (90,78) — an **off-centre** origin, high and slightly left — clamped to `(dist-0.38)*150` capped
   at 115, bicubic-upscaled to full size and composited as black alpha. The centre ~38% stays
   untouched, corners darken by up to ~45%, and because the origin is high-left the bottom-right
   falls off hardest — a subtle directional light rather than a symmetrical tunnel.

Separately, `draw_glow_dot` (`:599-603`) is the *animation's* glow, not the finish pass: three
concentric filled ellipses at radius 15/alpha 42, radius 10/alpha 70, radius 5/alpha 210, each
multiplied by a `strength` factor, then a 4px white core at alpha 245. That layered falloff is what
makes a travelling dot read as a light source rather than a disc.

## The animation as motion design

`animate_frame` (`:613-649`) composites a fresh transparent overlay per frame onto the finished
plate. `progress = idx / total` (`:617`) runs 0 -> ~1 across the loop.

**Defaults.** `DEFAULT_FRAMES = 41`, `DEFAULT_FPS = 20` (`:14-15`), canvas 1210x1138 (`:12-13`),
all overridable under `canvas` in the spec (`assets/default-spec.json:2-7` uses exactly these).
GIF frame duration is `int(1000/fps)` = **50ms** (`:661`), so **one loop = 41 x 50ms = 2.05s**.
Both shipped GIFs confirm: 1210x1138, 41 frames, 50ms.

**The 11 paths (`:618-630`)** — each is `(points, colour, phase offset)`, and each dot position is
`point_at_fraction(points, progress + offset + trail)` (`:633`): every dot loops its own segment
continuously, staggered by its offset so the board never pulses in unison.

| # | line | path | colour | offset | what it communicates |
|---|---|---|---|---|---|
| 1 | `:619` | (605,239) -> (605,316), straight down | green | 0.00 | ingestion — the four inputs dropping into the Archive Core |
| 2 | `:620` | (355,411) -> (472,411), rightward | cyan | 0.10 | Scan hands off to Import |
| 3 | `:621` | (732,411) -> (850,411), rightward | cyan | 0.24 | Import hands off to Index — same colour as #2, so the two core hops read as one continuous conveyor |
| 4 | `:622` | (982,456) down, left along y=481, down to (768,508) | azure | 0.38 | Index doubles back and drops into the decision diamond — the only dog-leg inside the core |
| 5 | `:623` | (826,568) -> (1022,568), rightward | green | 0.54 | the YES branch out of the gate into the Report card |
| 6 | `:624` | (707,568) left to x=510, on to x=222, then UP to (222,456) | orchid | 0.66 | the failure/retry branch — all the way back across the board and up into Scan. Longest path, and drawn dashed + muted in the static plate (`:505`): the retry is visibly the expensive move |
| 7 | `:625` | (156,637) -> (156,736), downward | green | 0.18 | "Read" — the core reaching down into Memory Sources |
| 8 | `:626` | (205,736) -> (205,637), upward | green | 0.58 | "Context" — sources feeding back up. #7/#8 are a deliberate counter-flowing pair 49px apart, so the left edge shows a two-lane exchange, not a one-way arrow |
| 9 | `:627` | six points, 458 -> 766 at y=890, one continuous run | orchid | 0.32 | a single dot traversing all four Archive Layer cards (Sources -> Records -> Versions -> Manifest) — one dot crossing four gaps, so the layers read as one pipeline rather than four boxes |
| 10 | `:628` | (855,890) -> (904,890) | **white** | 0.46 | "Compile" — the hand-off out of the archive into the Memory Pack. The only white dot: structural plumbing, not a channel |
| 11 | `:629` | (1036,735) up to y=691, left to x=766, up to (766,628) | amber | 0.72 | "Reusable" — the finished pack returning up into the decision gate. Amber appears nowhere else in motion, so the return trip owns its colour |

**Comet trails (`:632-634`).** Every dot is drawn three times at fractions `t`, `t-0.035`, `t-0.07`
with strengths `1.0 / 0.72 / 0.44`. At 41 frames that trail spans ~2.9 frames of path, ~145ms of
travel — short enough to read as a comet tail rather than a dotted line, and the strength ramp means
the tail fades as it lags.

**The pulse rhythm (`:635-647`).** Seven `pulse_targets`: the input box, the three core cards, the
decision diamond, the centre archive panel, the right pack panel. `active = (idx // 6) % 7` (`:644`)
means **exactly one** target is lit at a time and it advances every **6 frames = 300ms**. Across 41
frames the cursor walks 0,0,0,0,0,0,1,1,1,1,1,1,2,... reaching index 6 at frame 36 and holding it
for the last 5 frames — one near-complete pass per loop, with a slight truncation at the wrap. The
order is a guided tour of the diagram: **Input -> Scan -> Import -> Index -> Decision -> Archive
Layers -> Memory Pack**. The pulse teaches the reading order while the dots show the flow.

`pulse_rect` (`:606-610`) is the ring itself: alpha oscillates `70 + 70*(0.5+0.5*sin(phase))`, i.e.
70 -> 140, driven by `phase = progress * tau * 2` (`:647`) — **two full breaths per 2.05s loop**,
about 1 Hz. Three concentric rounded rectangles are drawn at grow 0/4/8 px with widths 2/2/1, alpha
reduced by `grow*8` (floored at 25) and radius `12 + grow`, so the ring is brightest and tightest at
the card edge and dissolves outward — a shockwave, not an outline.

**What a viewer actually sees over one 2.05s loop.** A still, dark, softly-haloed plate. Coloured
points of light are constantly in transit along every arrow at once, each trailing a short comet
tail: green falling into the core at the top; two cyan dots marching the three core cards
left-to-right; an azure dot dog-legging down into the green diamond; green exiting right to the
Report; an orchid dot sweeping the entire width back to the start (the retry); a green pair
counter-flowing down and up the left edge; an orchid dot running the four archive layers; a white
dot hopping the compile gap; an amber dot climbing back up the right side. Underneath that, one
region at a time swells with a soft double-ringed pulse for 300ms — input, then each core stage,
the gate, the archive, the pack — walking the eye through the whole story once per loop while the
light keeps moving. Nothing translates, nothing scales, no text moves: **the static plate never
changes; only light is added.** That is the rule `SKILL.md:58-59` states outright — prefer clean
white main arrows, use coloured motion only in the GIF overlay, let animation add motion, not
clutter.

## The rendered GIFs

`assets/previews/` ships two, both 1210x1138, 41 frames, 50ms/frame, 2.05s loop — the defaults
rendered on macOS with the handwriting fonts present. Both use the identical fixed layout; only the
copy differs, which is itself proof that this is a template, not a layout engine.

- **`memory-pack.gif`** (8.3MB) — matches `assets/default-spec.json` exactly. Title "The internals
  of" in chalk-marker lettering with an 11px orchid tick at its left, then "Memory Pack" in green
  inside the pine capsule; CJK subtitle underneath. A Source/Input box with four icons (cyan folder,
  pink file, amber file, cyan file). Archive Core slab in azure holding Scan / Import / Index.
  Green "Ready?" diamond, "Yes" to a Report card. Bottom band: green "Memory Sources" with a small
  green read-only badge, orchid "Archive Layers" with four layer cards and a "Redact + Dedup"
  footer chip, green "Memory Pack" with three pack rows. Brand dot-lattice and the signature
  top-right.
- **`claude-loops.gif`** (7.7MB) — same skeleton, different subject: "Claude Loops", with a Chinese
  subtitle on loop engineering. Trigger/Charter inputs (Goal / Loop / Source / Scheduler), Loop Core
  = Find / Act / Verify, a "Done? checks pass, nothing left" gate leading to Notify. Bottom: Work
  Queue (Tasks / Tests / Inbox), Control Layer (/goal, /loop, Check, State) with a
  "Retry + Remember" footer, Finished Work (Brief / Patch / Ping).

Both show the composed register described above — hand-lettered display type over precision
geometry, black ground, halos on the region edges, dots in transit. Also visible in both: a few card
bodies slightly exceed their card lower edge (the "MEMORY.md, skills / rollout summaries" line in
Memory Sources), and the "Compile" label overlaps the Manifest layer card — the fixed-coordinate
layout has no collision resolution, only the per-box `fit_text` ladder.

## References — stated aesthetic rules

`SKILL.md:53-61` "Style Rules": dark canvas with a thin outer rounded frame; one highlighted title
phrase in a green capsule; signature in the top-right brand slot; clean white main arrows with
coloured motion only in the GIF overlay; keep static diagrams restrained; short text — if a phrase
cannot fit, rewrite it instead of shrinking until unreadable; built-in icons only.
`references/spec-format.md:5-19` fixes the seven-zone layout model and calls the positions "fixed
art-directed"; `:21-30` gives copy-length budgets (title prefix 2-4 words, highlight 1-3, input
labels 1 word, core body 2 lines under 22 chars each); `:32-48` documents the text-fit ladder as "a
safety net for labels, not a replacement for concise copy"; `:64-79` is the quality bar (three
files, real frame-diff motion, unique ids, `fontFamily: 5`, empty `files`). `agents/openai.yaml:4`
fixes the brand colour at `#22C86F`.

---

# visual-explainer

All paths below are relative to `plugins/visual-explainer/`.

## The visual system

There is no single stylesheet for the main path — the skill generates a bespoke page each time and
governs it with (a) hard written constraints in `SKILL.md`, (b) four worked reference templates,
and (c) `references/css-patterns.md` (1800+ lines of copyable CSS). The only fixed stylesheet is
quick mode's `quick/base.css`.

**quick mode — the one literal stylesheet** (`quick/base.css`):

- Palette `:1-15` light — bg `#f4f1e9` (warm paper), surface `#fffdf7`, surface-2 `#ebe7dc`, border
  `#c8c1b1`, text `#252a2a`, dim `#636b68`, accent `#ad4f32` (terracotta), positive `#35745c`,
  warning `#a36d14`, danger `#a33c3c`, info `#356c8c`; shadow `0 16px 40px rgba(48,43,33,.09)`.
  Dark at `:17-32` is a re-pick, not an inversion: bg `#151a19`, surface `#202624`, text `#f1eee6`,
  accent `#e28564`. Both schemes ship, per `SKILL.md:94`.
- Background `:39-42` — a **32px double-gradient graph-paper grid** at 25% border opacity. Quiet,
  but the page is never a flat field.
- Typography `:44` body is `"Avenir Next", "Trebuchet MS", sans-serif`; at
  `:54,73,92,98,103,110,116,121` every label / chip / kicker / `th` / severity is
  `"Iosevka","Cascadia Code", monospace` at .68-.73rem with letter-spacing .04-.12em, uppercase
  where appropriate. `h1` is `clamp(2.25rem, 7vw, 4.8rem)` with `line-height:.98` and
  `letter-spacing:-.055em` (`:51`) — a very tight editorial display setting played against small
  mono labels. Body `line-height: 1.55`; `.summary` capped at `72ch`, section summary `76ch`
  (`:55,76`).
- Layout `:48` — `main { width: min(1120px, calc(100% - 32px)); padding: 52px 0 80px }`; sections in
  a grid with `gap:18px` (`:57`); cards `repeat(auto-fit, minmax(min(220px,100%),1fr))` gap 12px
  (`:78`).
- **The signature shape** `:63` — `border-radius: 5px 5px 18px 5px`. Asymmetric: three tight corners
  and one soft bottom-right. Cards echo it at `4px 4px 12px 4px` (`:84`), flow nodes at
  `3px 3px 12px 3px` (`:113`), the table wrap at `4px 4px 12px 4px` (`:94`). Nothing is a uniform
  pill — exactly what `SKILL.md:97` bans.
- Tone / severity encoding `:62,67-71,86-89,104-105` — a 4px top border on sections and a 4px left
  border on cards, coloured by `data-tone`; risk severity is a filled uppercase mono chip, red for
  high/critical, green for low. State lives in form, per `SKILL.md:102`.
- Flow edges `:117` use a downward-turn arrow pseudo-element in the accent colour; step/file indices
  `:110` are 28px circles outlined in the section tone.
- Responsive `:123-128` at 620px: the section head flips to `column-reverse`, risks collapse to one
  column.
- The favicon is an inline data-URI SVG (`quick/render.mjs:13`) — dark rounded square, amber hexagon
  outline, sky-blue centre dot — so every quick page is self-contained.

**The four templates, each a deliberately different palette** so the agent absorbs variety rather
than one house style (stated at `templates/mermaid-flowchart.html:10-11`):

- `templates/architecture.html:31-44` — IBM Plex Sans + IBM Plex Mono; warm terracotta/sage: bg
  `#faf7f5`, text `#292017`, accent `#c2410c`; dark `:58-68` bg `#1a1412`, accent `#fb923c`.
  Background is a radial accent-glow ellipse at 20% 0% (`:88`).
- `templates/mermaid-flowchart.html:31-45` — Bricolage Grotesque + Fragment Mono; teal/cyan: bg
  `#f0fdfa`, text `#134e4a`, primary `#0d9488`, secondary `#0369a1`, tertiary `#d97706`, danger
  `#dc2626`; dark `:48-60` bg `#042f2e`, primary `#2dd4bf`. Background is a 24px dot grid (`:68-69`);
  `h1` 38px at `-1px` tracking (`:101-107`).
- `templates/data-table.html:31-44` — **Instrument Serif** body + JetBrains Mono; rose/cranberry: bg
  `#fff5f5`, accent `#be123c`; dark `:54-64` bg `#1a0a0a`, accent `#fb7185`.
- `templates/slide-deck.html:34-46` — "Midnight Editorial": Instrument Serif + JetBrains Mono,
  dark-first bg `#0f1729`, surface `#162040`, accent `#d4a73a` (gold), border
  `rgba(200,180,140,.08)`; the *light* scheme is the media-query branch (`:58-68`), inverting the
  usual order.

**The written visual law** (`SKILL.md:90-109`) — palette must be custom properties
(`--bg`/`--surface`/`--border`/`--text`/`--text-dim` plus 3-5 accents); persistent pages ship both
schemes and "pick the second theme's values; never invert" (`:94`); one palette and one font pair,
picker only on request (`:95`); aesthetic anchored to the content domain — CLI/infra to terminal,
metrics to data-dense, plans to blueprint, recaps to editorial, prose to paper/ink (`:96`); an
explicit **banned-defaults list** (`:97`): no body font that is only Inter/Roboto/Arial/Helvetica/
system-ui, no violet-fuchsia Tailwind accents (`#8b5cf6`, `#7c3aed`, `#a78bfa`, `#d946ef`), no
cyan+magenta+purple neon dashboard, no gradient-mesh blobs, no purple-to-blue hero, no emoji section
markers, no centered-everything, no uniform large border-radius; running text near 65ch with
`text-wrap: balance` on headings (`:98`); a rem type scale with one root knob and hard minimums —
body >=14px, labels >=11px, mono >=12px (`:99`); "bias neutrals toward the accent hue; pure mid-grey
reads as unconsidered", gap over collapsing margins, `tabular-nums` (`:100`); depth used sparingly,
hero/elevated only for primary sections (`:108`); and `:109` **"Do not use continuous glow, pulse,
or breathing effects on static content"** — the exact effect Lanshu is built on. Curated font pairs
at `:103`, accent directions at `:105` (terracotta+sage, teal+slate, rose+cranberry, amber+emerald,
deep blue+gold). Design judgment at `:36-39` calibrates register: reviews/memos/audits get
"polished-utilitarian", showcases and narrative decks get "editorial", and the plan is audited once
against "would I produce this plan for any similar page?"

`references/css-patterns.md` supplies the component vocabulary: the token set `:9-51` (adding
`--node-a/b/c` semantic diagram accents), the rem type scale `:57-69`, four background-atmosphere
recipes `:77-107` ("flat backgrounds feel dead" — radial glow, dot grid, diagonal lines, gradient
mesh), card depth tiers elevated / recessed / hero / glass `:119-161`, code blocks `:193-213` (mono,
13px, `white-space: pre-wrap`, `border-radius: 8px`, `max-height: 400px` scroll) plus a file-header
variant `:224-254`, and then connectors, KPI cards, before/after panels, collapsibles, sparklines
and prose elements (lead paragraphs, pull quotes, bylines, callouts).

`references/themes.md:14-147` adds **eleven complete named palettes** — Dracula, Nord, One Dark,
Catppuccin Mocha, Tokyo Night, Gruvbox Dark, Synthwave '84, Solarized Light, GitHub Light,
Catppuccin Latte, Gruvbox Light — each defining the same 21 custom properties, plus five font pairs
(`:174-181`) and a runtime picker (`:189-268`). Explicitly opt-in, not a default (`:5`); a theme
there is one fixed palette, never a light/dark pair (`:7`).

## Theming of Mermaid and Chart.js — settled

**Mermaid is themed, and the theming is mandatory. This is not mermaid-slop.**

- `SKILL.md:80` — "Use `theme: 'base'` with custom `themeVariables` matching the page palette."
  `theme: 'base'` is precisely the Mermaid mode that discards the stock look and takes the page's
  colours; the default `theme: 'default'` (lavender nodes, Trebuchet MS) is never used anywhere in
  the tree.
- `templates/mermaid-flowchart.html:391-413` is the worked instance: `theme:'base'`,
  `look:'classic'`, `layout:'elk'` (ELK registered at `:390`), and **fifteen** explicit
  `themeVariables` — `fontFamily` set to the page's Bricolage Grotesque, `fontSize:'16px'`, and
  light/dark pairs for primary/secondary/tertiary colour+border+text, `lineColor`, and the three
  note variables. CSS additionally forces the SVG labels onto the page fonts (`:222,227` —
  `font-family: var(--font-body)!important` on `.nodeLabel`, `var(--font-mono)!important` on
  `.edgeLabel`), and `:18` documents the label size overrides (nodeLabel 16px, edgeLabel 13px).
- `references/themes.md:150-166` goes further and *forbids* storing per-theme Mermaid variables:
  `mermaidVars(css)` **derives all 18 from 6 palette values** (`--bg`, `--surface`, `--text`,
  `--text-dim`, `--accent`), "which is what keeps a diagram in sync with the page around it". The
  runtime picker re-renders every diagram on swap (`SKILL.md:143`).
- The chrome is mandated too: `SKILL.md:83-84` requires the canonical `diagram-shell` >
  `mermaid-wrap` > `zoom-controls` + `mermaid-viewport` > `mermaid-canvas` structure with zoom
  in/out/reset/expand, Ctrl/Cmd-scroll zoom, drag panning and click-to-expand — and `:82` states
  **"Never use bare `<pre class=\"mermaid\">`"**, which is the literal definition of the slop
  pattern. `<figure>` + a claim-stating `<figcaption>` + `role="img"` + matching `aria-label` on the
  shell (not the SVG, since re-renders replace it) are on the delivery checklist (`:140`).
- Content rules match diagram-design's register (`SKILL.md:72-76`): depict the mechanism, not its
  name; label every arrow (`writes`, `invalidates`, `polls every 30s`) because "an unlabeled arrow
  only says related somehow"; to compare options draw the difference; one figure, one claim, stated
  in the caption. Layout guidance at `:85-88`: prefer `flowchart TD`, `LR` only for simple 3-4 node
  linear flows, never define a page-level `.node` (Mermaid uses it internally), and for 15+ elements
  use a hybrid small-Mermaid-overview + CSS detail cards rather than one crammed diagram.
- **Chart.js** (`references/libraries.md:447-503`) is themed, but more lightly than Mermaid. There
  is an `isDark` branch for tick/legend colour (`#8b949e` / `#6b7280`), grid at
  `rgba(255,255,255,0.06)` / `rgba(0,0,0,0.06)`, and `fontFamily` pulled **from the live page** via
  `getComputedStyle(document.documentElement).getPropertyValue('--font-body')` (`:460-461`), so
  charts reliably inherit the page typeface. The dataset colours in the sample are hardcoded indigo
  (`#4f46e5` / `#818cf8`, `:470-471`) and the tick colours are literal hexes rather than
  `var(--text-dim)` — so the chart *palette* is a copy-and-edit step, not automatic. Charts are
  wrapped in a `.chart-container` built from `--surface`/`--border` with `border-radius: 10px`
  (`:492-502`). Chart.js is also scoped: "overkill for static numbers — use pure SVG/CSS for simple
  progress bars and sparklines" (`:449`), with pure-SVG sparklines provided at
  `css-patterns.md:1161-1177`.

## configs/ — what is configurable visually

`configs/` holds **no visual configuration at all**. The seven files — `antigravity/AGENTS.md`,
`codex/AGENTS.md`, `copilot/AGENTS.md`, `cursor/visual-explainer.mdc`, `openclaw/AGENTS.md`,
`opencode/AGENTS.md`, `pi/AGENTS.md` — are per-harness *install and activation* notes: where to copy
the skill directory, how to activate it, and the one shared output convention that generated pages
go to `~/.agent/diagrams/` and open in a browser when the environment allows. Visual configuration
lives entirely in `SKILL.md`, `references/themes.md` and `references/css-patterns.md`; runtime
switching lives in the opt-in picker (`themes.md:189-268`).

## Brand presentation and banner.png

`package.json:47` lists `banner.png` in `files` and `:79` sets it as the Pi package `image`, but
**the file is not present in this vendored tree** — no PNG or SVG asset exists anywhere under
`vendor/visual-explainer` (checked). The only shipped brand mark is the inline data-URI SVG favicon
used by quick mode (`quick/render.mjs:13`) and repeated in `templates/mermaid-flowchart.html:7`: a
`#0f172a` rounded square (14px radius) carrying an amber `#fbbf24` hexagon outline at 4px with a
`#38bdf8` centre dot. Package identity otherwise: name `visual-explainer`, v0.11.0, MIT, author
nicobailon (`SKILL.md:7-8`), two bins — `visual-explainer-mcp` and `visual-explainer-pptx`
(`package.json:81-84`). The presentation is deliberately un-branded: the *page* is the brand, and
the skill's own identity is a favicon.

---

# The comparison

| | **Lanshu** | **visual-explainer** |
|---|---|---|
| register | studio-at-night; marker lettering on black | polished-utilitarian to editorial; paper or midnight |
| output | PNG + GIF + `.excalidraw`, raster, fixed 1210x1138 | one self-contained HTML document, responsive |
| layout | **fixed art direction** — hardcoded coordinates, seven zones, no engine | generative — CSS grid, `auto-fit`, breakpoints |
| colour | four saturated signal accents on true black, each with its own near-black fill | token pairs, both schemes, 11 named palettes available, banned-defaults list |
| type | one display face (handwriting) plus fitted micro-labels | committed pairs, rem scale with hard minimums, mono labels |
| motion | **the whole point** — travelling comet dots, 300ms region pulse, ~1Hz breathing | entrance-only; `SKILL.md:109` explicitly bans continuous glow/pulse/breathing |
| editability | `.excalidraw` round-trips into a real editor | HTML is the source of truth; PPTX is lossy best-effort |
| text handling | fixed boxes plus a shrink ladder; can overflow | `min-width:0`, `overflow-wrap`, scroll containers, 65ch measure |
| scale | one diagram shape, forever | any page shape — slides, tables, prose, dashboards, code |

**What Lanshu does better.** Motion as explanation rather than ornament — the staggered dot phases,
the per-channel colours, the counter-flowing pair, and above all the 300ms pulse cursor that walks
the reading order. The composed register (loose lettering over tight geometry) reads as made by a
person. The finish pass — edge-only bloom, deterministic grain, off-centre vignette — is three cheap
operations that separate it entirely from screenshot-of-a-tool. Determinism: one fixed seed makes
the wobble and the noise reproducible. And it emits an **editable** artefact alongside the picture,
so the diagram is not a dead image.

**What visual-explainer does better.** Typographic discipline and layout robustness: measure caps, a
rem scale with floors, overflow guards, both colour schemes, semantic HTML, keyboard focus, a
pre-delivery checklist. Palette *governance* — a banned-defaults list, domain-anchored direction,
and the explicit "would I produce this plan for any similar page?" audit (`SKILL.md:38`). Diagram
governance — themed Mermaid with derived variables, required zoom/pan/expand chrome, figcaptions
that state a claim. And it scales to content Lanshu cannot express at all: tables, prose, slides,
dashboards, code.

**What belongs in one coherent engine, alongside diagram-design's editorial register.**
*From Lanshu:* the motion vocabulary (phase-staggered flow dots with 3-step comet trails, the
sequential region-pulse cursor as a reading-order teacher, ~1Hz breathe), the finish pass
(edge-only bloom at low alpha behind a Gaussian blur, seeded grain, off-centre vignette), radius as
hierarchy, channel-coloured near-black fills, dashed-plus-dimmed as the retry path, the dual-emit
idea (one draw call producing both a rendered artefact and an editable source), and fixed-seed
determinism. *From visual-explainer:* the token contract and the both-schemes rule, the
rem-with-floors type scale, the banned-defaults list and domain anchoring, `mermaidVars(css)`, the
required diagram shell with zoom/pan/expand and claim-stating figcaptions, the tone/severity
encoding, the overflow guards, and the delivery checklist. diagram-design supplies the editorial
frame both of them sit inside; Lanshu supplies the register that makes a plate feel authored;
visual-explainer supplies the discipline that keeps it readable at any size.

---

# What NOT to copy

1. **macOS-absolute font paths with a silent fallback** — `render_animated_diagram.py:54-72` plus
   `load_font`'s swallowed `OSError` (`:76-81`). Observed on this box: every requested size
   collapses to a 10px default and the entire typographic hierarchy disappears from the PNG/GIF
   while palette, geometry and animation survive. Any lift must resolve fonts through a bundled file
   or a platform-aware lookup, and **fail loudly**.
2. **A contract check that never looks at the pixels.** `check_outputs` (`:688-749`) returned
   `"ok": true` on all checks for the visually-broken Windows render. Dimensions, frame count, fps,
   frame-diff and JSON fields all pass without a single typographic or visual assertion.
3. **Hardcoded coordinates as the layout model.** The entire static composition (`:456-554`), the
   six bloom rects (`:562-569`), the 11 motion paths (`:618-630`) and the 7 pulse targets
   (`:635-643`) are literal numbers tied to one 1210x1138 canvas. Changing the canvas size in the
   spec moves the diagram but not the glow or the animation; a fifth input or a fourth core card is
   not expressible.
4. **No collision resolution.** Only the per-box `fit_text` ladder exists; in both shipped GIFs some
   card body text crosses its card edge and the "Compile" label overlaps the Manifest card.
5. **Dead theme keys.** `green_fill` and `purple_fill` (`:27`, `:29`) are declared and never read;
   three fills (`#04200f`, `#052515`, `#17091d`) are inlined at `:450`/`:519`, `:497` and `:529`
   instead of being tokens. The palette is not actually single-source.
6. **A 6-8MB GIF as the delivery format.** `optimize=False` (`:662`) on a 41-frame 1210x1138 GIF.
   Fine as a preview, heavy as a web artefact.
7. **`UPDATED = 1782475200000`** (`:17`) — a hardcoded future timestamp stamped onto every
   Excalidraw element (`:210`).
8. **Chart.js sample colours** (`references/libraries.md:470-471`) — hardcoded indigo `#4f46e5` /
   `#818cf8` and literal tick hexes, in a system that otherwise derives everything from tokens; and
   indigo sits adjacent to the palette family `SKILL.md:97` bans.
9. **A declared asset that is not shipped** — `banner.png` referenced at `package.json:47,79`,
   absent from the tree.
10. **Not a defect, but a conflict to settle deliberately:** `SKILL.md:109` bans continuous glow,
    pulse and breathing on static content; Lanshu's entire value *is* continuous glow, pulse and
    breathing. One engine needs an explicit rule for when a plate is *animated* (an explainer
    artefact) versus *static* (a document), rather than a silent merge of the two.

# Lift notes for prism-viz-engine

- **The motion vocabulary is the crown jewel and it is about 35 lines.** `draw_glow_dot`
  (`:599-603`), `pulse_rect` (`:606-610`) and `animate_frame` (`:613-649`) are the entire animation
  system. Port the *parameters* — 3-stop falloff at radius 15/alpha 42, radius 10/alpha 70, radius
  5/alpha 210 plus a white core at 245; trail offsets -0.035 / -0.07 at strength .72 / .44; ring
  grows 0/4/8 at widths 2/2/1 with alpha `70+70*sin` and radius `12+grow`; pulse advancing every 6
  frames; 41 frames at 20fps = 2.05s — and drive the paths from the spec's edge list instead of
  literals.
- **The finish pass ports verbatim and cheaply** (`:557-596`): stroke only the *container* edges, at
  alpha ~70 and radius 18, behind a Gaussian blur of 4; 2600 seeded grain points at alpha 4-14; an
  off-centre vignette. These three operations are what make the plate look expensive.
- **Dual-emit is the pattern worth keeping** — every primitive writes an editable element AND a
  rendered mark in the same call (`draw_rect:300-302`). For an HTML/SVG engine the analogue is
  emitting the SVG and its source graph together.
- **Take visual-explainer's governance wholesale**: the 21-token contract (`themes.md:11`), the
  rem-with-floors scale (`css-patterns.md:57-69`), the banned-defaults list (`SKILL.md:97`),
  `mermaidVars(css)` (`themes.md:155-166`), and the delivery checklist (`SKILL.md:130-148`).
- **Palette translation is nearly free.** Lanshu's THEME maps onto the token contract directly:
  `bg` -> `--bg`, `white` -> `--text`, `muted` -> `--text-dim`, `frame` -> `--border`,
  `core_stroke` / `green` / `purple` -> `--node-a/b/c` with `core_fill` / `pack_fill` /
  `archive_fill` as the matching `-dim` fills, `amber` and `pink` as remaining accents, `green` ->
  `--positive`. It is already a 21-property palette wearing different names.
- **Evidence from this session** (Windows, PIL 12.1.1): renderer executed against
  `assets/default-spec.json`; PNG inspected visually; `--check` exit 0 with `"ok": true` on all 11
  checks despite the collapsed typography. Both shipped GIFs read frame-by-frame at 1210x1138 /
  41 frames / 50ms.
