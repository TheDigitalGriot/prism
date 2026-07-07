---
date: 2026-07-07T03:21:33-04:00
researcher: Claude
git_commit: 79646e50fdaa729eee522db31e91620e70c40251
branch: main
topic: "Always-on droplet (Model B) — deploy the daemon + pair phone with laptop off"
tags: [handoff, relay, pairing, universal-links, droplet, coolify, eas, ios]
status: complete
---

# Handoff: Always-on droplet (Model B) — the last mile

## 0. The mission

Get the Prism agent daemon running **always-on on the DO droplet** (Coolify), so a phone pairs
to it over the Griot relay and agents keep running **with the laptop (P16) off**. This session
shipped the keystone that made it possible — the **pairing landing page + iOS universal links**
(the offer link now works end-to-end from anywhere). What remains: **deploy the droplet daemon and
run the Model-B acceptance test** (pair the phone to the droplet, laptop off).

Prior handoff (now RESOLVED): `.prism/shared/handoffs/2026-07-03-relay-pairing-landing-page.md`.

## Task(s)

- ✅ **Relay pairing landing page + iOS universal links** — DONE and **deployed to production**.
  `https://prism.digitalgriot.studio/#offer=…` now returns 200 (was Cloudflare 522) and bridges to
  the app. AASA served with Apple Team `M6K8N36JN8`.
- ✅ **v3.9.0 bookend** — version bumped 3.8.0→3.9.0 across all files, tagged `v3.9.0`, pushed,
  CI released.
- ✅ **prism-eval rescued** — 57-file uncommitted Electron eval app committed (`200d344`) + pushed
  to branch `prism-eval-app` on the electron-react-vite-ts-starter remote.
- ⚠️ **iOS `preview` standalone build (for on-device tap-to-open)** — build `bd59deb7` **ERRORED**.
  Root cause + fix in Learnings §L5. Needs an **interactive** rebuild. NOT blocking the droplet work.
- ⬜ **Deploy droplet daemon (Model B)** — PLANNED. See Action Items.
- ⬜ **Model-B acceptance test** — pair phone to droplet with laptop off. PLANNED.

## Critical References

1. `apps/prism-mobile/deploy/RUNBOOK.md` — the droplet deploy playbook (Coolify, volumes, verify).
2. `.prism/shared/docs/SURFACE-CONNECTIVITY-AND-TESTING.md` — how every surface reaches the daemon;
   §7 is the droplet, §4 is device testing.
3. `apps/prism-mobile/packages/relay/src/pairing-page.ts` — the landing page + AASA (Team ID lives here).

## Recent Changes

- `apps/prism-mobile/packages/relay/src/pairing-page.ts` (NEW) — landing HTML (reads `#offer=`,
  redirects to `prism://…#offer=`), `buildAppleAppSiteAssociation()` (Team `M6K8N36JN8`,
  bundles `com.thedigitalgriot.prism[.debug]`), and `handlePairingStaticRoutes()`.
- `apps/prism-mobile/packages/relay/src/cloudflare-adapter.ts:568-575` — call
  `handlePairingStaticRoutes(url)` first, before the `/relay` strip (relay traffic untouched).
- `apps/prism-mobile/packages/relay/wrangler.toml:9-19` — route widened
  `prism.digitalgriot.studio/relay/*` → `/*` (removes the apex 522).
- `apps/prism-mobile/packages/app/app.config.js` — `ios.associatedDomains:
  ["applinks:prism.digitalgriot.studio"]` (~line 82).
- `apps/prism-mobile/deploy/docker-compose.yml` + `deploy/.env.example` — added
  `PASEO_APP_BASE_URL=https://prism.digitalgriot.studio` (so droplet offers point at the landing page).
- `apps/prism-mobile/packages/app/eas.json` — added standalone `preview` profile (internal, no
  dev client, `APP_VARIANT=development`).
- `.prism/shared/docs/ANDROID-APP-LINKS-DEFERRED.md` (NEW) — Android App Links removal + how to re-add.
- Commits on `main`: `8846006` (pairing feat), `0da1cc1` (prism-eval gitlink), `c5395f3`
  (bookend v3.9.0), `79646e5` (preview profile).

## Learnings

- **L1 — Relay deploy is live.** `cd apps/prism-mobile/packages/relay && npx wrangler deploy`
  (user ran it). Verified: apex `/` → 200, `/relay/ws` → 400 (healthy Worker). Route is now
  `prism.digitalgriot.studio/*`; the Worker serves `/`, `/pair`, `/.well-known/apple-app-site-association`,
  and existing `/relay/*`,`/ws`,`/health`.
- **L2 — App deep-link handling already existed.** `apps/prism-mobile/packages/app/src/app/_layout.tsx:648-689`
  `OfferLinkListener` catches any `#offer=` URL (cold via `getInitialURL`, warm via `addEventListener`).
  No app change was needed for pairing itself.
- **L3 — Apple Team ID = `M6K8N36JN8`** (GAVIN ANDRE BENNETT, Individual). Extracted from the last
  iOS build's `.ipa` embedded.mobileprovision (`TeamIdentifier`/`ApplicationIdentifierPrefix`).
  Public value (ships in every AASA) — safe to hardcode. It's in `pairing-page.ts` `APPLE_TEAM_ID`.
