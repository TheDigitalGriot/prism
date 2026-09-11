# Archify — the VISUAL + INTERACTION layer

Date: 2026-09-11
Scope: `apps/prism-viz-engine/vendor/archify` — what the output LOOKS like and how it MOVES.
A prior pass covered the IR, schemas and validator ergonomics; none of that is repeated here.
Documentarian only: this describes what exists, not what should change.

## Two corrections to earlier assumptions (recorded before anything else)

1. **`renderers/shared/engineering-profiles.mjs` is NOT a visual module.** The name implies a
   visual profile; it is not one. The entire file (157 lines) emits *authoring diagnostics* and
   nothing else. The only profile is `deployment-ownership` (`engineering-profiles.mjs:3`), it
   applies only to `architecture` (`:150`), and every code path ends in `diagnostics.push(...)` or
   `throwDiagnosticError` (`:153`). It requires at least one `region` and one `security-group`
   boundary (`:30-41`), an owner in `tag` on every non-external component (`:45-54`), exactly one
   region per component (`:56-78`), a `security-group` for every `database` (`:80-92`),
   region-consistency inside private boundaries (`:95-117`), and a named `label` on every
   boundary-crossing connection (`:119-142`). **It changes zero pixels.** A profile is a validation
   contract, not a theme. The visual variable in archify is the **preset** (`classic` /
   `signal-flow` / `blueprint` / `editorial`), a different axis entirely, living in CSS.

2. **There is no `viewer/` directory and no `viewer/export.js`** in the vendored tree (`find` over
   68 files). The entire viewer runtime — interaction, motion, and the PNG / JPEG / WebP / SVG /
   WebM / ShareCard export pipeline — is inline `<script>` inside `assets/template.html`
   (lines 4977-14934). The earlier grep for `transition|animate|@keyframes` over a `viewer/` dir
   returned nothing **because the directory does not exist**, not because motion is absent.
   Motion is settled below: it is abundant.

---

## The template's visual system

`assets/template.html` — 14,934 lines, one file, four regions: pre-paint theme script (`:8-33`),
fonts (`:34-167`), main stylesheet (`:168-4975`), body + viewer runtime (`:4977-14934`).

### Pre-paint theme resolution
`template.html:8-33` runs before any CSS. Precedence: `?theme=light|dark` (`:15-16`) ->
`localStorage['archify-theme']` (`:25`) -> `prefers-color-scheme` (`:28`). Default when nothing
resolves is **dark**. It also reads `?embed=1` -> `data-embed` (`:17-19`) and `?present=1` ->
`data-present` (`:20-22`). Stated reason: stop a dark flash for light-preference readers (`:9-10`).

### Typography — how JetBrains Mono is vendored
`template.html:34-167`, a dedicated `<style id="archify-fonts">`. Six `@font-face` blocks, one per
unicode subset, each a **base64 `data:font/woff2` URL inlined in the file**: cyrillic-ext (1,664 B),
cyrillic (8,892 B), greek (6,800 B), vietnamese (5,872 B), latin-ext (11,596 B), latin (31,340 B) —
byte counts and sha256 for each recorded in the header comment (`:42-47`). Source stated as the
Google Fonts service revision v24 of JetBrains Mono (`:36`). All six declare
`font-weight: 400 800` (a variable axis) and `font-display: swap` (`:152`, `:156`, `:160`, `:164`).

Three decisions commented at `:37-39`:
- "These fixed bytes are shared by the viewer and its SVG/raster exports" — the same embedded font
  is what makes exports self-contained.
- **"No `local()` source: an installed copy must not override the bundled font."** A locally
  installed JetBrains Mono is intentionally ignored so rendering is byte-stable.
- Uncovered characters (explicitly including CJK) fall through to the system stack.

Body stack (`template.html:480`): `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas,
'DejaVu Sans Mono', 'Liberation Mono', 'Noto Sans Mono CJK SC', 'PingFang SC', 'Hiragino Sans GB',
'Microsoft YaHei'` — one mono face with an explicit CJK tail. The **editorial** preset is the only
place a serif appears, and only for `h1` and card `h3`: `Georgia, 'Times New Roman', 'Songti SC',
STSong, serif` (`:823-827`), with `h1` at 1.72rem/600 (`:828`).

Sizes: `h1` 1.5rem/700, `letter-spacing: -0.025em` (`:774-778`); `.subtitle` 0.875rem in
`--text-muted`, `margin-left: 1.75rem` to clear the pulse dot (`:780-784`). In-SVG type is far
smaller — node label 10-11px/600, sublabel 7-9px, tag 7px, legend title 12px/650, legend item
10px/500.

### The token block — 8 complete palettes
`:root, [data-theme="dark"]` at `template.html:172-214` is the base. Every other palette is a full
override of the same variable names. Four presets x two themes:

| preset | dark | light |
|---|---|---|
| classic (default) | `:172-214` | `:216-254` |
| signal-flow | `:261-292` | `:294-322` |
| blueprint | `:330-363` | `:365-398` |
| editorial | `:407-440` | `:442-475` |

Classic dark real values (`:174-213`): `--bg #020617`, `--grid #1e293b`, `--text #ffffff`,
`--text-muted #94a3b8`, `--text-dim #475569`, `--text-faint #7d8da1`,
`--panel rgba(15,23,42,0.5)`, `--panel-border #1e293b`, `--lane-fill rgba(15,23,42,0.22)`,
`--lane-stroke #334155`, `--arrow #64748b`, `--arrow-emphasis #34d399`, `--mask #0f172a`.

The seven-kind semantic palette is the spine of the whole system — each kind a **fill + stroke
pair**, fill translucent, stroke saturated (classic dark, `:194-207`):

| kind | fill | stroke |
|---|---|---|
| frontend | `rgba(8,51,68,0.4)` | `#22d3ee` cyan |
| backend | `rgba(6,78,59,0.4)` | `#34d399` emerald |
| database | `rgba(76,29,149,0.4)` | `#a78bfa` violet |
| cloud | `rgba(120,53,15,0.3)` | `#fbbf24` amber |
| security | `rgba(136,19,55,0.4)` | `#fb7185` rose |
| messagebus | `rgba(251,146,60,0.3)` | `#fb923c` orange |
| external | `rgba(30,41,59,0.5)` | `#94a3b8` slate |

This is the Tailwind 400/500-level ramp on a slate-950 ground. Light theme (`:234-247`) keeps the
hues but inverts the construction: fill drops to 0.15-0.2 alpha of the *bright* hue and the stroke
darkens to the 600/700 step (`#0891b2`, `#059669`, `#7c3aed`, `#d97706`, `#e11d48`, `#ea580c`,
`#64748b`).

`--mask` is a named, load-bearing token: an **opaque** colour drawn behind semi-transparent
component fills so connectors routed underneath are actually hidden (`:190-192`). Every node in
every renderer is drawn as two stacked rects — `.c-mask` then `.c-<kind>` — precisely for this
(`:5161-5163`).

### The presets — what each one actually changes
All four share **identical geometry**; the comments state this repeatedly (`:325-328`, `:400-406`,
`viewer-runtime.md:9`). They differ in ground, chrome, corner radius, dash language, motion budget.

- **classic** — flat dark slate panel, `border-radius: 1rem`, 1px `--panel-border`, 1.5rem padding
  (`:853-862`). No page background image.
- **signal-flow** — near-black `#030711`; page washed with two fixed radial gradients (cyan at
  18%/-8%, violet at 92%/18%, `:488-498`); diagram panel becomes a vertical gradient with an inset
  top highlight and a 28px/80px drop shadow (`:864-873`); header gets a pill badge with a cyan glow
  (`:786-798`); a one-shot diagonal light sweep crosses the panel (`:928-936`, `@keyframes
  archify-signal-scan :4857`). Glows widen everywhere: lens flow stroke 3.05->3.7, drop-shadow
  3px->6px (`:4327-4341`).
