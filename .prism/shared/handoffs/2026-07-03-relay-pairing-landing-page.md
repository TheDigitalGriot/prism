# Handoff — Relay pairing landing page → complete the always-on-droplet loop

**Date:** 2026-07-03 · **Branch:** `chore/bookend-3.7.5` · **HEAD:** `b0b239c` · **Version:** v3.8.0 (shipped)

---

## 0. The mission (do this diligently — no workarounds)

Make the **relay pairing link work end-to-end from anywhere** so a phone can pair to the daemon by
opening/scanning a `https://prism.digitalgriot.studio/#offer=…` link — **without** the in-app-scanner
crutch and **without** falling back to LAN. This is the keystone for the **always-on droplet**
(Model B): the droplet daemon dials the same Griot relay and hands out the same style of offer, so a
working pairing link is what makes "run the daemon on the VPS, pair from my phone, P16 off" real.

**Do not** tell the user to "avoid the browser" or "use direct LAN instead." Those dodge the gap.
**Build the missing pairing landing page.**

---

## 1. Root cause (precise — verified this session)

Opening the offer link in a browser (or scanning the QR with the phone camera) returns Cloudflare
**522 "Connection timed out"** (Browser ✓ / Cloudflare ✓ / **Host: Error**). Why:

1. The daemon builds the offer URL from `appBaseUrl` — `bootstrap.ts:775`:
   `const appBaseUrl = config.appBaseUrl ?? "https://app.paseo.sh"`, and
   `connection-offer.ts:49`: `${appBaseUrl}/#offer=${encoded}`.
2. **Your persisted config sets it to the apex:** `~/.thedigitalgriot/config.json` →
   `app.baseUrl: "https://prism.digitalgriot.studio"` (env `PASEO_APP_BASE_URL` is unset).
   So the offer is `https://prism.digitalgriot.studio/#offer=…`.
3. **The relay Cloudflare Worker is only routed on `/relay/*`** (`packages/relay/wrangler.toml`:
   `pattern = "prism.digitalgriot.studio/relay/*"`; the Worker's `fetch` handles `/relay/*`,
   `/health`, `/ws` — `packages/relay/src/cloudflare-adapter.ts:567+`). The **apex `/` is not routed
   to the Worker and has no origin server** → 522.
4. The `#offer=…` is a **URL fragment** — it never reaches the server anyway; it must be read
   client-side by a page (or the app). The app has scheme `prism://` (`app.config.js:71`) and an
   in-app offer decoder (`packages/app/src/app/pair-scan.tsx`), but **no web landing page bridges the
   `https` link → app**, and (verify) no universal-link handler.

**Net:** the relay itself is healthy (`/relay/ws` → 400 to a plain GET = Worker up). The missing
piece is a **pairing landing page** at the offer host.

---

## 2. The fix (build this)

Deliver a pairing web page + wire the app to receive it. Suggested plan (validate + adjust):

**A. Pairing landing page** at the offer host.
   - Serve HTML+JS at `https://prism.digitalgriot.studio/` (apex) — or a dedicated path like `/pair`
     (then set `app.baseUrl` to `https://prism.digitalgriot.studio/pair`). Two hosting options:
     - **Extend the relay Worker**: add an apex/`/pair` route in `wrangler.toml`
       (`pattern = "prism.digitalgriot.studio/pair*"` or the apex) and return the HTML from
       `cloudflare-adapter.ts`'s `fetch` for that path. Keeps it all in one Worker.
     - **Cloudflare Pages**: deploy a tiny static site at the apex. Cleaner separation.
   - Page logic: read `location.hash` → `#offer=<b64>` → present "Open in Prism" and redirect to
     `prism://…#offer=<b64>` (custom scheme). Handle "app not installed" (App Store link).
   - **Decide the `app.baseUrl`**: keep the apex (needs the apex served) or move to `/pair`. Set via
     `PASEO_APP_BASE_URL` (env, cleanest for the droplet) or `~/.thedigitalgriot/config.json`
     `app.baseUrl`, and mirror it in `apps/prism-mobile/deploy/` for the droplet.

