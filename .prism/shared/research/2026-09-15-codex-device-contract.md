---
date: 2026-09-15
topic: codex device contract - what prism-codex-plan-sync must read (forward) and write back (reverse)
stage: B26 STEP2_GROUND
status: documentarian - describes what exists, cites file:line, verified by Node counts this session
---

# Codex device contract

Grounding for B26 (`.prism/shared/plans/2026-09-15-b26-device-carriage-CONTEXT.md`). Every claim here
was observed this session by line-ranged reads and Node substring counts. Unverified items are
marked **UNVERIFIED**.

## Sources

| Id | Path | Size |
|---|---|---|
| T | `C:\Users\digit\.claude\skills\griot-app-codex\assets\codex-template.html` | 596 lines |
| P | `C:\Users\digit\GriotMeta\griot-live-artifacts\live\prism-codex.html` | 1227 lines, 1,430,679 b |
| L | `C:\Users\digit\GriotMeta\griot-live-artifacts\live\*-codex.html` | 47 files |

## 1. Two device kinds

| Kind | Template marker | Toggles are | Class prefix in T | State attr |
|---|---|---|---|---|
| **Form-factor device** | `[OPT:DEVICE]` (T:26, closes `[/OPT:DEVICE]` T:448) | desktop / tablet / phone of ONE design | `tsd-*` | `.tsd-btn.on` class toggle |
| **Surfaces device** | `[OPT:DEVICE-SURFACES]` (T:29-33; markup T:252-306; handler T:307-343; no closing marker) | the app's NAMED SURFACES, each with its own real frames | `tsdx-*` | `aria-pressed="true"` |

Template text on the relationship (T:29-33, verbatim):

```
[OPT:DEVICE-SURFACES]
       ALTERNATIVE to the above: a device whose toggles are the app's
       NAMED SURFACES (VS Code / desktop / CLI / mobile / foundation)
       rather than desktop/tablet/phone. Use when the app ships several
       distinct surfaces; each carries its own real frames. Never ship
       both device blocks - pick one.
```

and the CSS comment (T:211): `use INSTEAD of the form-factor morph when the app has NAMED SURFACES`.

> **FLAGGED FOR GAVIN - wording conflict, not ruled here.** The B26 contract locks "The form-factor
> device is never replaced by the surfaces device. They coexist." The template says, per codex,
> "Never ship both device blocks - pick one." Read literally, they don't contradict each other:
> both device kinds coexist in the template as supported options, and choosing the surfaces device
> for a new codex never deletes or overwrites a form-factor device a codex already carries. The skill
> docs are written to that reading. Whether a single codex may carry both at once is Gavin's call.

## 2. Surfaces device - the exact contract (T)

### Tokens (T:270-280)

```
{{SURFACES}}   one <button class="tsdx-sb"> per surface:
               <button class="tsdx-sb" role="tab" aria-pressed="false" data-surf="KEY"><b>NAME</b><span>SUBTITLE</span></button>
               The FIRST one should carry aria-pressed="true".
{{DEVICE_DATA}} the JSON payload in #tsdxData:
               { "turns": { "t1": "Turn 1 — …" },
                 "frames": [ { "id":"5a", "s":"SURFACE_KEY", "t":"t5",
                               "label":"Full daily layout",
                               "note":"one honest line about the frame",
                               "src":"data:image/jpeg;base64,…" } ] }
{{DEVICE_CAP}}  provenance line — the source .dc.html, the project name,
                how it was recovered, and the date.
```

`{{DEVICE_CAP}}` is shared with the form-factor block (T:446). Form-factor-only tokens:
`{{DEVICE_LEAD}}` T:424, `{{DEVICE_SCREEN}}` T:431, `{{DEVICE_MODES}}` T:414/444,
`{{DEVICE_SURFACES}}` T:422 (inside the placeholder), `{{APP_NAME}}` T:420/432.

### Markup (T:293-306)

```html
<div class="tsdx">
  <div class="tsdx-surf" id="tsdxSurf" role="tablist">{{SURFACES}}</div>
  <div class="tsdx-frames" id="tsdxFrames"></div>
  <div class="tsdx-stage">
    <div class="tsdx-rig" id="tsdxRig"><div class="tsdx-bez"><div class="tsdx-screen"><img id="tsdxImg" alt=""></div></div></div>
    <div class="tsdx-meta">
      <div class="tsdx-turn" id="tsdxTurn"></div>
      <div class="tsdx-label" id="tsdxLabel"></div>
      <div class="tsdx-note" id="tsdxNote"></div>
    </div>
    <div class="tsdx-cap">{{DEVICE_CAP}}</div>
  </div>
</div>
<script id="tsdxData" type="application/json">{{DEVICE_DATA}}</script>
```

A **frame is a JSON record, not a DOM node**. There is one shared `<img>`, and the handler paints it.
Adding a surface means adding one toggle `<button>` plus that surface's frame records.

### Handler (T:311-341)