- **blueprint** — drafting register. Page is a real 32px x 32px ruled grid from `--grid`
  (`:499-506`); panel radius collapses to 0.35rem (`:874-881`); **four corner drafting ticks**
  composited as eight 1.35rem gradient slivers inset 0.7rem (`:882-898`); pulse dot becomes a 10px
  hollow rotated square (`:800-809`); the header badge is rules-above-and-below rather than a pill
  (`:810-821`). It is the anti-glow preset: `filter: none` and `stroke-linecap: square` are applied
  to essentially every effect (`:4342-4347`, `:4410-4413`, `:4470-4474`, `:4521`, `:4561-4565`,
  `:4640-4650`, `:4746-4750`, `:4782`). Grid dash tightens to `1 3` at 0.78 opacity (`:4671-4674`),
  region dash becomes a chain-dash `12 4 2 4` (`:4675-4678`), brand-mark badges square to `rx: 1px`
  (`:4127-4128`).
- **editorial** — paper. Warm ground `#181611` dark / `#f2eee5` light. The page carries a **printed
  margin rule** (a vermilion vertical line at 5.4rem) plus 32px horizontal ruled lines (`:507-512`).
  Accent is one restrained vermilion: `--arrow-emphasis #dd6b3d` dark / `#bb4c23` light. The panel
  gets a vermilion edge wash and a corner **plate label** in italic Georgia (`:899-926`). Pulse dot
  is a filled rotated square with a soft halo (`:829-838`). Hover is a *paper* shadow —
  `drop-shadow(0 2px 2px ...)` rather than a glow (`:4665-4669`). Grid becomes a fine `1 4`
  dot-dash at 0.48 opacity (`:4657-4660`).

### The SVG `<defs>` — markers, gradients, filters, patterns
`template.html:5137-5153`. Four markers and one pattern. **There are no gradients and no `<filter>`
elements in `<defs>` at all** — every glow in the system is a CSS `filter: drop-shadow(...)` on a
class, not an SVG filter primitive, and the only gradients anywhere are CSS backgrounds on HTML
chrome. The defs block is identical byte-for-byte in the template and in every rendered example
(`examples/web-app-rendered.html:5137-5153`).

- `#arrowhead`, `#arrowhead-emphasis`, `#arrowhead-security`, `#arrowhead-dashed` — all four are the
  **same shape**: `markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"` wrapping
  `<polygon points="0 0, 10 3.5, 0 7">`. A solid filled triangle, 10 x 7 user units, tip-anchored 1
  unit inside the endpoint. The only difference is the fill class (`.m-default` / `.m-emphasis` /
  `.m-security` / `.m-dashed`, `:4190-4193`). There is no open / barbed / diamond / circle head
  anywhere in the system.
- `#grid` — `<pattern width="40" height="40" patternUnits="userSpaceOnUse">` containing
  `<path d="M 40 0 L 0 0 0 40" class="c-grid" stroke-width="0.5"/>`. A 40-unit lattice at half-pixel
  weight in `--grid`, painted as one full-bleed `<rect width="100%" height="100%"
  fill="url(#grid)">` (`:5156`).

### Stroke weights — the whole vocabulary
Background grid **0.5** · boundary/region/lane/zone rects **1** · legend swatches **1** · sequence
activation bars **1** · lifeline and band rules **0.8** (dashed) · ordinary connectors **1.5** ·
emphasis connectors **1.8** (`examples/web-app-rendered.html:5164`) · component/node rects **1.5**
(stated as the rule at `:5162`) · lifecycle primary rail **2.2** · semantic sigils **1.35** with
`vector-effect: non-scaling-stroke` (`:4090-4099`) · brand-mark frame **0.8** non-scaling
(`:4114-4119`) · viewer-only overlay flows 2.45-3.85 by preset (`:4302-4347`, `:4453-4479`,
`:4615-4639`) · invisible pointer rail for relationships **24** (`:4386-4395`).

### Corner radii
Legend swatch `rx=2.5` · sequence message-label plate and activation bar `rx=3` · brand-mark badge
and frame `rx=4` (`brand-marks.mjs:559,561`) · standard node `rx=6` · lifecycle state `rx=7` ·
security-group boundary and wide frontend block `rx=8` · lane/stage frame `rx=10` · region boundary
`rx=12`. HTML chrome: diagram panel `1rem` classic / `0.35rem` blueprint / `0.38rem` editorial,
toolbar buttons `0.625rem`, share cue `0.75rem`, badges `999px`.

### Semantic classes (the contract renderers write against)
`template.html:4061-4085`. Renderers are instructed to emit **classes, never inline fill/stroke**,
so the theme toggle works (`:4062`, restated `:5159-5160`). `.c-grid`, `.c-mask`,
`.c-frontend|backend|database|cloud|security|messagebus|external` (`:4064-4073`); text
`.t-primary` `.t-muted` `.t-dim` plus `.t-<kind>` (`:4076-4085`). Boundary variants (`:4784-4787`):
`.c-security-group` (transparent fill, security stroke, dash `4,4`), `.c-region`
(`rgba(251,191,36,0.05)` amber wash, cloud stroke, dash `8,4`), `.c-lane` (`--lane-fill`,
`--lane-stroke`, dash `6,6`). Arrows (`:4183-4193`): `.a-default` (solid `--arrow`), `.a-emphasis`
(solid `--arrow-emphasis`), `.a-security` (security stroke, dash `5,5`), `.a-dashed` (database
stroke, dash `4,4`). The JS-side map is `arrowClassMap` (`geometry.mjs:1366-1373`); label colour
per variant is `variantAccent` (`geometry.mjs:1375-1383`): security->`t-security`,
emphasis->`t-backend`, dashed->`t-messagebus` (workflow overrides the dashed accent), else
`t-muted`.

### Semantic sigils — a second icon system, distinct from brand marks
`template.html:4087-4107`. Small authored role stamps drawn as `fill: none; stroke: currentColor;
stroke-width: 1.35; linecap/linejoin round; opacity 0.76; pointer-events none`, with
`vector-effect: non-scaling-stroke` on every child and a `.sigil-fill` escape hatch for solid dots.
Colour comes from `.s-<kind>` setting `color:` to the kind's stroke token. In output they are a
16-unit glyph at the node's top-left, inset 6, scaled 0.6875
(`transform="translate(46 306) scale(0.6875)"`, `examples/web-app-rendered.html:5179`) — an 11px
effective mark. Examples: external = box with out-arrow (`:5180-5181`), security = shield with check
(`:5192-5193`), frontend = browser chrome with two dots, cloud = a single cloud path, lifecycle
`start` = circle with play triangle, `active` = a pulse line. Lifecycle places its sigil at the
**top-right** (`translate(136 132)` on a node at x=35 w=118) rather than top-left.

---

## What a rendered diagram looks like

Read: `examples/web-app-rendered.html` (architecture) and
`examples/dataflow-product-analytics.html` (dataflow), cross-checked against
`examples/sequence-cache-miss-request.html` and `examples/lifecycle-agent-run.html`.

### Overall page composition
Top to bottom: a **fixed toolbar** pinned `top: 1rem; right: 1rem`, transparent background,
individually-chromed buttons (`template.html:3179-3200`); a **title block**; an optional guided-view
rail; the **diagram panel**; a row of **summary cards**.

Title block (`examples/web-app-rendered.html:5084`): a `.header-row` flex line of
`[12px pulse dot] [h1]` with 1rem gap (`template.html:752-757`), the dot filled `--frontend-stroke`
and breathing `opacity 1 -> 0.5 -> 1` on a 2s infinite `@keyframes pulse` (`:759-772`) — but only
when `html[data-motion-capable="true"]` (`:767`). Beneath it a `.subtitle` in `--text-muted`,
indented 1.75rem to align under the `h1` rather than the dot. The header reserves
`padding-right: 29.5rem` so the fixed toolbar never collides with the title (`:746`). Presets append
a right-aligned badge via `::after` reading a `data-preset-badge-*` attribute (`:786-798`,
`:810-821`, `:839-851`).

The diagram panel is a rounded translucent card — `background: var(--panel)`, 1px `--panel-border`,
`border-radius: 1rem`, `padding: 1.5rem`, `overflow: hidden`, `position: relative` (`:853-862`) —
carrying `data-detail-level="read"` (`:5132`), the level-of-detail state.

