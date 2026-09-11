# FossFLOW — The Design Layer

**Date:** 2026-09-11
**Subject:** `apps/prism-viz-engine/vendor/fossflow` (186 source files, vendored whole)
**Scope:** look, motion, assets, feel. Projection maths and the scene model are deliberately NOT covered — harvested in a prior pass.
**Stance:** documentarian. Describes what exists.

Paths below are relative to `apps/prism-viz-engine/vendor/fossflow/`.

---

## Headline findings

1. **The entire motion system is two `gsap.to()` calls.** Not a timeline, not a motion library. Everything else that moves is a CSS transition or an MUI default.
2. **`paper` draws nothing.** A declared dependency whose only source reference is a 100%-commented-out file. The marching-ants lasso exists purely as a ghost.
3. **The theme is thin by design.** Four typography steps, one palette colour, the shadow ramp, five component defaults. Everything else is stock MUI v5. The visual identity lives in per-component `sx` and in `config.ts` constants, not in the theme.

---

## Motion (every gsap call, with curves)

`gsap` is imported in exactly two live files. `package.json:36` declares `gsap: ^3.11.4`.

### 1. `src/components/SceneLayer/SceneLayer.tsx:32-37` — the camera

    gsap.to(elementRef.current, {
      duration: disableAnimation || isFirstRender ? 0 : 0.25,
      translateX: scroll.position.x,
      translateY: scroll.position.y,
      scale: zoom
    });

| Aspect | Value |
|---|---|
| Properties | `translateX`, `translateY`, `scale` |
| Duration | `0.25s` (or `0` — see guard below) |
| **Ease** | **none specified -> gsap default `power1.out`** |
| Trigger | `useEffect` on `[zoom, scroll, disableAnimation, isFirstRender]` (`SceneLayer.tsx:42`) — any pan or zoom store change |
| Interruptible | **Yes.** `gsap.to()` on the same target+property auto-overwrites the in-flight tween. Continuous panning fires a new 0.25s `power1.out` tween per store update, each re-easing from current velocity. |

This one call is the camera for the whole diagram. `Renderer.tsx:59-108` mounts **eight** `<SceneLayer>` instances (Rectangles, Cursor, Connectors, TextBoxes, ConnectorLabels, SizeIndicator, Nodes, TransformControlsManager), so one pan gesture runs eight independent tweens with identical parameters. They stay locked because the inputs are identical, not because they are coordinated.

**Why `power1.out` matters for the feel:** the decelerating curve makes panning feel like the canvas has weight and settles, rather than tracking the pointer rigidly. With interruption, a fast drag produces continuous smoothed motion that lags the cursor slightly and catches up on release. That lag *is* the instrument feel.

### 2. `src/components/Grid/Grid.tsx:32-36` — the grid

    gsap.to(elementRef.current, {
      duration: isFirstRender ? 0 : 0.25,
      backgroundSize: `${tileSize.width}px ${tileSize.height * 2}px`,
      backgroundPosition: `${backgroundPosition.width}px ${backgroundPosition.height}px`
    });

| Aspect | Value |
|---|---|
| Properties | `backgroundSize`, `backgroundPosition` (CSS background, **not** transform) |
| Duration | `0.25s` — matched to SceneLayer on purpose |
| **Ease** | **none specified -> `power1.out`**, same as SceneLayer |
| Trigger | `useEffect` on `[scroll, zoom, isFirstRender, size]` (`Grid.tsx:41`); `size` is from `useResizeObserver` (`Grid.tsx:13`), so a window resize also re-tweens |
| Interruptible | Yes, same auto-overwrite |

The grid animates as a **tiled background-position**, not a transformed element — an infinite grid for one DOM node (`Grid.tsx:55-63`) instead of thousands of tiles. Duration and ease are deliberately identical to SceneLayer so grid and content read as rigidly coupled; any mismatch would show instantly as the grid sliding under the diagram.

Height is doubled — `tileSize.height * 2` (`Grid.tsx:34`) while width is 1x — because the SVG tile viewBox (141.39 x 163.26) holds one full diamond plus the half-diamonds needed to tile seamlessly.

### The first-render guard — every occurrence

The `duration: isFirstRender ? 0 : 0.25` pattern appears in exactly two places:

- `SceneLayer.tsx:19` (state), `:33` (guard), `:39-41` (flip)
- `Grid.tsx:14` (state), `:33` (guard), `:38-40` (flip)

Identical shape: `useState(true)` -> consume in the duration ternary -> flip inside the same effect. It prevents the canvas visibly flying in from `translate(0,0) scale(1)` to its restored scroll/zoom on mount. Without it every load would show a 0.25s swoop from origin.

### Deliberate motion suppression

| Mechanism | Location | Effect |
|---|---|---|
| `isFirstRender` | `SceneLayer.tsx:33`, `Grid.tsx:33` | Kills mount-time swoop |
| `disableAnimation` prop | Declared `SceneLayer.tsx:10,17`; consumed `:33` | Forces `duration: 0` |
| `disableAnimation` — only caller | `UiOverlay.tsx:229` | `<SceneLayer disableAnimation>` around `<DragAndDrop>` during `mode.type === 'PLACE_ICON'` |

`UiOverlay.tsx:229` is the most instructive motion decision here. While dragging a new icon onto the canvas the ghost must track the cursor with **zero** smoothing — a 0.25s `power1.out` lag on something attached to your pointer reads as broken, not as weight. The same easing that makes panning feel good makes dragging feel wrong, so it is switched off for exactly that case.

**Reduced-motion: absent.** `prefers-reduced-motion` appears nowhere in `src/`. No accessibility gate on motion.

**Export does NOT suppress motion.** `exportAsImage` (`src/utils/exportOptions.ts:178-185`) calls `domtoimage.toPng(el, {...size, cacheBust: true})` on the live element. Nothing pauses gsap or waits for tweens to settle. gsap writes inline transforms and dom-to-image serialises computed style, so an export fired mid-tween captures the intermediate transform.

### Motion NOT driven by gsap