```js
var RIGMODE={mobile:'phone',cli:'term'};   /* extend per app; default = desktop */
...
document.getElementById('tsdxRig').className='tsdx-rig'+(RIGMODE[f.s]?' '+RIGMODE[f.s]:'');
```

- `surface(k)` sets `aria-pressed` on the `.tsdx-sb` whose `data-surf===k`.
- It filters `D.frames` by `f.s===k` and builds `<button class="tsdx-fb" data-fid>` with `'<i>'+f.id+'</i>'+f.label`.
- It paints the first matching frame.
- On load it calls `surface()` on the first `.tsdx-sb` (T:339-340).

Geometry (T:230-232): `.tsdx-rig{max-width:960px}` · `.tsdx-rig.phone{max-width:290px}` ·
`.tsdx-rig.term{max-width:760px}`. Image (T:237): `.tsdx-screen img{width:100%;height:auto;display:block}`.
It uses **no object-fit** because frames render at their natural height.

### Accent chain (T:219-220, 225-226, 238)

`var(--accent,var(--ember,var(--mint,#e0a458)))`. T:214-215 explains it: "codexes name their accent
token differently (Prism uses --mint, most use --ember)". Active surface chip = accent border + text;
active frame chip = accent fill + `color:#06070a`.

## 3. Form-factor device - the exact contract (T)

```html
<div class="tsd-stage"><div class="tsd-rigwrap"><div class="tsd-rig desktop" id="tsdRig">
  <div class="tsd-frame"><div class="tsd-cam"></div><div class="tsd-screen">
    {{DEVICE_SCREEN}}
    <!-- SNAPSHOT: <img class="tsd-shot" alt="{{APP_NAME}} — current design" src="data:image/jpeg;base64,…">
         LIVE:     <iframe class="tsd-frameiframe" srcdoc="…"></iframe> -->
...
<div class="tsd-ctrl">
  <button class="tsd-btn on" data-m="desktop">Desktop</button>
  <button class="tsd-btn" data-m="tablet">Tablet</button>
  <button class="tsd-btn" data-m="phone">Phone</button>
```

- T:163 `.tsd-shot{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}`
- T:180 `.tsd-btn.on{…background:var(--ember)…}`. This uses plain `--ember` with **no** fallback chain.
- Handler T:583-591: `rig.className='tsd-rig '+b.getAttribute('data-m')` with an `.on` class swap.

**Self-declaring placeholder** (T:419-422):

```html
<div class="tsd-ph"><div class="pa"></div><div class="pt">Design pending</div>
  <div class="px">{{APP_NAME}}'s confirmed design export isn't locked. This frame embeds the
  real UX/UI once it is — the codex re-pushes on that edit.</div>
  <div class="surfs">{{DEVICE_SURFACES}}</div></div>
```

## 4. Reference implementation - Prism (P)

Node substring counts on P, this session:

| token | count |
|---|---|
| `class="pfx-` | 16 |
| `tsdx-` | 0 |
| `tsd-` | 0 |
| `class="placeholder` / `class="screen` / `class="rig` | 0 / 0 / 0 |
| `--mint:` | 1 |
| `--ember:` | 0 |
| `--accent:` | 0 |
| `var(--accent,var(--ember,var(--mint` | 7 |
| `"s":"` (frame records) | 15 |
| `pfx-cap` | 2 (1 CSS + 1 element) |

- **Prefix = `pfx-*`**: `pfx`, `pfx-surf`, `pfx-sb`, `pfx-frames`, `pfx-fb`, `pfx-stage`, `pfx-rig`,
  `pfx-bez`, `pfx-screen`, `pfx-meta`, `pfx-turn`, `pfx-label`, `pfx-note`, `pfx-cap`. IDs are `pfxSurf`,
  `pfxFrames`, `pfxRig`, `pfxImg`, `pfxTurn`, `pfxLabel`, `pfxNote`, `pfxData`. The CSS is identical to
  T's `tsdx-*` except `.pfx-fb[aria-pressed="true"]` adds `text-shadow:none`.
- **Bare CSS survives, unused.** P:110-123 still defines `.stage`, `.rigwrap`, `.rig`, `.frame`,
  `.screen`, `.placeholder` (+ `.pa`/`.pt`/`.px`/`.surfs`) and `.rig.desktop .frame`, which is the
  unprefixed form-factor device layer. No body element carries those classes (counts above).
- **Accent**: only `--mint:#10FFBA` is defined (P:19). Without the fallback chain an `--ember`-keyed
  active chip resolves to nothing and becomes invisible, which is why the chain is load-bearing.
- **Toggles** (P:354): `vscode` VS Code · `electron` Desktop · `cli` CLI / TUI · `mobile` Mobile ·
  `foundation` Foundation.
- **Frames**:

  | surface | frame ids |
  |---|---|
  | vscode | 5a, 4b |
  | electron | 1b, 4a, 5d, 2b, 5e, 2c |
  | cli | 3c, 5b |
  | mobile | 3b |
  | foundation | 1a, 3a, 2a, 5c |

  That is 15 frames. The turns are JSON keys `t1`-`t5` in `pfxData` (P:366); there are no HTML turn attributes.