Below the panel, `.cards` — a grid of small `.card` panels, each a coloured `.card-dot` (`cyan`,
`emerald`, `rose` …) beside an `h3` and a bullet list (`examples/web-app-rendered.html:5547-5580`).
They echo the semantic palette as a written summary.

### Node treatment
Every node is a `<g>` carrying the full semantic hook set (`examples/web-app-rendered.html:5175`):
`id="node-users"`, `data-node-id`, `data-node-label`, `data-node-kind`, `data-node-sublabel`,
`data-node-context`, `tabindex="0"`, `role="button"`, `aria-label="Focus Users, Browser / Mobile,
Architecture component"`, `aria-pressed="false"`. First child is a `<title>` joining the same facts
with a middot separator — the native tooltip (`:5176`).

Inside, the stack is four to six elements:
1. `<rect class="c-mask">` — opaque knockout (`:5177`)
2. `<rect class="c-<kind>" stroke-width="1.5">` — same x/y/w/h/rx (`:5178`)
3. optional `<g class="semantic-sigil s-<kind>">` top-left, inset 6, scale 0.6875 (`:5179-5182`)
4. `<text class="t-primary" font-size="11" font-weight="600" text-anchor="middle">` — the label,
   tagged `data-node-label` and `data-detail-anchor` (`:5183`)
5. `<text class="t-muted" font-size="9" data-detail="context">` — the sublabel (`:5184`)
6. `<text class="t-<kind>" font-size="7" data-detail="fine">` — the tag, in the kind stroke
   colour (`:5197`)

Architecture nodes measure 120 x 60 (`rx=6`), or 120 x 64 where a tag needs the extra line. Dataflow
nodes are 112 x 58 with label 10px / sublabel 7px / tag 7px. Lifecycle states are 118 x 62, `rx=7`,
and add a **two-digit ordinal** at top-left in the kind colour at 7px/700. So the visual result is:
a soft translucent chip in one of seven hues, a 1.5px saturated border, a small line-art glyph in
the corner, a bold white name, a muted descriptor, an optional coloured micro-tag — all monospace,
all centred.

### Connector style
Connectors are `<path>` emitted **before** the nodes so nodes paint over them
(`examples/web-app-rendered.html:5163` — "Connection paths (before components for correct
z-order)"). Each carries `data-edge-from`, `data-edge-to`, `data-edge-label`, `data-edge-key`,
`data-edge-id` and a `data-composition-points` string (`"160,330;250,330"`) preserving the authored
polyline independently of the rendered `d`.

Routing is strictly **orthogonal with rounded elbows**. Straight runs are a plain `M x y L x y`.
Multi-segment runs go through `roundedPath` (`geometry.mjs:1303-1330`), which walks interior
vertices and replaces each corner with a quadratic: back off `r` along the incoming leg, emit `L`,
then `Q cx cy` to a point `r` along the outgoing leg. `r` is clamped to
`min(radius, prevLen/2, nextLen/2)` (`:1313`); corners tighter than 1px fall back to a hard `L`
(`:1314-1317`). The visible result is a consistent **8-unit fillet**:
`M 160 142 L 612 142 Q 620 142 620 150 L 620 238 Q 620 246 628 246 …`
(`examples/web-app-rendered.html:5165`).

Four connector languages by class: solid grey (default), solid emerald (emphasis, 1.8 weight),
**rose dashed `5,5`** (security — the JWT verification path in the web-app example), **violet dashed
`4,4`** (async/data). Each gets its matching triangular arrowhead via
`marker-end="url(#arrowhead-*)"`.

### Labels
Edge labels are separate `<text>` at 9px in the variant accent colour. `labelPoint`
(`geometry.mjs:1332-1344`) places them: for a 2-point route, at the midpoint **raised 10 units**
above the line; for longer routes, at the midpoint of segment index `labelSegment ?? 1`, again
raised 10. Authors override with `labelAt` or nudge with `labelDx` / `labelDy`. Sequence is the one
renderer that gives labels a **plate**: a `.c-mask` rect sized to the text (`rx=3`, height 16) under
a 9px centred label, so the label knocks out the lifelines behind it
(`examples/sequence-cache-miss-request.html`, Messages block). Labels are wrapped in
`<g data-detail="context">` so they participate in reading depth.

### Boundary / zone rendering
Boundaries are drawn **first, behind everything** (`examples/web-app-rendered.html:5158`), as rects
carrying `data-graph-role="structural-frame"`, `data-composition-frame-kind`,
`data-composition-frame-id`, `data-composition-frame-label`:
- **region** — `class="c-region"`, `rx=12`, `stroke-width=1`, amber dashed `8,4` on a 5%-amber wash,
  label as a top-left `t-cloud` 10px/600 text inside the corner (`:5159-5160`).
- **security-group** — `class="c-security-group"`, `rx=8`, transparent fill, rose dashed `4,4`,
  label in `t-security` 8px (`:5161`). The template documents a headroom rule: "boundary
  y = inner.y - 30, h = inner.h + 50" so the group name gets ~12px breathing room above the
  component it wraps (`template.html:5197-5199`).
- **lane / stage / segment** — `class="c-lane"`, `rx=10`, `--lane-fill` with `--lane-stroke`
  dashed `6,6`.

Dataflow numbers its stages as five vertical `c-lane` columns 168 wide x 400 tall at a 215-unit
pitch (x = 16, 231, 446, 661, 876), each headed by a centred `t-dim` 9px/600 caption in the form
`01 / Sources`, `02 / Ingest`, `03 / Process`, `04 / Store`, `05 / Consume`
(`examples/dataflow-product-analytics.html:5159-5172`). Lifecycle instead uses **rules, not boxes**:
full-width `a-default` paths at 0.8 weight dashed `3,8` with a left-aligned `t-dim` 10px/600 caption
above each — `01 / Lifecycle phases`, `02 / Interruptions + Recovery loop`, `03 / Terminal exits`.

### Legend
Rendered last, bottom-left inside the viewBox. The composed result
(`examples/web-app-rendered.html:5334-5361`): a `<g data-legend="" data-legend-bridge="">` holding a
`t-primary` 12px/650 Legend title, then one `<g>` per entry with a **16 x 10, `rx=2.5` swatch using
the matching `.c-<kind>` fill+stroke at 1px** followed by a `t-muted` 10px/500 label offset 22 units
from the swatch x. Entries flow left to right on one baseline (y=572 in that example) at
x = 40, 140, 245, 335, 440, 560 — measured widths 78, 83, 68, 83, 98, 83 plus a 22-unit gap. Each
entry also carries `data-legend-semantic-kind`, `data-legend-kind`, `data-legend-label`,
`data-legend-x`, `data-legend-baseline`, `data-legend-width`, which is what makes it clickable.

### Light/dark handling — both, fully, plus print
Both themes are first-class and complete: eight full token sets (four presets x two themes), and
every visual rule that mentions a colour reads a variable. Switching is a single attribute —
`data-theme` on `<html>` — resolved pre-paint (`:8-33`), toggled by the toolbar button or the `T`
key (`:14847`), persisted to `localStorage` key `archify-theme` (`:25`). The body carries
`transition: background 0.2s ease, color 0.2s ease` (`:485`) so the swap cross-fades.

There is a **third palette: print** (`:3094-3174`). `@page { size: landscape; margin: 1.5cm }`
(`:3092`). The print block force-overrides `:root`, `[data-theme="dark"]` *and*
`[data-theme="light"]` to the full light ramp (`:3098-3126`), stated reason being that printing from
dark would otherwise put "neon strokes and translucent dark fills on white paper" (`:3095-3097`). It
sets `--grid: transparent` so the lattice does not waste ink (`:3100`), hides all interactive chrome
(`:3129`), packs summary cards into two columns to avoid an orphan card on a trailing page
(`:3138`), and — importantly — **forces every viewer state back to full opacity**: focus, lens,
reach, route, story, chapter-preview and detail-level dimming are all reset with
`opacity: 1 !important; filter: none !important` (`:3131-3172`). A printed diagram is always the
complete static one.

Exported SVG carries a dual-theme trick: the serializer inlines the dark variables on the root and
appends `@media (prefers-color-scheme: light) { :root, svg { …light vars… } }` into the standalone
file (`:6246-6257`), so one exported SVG renders correctly in both.