1. **CSS transition — exactly one in the codebase.** `ItemControls/IconSelectionControls/IconGrid.tsx:26`: `transition: 'background-color 0.2s'`, with `backgroundColor: isHovered ? 'action.hover' : 'transparent'` (`:24`) and `borderRadius: 1` (`:25`). `0.2s`, no easing function specified so CSS default `ease`. The only authored hover transition in the product.
2. **MUI defaults.** Dialogs, menus, tooltips, `CircularProgress`. The theme never overrides `transitions` (`src/styles/theme.ts:52-134`), so all run stock: `duration.standard = 300ms`, `easing.easeInOut = cubic-bezier(0.4, 0, 0.2, 1)`.
3. **Spinner.** `Loader/Loader.tsx:21` — `<CircularProgress size={size * 20} />`, default `size = 1` (`:10`) = a 20px indeterminate spinner.
4. **`useResizeObserver` reflow.** `Grid.tsx:13`, `IsometricIcon.tsx:13`, `ExpandableLabel.tsx:21`. Not animation, but it drives visual change — the icon anchor is recomputed from observed size (`IsometricIcon.tsx:32-33`), so icons pop into position after load rather than tweening.
5. **No `requestAnimationFrame` loop, no spring physics.** Neither appears in `src/`. The 0.25s `power1.out` is the entire motion vocabulary.

### The ghost: the marching-ants lasso

`src/components/Lasso/Lasso.tsx` is **83 lines, all commented out** (`:1-83`) — the most detailed motion design in the repo, none of it running:

- `gsap.fromTo(shapeRef.current, {dashOffset: 0}, {dashOffset: PIXEL_UNIT * 10, ease: 'none', duration: 0.25}).repeat(-1)` (`Lasso.tsx:64-70`)
- **`ease: 'none'`** — the only explicit ease in the codebase, and correctly linear: marching ants must crawl at constant rate or they pulse. `.repeat(-1)` = infinite.
- Shape (`:52-62`): `dashArray: [5, 10]`, `strokeWidth: PIXEL_UNIT * 3`, `strokeColor: 'blue'`, `fillColor: 'lightBlue'`, `opacity: 0.5`, `radius: PIXEL_UNIT * 8`, `strokeCap: 'round'`

It imports `PIXEL_UNIT` from `src/renderer/utils/constants` (`Lasso.tsx:5`), a path that no longer exists in this tree. Dead code from an earlier architecture, not a feature awaiting a flag.

---

## The theme (real values)

Source: `src/styles/theme.ts`. Created via `createTheme(themeConfig)` at `:136`, applied once at `src/Isoflow.tsx:79` (`<ThemeProvider theme={theme}>`).

### Palette — one single colour is overridden

`theme.ts:74-78`:

    palette: { secondary: { main: '#df004c' } }

That is the whole palette override. A crimson/magenta secondary. **`primary` is NOT overridden**, so everywhere the code reads `theme.palette.primary.main` it gets MUI v5 stock **`#1976d2`**, and `primary.dark` = stock **`#1565c0`**. This matters: the hover-tile highlight and the transform-anchor hover fill both key off `primary`, so the most prominent interactive colour in the product is an un-chosen MUI default.

Inherited stock values in active use:

| Token | Value | Used at |
|---|---|---|
| `common.white` | `#fff` | connector halo `Connector.tsx:109`; anchor fills `:133,140`; arrow stroke `:152` |
| `common.black` | `#000` | anchor outline `Connector.tsx:139` |
| `grey.400` | `#bdbdbd` | every card + label border — `Label.tsx:64`, `UiElement.tsx:16` |
| `action.hover` | `rgba(0,0,0,0.04)` | icon grid hover `IconGrid.tsx:24` |

### Typography — four steps, all in `em`

`theme.ts:55-73`:

| Variant | fontSize | lineHeight | Other |
|---|---|---|---|
| `h2` | `4em` | `1.2` | `fontStyle: 'bold'` (invalid — see What NOT to Copy) |
| `h5` | `1.3em` | `1.2` | — |
| `body1` | `0.85em` | `1.2` | — |
| `body2` | `0.75em` | `1.2` | — |

**Every overridden variant is `lineHeight: 1.2`** — a deliberate tight, dense, technical-drawing rhythm, well below MUI stock `1.5` for body text.

### Font families — two stacks, defined in two places

- **Theme: not set at all.** `themeConfig` has no `typography.fontFamily`, so all chrome runs MUI default `"Roboto","Helvetica","Arial",sans-serif`.
- **Canvas: its own constant.** `DEFAULT_FONT_FAMILY = 'Roboto, Arial, sans-serif'` (`src/config.ts:31`).

They agree on Roboto by coincidence, not by wiring. **Neither loads the font** — there is no `@font-face` or webfont import anywhere in `src/`; Roboto is assumed present on the host page.

### Shadows — a generated 25-step ramp where only spread varies

`theme.ts:40-50`:

    Array(25).fill('none').map((shadow, i) => {
      if (i === 0) return 'none';
      return `0px 10px 20px ${i - 10}px rgba(0,0,0,0.25)`;
    });

Real values: index 0 = `none`; index 1 = `0px 10px 20px -9px rgba(0,0,0,0.25)`; index 10 = `0px 10px 20px 0px rgba(0,0,0,0.25)`; index 24 = `0px 10px 20px 14px rgba(0,0,0,0.25)`.

Fixed y-offset `10px`, fixed blur `20px`, fixed colour `rgba(0,0,0,0.25)` — **only the spread moves**, from `-9px` to `+14px`. Low indices tighten into a soft drop; high indices bloom into a heavy dark halo. Only `boxShadow: 1` is ever used (`UiElement.tsx:15`) = `0px 10px 20px -9px rgba(0,0,0,0.25)`, a soft lifted-card shadow. The other 23 steps are generated and unused.

### Component defaults — the real UI personality

`theme.ts:79-133`:

| Component | Override | Visual effect |
|---|---|---|
| `MuiCard` | `elevation: 0`, `variant: 'outlined'` (`:80-85`) | Flat hairline-bordered cards, no default shadow |
| `MuiToolbar` | `backgroundColor: 'white'` (`:86-92`) | Toolbars pinned white against the `#f6faff` canvas |
| `MuiButtonBase` | `disableRipple: true`, `disableTouchRipple: true` (`:93-98`) | **No ripple anywhere** |
| `MuiButton` | `disableElevation`, `variant: 'contained'`, ripples off, `textTransform: 'none'` (`:99-111`) | Flat buttons, sentence case not SHOUTING |
| `MuiSvgIcon` | `color: 'action'`, `width: 17, height: 17` (`:112-122`) | **Every icon is 17x17**, not 24 |
| `MuiTextField` | `variant: 'outlined'`; `styleOverrides.root['.MuiInputBase-input'] = {}` (`:123-132`) | Outlined inputs; the empty rule is a no-op leftover |