- **Handler** (P:368-397): the same logic and the same `RIGMODE={mobile:'phone',cli:'term'}` (P:370). It
  has no `if(!el)` guard and ends with a hardcoded `surface('vscode')`.
- **Placeholders**: none. The closest thing is the honest note on frame 5c ("Renders empty
  headlessly - WebGL needs a GPU."), which is a real frame with a caveat, not a gap.

### Provenance line (the `*-cap` element)

P:363 (surfaces device):

```html
<div class="pfx-cap">Every state above is a <b>real frame</b> from <b>Prism Surface System.dc.html</b> (375KB), the Claude Design project named <i>Prism five-surface design sweep</i> &mdash; recovered 2026-09-15 through the <code>griot-cc-cd-sync</code> pull channel ... Nothing here is a mock.</div>
```

Form-factor examples: `anansi-codex.html:290` `<div class="tsd-cap">Source: <b>Anansi Loom.dc.html</b> &mdash; the real
Claude Design export, pulled 2026-09-15 via <code>griot-cc-cd-sync</code>...` and `kora-codex.html:296`
`<div class="tsd-cap">Source: <b>Kora.dc.html</b> ...`.

A provenance line carries: source `.dc.html` file name, Claude Design project name, recovery channel
(`griot-cc-cd-sync`), and date. These are the seeds for a surface-scoped story's `context.graphTargets`
and `context.references`.

## 5. Prefix split - as observed

| Where | Device | Prefix | Real export markup | Placeholder markup |
|---|---|---|---|---|
| Template form-factor | `[OPT:DEVICE]` | `tsd-*` | `<img class="tsd-shot">` in `.tsd-screen`, object-fit:cover / object-position:top center | `.tsd-ph` + `.pa`/`.pt`/`.px`/`.surfs` |
| Template surfaces | `[OPT:DEVICE-SURFACES]` | `tsdx-*` | frame record `src` data-URL painted into `#tsdxImg` (height:auto) | not defined in T |
| Filled form-factor codexes | form-factor | `tsd-*` | `<img class="tsd-shot">` (7 files) or class-less `<img>` (anansi, kora) | `<div class="tsd-ph">` |
| Prism | surfaces | `pfx-*` | frame records in `#pfxData` | none |
| Prism dead CSS | form-factor era | bare | - | `.placeholder` CSS only, no elements |

> **FLAGGED - contract premise corrected by observation.** The B26 contract says "Prism uses bare
> `.placeholder` / `.screen` / `.rig` with no tsd- prefix." That is true of Prism's surviving CSS
> (P:110-123) but not of its live markup, which is `pfx-*`. Selectors aimed at bare classes match
> zero elements in P. The skill docs record the observed three-prefix reality.

## 6. Destination check - L (47 codexes)

Self-declaring marker: `<div class="tsd-ph">`, usually with `<div class="pt">Design pending`. A raw
`tsd-shot` count includes the CSS rule, so real exports were counted as `<img class="tsd-shot"`.

| Classification | Codexes |
|---|---|
| **real export**, `<img class="tsd-shot">` | formae, griothub, kaleidoscope, lucid, meridian, r3fstudio, hazine (7) |
| **real export**, class-less `<img>` (verified at anansi:278, kora:284) | anansi, kora (2) |
| one `src="data:image"`, no placeholder div - **UNVERIFIED** placement | audion, synaptiq, paralegalproject |
| **placeholder** "Design pending" | ashe, auxgod, damus, djeli, fragment, gbfolio, gbfolio-experience, glennlewisime, graft, kente, keylink, kweli, mentorshipplatform, ophenia, plantidcnn, prismgavel, realtorcms, securedocrepository, sigil, skillforge, thegriotmodel, valence |
| **placeholder**, inline-styled `tsd-ph` (exact-string count misses it) | cinopsis |
| **placeholder**, `tsd-ph` with different text | gb-avatar-golden-run, mathformalism |
| **surfaces device**, 15 real frames | prism |
| no device block | agent-ontology, diagramming-oss-audit, djeli-branch-capture, gold, griot-ontology, griot-sandbox, griot3d-pipeline, personal, suite-drift |

No file mixes a real export with a placeholder. No live codex contains the literal
`OPT:DEVICE-SURFACES` marker (djeli-branch-capture's two hits are workgraph JSON prose).

Detection lesson (the N16/B27 correction in practice): classify by the **element in the
destination**, never by a raw token count. A count of `tsd-shot` is polluted by the CSS rule; an
exact `class="tsd-ph">` string misses an inline-styled placeholder.

## 7. Injection safety - the refuse-to-write triad (N29)

From the B26 contract and the 2026-09-15 workgraph close-out router. Any write into a codex is refused
unless all three hold:

1. **Lead / element count unchanged**, except by the exact intended delta.
2. **Final size == predicted** (+/-4 bytes).
3. **Unique id present exactly once.**

Also: never search a generated document for a token you just wrote into it, and never trust a `-1`
index into a slice. That collision duplicated a whole codex (N29).