---

## Viewer interaction + motion

Source: `references/viewer-runtime.md` (45 lines) plus the inline runtime,
`template.html:4977-14934`. The reference opens by saying these features are already in the
generated HTML and need not be re-implemented (`viewer-runtime.md:3`).

### Toolbar and keyboard
Toolbar (`template.html:4981-5074`): **theme** toggle, **visual style** menu (a four-item popup
listing Classic / Signal Flow / Blueprint / Editorial, each with a bold name and a `<small>` hint,
`:5001-5022`), **motion** Live/Still toggle (`:5025-5030`), **presentation stage** toggle
(`:5033-5037`), and **export** menu (`:5040-5072`). Shortcuts, from the in-file guide
(`template.html:14846-14856`): `?` Diagram Guide, `T` theme, `S` cycle style, `E` export menu,
`F` presentation stage, `M` Semantic Radar, `L` Semantic Lens, `R` Route Probe, `/` node finder
(or the active route endpoint picker), `+` and `-` zoom, `0` reset, `Escape` clears temporary
trace/focus/view first then exits presentation.

### Reading Depth — the zoom-linked level of detail
The most distinctive interaction. `template.html:4130-4148`. Three levels carried on the panel as
`data-detail-level`: **MAP** below 100% scale, **READ** at the default 100%, **FULL** at 175%
(`viewer-runtime.md:8`). Elements are tagged `data-detail="context"` (sublabels, edge labels) or
`data-detail="fine"` (tags, ordinals, fine annotations). At `map`, both context and fine go
`opacity: 0; pointer-events: none`; at `read`, only fine hides (`:4140-4145`). Crucially **nothing
moves** — the only transform is an 8px downward translate on `[data-detail-anchor]` at map level
(`:4146-4148`) so the primary label optically re-centres when its sublabel vanishes. Transitions are
160ms ease on both opacity and transform (`:4134-4139`).

The override rule (`:4150-4181`) is the interesting part: focus, reach, lens, legend preview, intent
trace, route, story, relationship preview, plus plain `:hover` and `:focus-visible` on any node
**all reveal their exact matches at any scale**, restoring `opacity: 1` and `transform: none`.
Reader intent outranks the global zoom level.

### The interaction inventory
Each is a named capability with its own CSS state on the `<svg>`:

- **Focus** (`svg[data-focus-active]`, `:4349-4354`) — click or keyboard-activate a node. Everything
  drops to `opacity: 0.13`; `[data-focus-match]` returns to 1; the selected node gets
  `drop-shadow(0 0 10px var(--frontend-stroke))` — a cyan halo.
- **Hover / select** (`:4196-4205`) — `[data-node-id]` is `cursor: pointer` with
  `transition: opacity .18s, filter .18s`; hover and `:focus-visible` both apply
  `drop-shadow(0 0 7px var(--frontend-stroke))` and suppress the native outline.
- **Semantic Lens** (`svg[data-lens-active]`, `:4294-4300`) — summarises selected node and
  relationship kinds. Non-matches to 0.11, matches to 1, **peers to 0.62** (a deliberate third
  tier), selected gets a 10px violet halo. Accompanied by `.semantic-lens-flow` — a cloned
  3.05-weight dashed rail (`dasharray 0.075 0.925` in path-length units) running once over the edge,
  cyan for out/forward, violet for in/reverse, orange for within, each with a matching 3px glow, on
  a 1.35s linear run with a per-edge `--lens-flow-delay` stagger (`:4302-4326`).
- **Legend filtering** (`:4241-4293`) — legend entries are real buttons. Each gets an invisible
  `[data-legend-hit]` rect (transparent fill and stroke, `pointer-events: all`) so the tiny swatch
  has a forgiving target; hover strokes it 58% violet, focus-visible strokes it cyan at 1.8 with a
  3px glow, selection strokes violet at 2.2 with `dasharray 3 2`. A `[data-legend-count-badge]` pill
  (mask fill, panel-border stroke, 8px/700 muted text) shows the count; entries with zero instances
  drop to `opacity: 0.44` (`:4281`). Activating one dims the diagram to 0.11 and lifts the matching
  kind (`:4287-4293`).
- **Authored Reachability** (`svg[data-reach-active]`, `:4356-4378`) — upstream walks incoming
  edges, downstream walks outgoing. The deepest dim in the system, **0.09**. Origin glows violet
  (11px) for upstream and emerald for downstream; matching edges get a 4px colour-matched glow. The
  comment is explicit that it never claims runtime causality (`:4358-4359`), and
  `viewer-runtime.md:41` insists it be called authored reachability, not impact, blast radius,
  breakage, or runtime causality.
- **Direct Relationship Pin / hit rail** (`:4380-4427`) — since a 1.5px path is an unusable pointer
  target, the runtime clones each edge into a **transparent 24-unit-wide `.relationship-hit-rail`**
  with `pointer-events: stroke` and `cursor: pointer`. Keyboard focus reveals a
  `.relationship-focus-rail` — a 6-wide, `dasharray 2 4`, 34%-cyan dotted ghost of the path
  (`:4396-4409`). The authored path underneath is never altered. The rail is disabled while focus,
  story, route-picking, lens or chapter-preview own the pointer (`:4418-4423`).
- **Relationship Preview** (`:4429-4451`) — layered on top of focus: focus-matches recede to 0.18,
  the previewed edge goes to 1 with a 5px emphasis glow and its stroke thickens 1.5 -> **2.75**,
  source node glows cyan, target glows violet. Plus `.relationship-flow-pulse`, a 3.35-weight
  travelling dash over 1.2s (`:4453-4464`), and a `.semantic-flow-token` — a small carrier glyph
  (halo + shape + ink + dot, `:4491-4513`) whose colour encodes the payload: data=violet,
  event=orange, security=rose, state=amber (`:4514-4517`).
- **Intent Trace** (`:4525-4579`) — a *pre-click* preview for fine pointers and keyboard targets.
  Gentler dim (0.2, the softest tier), a 3.1-weight one-shot trace over 1.15s, colour-coded
  out=cyan / in=violet / loop=rose. A comment notes both directions must share playback direction
  because the cloned geometry already runs source to target (`:4545-4547`). It reports through a
  visually-hidden `.intent-trace-status` live region (`:4568-4579`).
- **Route Probe** (`:4581-4655`) — resolves exactly two endpoints over authored directed edges and
  never infers a route from geometry (`viewer-runtime.md:16`). While picking a target the cursor
  becomes `crosshair` (`:4587`), non-candidates fall to 0.24 and only valid candidates stay lit
  (`:4584-4586`). Once resolved: everything to 0.11, start glows cyan 11px, end glows rose 11px,
  intermediate hops glow emerald 7px (`:4591-4602`). A **Route Journey** mode then walks the route,
  tinting hops past 0.62 / current 1 / future 0.34 (`:4603-4612`), with a 3.5-weight travelling
  signal on a 780ms `cubic-bezier(0.22, 1, 0.36, 1)` (`:4628-4639`); the probe flow itself staggers
  per hop via `animation-delay: calc(var(--route-step) * 0.16s)` (`:4626`).
- **Node Finder** (`:2320-2500`) — a searchable panel over labels and stable IDs, with `kbd` hints,
  a focus-within-highlighted search field, results showing label + ID + match context. It doubles as
  the route endpoint picker, retinting its heading cyan for `route-source` and rose for
  `route-target` (`:2338-2359`, `:2482-2491`).
- **Semantic Passport** — opens on focus, shows authored upstream/downstream facts, offers a
  **copyable deep link**, has an explicit close, closes on true outside activation and Escape, and
  never enters canonical export (`viewer-runtime.md:12`).
- **Semantic Radar** (`M`) — a minimap mirroring viewport and graph, with a
  `@keyframes archify-radar-live` expanding-ring pulse (`:4862-4865`).
