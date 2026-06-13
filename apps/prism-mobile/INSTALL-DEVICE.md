# Prism Debug — iPhone + iPad install + dev environment

This document is the personal install guide for **digitalgriot's** dev client builds of this paseo fork. It is not meant to be merged upstream.

## Build context

This `paseo` directory is a clone of upstream [getpaseo/paseo](https://github.com/getpaseo/paseo) with a **minimal Expo identity rebrand**. All package names (`@thedigitalgriot/*`), CLI commands (`paseo`), env vars (`PASEO_*`), and config files (`paseo.json`) are unchanged from upstream. Only the Expo app identity was rebranded so it routes to your existing Expo project + Apple credentials:

| Field | Upstream value | This clone |
|---|---|---|
| `app.config.js` `production.name` | `"Paseo"` | `"Prism"` |
| `app.config.js` `production.packageId` | `sh.paseo` | `com.thedigitalgriot.prism` |
| `app.config.js` `development.name` | `"Paseo Debug"` | `"Prism Debug"` |
| `app.config.js` `development.packageId` | `sh.paseo.debug` | `com.thedigitalgriot.prism.debug` |
| `app.config.js` `slug` | `voice-mobile` | `prism-mobile` |
| `app.config.js` `scheme` | `paseo` | `prism` |
| `app.config.js` `updates.url` | `0e7f65ce-…` | `4e6ac688-b550-4441-b19a-bbb4459ad05b` |
| `app.config.js` `extra.eas.projectId` | `0e7f65ce-…` | `4e6ac688-b550-4441-b19a-bbb4459ad05b` |
| `app.config.js` `owner` | `getpaseo` | `digitalgriot` |

All other files are upstream paseo, untouched.

## Account / credential reference

| Resource | Value |
|---|---|
| Expo account | `digitalgriot` (`digitalgriotstudios@gmail.com`) |
| Expo project | `@digitalgriot/prism-mobile` |
| Expo project ID | `4e6ac688-b550-4441-b19a-bbb4459ad05b` |
| Apple Developer Program | `gbdevux@gmail.com` |
| Apple Team | `M6K8N36JN8` (GAVIN ANDRE BENNETT, Individual) |
| iOS distribution cert | serial `137E3F9A45B317D7105E3B89A883C9E5`, expires May 2027 |
| iOS provisioning profile | Apple Developer Portal ID `PN5V8QPXV4`, expires May 2027 |
| Registered devices | `dg-iphone` (`00008140-0004488A0206801C`), `dg-ipad` (`00008103-000A45361AA0801E`) |

Cert + profile are cached in EAS and reused automatically across builds — no Apple ID prompt during `eas build`.

## Local toolchain

| Tool | Version |
|---|---|
| Node | 22.20.0 (matches `.tool-versions` and EAS Build's runtime) |
| npm | 10.9.3 |
| nvm-windows | 1.2.2 (installed at `C:\Users\digit\AppData\Local\nvm`, symlink at `C:\nvm4w\nodejs`) |

To activate Node 22.20.0 in any new shell:

```powershell
nvm use 22.20.0
```

(`nvm use` requires admin — UAC prompt appears.)

## How the first dev client build was produced

Already done — current build is `64dccfd5-1530-4f85-bd1e-b1a005d15542`. Documented here for reproducibility.

```powershell
# 1. Activate Node 22.20.0
nvm use 22.20.0

# 2. From the paseo root: install dependencies (does not modify lockfile)
cd C:\Users\digit\Developer\paseo
npm ci

# 3. Build all workspace packages so Metro can resolve them locally
#    (npm ci only symlinks workspaces — it does not run their build scripts).
#    Without this, Metro fails with "Unable to resolve @thedigitalgriot/expo-two-way-audio"
#    (and similar) when the dev client connects. The cloud EAS build doesn't need
#    this because it builds workspaces internally; only local Metro does.
npm run build

# 4. Run the build (cached credentials reused, no Apple prompt)
cd packages\app
npx eas-cli@16.24.1 build --profile development --platform ios --non-interactive
```

Build URL once finished:
- Direct: https://expo.dev/accounts/digitalgriot/projects/prism-mobile/builds/64dccfd5-1530-4f85-bd1e-b1a005d15542
- Project dashboard: https://expo.dev/accounts/digitalgriot/projects/prism-mobile/builds

To run a fresh build later, repeat steps 1–3. Each run produces a new build URL with a new install link.

## Installing the dev client on iPhone + iPad

Do this on **each** device:

1. **Open the build URL in Safari** (Chrome on iOS does not trigger the install prompt):
   `https://expo.dev/accounts/digitalgriot/projects/prism-mobile/builds/64dccfd5-1530-4f85-bd1e-b1a005d15542`
2. Scroll to the **Install** button (or scan the QR code on the build page using the camera on the *other* device).
3. iOS prompts: *"expo.dev would like to install 'Prism Debug'"* → tap **Install**.
4. The Prism Debug icon appears on the home screen.
5. **If iOS shows "Untrusted Developer"** on first launch:
   - Settings → General → VPN & Device Management → tap *Apple Development: GAVIN ANDRE BENNETT* → **Trust**.
   - Return to the home screen and tap Prism Debug again.

Because this is ad-hoc distribution where each device's UDID is in the provisioning profile, the "Untrusted Developer" step is sometimes skipped automatically. Either outcome is normal.

## Starting the local dev environment

In a new terminal pointed at `C:\Users\digit\Developer\paseo`:

### Option 1 — combined Windows dev script

```powershell
nvm use 22.20.0
npm run dev:win
```

Runs daemon + Expo dev server together via `scripts/dev.ps1`.

### Option 2 — split terminals (more robust)

Terminal A (daemon):

```powershell
nvm use 22.20.0
npm run dev:server
```

Terminal B (Expo dev server):

```powershell
nvm use 22.20.0
npm run dev:app
```

Wait for Terminal B to print a QR code and a URL like `exp://192.168.x.x:8081`.

## Connecting Prism Debug to the dev server

1. **Phone and computer must be on the same Wi-Fi.** Required — Expo defaults to LAN mode.
2. Open Prism Debug on iPhone (or iPad). The first screen is the Expo dev launcher.
3. Tap **"Scan QR code"** and scan the QR from Terminal B (or "Enter URL manually" and type `http://<your-pc-lan-ip>:8081` — note the scheme: the manual-entry field validates against Metro's `/status` endpoint, so it expects the Metro HTTP URL, **not** an `exp://` URL. `exp://` only works via QR / deep link).
4. JS bundle downloads (10–30s on first load); the actual paseo UI appears.
5. The paseo UI has its own pairing flow for connecting to the **daemon** on port 6767. If it asks for a daemon URL, enter `http://<your-pc-lan-ip>:6767` — find the LAN IP with `ipconfig` (use the IPv4 of your active Wi-Fi adapter).
6. Once paired, the device is talking to the local daemon, which manages your Claude Code / Codex / OpenCode agents.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Install URL refuses to open the install dialog | Using Chrome on iOS | Open the URL in Safari instead |
| App stuck on white screen after launch | Cannot reach Expo dev server on port 8081 | Check phone + PC on same Wi-Fi; allow Node through Windows Defender Firewall for private networks |
| App opens but cannot connect to daemon | Windows Defender Firewall blocking port 6767 | Run `New-NetFirewallRule -DisplayName "Paseo daemon" -Direction Inbound -LocalPort 6767 -Protocol TCP -Action Allow` in elevated PowerShell |
| `npm ci` fails with `Missing: react@x.y.z from lock file` | You ran `npm install` and overwrote the lockfile | `git checkout package-lock.json` then `npm ci` again |
| `eas build` complains about missing `expo-dev-client` | `node_modules/` is empty | Run `npm ci` from the paseo root before building |
| Metro red screen: `Unable to resolve "@thedigitalgriot/expo-two-way-audio"` (or similar workspace pkg) | The workspace package's `build/` dist hasn't been compiled yet — `npm ci` symlinks workspaces but doesn't run their build scripts | `npm run build` from the paseo root, then reload the dev client (or restart Metro with `npx expo start --clear` if the resolver cache is sticky) |
| `nvm use` errors with permission issue | UAC was declined | Re-run, accept the UAC prompt |

## Refreshing the dev client

You only need to rebuild the dev client (`.ipa`) when:

- The list of native modules changes (e.g., adding/removing an Expo plugin)
- `app.config.js` changes
- The Expo SDK version changes
- The provisioning profile or distribution cert needs renewal

For everyday JS changes, just edit code on your machine — Metro live-reloads inside the already-installed Prism Debug app. No rebuild needed.

## Why this clone instead of the prism-mobile fork

The neighboring `C:\Users\digit\Developer\prism-mobile` directory is the abandoned full-rename experiment (paseo → prism across all package names, env vars, and config files). It produced a `package-lock.json` with a tree where the `react: 19.1.0` override conflicted with sub-packages that declared peer deps `^19.1.4` — `npm ci` rejected the lockfile every time, both locally and on EAS Build. That fork is parked for now. This `paseo` directory uses upstream's known-good lockfile with only the Expo identity changed; everything else is unmodified upstream paseo.