**B. App deep-link handling.** Verify/implement that the app catches an incoming
   `prism://…#offer=…` (and, with C, a universal link) via `expo-linking` and routes to the pairing
   flow — reuse `pair-scan.tsx`'s `decodeOfferFragmentPayload` / `ConnectionOfferSchema` /
   `upsertConnectionFromOfferUrl`. There's a scan path today; confirm the *deep-link* path exists.

**C. (Best UX) Universal links** so the `https` link opens the app with no browser hop:
   - iOS: `associatedDomains: ["applinks:prism.digitalgriot.studio"]` in `app.config.js` +
     host `/.well-known/apple-app-site-association` (served by the Worker/Pages) with the app's
     Team ID + bundle ids (`com.thedigitalgriot.prism` and `.debug`).
   - Android: `intentFilters` with `autoVerify` + `/.well-known/assetlinks.json`.
   - Requires a **new EAS build** to take effect (native entitlements).

**D. Verify against the droplet (Model B).** The droplet daemon (`apps/prism-mobile/deploy/`) sets
   `PASEO_RELAY_ENDPOINT=wss://prism.digitalgriot.studio/relay` and should set `PASEO_APP_BASE_URL`
   to the same landing page. Confirm a droplet-generated offer pairs a phone over the relay with the
   laptop off — that's the acceptance test for the whole arc.

**Acceptance:** open `https://prism.digitalgriot.studio/#offer=…` on the phone → lands on the page (or
directly in the app via universal link) → app pairs over `/relay` → agent runs. Works for both the
laptop daemon and the droplet daemon.

---

## 3. What already shipped this session (context, all done)

- **Daemon `agent-run` fixed** — `PaseoWebSocketAdapter` now dials `/ws` and accepts the daemon's
  `server_info` handshake (it never sends `welcome`); `agent-run` flips **error → ready**. Regression
  test added. `prism-cli daemon ls` read-limit raised to 1 MiB. (v3.8.0)
- **Release v3.8.0** — bookend bump 3.7.7→3.8.0, tagged, pushed; CI green (5 CLI + macOS DMG +
  Windows installer). Also fixed a pre-existing Tauri `detect.rs` borrow bug and **untracked
  `prism-docs/.vitepress/dist`+`cache`** (they were polluting release commits).
- **EAS iOS dev builds** — 3.7.6 then 3.8.0 FINISHED; **per-variant icons** live (blue = Prism Debug
  `icon-debug.png`, green = Prism `icon.png`, via `variant.icon` in `app.config.js`). Installed on the
  registered iPhone.
- **Architecture Explorer** — ported to a native themed VitePress component; live at
  `thedigitalgriot.github.io/prism-plugin/architecture`. GitHub Pages enabled; all 3 CI workflows green.
- **Docs** — `PRISM-DOCUMENTATION-3.8.0.md`; `daemon/adapters.md` corrected (documented the fictional
  `welcome`); new `.prism/shared/docs/SURFACE-CONNECTIVITY-AND-TESTING.md` (per-surface connection
  architecture + testing + the 522 gap). The SURFACE doc is **untracked** — commit it.

---

## 4. Current runtime state (as of handoff)

- **Node:** 22.20.0 (REQUIRED — native ABI; machine default is 24. Always `nvm use 22.20.0` for the
  daemon).