The **global ripple kill** + **`disableElevation`** + **`elevation: 0` outlined cards** is the clearest design intent in the file: this is meant to read as a precise CAD/drafting instrument, not as Material Design. Ripples and elevation are Material's signature affordances and all three are switched off.

The **17px icon size** is deliberate and unusual — between MUI `small` (20px) and nothing, producing denser toolbars than stock Material allows.

### What is NOT overridden (all stock MUI v5)

- **Spacing unit: `8px`.** So `p: 0.5` = 4px, `py: 1` = 8px, `px: 1.5` = 12px, `m: 0.5` = 4px.
- **Shape / border-radius: `4px`** (`shape.borderRadius`). So `borderRadius: 1` = 4px and `borderRadius: 2` = **8px** — the value used by both `Label` (`:64`) and `UiElement` (`:14`), making **8px the de-facto card radius**.
- **z-index:** stock (`appBar: 1100`, `drawer: 1200`, `modal: 1300`, `tooltip: 1500`). The canvas does not use the MUI z-index scale at all.
- **Breakpoints:** stock (`xs:0, sm:600, md:900, lg:1200, xl:1536`). No responsive work in the canvas.
- **Transitions:** stock.

### `customVars` — the complete custom token set

Declared as an interface at `theme.ts:3-14`, module-augmented into MUI's `Theme` and `ThemeOptions` at `theme.ts:16-24` (so `theme.customVars` is type-safe), defined at `theme.ts:26-38`, injected at `theme.ts:53`.

**Four values, in full:**

    appPadding:    { x: 40, y: 40 }
    toolMenu:      { height: 40 }
    customPalette: { diagramBg: '#f6faff', defaultColor: '#a5b8f3' }

| Token | Value | Where consumed |
|---|---|---|
| `appPadding.x` / `.y` | `40` / `40` | `UiOverlay.tsx:218-220` — insets floating UI from the canvas edge |
| `toolMenu.height` | `40` | Tool menu bar height |
| `customPalette.diagramBg` | **`#f6faff`** | `Renderer.tsx:54-56` as `bgcolor`, overridable by the `backgroundColor` renderer prop |
| `customPalette.defaultColor` | **`#a5b8f3`** | `config.ts:29` -> `DEFAULT_COLOR.value` — default connector/rectangle colour |

`config.ts:15` imports `customVars` directly from `./styles/theme` (not via `useTheme`), which is how a module-level constant (`DEFAULT_COLOR`, `config.ts:27-30`) consumes a theme token outside React.

`#f6faff` is a slightly blue-tinted near-white, not pure `#fff`. Against it the grid lines at `rgba(0,0,0,0.15)` read as soft grey and `#a5b8f3` (desaturated periwinkle) reads present but unassertive. That is the palette's whole foundation: **a cool near-white ground with low-contrast furniture, so user-chosen node colours are the only saturated thing on screen.**

### Other visual constants (`src/config.ts`)

| Constant | Value | Line |
|---|---|---|
| `UNPROJECTED_TILE_SIZE` | `100` | `:17` |
| `PROJECTED_TILE_SIZE` | `{width: 141.5, height: 81.9}` (100 x 1.415 / 0.819) | `:18-26` |
| `DEFAULT_FONT_FAMILY` | `'Roboto, Arial, sans-serif'` | `:31` |
| `CONNECTOR_DEFAULTS` | `width: 10`, `style: 'SOLID'`, `showArrow: true` | `:49-54` |
| `CONNECTOR_SEARCH_OFFSET` | `{x: 1, y: 1}` | `:60` |
| `TEXTBOX_DEFAULTS` | `fontSize: 0.6`, `orientation: 'X'` | `:62-66` |
| `TEXTBOX_PADDING` / `TEXTBOX_FONT_WEIGHT` | `0.2` / `'bold'` | `:68-69` |
| `ZOOM_INCREMENT` / `MIN_ZOOM` / `MAX_ZOOM` | `0.2` / `0.2` / `1` | `:71-73` |
| `TRANSFORM_ANCHOR_SIZE` | `30` | `:76` |
| `TRANSFORM_CONTROLS_COLOR` | **`#0392ff`** | `:77` |
| `DEFAULT_LABEL_HEIGHT` | `20` (but `VIEW_ITEM_DEFAULTS.labelHeight = 80`, `:46`) | `:116` |
| `PROJECT_BOUNDING_BOX_PADDING` | `3` | `:117` |

Note `MAX_ZOOM = 1` — you can never zoom past 100%. The canvas only ever zooms *out*, which keeps the raster icon artwork from ever being magnified past its native resolution.

---

## Emotion usage

Emotion is a **transitive requirement of MUI v5, not an independent styling layer.** `@emotion/react` and `@emotion/styled` are listed (`package.json:23-24`) because MUI v5 requires them as peers.

- **No `styled()` calls.** No component in `src/` imports or calls Emotion's `styled`.
- **No `css` prop.** No `/** @jsxImportSource @emotion/react */` pragma anywhere.
- **No Emotion `keyframes`.** No `@keyframes` authored in `src/` at all.
- **Effectively 100% of styling goes through MUI's `sx` prop**, plus the split convention below.

### The one global stylesheet

`src/styles/GlobalStyles.tsx:5-15` — the entire global CSS in the product:

    <MUIGlobalStyles styles={{ div: { boxSizing: 'border-box' } }} />

A bare `div` element selector setting `box-sizing`. No reset, no normalize, no font loading. Mounted once at `src/Isoflow.tsx:65`.

### The third-party stylesheet

`src/styles/GlobalStyles.tsx:3` — `import 'react-quill/dist/quill.snow.css';`

The **only** external CSS in the build, imported as a side effect inside the global-styles module. It brings Quill's "snow" theme (light bordered toolbar) for the markdown/rich-text editor used in node descriptions (`Node.tsx:77`). Loaded unconditionally and globally, even in read-only mode.

### The `sx` vs `style` split — a real, consistent convention

The most transferable pattern in the codebase. Components systematically split styling across two props:

- **`sx`** — static styles, theme tokens, anything cacheable into an Emotion class
- **`style`** — per-frame dynamic values (positions from tile coordinates, projection matrices)