- **L4 — Dev-client builds break the browser tap-to-open.** The installed `development` (dev-client)
  build shows "No development server found" when you tap the landing page button, because the dev
  launcher owns `prism://` on cold launch and there's no embedded JS. **Pairing still works** on the
  dev client via **in-app paste/scan** of the offer link. The `preview` profile (standalone, embedded
  bundle) was created to make the browser tap-to-open + universal links work.
- **L5 — Preview build `bd59deb7` ERRORED (fixable).** `XCODE_BUILD_ERROR`: the ad-hoc provisioning
  profile "doesn't support the Associated Domains capability / doesn't include
  com.apple.developer.associated-domains". Cause: we added `associatedDomains` (entitlement), but I
  ran `eas build --non-interactive`, so EAS skipped Apple auth and reused the OLD profile (made
  before the entitlement). **FIX: run the build INTERACTIVELY** so EAS enables the capability +
  regenerates the profile (both devices `dg-iphone`/`dg-ipad` are already registered, Team M6K8N36JN8):
  `cd apps/prism-mobile/packages/app && npx eas-cli build -p ios --profile preview` (NO
  `--non-interactive`). One-time; later builds reuse the fixed profile.
- **L6 — Both devices registered.** EAS shows the ad-hoc profile provisions `dg-ipad`
  (UDID 00008103-000A45361AA0801E) and `dg-iphone` (UDID 00008140-0004488A0206801C). One preview
  build installs on both.
- **L7 — base64url compat verified.** Daemon encodes `Buffer.toString("base64url")`; the landing page
  decodes with `atob` after `+`/`/`/pad restore. Round-trip confirmed; relay tests 13/13, tsgo clean.
- **L8 — Daemon is currently DOWN** (nothing on `:6767`). Start it (Node 22) before pairing.

## Artifacts

- Code: `pairing-page.ts` (new), `cloudflare-adapter.ts`, `cloudflare-adapter.test.ts`,
  `wrangler.toml`, `app.config.js`, `deploy/docker-compose.yml`, `deploy/.env.example`, `eas.json`.
- Docs: `.prism/shared/docs/ANDROID-APP-LINKS-DEFERRED.md`, updated
  `.prism/shared/docs/SURFACE-CONNECTIVITY-AND-TESTING.md`, this handoff.
- Release: tag `v3.9.0` + GitHub release (CI). prism-eval backup: branch `prism-eval-app` @ `200d344`.
- Failed build (for reference/logs): EAS iOS `bd59deb7-359a-4218-9214-cb46f1107ac2` (profile `preview`).

## Action Items & Next Steps

1. **(Optional, to get browser tap-to-open + universal links) Rebuild the preview app INTERACTIVELY:**
   ```
   cd apps/prism-mobile/packages/app
   npx eas-cli build -p ios --profile preview      # NO --non-interactive; approve Apple login
   ```
   Then open the build page on iPhone + iPad in Safari → Install → trust cert
   (Settings → General → VPN & Device Management).
2. **You can test pairing RIGHT NOW without any rebuild** using the existing dev-client build:
   - Start the daemon (Node 22): `cd apps/prism-mobile; nvm use 22.20.0; npm run build:daemon;
     PASEO_LISTEN=0.0.0.0:6767 npm run start`
   - `npm run cli -- daemon pair` → in the app, **paste the offer link / scan the QR** (in-app, not
     the browser button) → pairs over the relay.
3. **Deploy the droplet daemon (Model B)** — follow `apps/prism-mobile/deploy/RUNBOOK.md`:
   - One-time on the droplet: `claude login` (Claude Max auth → `~/.claude`, mounted RO); clone Griot
     repos into `/workspace`.
   - Coolify: New Resource → Docker Compose, base dir `apps/prism-mobile`, compose `docker-compose.yml`,
     env from `deploy/.env.example` (now includes `PASEO_APP_BASE_URL`). Deploy.
   - Verify Coolify logs: daemon binds `0.0.0.0:6767`, relay connection to
     `prism.digitalgriot.studio/relay`, a pairing offer URL appears.
   - Expect first-deploy native-dep friction (node-pty / better-sqlite3 / sherpa) — iterate on logs.
4. **Model-B acceptance test:** generate an offer on the DROPLET daemon → open its
   `https://…/#offer=…` on the phone → pairs over the relay **with the laptop off** → drive an agent.
5. **Optional cleanups:** add `.easignore` (exclude `prism-eval/`, `.prism/`, `prism-docs/`,
   `apps/prism-cli/`) to shrink the 535 MB EAS upload; delete stale branch `chore/bookend-3.7.5`
   (== one behind main); fix prism-eval's loose embedded-repo setup (no `.gitmodules`).

## Other Notes

- **Node 22 only** for the daemon (native ABI; machine default is 24 → `nvm use 22.20.0`).
- **Universal links** activate on-device only after a successful standalone build (Action Item 1) —
  the AASA is already live server-side and the Team ID matches.
- **Relay deploy** already done; re-deploy with `npx wrangler deploy` from `packages/relay` if the
  Worker changes. Route change `/relay/* → /*` is backward-compatible (relay tests cover it).
- **"paseo" naming still deferred** — do not rename `PASEO_*`, `websocket-paseo`, `app.paseo.sh`
  placeholders. The wire is already Griot.
- `PASEO_APP_BASE_URL` is the one env that makes a fresh daemon (droplet) emit offers pointing at the
  landing page instead of the `app.paseo.sh` default — already in `deploy/docker-compose.yml`.
