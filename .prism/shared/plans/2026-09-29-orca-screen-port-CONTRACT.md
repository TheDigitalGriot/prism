# Contract — porting one Orca screen to the Djeli canvas

You are porting ONE screen. Read it, then render it. You are not summarising it, not
documenting it, and not designing a better one.

## Inputs

- SOURCE (read-only): `C:\Users\digit\GriotSandbox\orca\src\renderer\src\components\<your screen>`
- TOKENS (read-only, the ONLY colour source):
  `C:\Users\digit\GriotSandbox\orca\src\renderer\src\assets\main.css`, the `.dark` block.
  Measured values: background `#0a0a0a` · foreground `#fafafa` · card/popover/sidebar `#171717` ·
  secondary/muted `#262626` · muted-foreground `#a1a1a1` · accent `#404040` ·
  border `rgb(255 255 255 / 0.07)` · input `rgb(255 255 255 / 0.15)` · ring `#737373` ·
  primary `#e5e5e5` · sidebar-primary `#1447e6`.
  Never invent a colour. A Tailwind class in the source maps to one of these.
- REFERENCE, already on the canvas and already correct — match its species exactly:
  `C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-ide-shell\project\OrcaShellDesktop.dc.html`
  and `OrcaShellMobile.dc.html`. Read them before writing yours.

## Outputs — a PAIR, or the run failed

- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-ide-shell\project\<Name>.dc.html`
  — desktop, root exactly 1440x900.
- `...\<Name>Mobile.dc.html` — mobile, root exactly 390x844.
Both, always. A desktop board without its twin is a failed run.

## The Design type's rules — each one fails silently if broken

1. `<script src="./support.js"></script>` in `<head>`, byte for byte.
2. `<x-dc>` wraps the body; a `<helmet>` holds ONLY the Google Fonts link, `body{margin:0;...}`,
   the `a`/`a:hover` colours and any `@keyframes`. Nothing else belongs there.
3. The root element carries a FIXED inline size equal to the board frame:
   `style="width: 1440px; height: 900px; box-sizing: border-box; ..."`.
4. A `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>`
   block with `class Component extends DCLogic { renderVals() { return {} } }`. Classic JS, no imports.
5. LAYOUT LIVES IN INLINE `style="…"`. That is what the canvas properties panel edits. Do not put
   layout in a stylesheet.
6. Close every non-void element, quote every attribute.
7. Real elements, always: `<button type="button">`, `<a href>`, `<input>` with a `<label>` (visually
   hidden is fine). Never a div with a click handler. `aria-label` on icon-only buttons. Interactive
   targets at least 44px. Text contrast 4.5:1 — `#a1a1a1` on `#0a0a0a` passes, lighter greys do not.
8. Icons are inline stroke `<svg>`. No emoji, no icon fonts, no external images.
9. No `<iframe>`, `<object>`, `<embed>`, no network beyond the Google Fonts `css2` link.

## How to port

Render the state the CODE ACTUALLY RENDERS for its default/empty case, the way the running app
looks right now. If the component branches on data — a list that is empty, a button disabled when
`repos.length === 0` — port the branch that is live today and let it read honestly. Do not invent a
populated state to make the board look richer; an honest empty state is the point.

Copy real strings from the source, including `translate(...)` fallbacks, which are the English text.
Keep real spacing, radii and weights: a `rounded-2xl` is 16px, `size-20` is 80px, `text-4xl` is 36px,
`gap-4` is 16px. Convert Tailwind to real numbers rather than approximating by eye.

Mobile is the same screen at 390 wide, not a different design: stack what was side by side, keep
every control, grow touch targets. If the source has its own mobile component under `mobile/`, port
that instead and say so.

## Gate before you finish

- both files exist, and each contains its own `$preview` matching its root size
- `support.js` line present in both
- every colour in the file appears in the token list above
- no `<iframe>`, no emoji, no external image
- you cited the source file:line for the markup you ported, in your summary

## Finish

Write `C:\Users\digit\GriotApps\Prism\.prism\local\port-<slug>-DONE` containing the two file names
and the source file:line you ported from. Return a ~10 line summary only; the work is the files.