| Component | `sx` holds | `style` holds |
|---|---|---|
| `Node.tsx:54-59` | `position: 'absolute'` | `left: position.x, top: position.y` |
| `Label.tsx:56-77` | bgcolor, border, radius, padding, transform | `maxHeight`, `top: -labelHeight` |
| `TransformAnchor.tsx:28-37` | iso projection transform, size | computed `left`/`top` |
| `Connector.tsx:97` | — | `style={css}` from `useIsoProjection` |
| `SceneLayer.tsx:47-56` | `sx` only | nothing — gsap writes the transform directly to the ref |

The reason is performance and it is correct: Emotion hashes every unique `sx` object into a cached class. Feeding it continuously-changing pixel values would mint a new class per frame and blow out the stylesheet. Routing dynamic values through the plain `style` attribute keeps the Emotion cache stable at a handful of classes.

`SceneLayer` takes this furthest — the camera transform never passes through React or Emotion at all (`SceneLayer.tsx:32`).

---

## Component visual treatment

### The ground: canvas + grid

**Canvas background** — `Renderer.tsx:54-56`: `bgcolor` = `backgroundColor` prop ?? `theme.customVars.customPalette.diagramBg` (`#f6faff`).

**Root container** — `Isoflow.tsx:63-72`: `position: relative`, `overflow: 'hidden'`, and notably **`transform: 'translateZ(0)'`** (`:70`) — an explicit GPU-layer promotion forcing the whole canvas onto its own compositor layer so the gsap transforms on eight child SceneLayers composite rather than repaint.

**The grid tile** — `src/assets/grid-tile-bg.svg`, the only asset file in the repo:

- viewBox `0 0 141.38828 163.26061` — exactly `PROJECTED_TILE_SIZE.width` x 2x height, matching `tileSize.height * 2` in `Grid.tsx:34`
- Stroke group (`:2`): `stroke="#000000"`, **`stroke-opacity="0.15"`**, `stroke-width="1"`
- Content: one `<polygon>` diamond with `fill="none"` (`:3`) plus four `<line>` segments (`:4-7`) completing the half-diamonds so the pattern tiles seamlessly

Black at 15% over `#f6faff` — present enough to give spatial reference, faint enough never to compete with content. Also `pointerEvents: 'none'` (`Grid.tsx:52`) inside an `overflow: hidden` wrapper (`:51`).

### Connectors — the double-stroke halo

`src/components/SceneLayers/Connectors/Connector.tsx:107-125`. Every connector is **two stacked polylines on the same path**:

