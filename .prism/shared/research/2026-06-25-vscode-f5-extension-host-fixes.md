# VSCode F5 Extension-Host Fixes + VSCode/Electron Joint-Build Notes

- **Date:** 2026-06-25
- **Surface:** `apps/prism-vscode` (v3.6.0), tested in Cursor 2.4.31 on Windows
- **Type:** Debugging record + fix log + build-process analysis
- **Author:** debugging session (systematic-debugging)
- **Status:** Fixes applied to working tree, not yet committed

---

## TL;DR

Pressing **F5 ("Run Prism Extension")** appeared to crash the Extension Development Host. Investigation found **three independent issues**, only the first of which actually stopped Prism from appearing:

1. **Extension never loaded** — `engines.vscode` was `^1.109.0`, newer than Cursor 2.4.31's VS Code base, so Cursor silently refused to load the extension. → restored to `^1.84.0`.
2. **Sidebar + panel rendered blank** — stale Vite dev-server port files (`.vite-port`, `.vite-panel-port`) routed the webviews at dead `localhost` servers instead of the production build. → removed stale files + **hardened** the three webview providers to verify a server is actually listening.
3. **The scary `Canceled: Canceled` crash was a red herring** — it is Cursor's normal extension-host *shutdown*, with the rejections thrown by **gitlens** + Cursor's **ProxyResolver** during teardown. Not Prism.

The "joint build" curiosity: my changes are **100% inside `apps/prism-vscode`** — the shared `@prism-core` package and `apps/prism-electron` are untouched. The stale-port bug class **cannot occur on the Electron side** because Electron binds its dev-server URL at build time rather than through a runtime file.

---

## Symptom vs. reality (what was noise)

| Observed in console | Actually is |
|---|---|
| `[initializeExtension] OTLP exporter initialized … direct backend connection` | **Cursor's own telemetry.** This string exists nowhere in Prism source, `dist/extension.js`, or node_modules. |
| `Encountered UnhandledRejection: Canceled: Canceled` + `Ol.dispose / Pgs.terminate / fet.terminate / MessagePortMain` | **Cursor's standard ext-host shutdown.** The exthost logs show `Extension host … exiting with code 0` (clean), *then* `eamodio.gitlens` `GkCliIntegrationProvider.dispose()` throws `Channel has been closed` and `ProxyResolver#resolveProxy DIRECT Canceled`. Runs on every window close. |
| `cursorsandbox.exe exists=false` | Cursor's own sandbox-helper runtime. |
| Prism missing from sidebar **and** panel | The real bug — engine mismatch (see Root Cause 1). |

**Evidence:** in every Cursor exthost log, ~30 extensions activate but `prism.prism` appears in **none** — the signature of an extension excluded by the engine check before activation.

---

## Root Cause 1 — `engines.vscode` mismatch (blocked loading)

`engines.vscode` is the manifest field that tells the editor "only load me if you're at least this version." Its git history flip-flopped:

| Commit | Date | `engines.vscode` |
|---|---|---|
| `3de58aa` "working ecosystem" | 03-26 | **`^1.84.0`** (last known-good) |
| `f8234ed` v3.0.0 | 04-06 | `^1.109.0` (bumped, never reverted) |
| current (3.6.0) | — | `^1.109.0` |

Cursor 2.4.31's VS Code base is older than 1.109, so `^1.109.0` is never satisfied → extension excluded → absent from sidebar and panel.