- **Daemon `:6767`:** UP — `0.0.0.0:6767 LISTENING`, **PID 159636**, relay-connected
  (`prism.digitalgriot.studio/relay`), serverId `srv_RsO767GU8GMu`, daemon pubkey in
  `~/.thedigitalgriot/`. Started with `PASEO_LISTEN=0.0.0.0:6767` (LAN + relay both work). Note: the
  relay control link flaps `1006`/reconnect ~every 15 min (benign Cloudflare Worker recycling; DO
  preserves the channel — but worth confirming it's not hurting pairing).
- **Broker `:6780`:** DOWN. Start from repo root: `npx tsx packages/prism-daemon/src/index.ts`
  (only needed for desktop/CLI surfaces + `prism-cli daemon ls`, not for mobile).
- **Git:** branch `chore/bookend-3.7.5`, HEAD `b0b239c`, main FF'd to the same. Only uncommitted:
  `.prism/shared/docs/SURFACE-CONNECTIVITY-AND-TESTING.md` (untracked). `prism-eval` submodule dirty
  (leave it); `.prism/shared/designs/assets/` untracked (the icon sources).

---

## 5. Key files & commands

**Offer / pairing:**
- `apps/prism-mobile/packages/server/src/server/bootstrap.ts` (~774-852) — builds the offer;
  `appBaseUrl` default + `relayPublicEndpoint`.
- `.../server/connection-offer.ts` (`encodeOfferToFragmentUrl` → `${appBaseUrl}/#offer=`),
  `.../server/config.ts` (`DEFAULT_APP_BASE_URL`, `PASEO_APP_BASE_URL`, persisted `app.baseUrl`).
- `.../server/pairing-offer.ts`, `.../server/pairing-qr.ts`; CLI `packages/cli/src/commands/daemon/pair.ts`.
- App: `packages/app/src/app/pair-scan.tsx`, `@/utils/daemon-endpoints` (`decodeOfferFragmentPayload`,
  `normalizeHostPort`), `@server/shared/connection-offer` (`ConnectionOfferSchema`).
- Config: `~/.thedigitalgriot/config.json` → `app.baseUrl` (currently the apex).

**Relay (Cloudflare):**
- `apps/prism-mobile/packages/relay/wrangler.toml` — routes `prism.digitalgriot.studio/relay/*`
  (account `c431da74…`, Durable Object `RelayDurableObject`).
- `apps/prism-mobile/packages/relay/src/cloudflare-adapter.ts` — Worker `fetch` (handles
  `/relay/*`, `/health`, `/ws`). **This is where an apex/`/pair` route + landing HTML would go** (or
  use Cloudflare Pages).

**Commands (from `apps/prism-mobile`, Node 22):**
```bash
nvm use 22.20.0
npm run build:daemon                                  # before start (relay/highlight ship only dist/)
PASEO_LISTEN=0.0.0.0:6767 npm run start                # daemon on all interfaces + relay
npm run cli -- daemon pair                             # QR + offer link
# relay deploy (verify wrangler auth): from packages/relay → npx wrangler deploy
```

---

## 6. Constraints & gotchas

- **Node 22 only** for the daemon (native `node-pty`/`better-sqlite3`/sherpa ABI). Machine default is 24.
- **"paseo" naming is deferred** ("set up first, then go sovereign"). Do NOT rename `PaseoWebSocketAdapter`,
  `websocket-paseo`, `PASEO_*`, the `paseo` CLI binary, or `app.paseo.sh` placeholders yet. The wire is
  already Griot — only the labels lag.
- **`dist`/`cache` are now gitignored** — commit source only; don't let `git add -u` sweep build output.
- **Icons bake into the binary** — changes need a new EAS build, not `eas update`.
- **Releases:** bookend flow = `python scripts/bump-version.py <patch|minor|major> --root .` →
  fix `prism-docs/.vitepress/config.ts` copyright → commit `chore(release): bookend vX` → tag → push
  branch+main → CI (cli + installer) builds + publishes; docs-deploy on main push (flaky Pages 522 on
  the *deploy* step sometimes — just re-run).

---

## 7. First moves for the new session

1. Read this handoff + `.prism/shared/docs/SURFACE-CONNECTIVITY-AND-TESTING.md`.
2. Confirm the gap live: `curl -s -o /dev/null -w '%{http_code}' https://prism.digitalgriot.studio/`
   (522) vs `.../relay/ws` (400). Decode a fresh offer (`npm run cli -- daemon pair`).
3. Decide hosting for the landing page (extend the relay Worker vs Cloudflare Pages) + the
   `app.baseUrl` target, then build it (§2 A→B→C). Verify the app deep-link path exists first.
4. Test the full loop on the phone; then repeat against the droplet daemon (Model B).
5. Commit the untracked SURFACE-CONNECTIVITY doc.