**Layer 1 — the halo** (`:107-116`):

    stroke        = theme.palette.common.white   (#fff)
    strokeWidth   = connectorWidthPx * 1.4
    strokeOpacity = 0.7
    strokeLinecap = "round", strokeLinejoin = "round"
    fill          = "none"

**Layer 2 — the line** (`:117-125`):

    stroke        = getColorVariant(color.value, 'dark', { grade: 1 })
    strokeWidth   = connectorWidthPx
    strokeLinecap = "round", strokeLinejoin = "round"

This is the single best visual technique in the codebase. The white halo at 1.4x width and 70% opacity separates the connector from the grid and from any connector crossing beneath it. Without it, overlapping connectors on a line grid become unreadable. It is the diagramming equivalent of a text halo on a map label.

The line colour is **not** the raw user colour — it goes through `getColorVariant(color.value, 'dark', {grade: 1})` (`:119`), darkening one grade via `chroma-js`. Fill colours are picked for area legibility; the same value as a 10px stroke would read too light, so it is darkened at draw time.

**Width:** `connectorWidthPx = (UNPROJECTED_TILE_SIZE / 100) * connector.width` (`:80-82`). With `UNPROJECTED_TILE_SIZE = 100` and `CONNECTOR_DEFAULTS.width = 10`, default is **10px** — connector width is expressed as a percentage of tile size.

**Line styles** (`:84-94`) — all derived from `connectorWidthPx`, so dash rhythm scales with thickness:

| Style | `strokeDasharray` | At default 10px | Appearance |
|---|---|---|---|
| `SOLID` (default) | `'none'` | — | Continuous |
| `DASHED` | `${w*2}, ${w*2}` | `20, 20` | Even dashes |
| `DOTTED` | `0, ${w*1.8}` | `0, 18` | Zero-length dashes + `round` linecap = **true circular dots** |

The zero-length-dash + round-cap trick for dots is worth stealing; it produces actual circles rather than short rectangles.

**The arrowhead** (`:147-158`), rendered only when `directionIcon && connector.showArrow !== false`:

    <polygon fill="black" stroke={white} strokeWidth={4}
             points="17.58,17.01 0,-17.01 -17.58,17.01" />

An isoceles triangle ~35px wide, 34px tall — **black fill with a 4px white stroke**, the halo idea applied again. Nested in two `<g>` wrappers, `translate(x,y)` then `rotate(rotation)` (`:148-149`), so rotation happens about the arrow's own centre.

**The mirror hack** (`:99-105`): the `<Svg>` carries `transform: 'scale(-1, 1)'` with an inline TODO admitting tile x-coordinates are computed mirrored and this is a patch, not a fix.

### Connector selection state

Driven from `Connectors.tsx:37` (`isSelected={selectedConnectorId === connector.id}`). Its **only** visual effect is revealing anchor handles — `anchorPositions` returns `[]` early when not selected (`Connector.tsx:51`). The connector line itself does not change colour, width, or glow.

Each anchor is a **two-circle stack** (`Connector.tsx:127-145`, via `src/components/Circle/Circle.tsx`):

- Outer: `radius={18}`, `fill={white}`, `fillOpacity={0.7}` — the halo again
- Inner: `radius={12}`, `fill={white}`, `stroke={black}`, `strokeWidth={6}`

A 24px white disc with a heavy 6px black ring on a 36px translucent white pad. High contrast, unambiguous grab target.

### Nodes

`src/components/SceneLayers/Nodes/Node/Node.tsx`. A node is **not a drawn shape** — it is an absolutely-positioned image plus an optional label. There is no node box, no fill, no border, no shadow. **The icon artwork is the node.**

- Positioned via `getTilePosition({tile, origin: 'BOTTOM'})` (`:24-29`) — anchored to the tile's bottom vertex so the icon sits *on* the diamond
- Icon wrapper is `pointerEvents: 'none'` (`:87`) — all hit-testing happens on the separate interaction layer (`Renderer.tsx:93-102`), never on the visuals
- Label offset: `bottom: PROJECTED_TILE_SIZE.height / 2` = **40.95px** above tile centre (`:64`)
- Label name: `<Typography fontWeight={600}>` (`:73`) — semibold, inheriting `body1` at `0.85em / 1.2`
- Name and description stacked with `<Stack spacing={1}>` = 8px gap (`:71`)

**Depth sorting** — `Nodes.tsx`: `{[...nodes].reverse().map(node => <Node order={-node.tile.x - node.tile.y} .../>)}`. The `order` becomes `zIndex` (`Node.tsx:51`). A painter's algorithm for isometric space: tiles further back (lower x+y) get higher z.

**Layer stacking:** `SceneLayer`'s `order` prop defaults to `0` (`SceneLayer.tsx:8`) and `Renderer.tsx:59-108` never passes it, so **all eight scene layers sit at `zIndex: 0`** and stacking is purely DOM order: Rectangles -> Grid -> Cursor -> Connectors -> TextBoxes -> ConnectorLabels -> [interaction layer] -> Nodes -> TransformControls. Nodes deliberately render *after* the interaction layer.

### Labels

`src/components/Label/Label.tsx:56-77` — the label card:

    bgcolor:         'common.white'    (#fff, against the #f6faff canvas)
    border:          '1px solid'
    borderColor:     'grey.400'        (#bdbdbd)
    borderRadius:    2                 (= 8px)
    py: 1, px: 1.5                     (= 8px vertical, 12px horizontal)
    transformOrigin: 'bottom center'
    transform:       translate(-50%, -100%|-50%)  per expandDirection
    overflow:        'hidden'

Flat white card, hairline grey border, 8px radius, **no shadow**. The asymmetric padding (wider than tall) keeps short labels from looking cramped.

**The leader line** (`Label.tsx:32-53`) — the detail that sells it. When `labelHeight > 0`, an inline SVG draws a vertical line from label down to node:

    CONNECTOR_DOT_SIZE = 3                      (Label.tsx:4)
    strokeDasharray    = `0, ${3 * 2}`  -> "0, 6"
    stroke = "black", strokeWidth = 3, strokeLinecap = "round"

Same zero-dash + round-cap trick as DOTTED connectors: a **chain of 3px black dots spaced 6px apart**.

**Expand behaviour** (`src/components/Label/ExpandableLabel.tsx`):

- Collapsed max height `STANDARD_LABEL_HEIGHT = 80` (`:12`)
- Truncation detected at `contentSize.height >= 80 - 10` (`:34`) — a 10px tolerance so a label that *just* fits does not sprout a button
- Expanding also widens: `maxWidth: isExpanded ? rest.maxWidth * 1.5 : rest.maxWidth` (`:45`). Node labels pass `maxWidth={250}` (`Node.tsx:67`), so expanded = **375px**
- Scrollbar hidden while keeping scroll: `'&::-webkit-scrollbar': {display: 'none'}` (`:50-52`) with `overflowY: 'scroll'` (`:55`)
- Scroll resets to top on toggle (`:37-39`)
- **The fade** — when truncated, a `<Gradient>` overlays the bottom `50px` (`:62-71`)

`src/components/Gradient/Gradient.tsx:12-13`:

    linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 5%, rgba(255,255,255,0) 100%)

Note the **5% solid hold** before the fade begins — the bottom 2.5px of the 50px band is fully opaque white, guaranteeing clean truncation of glyph descenders rather than a half-visible letter.

### The cursor highlight (hover state)

`src/components/Cursor/Cursor.tsx:16-23` — an `IsoTileArea` on the hovered tile:

    fill         = chroma(theme.palette.primary.main).alpha(0.5).css()
                 = chroma('#1976d2').alpha(0.5)  ->  rgba(25,118,210,0.5)
    cornerRadius = 10 * zoom

A 50%-opacity blue diamond with rounded corners that follows the mouse. `chroma-js` is used purely to inject alpha into a theme hex.

`IsoTileArea` (`src/components/IsoTileArea/IsoTileArea.tsx:41-47`) renders a plain `<rect>` with `rx={cornerRadius}` inside a projected `<Svg>` — the rounding is applied in unprojected space then skewed by the CSS matrix, so corners come out as correct isometric rounded corners rather than circular arcs.

### Transform controls (selection handles)

`TRANSFORM_CONTROLS_COLOR = '#0392ff'` (`config.ts:77`) — a bright azure, notably **not** a theme palette entry and different from stock primary `#1976d2`. `TRANSFORM_ANCHOR_SIZE = 30` (`config.ts:76`).

`src/components/TransformControlsManager/TransformAnchor.tsx:46-57`:

    width/height = 30 - 2*2 = 26
    fill         = isHovered ? theme.palette.primary.dark : theme.palette.common.white
    stroke       = '#0392ff'
    strokeWidth  = 2
    rx           = 3

A 26px white rounded square with a 2px azure outline that **fills with `primary.dark` on hover** (`:47-51`) — a hard swap, no transition, instantaneous. The wrapper carries `transform: getIsoProjectionCss()` (`:30`) so the handle is skewed into the isometric plane, and is offset by half its size to centre on the anchor point (`:35-36`). Hover is local `useState` (`:16`) driven by `onMouseOver`/`onMouseOut` (`:21-26`).

### Floating UI chrome

`src/components/UiElement/UiElement.tsx:12-20` — the wrapper for every floating panel:

    <Card borderRadius: 2      (8px)
          boxShadow: 1         (0px 10px 20px -9px rgba(0,0,0,0.25))
          borderColor: 'grey.400'
          p: 0 />

Inherits `MuiCard` defaults `elevation: 0, variant: 'outlined'` (`theme.ts:80-85`), so `boxShadow: 1` re-adds a shadow on top of an outlined card — **hairline border and soft drop shadow together**. `p: 0` means panels manage their own padding. Positioned via `customVars.appPadding` at `UiOverlay.tsx:218-220`.

---

## Assets + iconography

### `src/assets/` — the complete inventory

**One file.** `src/assets/grid-tile-bg.svg` (9 lines, detailed above). That is the entire asset directory — no textures, no icon sprites, no fonts, no images. Imported once at `Grid.tsx:5`, consumed at `Grid.tsx:61` as `background: repeat url("${gridTileSvg}")`.

### Where node icons actually come from

Icons are **not bundled**. They arrive as data at runtime.

The `Icon` shape (schema `src/schemas/icons.ts:9`) is `{id, name, url, isIsometric?}`. `DEFAULT_ICON` (`config.ts:107-112`) is `{id:'default', name:'block', isIsometric:true, url:''}` — note the **empty `url`**, so an unresolved icon renders a broken image, not a placeholder glyph. `INITIAL_DATA.icons = []` (`config.ts:79`); the host application supplies the icon set.

### The isometric glyph system: `@isoflow/isopacks`

Yes, there is one — and it lives **entirely outside this package**, as a **devDependency** (`package.json:59`) used only by the examples. `src/examples/initialData.ts:3-10`:

    import { flattenCollections }  from '@isoflow/isopacks/dist/utils';
    import isoflowIsopack          from '@isoflow/isopacks/dist/isoflow';
    import awsIsopack              from '@isoflow/isopacks/dist/aws';
    import gcpIsopack              from '@isoflow/isopacks/dist/gcp';
    import azureIsopack            from '@isoflow/isopacks/dist/azure';
    import kubernetesIsopack       from '@isoflow/isopacks/dist/kubernetes';
    const isopacks = flattenCollections([...]);   // :10
    export const icons: Icons = isopacks;          // :49

Five packs — a generic isoflow set (server, database, cloud, etc.) plus AWS, GCP, Azure and Kubernetes service icons. `flattenCollections` merges them into one flat `Icon[]`. The library itself defines only the contract (`{url, isIsometric}`); the packs supply pre-rendered isometric artwork.

### How an icon is projected onto a tile — two distinct paths

`src/hooks/useIcon.tsx:24-39` branches on `icon.isIsometric`:

**Path A — `isIsometric: true`** -> `IsometricIcon` (`.../Node/IconTypes/IsometricIcon.tsx:23-37`):

    component="img", src={url}
    width: PROJECTED_TILE_SIZE.width * 0.8   = 141.5 * 0.8 = 113.2px
    top:   -size.height          (size from useResizeObserver)
    left:  -size.width / 2
    pointerEvents: 'none'

**No CSS transform is applied.** The artwork is already drawn in isometric perspective by the pack author. The component only *anchors* it: `left: -w/2` centres horizontally, `top: -h` sits the image's bottom edge on the tile origin — and since `Node.tsx:26` positions with `origin: 'BOTTOM'`, the icon's base lands exactly on the tile's bottom vertex. The image's own height is measured with a `ResizeObserver` (`:13,18`) because icons in a pack have varying aspect ratios (a tall server vs a flat disk), so the anchor cannot be a constant.

**Path B — `isIsometric: false`** -> `NonIsometricIcon` (`.../NonIsometricIcon.tsx:14-29`):

    outer Box: position absolute
      left: -PROJECTED_TILE_SIZE.width / 2    = -70.7
      top:  -PROJECTED_TILE_SIZE.height / 2   = -40.95
      transformOrigin: 'top left'
      transform: getIsoProjectionCss()
    inner img: width = PROJECTED_TILE_SIZE.width * 0.7   = 99.0px

Here a **flat** icon (any ordinary square logo/PNG) is **skewed into the isometric plane by CSS matrix** and lies flat *on* the tile like a decal, rather than standing up on it.

The two paths are visually distinct by design: isometric icons are 3D objects sitting on the grid at **80%** tile width; non-isometric icons are flat tiles painted on the ground at **70%** tile width. `IconSelectionControls.tsx:142` (`isIsometric: treatAsIsometric // Use user's preference`) lets the user force either treatment per imported icon.

**Loading state:** `useIcon` tracks `hasLoaded` (`:9`), resets on `icon.url` change (`:21-23`), sets `true` immediately for non-isometric icons (`:27`) and on the `onLoad` callback for isometric ones (`:32-35`). `IsometricIcon.tsx:27` wires `onLoad={onImageLoaded}`.

---

## Interaction feel

What makes it read as an instrument rather than a form:

**1. Cursor states are modal and explicit.** `setWindowCursor` (`src/utils/common.ts:41-43`) writes `window.document.body.style.cursor` directly — a global cursor, not per-element CSS. The complete map:

| Mode | Cursor | Location |
|---|---|---|
| Pan — idle | `grab` | `interaction/modes/Pan.ts:7` |
| Pan — dragging | `grabbing` | `interaction/modes/Pan.ts:28` |
| Pan — drag release | back to `grab` | `interaction/modes/Pan.ts:32` |
| Pan — exit | `default` | `interaction/modes/Pan.ts:10` |
| Draw connector | `crosshair` | `interaction/modes/Connector.ts:13` |
| Draw rectangle | `crosshair` | `interaction/modes/Rectangle/DrawRectangle.ts:7` |
| Place textbox | `crosshair` | `interaction/modes/TextBox.ts:6` |
| Unmount | `default` | `Isoflow.tsx:47` |

The `grab` -> `grabbing` -> `grab` cycle is the classic direct-manipulation tell. Each mode sets its cursor on entry and restores `default` on exit — a disciplined pairing with no leaks — and the unmount cleanup at `Isoflow.tsx:45-49` means the cursor never survives the component.

**2. Snapping is absolute.** Everything is tile-indexed (`mouse.position.tile`, `Cursor.tsx:9-11`). There is no free positioning and therefore no "almost aligned" state. The diagram cannot be made messy — a strong instrument-like constraint.

**3. The hover tile is always lit.** The `Cursor` component (`Renderer.tsx:73-77`, gated on `mode.showCursor`) paints a 50%-blue diamond on whatever tile the mouse is over. Living in its own `SceneLayer`, it inherits the same 0.25s `power1.out` camera tween. Continuous spatial feedback even when nothing is selected.

**4. The camera has weight.** `power1.out` with tween interruption (`SceneLayer.tsx:32-37`) makes pan/zoom feel like moving a physical drawing rather than scrolling a div.

**5. Drag feedback deliberately has no weight.** `UiOverlay.tsx:229` — `disableAnimation` on the `PLACE_ICON` drag ghost. The one place where lag would feel broken is the one place it is removed. This contrast is the sharpest interaction judgement in the codebase.

**6. Hit-testing is separated from visuals.** `Renderer.tsx:93-102` is a dedicated full-bleed interaction layer; node icons (`Node.tsx:87`), the grid (`Grid.tsx:52`) and both icon types (`IsometricIcon.tsx:34`, `NonIsometricIcon.tsx:13`) all set `pointerEvents: 'none'`. Interaction is computed from tile coordinates, not DOM event targets — so hover/click never snag on a transparent PNG edge.

**7. Progressive disclosure on labels.** Labels stay at 80px until asked (`ExpandableLabel.tsx:12,30`), the fade signals more (`:62-71`), the `ExpandButton` appears only when warranted (`:74-88`), and expansion widens as well as heightens (`:45`). The 10px truncation tolerance (`:34`) prevents a button appearing for one stray pixel.

**8. No ripples, no elevation, sentence case.** `theme.ts:93-111`. The chrome behaves like a tool palette, not a Material app.

**9. Dense chrome.** 17px icons (`theme.ts:118-119`), `lineHeight: 1.2` throughout (`:55-72`), `body2` at `0.75em`. Information density over comfort — a professional-tool choice.

**10. Zoom only ever goes out.** `MIN_ZOOM = 0.2`, `MAX_ZOOM = 1`, `ZOOM_INCREMENT = 0.2` (`config.ts:71-73`). 100% is the ceiling, so raster icon artwork is never magnified past native resolution — it can only ever get crisper-per-pixel, never blurrier.

**11. Empty states.** `INITIAL_DATA` (`config.ts:79-87`) has empty `items`/`views`, so a fresh canvas is `#f6faff` with the 15%-opacity grid and the hover diamond. There is no empty-state illustration or onboarding copy — **the grid itself is the empty state**, which reads as "ready" rather than "nothing here."

**12. Loading states.** `Isoflow.tsx:61` — `if (!initialDataManager.isReady) return null;` renders **nothing** until data is ready, no skeleton. `Loader` (`Loader.tsx:21`) is a stock 20px MUI `CircularProgress` used for in-flight operations.

---

## Paper + pathfinding

### `paper` — a dependency that draws nothing

`paper: ^0.12.17` (`package.json:26`). Its complete source footprint:

- `src/components/Lasso/Lasso.tsx:2` — `// import { Rectangle, Shape } from 'paper';` — **commented**
- `src/components/Lasso/Lasso.tsx:15` — `//   const shapeRef = useRef<paper.Shape.Rectangle>();` — **commented**

There are no other references. **Paper.js is never imported, never initialised, and renders nothing. There is no second canvas engine.** The entire product renders through SVG (`src/components/Svg/Svg.tsx`) and DOM/CSS.

So the answer to "why was a second canvas engine needed alongside SVG/DOM" is: **it wasn't, and it isn't.** The evidence in `Lasso.tsx:1-83` is that an earlier architecture — referencing `src/renderer/utils/constants`, `src/renderer/utils/projection` and `applyProjectionMatrix`, none of which exist in this tree — used Paper for a marching-ants selection rectangle. That architecture was replaced by the SVG/DOM approach; the file was commented out rather than deleted and the dependency was never removed.

The visual result of paper in the shipped product is: **nothing**. The marching ants never appear.

### `pathfinding` — where A* becomes visible

`pathfinding: ^0.4.18` (`package.json:27`). Single call site: `src/utils/pathfinder.ts`.

    const grid = new PF.Grid(gridSize.width, gridSize.height);        // :11
    const finder = new PF.AStarFinder({                               // :12
      heuristic: PF.Heuristic.manhattan,                              // :13
      diagonalMovement: PF.DiagonalMovement.Always                    // :14
    });
    const path = finder.findPath(from.x, from.y, to.x, to.y, grid);   // :16

**The visible effect is the shape of every connector.** The returned tile array becomes `connector.path.tiles`, which `Connector.tsx:42-48` reduces into the `points` string of both polylines. Every bend you see in a connector is an A* decision.

The two configuration choices are directly legible on screen:

| Setting | Visual consequence |
|---|---|
| `DiagonalMovement.Always` (`:14`) | Connectors may cut **diagonally** across the grid, not just orthogonally. On an isometric grid a diagonal step is a 45-degree screen-space move, so connectors read as clean iso-aligned runs instead of stair-stepped Manhattan routes. |
| `Heuristic.manhattan` (`:13`) | A Manhattan heuristic paired with diagonal movement is *inadmissible* (it can overestimate), which makes A* greedier and less optimal — but it produces paths that commit to a direction early rather than wandering. Visually: fewer, longer, more decisive segments. |

`PF.Grid` is constructed with **no walls** (`:11`) — every tile is walkable. Connectors therefore route freely through nodes and each other; there is no obstacle avoidance. Combined with the white halo stroke (`Connector.tsx:107-116`), crossings stay readable instead of being routed around. That is the trade: legibility is solved at draw time, not at route time.

The search space is bounded by `CONNECTOR_SEARCH_OFFSET = {x: 1, y: 1}` (`config.ts:60`), documented at `config.ts:58-59` as "the grid that encompasses the two nodes + the offset" — one tile of padding, so connectors can bow out by a single tile to clear an anchor but no further.

**Rounding:** `strokeLinejoin="round"` on both polylines (`Connector.tsx:112,122`) softens every A* corner. At the default 10px width the join radius is 5px, which is what stops routed paths from looking like circuit traces.

---

## What NOT to copy

### Clear defects

1. **`fontStyle: 'bold'` is invalid CSS.** `src/styles/theme.ts:58`. `font-style` accepts `normal | italic | oblique` only. The declaration is dropped by the browser, so `h2` renders at default weight. The author meant `fontWeight: 'bold'`. Copy the intent, fix the property.
2. **`paper` is a dependency for dead code.** `package.json:26` + `Lasso.tsx:1-83` (entirely commented). Ships a vector library that renders nothing.
3. **`Lasso.tsx` references paths that no longer exist.** `Lasso.tsx:5,10,11` import from `src/renderer/utils/constants` and `src/renderer/utils/projection` and use `PIXEL_UNIT` — none present in this tree. Even uncommented it would not compile. Treat as a design spec, not code.
4. **The mirror hack on connectors.** `Connector.tsx:99-105`: `transform: 'scale(-1, 1)'` with the author's own TODO — *"The original x coordinates of each tile seems to be calculated wrongly. They are mirrored along the x-axis. The hack below fixes this, but we should try to fix this issue at the root."* This flips the coordinate system for the connector SVG only, which is why anchor and arrow positions need compensating maths. Fix at the source in any reimplementation.
5. **Hooks called after an early return.** `Connector.tsx:27-35`: `if (!connector || !color) return null;` at `:27-29`, then `useIsoProjection` at `:31` and `useMemo` at `:35`. Violates the Rules of Hooks — the hook count changes between renders when a connector's colour resolves. Latent crash, not a style issue.
6. **Export can capture mid-tween.** `exportOptions.ts:178-185` calls `domtoimage.toPng` on the live element with no gsap settle/kill first. An export fired during a pan captures an interpolated transform.
7. **23 of 25 shadow steps are generated and unused.** `theme.ts:40-50`; only `boxShadow: 1` is consumed (`UiElement.tsx:15`). The high indices (`+14px` spread at 25% black) would be unusable anyway.
8. **Empty style rule.** `theme.ts:129`: `'.MuiInputBase-input': {}` — a no-op leftover.
9. **`DEFAULT_ICON.url` is `''`.** `config.ts:111`. An unresolved icon renders a broken-image indicator rather than a placeholder.

### Probable accidents (deliberate-looking but likely not)

10. **Double depth-reversal on nodes.** `Nodes.tsx` both calls `[...nodes].reverse()` *and* computes `order={-node.tile.x - node.tile.y}`. One is redundant; applying both means DOM order and z-index disagree about direction. The z-index values are also **negative**, which can push nodes behind their own stacking-context parent. Derive fresh rather than copy.
11. **`cornerRadius={10 * zoom}` on the cursor.** `Cursor.tsx:21`. The `IsoTileArea` already sits inside a `SceneLayer` that gsap scales by `zoom` (`SceneLayer.tsx:36`), so the radius is scaled twice — at 0.2 zoom the effective radius is 0.4px, at 1.0 it is 10px. Corner rounding vanishes non-linearly as you zoom out. Likely should be a constant.
12. **Two font stacks defined independently.** `config.ts:31` vs the theme's inherited MUI default. They agree on Roboto by coincidence; changing one will not change the other.
13. **No `@font-face` or font import.** Roboto is named in both stacks but never loaded. If the host page lacks it everything silently falls back to Arial/Helvetica — and the tight `lineHeight: 1.2` was tuned against Roboto's metrics.
14. **Quill's stylesheet is imported globally and unconditionally.** `GlobalStyles.tsx:3`. Loads even in `editorMode: 'READONLY'` and even when no node has a description, and its selectors are global.
15. **No `prefers-reduced-motion` handling.** The `disableAnimation` prop (`SceneLayer.tsx:10`) is the ready-made hook for it and is wired to exactly one caller. Free win in a reimplementation.
16. **`transition: 'background-color 0.2s'` exists exactly once** (`IconGrid.tsx:26`) at a duration matching nothing else (canvas is `0.25s`). Reads as ad-hoc rather than systemic.
17. **`primary` is never set.** The most prominent interactive colour — the hover-tile highlight (`Cursor.tsx:20`) and the anchor hover fill (`TransformAnchor.tsx:49`) — is stock MUI `#1976d2`, while the deliberately-chosen `TRANSFORM_CONTROLS_COLOR` is `#0392ff` (`config.ts:77`). Two different blues, only one of them chosen.

---

## Verdict: paper vs pathfinding

**`paper` — drop it.** Zero call sites, zero pixels. It is dead weight in this fork; the only thing worth keeping is the commented marching-ants *spec* (`Lasso.tsx:52-70`: dashArray `[5,10]`, infinite `dashOffset` tween at `ease:'none'`, 0.25s), which is trivially reimplementable as an animated `stroke-dashoffset` on the existing SVG path with no new dependency.

**`pathfinding` — take it, deliberately.** It is genuinely load-bearing for connector shape, and the two config choices (`DiagonalMovement.Always` + `Heuristic.manhattan`, `pathfinder.ts:13-14`) are precisely what make routes read as iso-aligned and decisive rather than stair-stepped. Small dependency, real visual payoff. Note the grid is walls-free (`:11`), so obstacle-aware routing would be new work, not a config flip.

---

## Lift notes for prism-viz-engine

**Take directly (small, high-value, dependency-free):**

1. **The connector double-stroke halo** — ~20 lines (`Connector.tsx:107-125`). Highest-value visual technique in the repo; generalises to any line-over-texture rendering.
2. **The grid tile SVG + background-position animation** — `grid-tile-bg.svg` (9 lines) + `Grid.tsx:22-41`. An infinite, zoomable, pannable isometric grid for one DOM node.
3. **The dotted-line technique** — `strokeDasharray="0, N"` + `strokeLinecap="round"` (`Connector.tsx:89`, `Label.tsx:48-51`).
4. **The `Gradient` fade with its 5% opaque hold** (`Gradient.tsx:12-13`).
5. **The two-circle anchor handle** (`Connector.tsx:127-145`).
6. **`customVars` module augmentation** (`theme.ts:3-24`) — type-safe custom tokens on an MUI theme, consumable outside React (`config.ts:15`).

**Take the pattern, rewrite the code:**

7. **The motion contract** — two tweens, one duration (`0.25s`), one ease (`power1.out`), one suppression flag. Worth promoting to explicit tokens rather than two literals in two files. Add the `prefers-reduced-motion` gate through the existing `disableAnimation` seam.
8. **The `sx`/`style` split** — the difference between ~6 cached Emotion classes and one class per frame.
9. **Cursor-mode discipline** — entry sets, exit restores, unmount resets (`interaction/modes/*.ts`, `Isoflow.tsx:45-49`).
10. **Visuals `pointerEvents: 'none'` + a dedicated interaction layer** (`Renderer.tsx:93-102`) — decouples hit-testing from artwork.

**Decide deliberately:**

11. **Icon strategy.** FossFLOW's isometric icons are **pre-rendered raster artwork** from external packs, not projected geometry — which is why they look right and why the library ships no icon assets. Prism has to answer the same question: supply an artwork pack, or generate projected glyphs. The `isIsometric` flag with its two rendering paths is a clean contract either way.
12. **Theme thinness.** Set `primary` explicitly if lifting the theme — FossFLOW's most prominent interactive blue is an un-chosen MUI default.