- **Guided views / story** (`:5092-5129`, `:2592`, `:2678`) — up to five authored chapters from
  `meta.views` drive a Named Chapter Rail, Chapter Delta Preview, Story Beat Navigator, Follow
  Camera, Director Strip, Horizon and shareable moment links, all from that one array
  (`viewer-runtime.md:19`). Story beats tint nodes by state: inactive 0.22 + `saturate(0.42)`, past
  0.72 + `saturate(0.82)`, next 0.5 + `saturate(0.66)`, active 1 + 7px cyan glow plus a 360ms
  `archify-story-beat-node` entrance (`:4711-4728`). The Chapter Delta Preview is explicitly
  **static and colour-independent** — membership is carried by symbols in the rail, and the SVG only
  gets saturation/greyscale: stay 0.76 + `saturate(0.7)`, enter 1 + `saturate(1.2)`, leave 0.28 +
  `grayscale(0.72)` (`:4760-4782`).
- **Presentation Stage** (`F`, `?present=1`) — gives the diagram the viewport: `100dvh`, overflow
  hidden, cards hidden, SVG flexed to fill, the Present button retinted cyan (`:675-728`). It
  changes viewer chrome and framing, never authored geometry (`viewer-runtime.md:25`).
- **Embed mode** (`?embed=1`) — hides toolbar, header, cards, nav, map, focus chip, route probe,
  lens, guide, finder and guided views; drops panel padding to 0.5rem and removes border, radius and
  shadow (`:514-541`). A **Share Chapter Cue** appears instead: a 52rem glass bar with a 16px
  backdrop blur, a pulsing state dot, chapter counter, title, note, truthful stop order, and a 2px
  bottom progress bar with a cyan-to-violet gradient and a glow (`:543-673`).
- **Verified Source Beacons** (`:4206-4240`) — installed at runtime only for nodes whose repository
  evidence passed local revision/blob/line checks. A small emerald-tinted pill inside the node
  (mask-mixed fill, emerald stroke, 5.5px/800 uppercase letterspaced text) at 0.76 opacity, rising
  to 1 with a 4px emerald glow on hover/focus/selection. Removed before export.

### Motion — SETTLED: it is extensive, and it lives in the template
**24 `@keyframes` blocks**, all in `assets/template.html`. The earlier grep found nothing because it
was pointed at a `viewer/` directory that does not exist in the vendored tree.

| keyframes | line | what moves |
|---|---|---|
| `pulse` | 769 | header dot, 2s infinite opacity 1 to 0.5 |
| `archify-lens-in` | 1595 | Semantic Lens panel entrance |
| `archify-guide-in` | 2315 | Diagram Guide entrance |
| `archify-chapter-anchor` | 2592 | chapter anchor |
| `archify-story-caption-in` | 2678 | story caption entrance |
| `toolbar-menu-in` | 3326 | toolbar popup menus |
| `archify-edge-flow` | 4836 | ambient trace: dasharray 10 8, offset 54 to 0, opacity .42 to 1 |
| `archify-node-pulse` | 4842 | ambient trace node: stroke 1.5 to 2.4 + 8px emphasis glow at 18-36% |
| `archify-blueprint-node-pulse` | 4849 | blueprint variant: opacity dip, 2px glow, no stroke change |
| `archify-editorial-node-pulse` | 4853 | editorial variant: opacity dip + paper drop-shadow |
| `archify-signal-scan` | 4857 | signal-flow diagonal light sweep, translateX -70% to 70% |
| `archify-radar-live` | 4862 | radar ring, box-shadow 0 to 0.32rem |
| `archify-guided-progress` | 4866 | chapter progress bar scaleX |
| `archify-story-flow` | 4870 | story trail dashoffset to 0 |
| `archify-intent-trace-flow` | 4873 | pre-click trace |
| `archify-route-probe-flow` | 4878 | route signal, settles to a solid 0.58 line |
| `archify-route-journey-flow` | 4883 | per-hop journey signal |
| `archify-semantic-lens-flow` | 4888 | lens signal |
| `archify-relationship-pulse` | 4893 | relationship pulse |
| `archify-relationship-token-life` | 4898 | carrier token fade in/out |
| `archify-story-beat-node` | 4903 | story beat node entrance |
| `archify-share-cue-enter` | 4908 | share cue slide-down |
| `archify-share-cue-pulse` | 4912 | share cue state dot |

Easing vocabulary is narrow and consistent: `linear` for travelling dashes,
`cubic-bezier(0.22, 1, 0.36, 1)` (an ease-out-quint) for entrances and the route journey (`:570`,
`:4625`, `:4638`, `:4727`), `ease` for 160-180ms state transitions, `ease-in-out` for the signal
scan and cue pulse. Durations cluster at 150-180ms (state), 280-360ms (entrance), 0.78-1.35s
(semantic signals), 1.75-3.8s (ambient trace).

**Nearly every animation is `1 both` — one shot, not a loop.** The only exceptions are the header
`pulse` and the share-cue state dot, both `infinite`.

### The Motion Governor
`template.html:938-1000`, the most opinionated thing in the file. The comment states the intent:
motion is "given a real static state" and "the strongest semantic action" gets "the only motion
budget"; atmosphere "resets to its authored base instead of freezing mid-cycle"; static artifacts
"never start a decorative pulse or scan" (`:938-941`).

Mechanically: **static is the default** (`viewer-runtime.md:25`). Nothing animates unless
`html[data-motion-capable="true"]` is set (`:767`, `:793`, `:928`, `:942-944`). Ambient trace runs
only under `html[data-ambient-motion="running"]` and only when the SVG carries
`data-animation="trace"`, which is only emitted when the author sets `meta.animation: "trace"`
(`:4789-4802`). Even then it is **one ambient pass**, after which the authored solid/security/async
line language is restored (`:4790-4791`), with a per-edge stagger of `calc(var(--step) * 160ms)`
(`:4795`, `:4801`).

Six conditions kill all motion outright (`:945-994`): `data-motion="still"` (the Live/Still toggle),
`data-motion-owner` (another feature holds the budget), `data-embed="true"`,
`data-share-playback="true"`, `data-document-hidden="true"` (the page is not visible), and print.
Atmosphere additionally has its opacity zeroed rather than being left frozen (`:960-965`), and the
guided progress bar is snapped to `scaleX(1)` so a paused chapter still reads as complete
(`:995-997`).

`@media (prefers-reduced-motion: reduce)` (`:4916-4974`) is not a blunt `animation: none`. It is a
**designed degraded state** where each signal keeps a meaningful *static* form: the intent trace
holds at solid 0.72 opacity, the route probe at solid 0.78, the lens flow at a thinner 2.2 stroke
and 0.34 with no glow, the story trail at solid 0.55 — all with `stroke-dasharray: none` so they
read as highlighted paths rather than half-drawn dashes (`:4944-4969`). The journey and pulse
overlays are removed entirely (`:4961-4962`, `:4970`), and the final rule kills every `transition`
on nodes, edges, detail elements and legend hits (`:4972-4973`). A second reduced-motion query at
`:4046` covers chrome.

The runtime queries `prefers-reduced-motion` in at least seven places (`:7210`, `:7577`, `:9007`,
`:9278`, `:10827`, `:11478`, `:12408`), including gating a 540ms delay to 0 (`:12408`).

---

## Export + ShareCard

All inline in `template.html`; constants at `:5759-5765`. There is no `viewer/export.js`.

### Raster export
`RASTER_SCALE = 4` (`:5759`). The key technique is in `serializeSvg` (`:6153-6178`): the clone
`width` / `height` attributes are set to `viewBox * scale` **before** rasterization, so the browser
rasterizes the vector at target resolution natively. The comment is emphatic — "This is the key to
sharp rasters — do NOT scale later via" (`:6175-6176`) — and `rasterize` repeats it: "drawImage
draws at natural size — no upsampling blur" (`:6345-6347`). **So 4x does not degrade: it is a true
4x vector rasterization, not an upscale.** Text, hairlines and the 0.5-weight grid are all
re-rendered at the higher resolution.

