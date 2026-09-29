# Orca DESIGN/ANNOTATE/GRAB surface — composition map

Researched by direct discovery (Grep/Glob/Read — the Prism `codebase-locator` /
`codebase-analyzer` subagents are not dispatchable as tools in this session;
this is the equivalent walk done by hand, same rules: no filtering by size,
composition not a flat list). Working directory: `C:\Users\digit\GriotSandbox\orca`.

## 0. Top-level fact that reshapes the whole map

**There is no single "design surface."** There are **three independent
capabilities** that share one toolbar and one host component (`BrowserPane`),
but do not share a pipeline:

| Capability | Entry | Delivers to | Works on remote/SSH panes? |
|---|---|---|---|
| **Grab** (`copy` intent) | crosshair toolbar button | OS clipboard (text + optional PNG) | No — webview-only |
| **Grab** (`annotate` intent) | message-plus toolbar button | agent chat/terminal, via a **shared** send-menu | No — webview-only |
| **Markup** (freehand draw-on-screenshot) | pencil toolbar button (`MarkupDrawButton`) | OS clipboard only (PNG) | **Yes** — its own capture path works on the remote screencast `<img>` too |

Grab and Markup are mutually exclusive at the toolbar (each disables the
other's button while active). They do not share a payload type, a hook, or a
delivery path — they only share the toolbar row and the pane they're injected
into.

---

## 1. Composition tree

```
BrowserPane.tsx:771  export default BrowserPane(browserTab, isActive, findShortcutScope)
│  Router: picks ONE of the two panes below per active runtime environment.
│
├─(local Electron <webview>)──▶ BrowserPagePane   [BrowserPane.tsx:2438]
│   Owns: grab (copy+annotate), markup, annotation tray, all toolbar controls.
│   │
│   ├─ toolbar row (inline JSX, not extracted)         [BrowserPane.tsx:4956-5044]
│   │   ├─ BrowserAddressBar.tsx                        (own file, url bar)
│   │   ├─ BrowserImportHintButton.tsx                  (own file)
│   │   ├─ "Grab page element" button (copy intent)     [inline, :4967-4998]
│   │   ├─ "Annotate page element" button (annotate)    [inline, :5000-5036]
│   │   └─ MarkupDrawButton.tsx                          (own file)
│   │        └─ useMarkupDrawHint.ts  (one-time onboarding popover nudge)
│   │
│   ├─ grab status banner (inline strip, top of pane)   [inline, :5231-5369]
│   │   shows state text ("Click or hover…", "Copied — press S…", error),
│   │   and — only when grabIntent==='annotate' && annotations exist —
│   │   inlines a "Send" DropdownMenu + "Copy All" + "Clear" + "Cancel"
│   │   ├─ DropdownMenu → BrowserAnnotationSendMenuContent.tsx  [:5312]
│   │   │      (thin wrapper, 29 lines — see §3)
│   │   └─ "Cancel" button → grab.cancel()
│   │
│   ├─ PendingBrowserAnnotationCard (function, same file) [:386-533]
│   │   Radix Popover anchored to the selected element's live viewport rect
│   │   (getBrowserOverlayAnchor / getLiveBrowserAnnotationRect, :343-384).
│   │   Owns: comment textarea + BROWSER_ANNOTATION_INTENT_OPTIONS
│   │   ToggleGroup (fix/change/question/approve) + Cancel/Add buttons.
│   │   Rendered only for the `annotate` intent, only while a fresh pending
│   │   selection has not yet been committed.                [used at :5460]
│   │
│   ├─ annotation tray (inline floating panel, bottom-right) [:5474-5606+]
│   │   Persistent-annotations list. Per-row: label + selector + delete.
│   │   Header carries its OWN "Send" DropdownMenu (second, independent
│   │   instance of BrowserAnnotationSendMenuContent, :5521) + count badge.
│   │
│   ├─ right-click context dropdown (inline, `copy` intent only) [:5607-5672]
│   │   Anchored (0-size trigger) at the grabbed element's center.
│   │   Items: Copy Contents (C) / Copy Screenshot (S) / Cancel.
│   │
│   ├─ inline grab toast bubble (inline, :5675+)
│   │   Small caret-pointing confirmation ("Copied", "Screenshotted", error)
│   │   positioned at the element, auto-dismisses.
│   │
│   └─ MarkupOverlay.tsx  [rendered at :5375, portal into pageViewport.container]
│        (only when markup.isActive && markup.baseImage)
│        ├─ useMarkupEditor.ts  (owns canvas ref, shapes, tool/color/width state)
│        │   ├─ useMarkupPointerHandlers.ts  (pointerdown/move/up → shape building)
│        │   └─ useMarkupKeyboardShortcuts.ts (tool hotkeys, undo/redo, Esc)
│        ├─ <canvas> — draws via markup-canvas-render.ts + markup-shape-render.ts
│        │   on top of markup-drawing-model.ts (shape data: pen/rect/arrow/text)
│        ├─ pending-text <input> (inline in MarkupOverlay, freeform text tool)
│        └─ MarkupToolbar.tsx  (tool switch, color, width, font size, undo/redo)
│
└─(remote/SSH screencast pane)──▶ RemoteBrowserPagePane  [BrowserPane.tsx:893]
    Owns: markup ONLY (no grab — element-selection needs webview DOM injection,
    the remote pane only has a screencast <img>; comment at :2044 states this
    explicitly).
    └─ useMarkupMode({ getCaptureContext: … source:{kind:'image', element} })
         → same MarkupOverlay/MarkupToolbar/useMarkupEditor stack as above,
           captured from the <img> element instead of the webview.
```

**Sibling, not child:** `BrowserMobileDriverOverlay` renders next to
`BrowserPagePane` inside `BrowserPane`'s return (`:883`) — unrelated to design
surface, a remote-control takeover indicator.

**Positioning host:** `BrowserPaneOverlayLayer.tsx` / `BrowserOverlaySlot`
(219 lines) is **not part of the design surface** — it's the CSS
anchor-positioning layer that keeps each worktree's `BrowserPane` instances
alive across tab-group moves (webviews can't survive DOM reparenting). It sits
*above* `BrowserPane` in the tree, has no grab/annotate/markup awareness, and
was named in the harvest instructions as a starting point but is a pane-host
concern, not a design-surface component.

---

## 2. Dead code found: `GrabConfirmationSheet` (the component)

`GrabConfirmationSheet.tsx` (289 lines) exports a default React component
with a full "review before attaching" sheet UI — screenshot preview, element
summary, HTML snippet, nearby text, Cancel/Copy/Copy Screenshot/**Attach to
AI** buttons.

**It is never rendered anywhere.** Confirmed by grepping the whole `src`
tree: the only imports of this file (besides its own test) are
`BrowserPane.tsx:127` and `GrabConfirmationSheet.test.ts:2`, and **both import
only `formatGrabPayloadAsText`** — the named helper, not the default
component. No file imports the default export or writes `<GrabConfirmationSheet`.

The real UI for `copy` intent is the inline right-click context dropdown +
inline toast (§1); the real UI for `annotate` intent is
`PendingBrowserAnnotationCard` + the annotation tray. Neither has an "Attach
to AI" action — the harvest-map author should **not** treat
`GrabConfirmationSheet`'s "Attach to AI" button as a live affordance or model
an artboard on it. It's safe to reuse `formatGrabPayloadAsText` as a spec for
the copy-format, but the component JSX is stale relative to the shipped flow.

---

## 3. The payload path (grab → clipboard / grab → chat)

**Origin — inside the guest page (main process, injected into the webview):**

- `src/main/browser/grab-guest-script.ts` (955 lines) — `buildGuestOverlayScript(action)`
  returns a giant JS string executed via `webContents.executeJavaScript`, for
  actions `'arm' | 'awaitClick' | 'finalize' | 'extractHover' | 'teardown'`.
  Inside: pointer-move highlight box, click capture, and the full extraction
  pipeline — `extractPayload(el)` (:668) building `getAccessibility`,
  `getComputedStyleSubset`, `buildSelector`/`buildFullPath`/`buildReadablePath`,
  `getNearbyText`/`getNearbyElements`, `getReactMetadata` (walks the React
  fiber to name the owning component + source file), `getSafeAttributes`
  (allowlist + secret-pattern redaction), all budget-clamped per
  `shared/browser-grab-types.ts`'s `GRAB_BUDGET`.

**Session lifecycle (main process):**

- `src/main/browser/browser-grab-session-controller.ts` (234 lines) —
  `BrowserGrabSessionController.awaitGrabSelection()` runs the guest script,
  resolves exactly once (click / cancel / navigation / guest-destroyed /
  120s timeout), distinguishes left-click (`'selected'`) from right-click
  (`'context-selected'`, guest wraps as `{__orcaContextMenu, payload}`).
- `src/main/browser/browser-grab-payload.ts` (221 lines) — `clampGrabPayload`,
  the **main-side re-enforcement** of the same budgets the guest script
  already applied (defense in depth against a compromised/old guest).
- `src/main/browser/browser-grab-screenshot.ts` (106 lines) — element-rect PNG
  capture, called separately after selection.
- `src/main/browser/browser-manager.ts` (2244 lines) — owns one
  `BrowserGrabSessionController` instance, wires `setGrabMode` /
  `awaitGrabSelection` / `cancelGrabOp` / `captureSelectionScreenshot` /
  `extractHoverPayload`, and (separately) `setAnnotationViewportBridge`.
- `src/main/ipc/browser.ts` (748 lines, grab handlers at :449-576) — the
  `ipcMain.handle('browser:*', …)` registration surface.

**Bridge (preload):** `src/preload/index.ts` + `src/preload/api-types.ts`
expose `window.api.browser.{setGrabMode, awaitGrabSelection, cancelGrab,
captureSelectionScreenshot, extractHoverPayload, setAnnotationViewportBridge}`.

**Renderer state machine:** `useGrabMode.ts` (289 lines) —
`idle → armed → awaiting → confirming → idle|armed`, `↘ error → idle`. One
instance per `browserTab.id`, created in `BrowserPagePane` (:2573).

**Renderer termination — two branches from `grab.state === 'confirming'`:**

1. **`copy` intent** → `formatGrabPayloadAsText(payload)` (the ONE live export
   of `GrabConfirmationSheet.tsx`) → `window.api.ui.writeClipboardText`, or
   for screenshot: raw `payload.screenshot.dataUrl` →
   `window.api.ui.writeClipboardImage`. Terminates in the **OS clipboard**.
   Trigger paths: auto-copy on left-click, right-click context menu, or C/S
   keyboard shortcuts (`handleGrabActionShortcut`, :4162, which for the
   *hover-without-click* case calls `window.api.browser.extractHoverPayload`
   directly — a **third** payload-origin path alongside click-to-select).

2. **`annotate` intent** → `PendingBrowserAnnotationCard.onAdd` →
   `handleAddBrowserAnnotation` (:4302) → `createBrowserAnnotationPayload`
   (:335, strips `screenshot` — "annotations are persisted; screenshot data is
   a transient copy payload that can be megabytes") → store action
   `addBrowserPageAnnotation` (`store/slices/browser.ts:1565`) → renders in
   the annotation tray → `formatBrowserAnnotationsAsMarkdown`
   (`browser-annotation-output.ts:155`, formats ALL pending annotations as one
   `## Design Feedback: <path>` markdown block, escaping/collapsing
   page-controlled text via `inlineText`) → `browserAnnotationsPrompt` →
   **`BrowserAnnotationSendMenuContent.tsx`** (29-line wrapper) →
   **`ReviewNotesSendMenuContent.tsx`** (340 lines, in
   `components/editor/`, **shared verbatim with the rich-markdown review-notes
   feature** — not design-surface-specific) → enumerates every running agent
   in the worktree (`deriveNotesSendAgentTargets`) →
   `sendNotesToActiveAgentSession` → lands as text in the agent's chat/terminal
   session. Terminates in **agent chat**, never the clipboard, and the
   screenshot never survives to this endpoint.

**A fourth, separate guest-injected surface — persisted-annotation badges:**
`shared/browser-annotation-viewport-bridge.ts` (257 lines) defines both the
IPC contract (`BrowserSetAnnotationViewportBridgeArgs`) and
`buildBrowserAnnotationViewportBridgeScript`, a **second** guest-injected
script (isolated world id `1207`, comment: "existing badges render in-guest
for smooth scroll; only the pending dialog needs viewport messages") that
draws numbered 24px badge markers directly into a closed shadow-DOM overlay on
the live page, tracking scroll natively — independent of
`grab-guest-script.ts`. `BrowserPane.tsx:3398` `syncBrowserAnnotationViewportBridge`
calls it whenever annotations or a pending payload change.

**Markup's path never touches any of the above:** `useMarkupMode.ts` (172
lines) is `idle → capturing → drawing → composing`, independent state machine,
no IPC to `browser-grab-*`. `markup-base-image.ts` captures either the webview
region or the remote `<img>` (no guest script injection — comment at
`useMarkupMode` call site: "markup snapshots the displayed screencast `<img>`
(no injection), so it works on remote panes even though element-grab
doesn't"). `markup-screenshot-compose.ts` composites the drawn shapes onto the
base image into one PNG data URL, and `markup-clipboard-delivery.ts`
(21 lines) is the **entire** delivery mechanism —
`window.api.ui.writeClipboardImage`, full stop, with an explicit code comment
explaining this reuses the existing clipboard-paste-to-temp-file machinery
"instead of re-plumbing a direct send."

---

## 4. Every component — file, size, one-line ownership

| Component | File | Lines | Owns |
|---|---|---|---|
| `BrowserPane` (router) | `BrowserPane.tsx:771` | (part of 5766) | Picks local-webview vs remote-screencast pane |
| `BrowserPagePane` | `BrowserPane.tsx:2438` | (part of 5766) | Local surface: grab, annotate, markup, toolbar, all popovers |
| `RemoteBrowserPagePane` | `BrowserPane.tsx:893` | (part of 5766) | Remote/SSH screencast surface: markup only |
| Grab toolbar buttons (copy/annotate) | `BrowserPane.tsx:4967-5036` | inline | Two `Button`s toggling `grab.toggle`/`startGrabIntent` |
| Grab status banner | `BrowserPane.tsx:5231-5369` | inline | State text + inline Send/Copy All/Clear/Cancel row |
| `PendingBrowserAnnotationCard` | `BrowserPane.tsx:386-533` | inline fn | Comment + intent form for one fresh selection |
| Annotation tray | `BrowserPane.tsx:5474-5606+` | inline | List of persisted annotations, own Send menu, delete rows |
| Right-click grab context menu | `BrowserPane.tsx:5607-5672` | inline | Copy Contents / Copy Screenshot / Cancel |
| Inline grab toast | `BrowserPane.tsx:5675+` | inline | Ephemeral confirmation bubble at element |
| `useGrabMode` | `useGrabMode.ts` | 289 | Grab state machine + IPC choreography |
| `GrabConfirmationSheet` (component) | `GrabConfirmationSheet.tsx` | 289 | **Dead** — no live renderer |
| `formatGrabPayloadAsText` | `GrabConfirmationSheet.tsx:11-95` | (of 289) | The ONE live export — clipboard text formatter |
| `BrowserAnnotationSendMenuContent` | `BrowserAnnotationSendMenuContent.tsx` | 29 | Thin adapter to the shared send-menu |
| `ReviewNotesSendMenuContent` | `editor/ReviewNotesSendMenuContent.tsx` | 340 | Shared "send to any running agent" menu (also used by markdown review) |
| `formatBrowserAnnotationsAsMarkdown` etc. | `browser-annotation-output.ts` | 228 | Formats persisted annotations into one markdown prompt |
| `MarkupDrawButton` | `markup/MarkupDrawButton.tsx` | 160 | Toolbar toggle, shared by local+remote panes |
| `useMarkupDrawHint` | `markup/use-markup-draw-hint.ts` | 51 | One-time first-use discovery popover (localStorage-gated) |
| `MarkupOverlay` | `markup/MarkupOverlay.tsx` | 168 | Full-pane draw surface: base image + canvas + text input + toolbar dock |
| `useMarkupEditor` | `markup/useMarkupEditor.ts` | 180 | Canvas ref, shape list, tool/color/width state |
| `useMarkupPointerHandlers` | `markup/useMarkupPointerHandlers.ts` | 109 | Pointer down/move/up → shape construction |
| `useMarkupKeyboardShortcuts` | `markup/useMarkupKeyboardShortcuts.ts` | 53 | Tool hotkeys, undo/redo, Escape |
| `MarkupToolbar` | `markup/MarkupToolbar.tsx` | 293 | Tool/color/width/font-size pickers, undo/redo |
| `markup-drawing-model.ts` | `markup/markup-drawing-model.ts` | 213 | Shape data types + mutation helpers |
| `markup-canvas-render.ts` | `markup/markup-canvas-render.ts` | 88 | Canvas repaint loop |
| `markup-shape-render.ts` | `markup/markup-shape-render.ts` | 144 | Per-shape draw routines (pen/rect/arrow/text) |
| `markup-base-image.ts` | `markup/markup-base-image.ts` | 78 | Captures webview or `<img>` into a base raster |
| `markup-screenshot-compose.ts` | `markup/markup-screenshot-compose.ts` | 201 | Composites shapes + base image → final PNG data URL |
| `markup-clipboard-delivery.ts` | `markup/markup-clipboard-delivery.ts` | 21 | The entire delivery mechanism: OS clipboard, full stop |
| `useMarkupMode` | `markup/useMarkupMode.ts` | 172 | Markup state machine: idle/capturing/drawing/composing |
| `browser-grab-types.ts` | `shared/browser-grab-types.ts` | 263 | Payload/IPC contract types, `GRAB_BUDGET`, secret-redaction patterns |
| `browser-annotation-viewport-bridge.ts` | `shared/browser-annotation-viewport-bridge.ts` | 257 | Contract + guest script for persisted-annotation scroll-synced badges |
| `grab-guest-script.ts` | `main/browser/grab-guest-script.ts` | 955 | In-page overlay + full DOM/React extraction, injected via `executeJavaScript` |
| `browser-grab-payload.ts` | `main/browser/browser-grab-payload.ts` | 221 | Main-side budget/sanitization re-enforcement (`clampGrabPayload`) |
| `browser-grab-screenshot.ts` | `main/browser/browser-grab-screenshot.ts` | 106 | Element-rect PNG capture |
| `browser-grab-session-controller.ts` | `main/browser/browser-grab-session-controller.ts` | 234 | Async grab-operation lifecycle / promise resolution |
| `browser-manager.ts` (grab+bridge slice) | `main/browser/browser-manager.ts` | 2244 (whole file) | Orchestrates guest injection, owns the session controller |
| `main/ipc/browser.ts` (grab handlers) | `main/ipc/browser.ts` | 748 (whole file) | `ipcMain.handle` registration for all `browser:*` grab/bridge channels |
| preload bridge | `preload/index.ts` + `preload/api-types.ts` | 4928 + 3771 (whole files) | Exposes `window.api.browser.*` to renderer |
| `BrowserPaneOverlayLayer` | `BrowserPaneOverlayLayer.tsx` | 219 | Pane-hosting/positioning only — **not** a design-surface component |

---

## 5. Artboard candidates (not all need 1440×900)

| Candidate | Suggested frame | Why |
|---|---|---|
| Toolbar row (address bar + grab×2 + markup) | ~960×48 | Thin horizontal strip, real max-width is the pane width |
| Grab status banner | ~960×36 | Single-line strip with trailing action cluster |
| `PendingBrowserAnnotationCard` | ~360×340 | Fixed-width Radix popover (`w-[22rem]`) |
| Annotation tray panel | ~320×420 | Fixed-width floating card (`w-[min(20rem,…)]`) |
| Right-click grab context menu | ~220×160 | Tiny 3-item dropdown |
| `BrowserAnnotationSendMenuContent` / `ReviewNotesSendMenuContent` | ~260×360 | Dropdown menu, scales with agent-target count |
| Inline grab toast | ~260×60 | Small caret bubble |
| `MarkupToolbar` (docked pill) | ~520×120 | Floating bottom-dock control cluster, not full-height |
| `MarkupOverlay` (canvas + toolbar together) | full pane, 1440×900 | The one true full-surface board — canvas covers the whole viewport |
| `MarkupDrawButton` + onboarding hint popover | ~280×140 | Small isolated toolbar-button + popover pairing |

**`GrabConfirmationSheet` is excluded** — it is dead code (§2); do not give it
an artboard as though it were the live "review" UI. If a review-style board is
wanted, its visual reference is fine, but the WIRED behavior (Cancel/Copy/Copy
Screenshot/Attach to AI callbacks) does not exist anywhere in the running app.

---

## 6. What the harvest map got wrong (§ the instructed check)

**Confirmed wrong**, with evidence:

- The map's line 33 records the design surface as browser **"Design Mode" =
  inspector**. There is no `designMode` or `inspectMode` state, flag, hook, or
  IPC channel anywhere in `browser-pane/` or `native-chat/` — confirmed by
  grepping the entire `src` tree case-insensitively for
  `designMode|inspectMode|design-mode|inspect-mode`. The **only** hit in the
  whole codebase is `src/shared/feature-wall-tiles.ts:108`, a marketing-copy
  string: `'Embedded browser + Design Mode'` — onboarding-tile prose that
  *labels* the Grab+Annotate+Markup feature cluster collectively for users. It
  is not a code concept and does not gate anything. The real mechanism is
  `useGrabMode`'s `GrabModeState` (`idle|armed|awaiting|confirming|error`)
  crossed with a separate `grabIntent: 'copy' | 'annotate'` — two intents on
  one state machine, not an "inspector mode."

**Other corrections surfaced during the walk (not in the original map, but
load-bearing for anyone building artboards from this):**

- The device-preview surface (`emulator-pane/`) has **zero** grab/annotate/
  markup code — confirmed by grep, no hits. The design surface is
  browser-pane-exclusive today; it does not extend to the emulator/device
  preview despite both being "preview" surfaces in the app.
- `native-chat/` has no grab/annotate-specific integration at all — the
  payload arrives there only as plain prompt text via the generic
  `ReviewNotesSendMenuContent` → `sendNotesToActiveAgentSession` path, shared
  with an unrelated feature (markdown review comments). Any "native-chat
  receives design context" framing should say *text prompt, no structured
  payload, no image* — screenshots never reach the chat endpoint.
- Grab and Markup are NOT peers with a shared trunk — they are two unrelated
  state machines (`useGrabMode` vs `useMarkupMode`) that happen to render into
  the same host component and mutually disable each other's toolbar button.
  A composition map that shows one "grab/markup" tree understates this.

---

## Component count

**38** distinct named components/modules documented above (12 inline JSX
blocks inside `BrowserPane.tsx` counted individually + 26 standalone files),
across renderer, shared, and main.