- **"Why it keeps changing":** `scripts/bump-version.py` only rewrites the `"version"` field — it **never** touches `engines.vscode`. The `^1.109.0` came from manual/past-session edits, not tooling. Once corrected it stays put.
- **Fix:** [`apps/prism-vscode/package.json`](apps/prism-vscode/package.json#L8-L10) → `engines.vscode: "^1.84.0"`. `^1.84.0` is a safe floor satisfied by any Cursor 2.x and is the proven "working ecosystem" value.
- **Note:** `@types/vscode` is still `^1.110.0` (installed `1.110.0`); it's compile-time typings only and does not affect loading. Left as-is.

---

## Root Cause 2 — stale Vite port files (blank webviews)

Each webview advertises its dev-server port by writing a small file when `vite dev` starts. The providers previously chose dev (HMR) mode based on **file existence alone** — so a file left behind by a *dead* dev server routed the webview at `http://localhost:<dead-port>` and it rendered blank.

| Webview | Provider | Port file | Was stale? |
|---|---|---|---|
| Sidebar | [`VscodeWebviewProvider`](apps/prism-vscode/src/hosts/vscode/VscodeWebviewProvider.ts) | `webview-ui/.vite-port` (5173) | yes — nothing listening |
| Bottom panel | [`PrismPanelProvider`](apps/prism-vscode/src/hosts/vscode/PrismPanelProvider.ts) | `webview-panel/.vite-panel-port` (5175) | yes — nothing listening |
| Office sub-view | [`OfficeViewProvider`](apps/prism-vscode/src/hosts/vscode/OfficeViewProvider.ts) | `webview-office/.vite-office-port` | n/a (prod build absent → placeholder) |

Tree views (Research/Plans/Stories) are native `TreeDataProvider`s and were never affected.

**Operational fix:** removed the stale `.vite-port` and `.vite-panel-port`; ran `npm run build:webview` so the sidebar has a production bundle. (Panel prod build already existed via `build:panel`.)

**Durable fix (harden):** new shared helper [`viteDevServer.ts`](apps/prism-vscode/src/hosts/vscode/viteDevServer.ts) — `resolveLiveViteServer()` reads the advertised port then does a fast TCP probe (300 ms) to confirm a server is **actually listening** before choosing HMR. A stale file → no listener → returns `null` → providers fall back to the production build. Wired into all three providers (replacing three copies of the "trust the file" block); base [`WebviewProvider.getHtmlContent`](apps/prism-vscode/src/core/webview/WebviewProvider.ts#L18) widened to `string | Promise<string>`. Preserves HMR (a *live* server is still used), adds **zero** latency when no port file exists.

**Hygiene fix:** added `webview-panel/.vite-panel-port` and `webview-office/.vite-office-port` to [`apps/prism-vscode/.gitignore`](apps/prism-vscode/.gitignore) — the sidebar's `.vite-port` was already ignored, but the other two were not, so they could be **committed** and re-break the panel for everyone.

---

## The VSCode / Electron joint build (the "those removed" question)

### Monorepo shape (npm workspaces, from root `package.json`)

```
packages/*            shared libraries
  prism-core          → @prism-core  (controller/state/grpc — the shared brain)
  prism-daemon, prism-daemon-client, prism-relay, prism-ui
apps/
  prism-vscode        VS Code extension shell  + webview-ui / webview-panel / webview-office
  prism-electron      Electron desktop shell   + webview-ui (its own)
  prism-installer, prism-design-studio
```

Both shells are **thin platform wrappers around the same `@prism-core` brain**: vscode imports `@prism-core` in **19** files, electron in **5**. vscode wraps it with `VscodeWebviewProvider`/`PrismController`; electron wraps it with `ElectronIPCBridge`. The webviews are **separate** packages (`prism-webview-ui` vs `prism-electron-webview-ui`) — not shared source.

### Why the stale-port bug was VSCode-only

This is the crux. The two shells load their dev webview through **different handshakes**:

| | VS Code shell | Electron shell |
|---|---|---|
| Dev-server discovery | **Runtime file** — vite writes `.vite-port`; the *extension-host process* reads it later | **Build-time constant** — `MAIN_WINDOW_VITE_DEV_SERVER_URL` injected by Electron Forge's Vite plugin ([`main.ts:77-81`](apps/prism-electron/src/main.ts#L77-L81)) |
| Prod vs dev switch | file exists? (now: file exists **and** port alive) | constant is `undefined` in packaged builds → `loadFile()` |
| Stale-state risk | **yes** — file persists after the dev server dies (two independent processes, no shared lifecycle) | **no** — the constant is bound at build time, can't go stale |

So the bug only existed on the VS Code side, and the fix (liveness probe) is VS Code-local. **Electron needs no change.**

### The deleted `D` files in `git status` (not mine, not related)

`git status` shows many **deleted** tracked files. They were already in that state before this session (confirmed) and break down as:

- `apps/prism-electron/dist/**` (3 files) and `apps/prism-electron/webview-ui/build/**` (3 files) — **committed build outputs** removed from the working tree by a clean/rebuild.
- `prism-docs/docs/.vitepress/dist/**` (hundreds) — committed VitePress build output, likewise removed.

**Root reason — a hygiene divergence between the two shells:**

| Shell | `dist/` & webview build in `.gitignore`? | Build outputs tracked in git? |
|---|---|---|
| `apps/prism-vscode` | **yes** (ignored) | no — clean |
| `apps/prism-electron` | **no** | **yes — committed** |

VS Code treats build outputs as ephemeral (gitignored); Electron commits them. That asymmetry is why a clean working tree shows Electron/docs outputs as "deleted" but never the VS Code ones. It is **cosmetic to this task** — but worth normalizing (see Recommendations).

---

## Scope of changes (all inside `apps/prism-vscode`)

Tracked source (6 files, net **−10 lines** — the harden de-duplicated 3 copies):

| File | Change |
|---|---|
| [`package.json`](apps/prism-vscode/package.json) | `engines.vscode` `^1.109.0` → `^1.84.0` |
| [`.gitignore`](apps/prism-vscode/.gitignore) | + `webview-panel/.vite-panel-port`, `webview-office/.vite-office-port` |
| [`src/core/webview/WebviewProvider.ts`](apps/prism-vscode/src/core/webview/WebviewProvider.ts) | abstract `getHtmlContent` → `string \| Promise<string>` |
| [`src/hosts/vscode/VscodeWebviewProvider.ts`](apps/prism-vscode/src/hosts/vscode/VscodeWebviewProvider.ts) | async getHtml + liveness helper |
| [`src/hosts/vscode/PrismPanelProvider.ts`](apps/prism-vscode/src/hosts/vscode/PrismPanelProvider.ts) | async `_getWebviewContent` + liveness helper |
| [`src/hosts/vscode/OfficeViewProvider.ts`](apps/prism-vscode/src/hosts/vscode/OfficeViewProvider.ts) | async `_getWebviewContent` + liveness helper |

New file: [`src/hosts/vscode/viteDevServer.ts`](apps/prism-vscode/src/hosts/vscode/viteDevServer.ts).

**Not touched:** `packages/prism-core/**` (shared), `apps/prism-electron/**`. Electron build is unaffected.

---

## Verification

- Reproduced activation in isolation (mock `vscode`, real `dist/extension.js`): `activate()` resolves cleanly in ~2 ms, 49 subscriptions, no unhandled rejection.
- `npm run check-types` → exit 0.
- `npm run compile` → exit 0; `dist/extension.js` rebuilt; `resolveLiveViteServer`/`isPortListening` confirmed bundled.
- Manual: engine fix → sidebar + trees render (confirmed by user screenshot). Panel fix → pending dev-host reload.

---

## Recommendations / open items

1. **Normalize Electron build hygiene** — add `dist/` and `webview-ui/build/` to `apps/prism-electron/.gitignore` and `git rm --cached` the committed outputs, so both shells treat build artifacts the same way. (Also `prism-docs/docs/.vitepress/dist/`.)
2. **Optionally align `@types/vscode`** to the `engines.vscode` floor to prevent compiling against APIs newer than the supported base.
3. **Guard against the engine regression** — consider a `prepackage` check that fails if `engines.vscode` exceeds a supported ceiling, since nothing automated manages that field today.
4. **Commit** — changes are staged in the working tree only. Suggested message: `fix(vscode): restore engine floor + harden webview dev-server detection`.

---

## Quick test checklist

- [ ] Reload the `[Extension Development Host]` (Ctrl+R) or re-run F5
- [ ] Prism appears in the **activity bar** (sidebar)
- [ ] Sidebar React UI renders (not blank)
- [ ] Research / Plans / Stories trees populate
- [ ] **Bottom Prism panel renders** (was blank)
- [ ] Office tab shows placeholder until `npm run build:office` (optional)
- [ ] `Canceled: Canceled` lines in Debug Console can be ignored (Cursor/gitlens teardown)