Scale is *defensively* reduced, never increased. `MAX_CANVAS_PIXELS = 16 * 1024 * 1024` (`:6334`),
the stated reason being that older iOS Safari silently produces a blank canvas above ~16 Mpx
(`:6329-6333`); `pickSafeScale` walks `{4,3,2,1}` and returns the largest whose `w*s*h*s` fits,
defaulting to 1 (`:6336-6342`). A 1000x680 viewBox at 4x is 2.72 Mpx, so ordinary diagrams get the
full 4x; only very large viewBoxes step down. JPEG and WebP encode at `quality = 0.95`; PNG passes
`undefined` (`:6372`).

Formats in the menu (`:5048-5072`), grouped under three headings — **Share**: Share Card, Route
Share Card, Reach Share Card, Copy Share Card, Copy Diagram; **Image**: PNG (lossless), JPEG
(compact), WebP (modern); **Vector + motion**: SVG (editable), WebM (motion, 6s). The WebM path
serializes at `Math.min(1, 1280 / vb.width)` (`:6591`) — capped to 1280 wide, never upscaled — and
samples the authored geometry into an explicit canvas timeline (`:4791-4792`).

### Canonical-state stripping
Before any export the clone is scrubbed of viewer state. `:6048` lists roughly 50 attribute
selectors removed in one query — story, chapter, focus, reach, lens, legend, relationship,
intent-trace, route, share-route, share-reach, source-evidence, and both `data-detail` and
`data-detail-anchor`. Legend interactivity hooks are stripped separately (`:5924-5925`), and the
export **asserts** the clone is clean, rejecting with `viewer.export.error.viewerState` if not
(`:6427`). Route and reach share cards assert their own snapshots too (`:6428-6429`).
`viewer-runtime.md:29` states the rule: Guide, Lens, finder, focus, route, story, camera, radar,
presentation, motion ownership and temporary overlays must all be removed from canonical export.

### What a ShareCard looks like
1200 x 630, padding 36, header band 112 (`:5762-5765`). Drawn to a 2D canvas (`:6438-6520`):

1. Ground: `--bg` of the **current theme and preset**, read live from
   `getComputedStyle(document.documentElement)` (`:6443-6447`) — so the card is Classic Dark,
   Editorial Light, etc., matching what the reader is looking at.
2. An **accent tick**: a 42 x 3 filled bar at `(36, 27)` (`:6488-6490`). Accent is
   `--frontend-stroke` normally; for a Reach card it becomes `--database-stroke` for upstream and
   `--backend-stroke` for downstream (`:6448-6452`) — the badge colour encodes the query direction.
3. **Title** at `(36, 62)`, bold 700, shrunk to fit `1200 - 72 - 330 = 798px`, from 29px down to a
   floor of 18px via `fitCanvasText` (`:6492-6494`). Taken from the live `.header h1`.
4. **Subtitle** at `(36, 87)` in `--text-muted`, 13px down to 11px, fitting 848px (`:6496-6498`).
   For a plain card it is the page subtitle; for a Route card a hop summary (N hops, source to
   target); for a Reach card a direction/origin/nodes/links/hops summary (`:6455-6467`).
5. A **right-aligned badge** at `(1164, 50)` in the accent colour, `600 12px JetBrains Mono`,
   uppercase (`:6500-6503`). Default content is PRESET + THEME (e.g. BLUEPRINT / DARK); route and
   reach variants substitute a hop-count or direction badge (`:6469-6478`).
6. The **complete diagram**, contained not cropped: `fit = min(availableWidth/w,
   availableHeight/h)`, centred in the 1128 x 482 body area, drawn at natural size (`:6506-6512`).
   `viewer-runtime.md:33` states it contains the complete canonical diagram without cropping.
7. A 1px `--panel-border` **hairline frame** stroked at half-pixel offsets around the diagram
   (`:6514-6516`) — `strokeRect(x-0.5, y-0.5, w+1, h+1)` for a crisp edge.

Source scale for the card is `Math.min(2, pickSafeScale(...))` (`:6425`) — capped at 2x because the
diagram is then downscaled into the card body anyway.

Route and Reach Share Cards reuse the identical seam (`format=share-card`, `variant=route|reach`),
may only add static `data-share-route-*` / `data-share-reach-*` decoration, are **download-only**,
and fail closed on stale, unreachable or conflicting state (`viewer-runtime.md:35-41`). Copy Share
Card reuses the same canonical PNG when clipboard image writes are supported
(`viewer-runtime.md:33`). The card explicitly never claims validation (`:33`), and the reference
closes with a truth boundary: viewer exports are communication assets that do not replace the
checked HTML, the delivery receipt, or a real visual review (`:43-45`).

---

## Desktop readability + text fitting

### The legibility model — `renderers/shared/desktop-readability.mjs` (26 lines)
Small, and the single most transferable idea in the repo. It answers one question: given that a
1000-unit-wide diagram will be displayed at some smaller pixel width, how big must the source text
be for it to still be readable?

Five constants (`:1-5`):
- `DESKTOP_READABILITY_VIEWPORT = { width: 1440, height: 900 }` — the assumed reader screen.
- `DESKTOP_READER_MIN_WIDTH = 960` — the narrowest desktop reader width designed for.
- `DESKTOP_READER_HORIZONTAL_CHROME = 30` — panel padding and border stolen from that width.
- `DESKTOP_READER_DIAGRAM_WIDTH = 960 - 30 = 930` — **the real pixel width the SVG gets.**
- `MIN_PROJECTED_NODE_TEXT_PX = 6` — the floor: node text must never land below 6 physical px.

Two functions, exact inverses:
- `projectedNodeTextPx(sourceFontPx, viewBoxWidth, diagramWidth = 930)` (`:7-12`) returns
  `sourceFontPx * Math.min(1, diagramWidth / viewBoxWidth)`. The `Math.min(1, …)` is the important
  detail: **the model only ever accounts for shrinking, never magnification.** A viewBox narrower
  than 930 is treated as 1:1 — a diagram is never assumed to benefit from being blown up.
- `minimumReadableSourceTextPx(viewBoxWidth, diagramWidth = 930, minimumProjectedPx = 6)` (`:14-26`)
  inverts it: `6 / Math.min(1, 930 / viewBoxWidth)`. This is what a renderer or validator asks to
  learn the smallest legal source font size for a given viewBox.

Worked: a 1000-wide viewBox projects at `930/1000 = 0.93`, so 7px source lands at 6.51px — legal.
A 1400-wide viewBox projects at 0.664, so the minimum source size rises to `6/0.664 = 9.03px` — and
a 7px tag would be illegal. **The wider you author, the larger your type must be.** That is the
whole rule, and it is the mechanism that stops "it looked fine in my 1800px canvas" from shipping.

Both functions return `NaN` rather than guessing on non-finite or non-positive inputs (`:8-10`,
`:19-24`).

### Text fitting — `renderers/shared/text-fit.mjs` (49 lines)
The header comment names the failure it exists to close: node text is **one `<text>` element with
`text-anchor="middle"` and is never wrapped**, so left unmeasured "an over-long value silently
spills across its neighbours while validation still reports a clean receipt" (`:3-7`).

**There is no wrapping and no truncation anywhere in node text.** The only strategy is
shrink-to-fit, with a hard floor, plus a validation escape.

Shared constants (`:24-27`): `widthFactor: 0.6` — px of advance width per text unit per px of font
size, a monospace approximation; `horizontalPadding: 8` — total px reserved so text never touches
the border.

Two halves, described as "always used together" (`:8`):
- `fittedNodeFontSize(text, width, preferred, minimum)` (`:32-37`) —
  `available = max(1, width - 8)`; `fitted = min(preferred, available / (units * 0.6))`; returns
  `max(minimum, floor(fitted * 10) / 10)`. Note the **floor to one decimal place**: font sizes are
  quantised to 0.1px so output is deterministic rather than carrying float noise.
- `minimumNodeTextWidth(text, minimum)` (`:42-44`) — `units * minimum * 0.6`, the width the text
  still needs after shrinking as far as it may. Compared against `width - 8` this tells validation
  whether shrinking can rescue the label or whether it must reject.
- `availableNodeTextWidth(width)` (`:47-49`) — `width - 8`.

So ordinary overruns simply get smaller; only what shrinking **cannot** save becomes an error
(`:9-13`). The `preferred` and `minimum` sizes are deliberately *not* shared, because renderers set
node text at different sizes — the comment records "architecture sublabels are 9px, the rest are
7px" (`:15-17`). This matches the examples exactly: architecture label 11 / sublabel 9 / tag 7;
dataflow and lifecycle label 10 / sublabel 7 / tag 7.

The same 0.6 factor reappears in `brandTopRailProblem` (`brand-marks.mjs:530`) and, at a slightly
looser 0.62, in the legend (`legend.mjs:10`).

### Legend composition and placement — `renderers/shared/legend.mjs` (217 lines)
Constants (`:6-11`): `DEFAULT_FONT_SIZE 8`, `DEFAULT_ITEM_GAP 22`, `DEFAULT_LINE_GAP 22`,
`DEFAULT_SWATCH_GAP 8`, `TEXT_ADVANCE_EM 0.62`, `INTERACTIVE_BADGE_ALLOWANCE 21`.

**Selection** — `resolveLegend(config, catalog, presentKinds)` (`:35-53`). Mode `hidden` returns
nothing; mode `all` shows every catalog kind; default `auto` shows only kinds actually present.
Per-entry `visible` overrides either way, and `label` can be overridden. An entry is `interactive`
only if the catalog allows it **and** the kind is actually present (`:50`) — that is what produces
the `[data-legend-zero]` 0.44-opacity entries in `all` mode.

**Measurement** — `measuredEntryWidth` (`:55-63`): `ceil(swatchWidth(14) + swatchGap(8) +
textUnits(label) * fontSize * 0.62 + (interactive ? 21 : 0))`. Interactive entries reserve 21px for
the count badge.

**Wrapping** — `legendFootprint` (`:68-102`) is a single greedy line-breaker: walk entries,
accumulate `itemGap + width`, start a new row when the cursor would exceed `width`. Returns `rows`,
`rowCount`, `minWidth` (the widest single entry) and `extraHeight = (rowCount - 1) * lineGap`. The
comment insists this is the **one** footprint calculation, owning both auto-viewBox sizing and final
placement, because a second approximation "would make generated geometry disagree with validation"
(`:65-67`).

**Placement** — `measureLegend` (`:104-192`). `titleY = baselineY - extraHeight - 20`;
`legendTopY = titleY - 10`. Rows are laid bottom-up: row `i` baseline is
`baselineY - (rowCount - i - 1) * lineGap` (`:151`), so the **last row always sits on the authored
baseline** and extra rows grow upward. Within a row, `entryX += entry.width + itemGap` (`:154`).

**Three fail-closed checks**, each either hiding the legend (`unfit: 'hide'`) or throwing a
structured diagnostic:
- `legend/label-too-wide` (`:119-131`) — a single entry wider than the whole band.
- `legend/vertical-overflow` (`:135-146`) — the wrapped stack would start above `minTitleY`.
- `legend/content-overlap` (`:158-184`) — the legend collides with authored relationship geometry.
  Obstacles come from `relationshipLegendObstacles` (`:13-33`), which decomposes every routed
  relationship into per-segment obstacles plus its label rect; collision uses
  `segmentIntersectsRect` for segments and `rectsOverlap` for rects (`:168-172`). Legend hit-rects
  are the title (48 x 14) and each entry (`width` x 14 at `baseline - 10`) (`:158-167`).

**Emission** — `renderLegend` (`:194-217`). The root gets `data-legend-bridge=""` only if at least
one entry is interactive (`:198-200`). The rendered font size is adjusted from the *measured* size:
`measured.fontSize < 8 ? +0.5 : +2` (`:199`) — so the default measurement size of 8 renders at
**10px**, exactly what the examples show. The title is always 12px/650 (`:203`). Swatch drawing is
injected by the caller as `renderSwatch(entry)` (`:211`), which is how each renderer supplies its
own swatch shape.

---

## Geometry vocabulary

`renderers/shared/geometry.mjs`, 1,423 lines. The header states the contract: every function is
pure, and renderers own their layout tables and pass in measured rects
`{x, y, width, height, cx, cy}` (`:1-3`).

### Anchors and sides
`anchor(rect, side)` (`:1121-1130`) — `left [x, cy]`, `right [x+w, cy]`, `top [cx, y]`,
`bottom [cx, y+h]`, defaulting to right. `PORT_OUTWARD_VECTOR` (`:1132-1137`) gives each side its
unit normal. `defaultFromSide` / `defaultToSide` (`:1274-1286`) pick sides from relative centres —
target to the left means exit `left` and enter `right`, with a vertical fallback when `cx` is equal.
`chosenSide(side, fallback)` (`:1288-1290`) treats `auto` as absent.

### Port spreading — fan-in / fan-out
`automaticPortSpread(relations, boxes, { gutter = 16, maxSpacing = 14, sideFor })` (`:1214-1272`).
Groups endpoints by `rect.id + side`; for any group of 2+, sorts by the counterpart cross-axis
centre (with a deterministic id/from/to/label tiebreak, `:1338-1341`), then computes
`usable = extent - gutter*2` and `spacing = min(14, usable / (n-1))`, offsetting each endpoint by
`(i - (n-1)/2) * spacing` — a symmetric fan about the side midpoint. It applies only to relations
with `route === 'auto'` and no `via` / `channelX` / `channelY` / `labelAt` (`:1234-1235`), so
authored routing is never overridden.

### The rhythm bridge
`automaticPortRhythmBridge(start, end, fromSide, toSide, { endpointStubPx = 24,
interiorSegmentPx = 16, accept })` (`:1143-1209`). The comment names the exact problem: port
spreading can leave parallel anchors a few pixels apart, and a conventional midpoint dogleg then
violates the renderer own 8px/16px route-rhythm floors (`:1139-1142`). When two same-axis sides are
closer than 16px, it builds a **full outside-channel route**: push 24px out along each normal, run
to a channel offset 16px beyond the further endpoint (trying both the far and near side), and return
the first candidate that honours both endpoint sides and produces zero rhythm issues. Returns `null`
when the ordinary route is fine.

So the named spacing floors are: **endpoint stub 24px, interior segment 16px, port gutter 16px, max
port spacing 14px, minimum component separation 8px** (`suggestComponentSeparation(a, b,
minGap = 8)`, `:1416`).

### Path emission
- `polylinePath(points)` (`:1292-1294`) — `M`/`L` chain.
- `roundedPath(points, radius)` (`:1303-1330`) — the fillet routine described earlier; falls back to
  `polylinePath` for fewer than 3 points or `radius <= 0` (`:1304-1306`), and to a hard corner when
  the computed `r < 1` (`:1314-1317`). Rendered examples show an 8-unit radius.
- `routePointsValue(points)` (`:1296-1301`) — serializes the authored polyline to the `"x,y;x,y"`
  form stored in `data-composition-points`, filtering non-finite points. This is what lets the viewer
  reason about the authored route independent of the rendered `d`.
- `normalizeRoutePoints` (`:966-980`).

### Arrowhead shapes
There is exactly **one** arrowhead shape in the system — the filled `0 0, 10 3.5, 0 7` triangle in
`<defs>` (`template.html:5138-5149`). `geometry.mjs` does not generate arrowheads; it only selects
which of the four colour-variant markers to reference, via `arrowClassMap` (`:1366-1373`), which
pairs each variant with both its line class and its marker id.

### Label geometry
`labelPoint(item, points)` (`:1332-1344`) — shared by edges, flows and transitions, all of which
carry the same `labelAt` / `labelDx` / `labelDy` / `labelSegment` knobs (`:1331`). Default is the
midpoint of segment 1 (or the only segment), raised 10 units.

### Quality gates (geometry as validation)
Roughly two-thirds of the module is layout *checking*, not layout *doing*. Each returns structured
diagnostics: endpoint-side violations (`:194-338`), flow-direction problems (`:340-406`), crossing
detection (`:484-568`), ambiguous corridors (`:570-669`), border runs where a route rides a frame
edge (`:671-756`), route budget metrics (`:758-820`), route rhythm (`:822-899`), and label-route
clearance (`:107-168`, `:901-944`). Supporting primitives: `rectsOverlap` with a `gap` (`:20-35`,
returning `false` for non-finite geometry so a NaN does not report as a collision in every pair,
`:21-25`), `segmentIntersectsRect` (`:37-52`), `segmentRectClearance` (`:54-73`),
`segmentRectIntersectionLength` via Liang-Barsky clipping (`:75-105`), and `isFinitePoint` as a
backstop against writing `<rect x="NaN">` (`:16-18`). Human-readable fix hints come from
`suggestLabelObstacleFix` (`:1395`), `suggestLabelPairFix` (`:1408`) and
`suggestComponentSeparation` (`:1416`).

---

## Brand marks

Layers: `brand-marks/catalog.json` (source), `renderers/shared/generated-brand-marks.mjs`
(2,003-line committed zero-dependency bundle), `renderers/shared/brand-marks.mjs` (563 lines, the
runtime), `references/brand-marks.md` (the agent contract), `brand-marks/README.md` (provenance).

### What it is
**107 marks** (`brand-marks/README.md:3`) across AI, cloud, engineering, data, collaboration,
business systems, channels, languages and frameworks (`references/brand-marks.md:64-65`). Most
vector paths come from **Simple Icons 16.28.0**; the OpenAI mark is traced from the official OpenAI
brand guidelines (`README.md:14-17`). Each catalog entry has `id`, `title`, `category`, `aliases`,
`domains`, and a `custom` block with `viewBox`, `hex` and a single `path`
(`brand-marks/catalog.json:4-12`). `catalog.json` is the editable source; the generated bundle is
explicitly not to be hand-edited (`README.md:29`). Provenance, guidelines and license metadata are
recorded per entry (`README.md:17-19`), with a stated caution that the Simple Icons CC0 license
covers the collection work, not the underlying trademarks (`README.md:20-23`).

The role split is stated plainly: semantic `type` still explains what the node does; `brand`
explains whose product it is (`references/brand-marks.md:4-5`). A mark never replaces the node type,
colour, label or relationships (`brand-marks/README.md:5-6`).

### What it renders
`renderBrandMark(node, {x, y, size = 16})` at `brand-marks.mjs:544-563`. A **three-layer sandwich**
with `inset = 3`:

1. `<rect width=16 height=16 rx=4 class="brand-mark-badge">` — a plain **white plate**
   (`template.html:4113`: `fill: #fff`).
2. The mark itself, one of three kinds:
   - `preset` — `<path>` scaled `(size - 6) / mark.viewBox` and translated by 3, filled with the
     brand `#hex` (`:550-551`). A 16-unit badge therefore carries a 10-unit glyph.
   - `remote` — `<image href="<dataUrl>">` at 10 x 10, `preserveAspectRatio="xMidYMid meet"` (`:553`).
   - fallback — a generic **globe**: a circle r=5.2 with a horizontal and two curved meridians,
     scaled `size/20`, `class="brand-mark-fallback"` (`:555-556`).
3. `<rect … rx=4 class="brand-mark-frame">` **on top** — `fill: none`, `stroke: #cbd5e1`,
   `stroke-width: 0.8`, `vector-effect: non-scaling-stroke` (`template.html:4114-4119`).

The `<g>` is `aria-hidden="true"`, `class="brand-mark"`, `pointer-events: none`
(`template.html:4112`), positioned by `transform="translate(x y)"`, and carries provenance in the
DOM: `data-brand-mark`, `data-brand-title`, `data-brand-status`, `data-brand-source`,
`data-brand-sha256` (`brand-marks.mjs:535-543`).

### Colour containment — the deliberate part
`template.html:4109-4111` states it: brand-mark colour is "contained inside one neutral plate so
vendor color never replaces Archify semantic node and relationship vocabulary." The white badge and
the neutral `#cbd5e1` frame are **hardcoded literals, not theme variables** — they do not change
with theme or preset (the sole preset override is blueprint squaring the corners to `rx: 1px`,
`:4127-4128`). A saturated brand colour is therefore always quarantined inside a 16x16 white chip
and can never compete with the seven-hue semantic palette. Compare the semantic sigils, which do the
opposite: no plate, `currentColor`, fully themed.

### Placement and the layout cost
A brand mark occupies a **top rail** across the node. `brandLabelFitWidth` reduces the available
label width by a flat **48px** when a mark is present (`brand-marks.mjs:521-523`), and
`brandTopRailProblem` (`:525-533`) raises an authoring error when the remaining `width - 48` is less
than `textUnits(label) * minimumFontSize * 0.6` — i.e. when the label could not survive at its
legible minimum — with the message "widen the node or shorten the label."

### Safety posture
Known-brand URLs resolve to the bundled vector and never hit the network
(`references/brand-marks.md:50`). Unknown-URL capture is a deliberate two-stage flow: run
`brands capture <url> --json`, then author the returned **digest-pinned** `{url, sha256}` value
(`:26-45`). Capture accepts only bounded raster formats, blocks credentials, nonstandard public
ports, and private or link-local destinations, and uses bounded concurrency with one total deadline
(`:51-54`). Later render and validate require that exact digest — blocked, unavailable, changed,
oversized or unsafe content **fails closed** rather than silently changing the artifact (`:54-56`).
If there is no match and no user-supplied URL, the instruction is to omit `brand`, and explicitly
"Do not invent a URL or silently assign a visually similar company" (`:47-48`). **The final artifact
never fetches a brand asset when opened** — preset vectors and digest-verified icons stay embedded
in SVG, PNG, WebP, JPEG, Share Card and WebM exports (`:58-60`).

---

## The five types visual forms

**Architecture** (`renderers/architecture/render-architecture.mjs`, 1,078 lines, plus `grid.mjs`,
62) — free-form nested containment. The only type with **true 2D boxes-in-boxes**: rounded
`c-region` frames (`rx=12`, amber `8,4` dash) holding `c-security-group` frames (`rx=8`, rose `4,4`
dash) holding 120x60 nodes, with orthogonal rounded-elbow connectors of all four variants weaving
between them and a 40-unit lattice behind. It is legible as architecture because **enclosure carries
meaning**: you read "inside the region, inside the security group" spatially, and the
corner-anchored boundary labels name each enclosure without a key. Its sublabels are the one
exception to the 7px rule at 9px (`text-fit.mjs:17`), giving it the densest per-node information of
the five. It is also the only type with an engineering profile (`engineering-profiles.mjs:150`) and
the only one with a delta renderer (`delta/architecture-delta.mjs`, 1,221 lines).

**Workflow** (`renderers/workflow/render-workflow.mjs` 35 lines + `workflow-compiler.mjs` 4,400
lines — by far the largest renderer, plus `workflow-migration-geometry.mjs` and
`migrations/workflow-v2.mjs`) — a compiled step graph. The thin renderer delegates everything to the
compiler, making workflow the one type whose **layout is computed rather than authored**. Its
distinguishing visual choice is recorded in `geometry.mjs:1376-1377`: workflow colours dashed (async
trace) labels `t-messagebus`, "like the trace store it points at," instead of the default. It reads
as a workflow because ordered steps and their branch and retry edges are positioned by the compiler
into a consistently-flowing graph rather than a hand-placed picture.

**Sequence** (`renderers/sequence/render-sequence.mjs`, 464 lines) — the classic UML form, and the
most visually distinct. Participants head evenly-pitched columns (the example uses a 144.17-unit
pitch across 7 participants); each drops a **vertical lifeline**: an `a-default` path at **0.8
weight, `stroke-dasharray="3,7"`** running the full timeline height. Over them sit **activation
bars** — 10-unit-wide, `rx=3` rects in the participant own semantic colour (frontend cyan, backend
emerald, security rose, database violet, messagebus orange), each double-drawn with a `c-mask`
beneath. Messages are horizontal paths with arrowheads, and each label gets a **`c-mask` plate**
(`rx=3`, height 16, width measured to the text) so it knocks a clean hole in the lifelines it
crosses. Optional `segment` frames are full-width `c-lane` bands (`rx=10`, 984 wide) grouping
phases. Time runs strictly downward; the README notes the timeline scales with viewBox height, so a
taller viewBox buys message room rather than clipping (`sequence/README.md:37-39`). You read it as a
sequence because the only meaningful axis is vertical, and the coloured bars show who is busy when.
