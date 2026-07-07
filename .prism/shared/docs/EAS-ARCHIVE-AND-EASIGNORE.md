# EAS project archive — what's in the 535 MB, and a safe `.easignore`

> Written 2026-07-07 while shipping the iOS `preview` build. The EAS upload reported
> **"Your project archive is 535 MB"**, so we swept the repo to see what's actually being
> uploaded and what a `.easignore` could safely trim — **without touching the always-on droplet.**

---

## TL;DR

- The repo has only **~142 MB tracked** and **~0 MB untracked-but-unignored**. A clean git-aware
  archive should be ~142 MB, so the **535 MB is dominated by build caches** the mobile build
  doesn't need.
- The single biggest thing on disk is **`apps/prism-installer/src-tauri/target/` = 1.4 GB** (Rust
  build cache). It *is* gitignored (so it shouldn't upload), but it's the #1 thing to hard-exclude
  in `.easignore` as insurance.
- A root `.easignore` can cap the EAS upload to the mobile workspace. **It has ZERO effect on the
  always-on droplet** — that path never uses EAS (see "Droplet safety").

---

## What the sweep found (tracked blob sizes + on-disk)

| Scope | Size |
|---|---|
| Whole repo, **tracked** | 142 MB |
| `apps/prism-mobile`, **tracked** | 28 MB |
| Untracked-but-**not**-ignored (whole repo) | ~0 MB (12 bytes) |
| `apps/prism-installer/src-tauri/target/` (Rust cache, **gitignored**) | **1.4 GB** |
| Root `installer/*.exe` (NSIS installers, **`*.exe` gitignored**) | ~410 MB |
| `.prism/shared/ref/crush/crush.exe` (**gitignored**) | 80 MB |

Biggest **tracked** files inside the mobile workspace (all small, all fine to keep):
`packages/website/public/hero-bg.jpg` (6.5 MB), `package-lock.json` (1.4 MB), website mockups,
the app icons (`icon.png`/`icon-debug.png` ~0.7 MB), `sherpa/assets/silero_vad.onnx` (0.6 MB).

**Conclusion:** nothing tracked is bloated. The 535 MB is build output the archiver is picking up
(Rust `target/`, `dist/`, native caches) that a `.easignore` should explicitly exclude.

---

## Where a `.easignore` goes (EAS archive scope)

EAS archives from the **git root** (`prism-plugin/`), not from `apps/prism-mobile/`. Evidence: the
535 MB is far larger than the mobile workspace's ~28 MB tracked / ~60 MB on-disk. So the `.easignore`
lives at the **repo root**, and it can exclude every top-level dir that isn't the mobile app.

> `apps/prism-mobile` is a **self-contained npm workspace** (its own `package-lock.json`, and it's
> **not** listed in the root `package.json` `workspaces`). So the EAS mobile build does not need the
> root `packages/*` or the other `apps/*` — they can all be excluded.

---

## ⚠️ The `.easignore` gotcha — read before shipping

`.easignore` uses `.gitignore` syntax. **But there is a version-dependent ambiguity:** in some EAS
versions a `.easignore` **replaces** `.gitignore` for the archive; in others it **supplements** it.

This matters because if it **replaces**, anything you don't re-list gets uploaded — including
**secrets** (`.env`, `.env.local`, `apps/prism-mobile/packages/app/.secrets/`, the
`google-services*.json` / `GoogleService-Info*.plist` referenced by `app.config.js`).

**Therefore:** keep the `.easignore` **supplement-style** (only ADD exclusions, never assume it's the
only ignore file), and **verify the next build** (below). Do not ship it blind.

---

## Recommended root `.easignore` (supplement-style)

```gitignore
# Non-mobile surfaces — not part of the EAS mobile app build
apps/prism-installer/       # 1.4 GB Rust target + Tauri
apps/prism-cli/             # Go CLI + committed platform binaries
apps/prism-vscode/
apps/prism-electron/
apps/prism-setup/
apps/prism-design-studio/
installer/                  # committed NSIS .exe installers
prism-eval/                 # embedded Electron eval app (separate repo)
prism-docs/                 # VitePress docs site
.prism/                     # Prism workflow docs / plans / designs / assets
packages/                   # root plugin packages (prism-core/prism-ui) — not the mobile workspace
skills/
commands/
agents/
hooks/

# Belt-and-suspenders build caches (in case a nested .gitignore isn't honored)
**/target/
**/dist/
**/build/
**/.expo/
**/.wrangler/
```

Keeps everything the mobile build needs: **`apps/prism-mobile/`**, root **`VERSION`**, root
**`package.json`**. Expected effect: archive drops from **535 MB → well under 100 MB**.

---

## Verify after adding (do NOT skip)

1. Run the next iOS build and read the log line **"Your project archive is X MB"** — it should be
   far smaller.
2. Confirm no secrets were swept in: check the EAS build's uploaded file list for `.env`, `.secrets/`,
   or `google-services*`. If any appear, your EAS version **replaces** `.gitignore` — re-add the
   standard ignore lines (`node_modules/`, `.env*`, `*.log`, `*.exe`, `**/.secrets/`, the
   `google-services*` / `GoogleService-Info*` patterns) to the `.easignore`.
3. Confirm the build still succeeds (workspace resolution intact).

---

## Droplet safety (Model B) — the important part

**A `.easignore` cannot affect the always-on droplet. Here's why, concretely:**

- `.easignore` is an **EAS-only** concept — it only shapes the tarball uploaded to **EAS Build** for
  the **mobile app**.
- The always-on droplet deploys a completely different way: **Coolify → `git clone` → Docker build**
  running `apps/prism-mobile/deploy/Dockerfile` (which does `npm install` + `npm run build:daemon`
  inside `apps/prism-mobile`). That pipeline **never reads `.easignore`**.
- Everything the excludes touch (`apps/prism-installer`, `installer/`, `.prism/`, `prism-docs/`,
  `prism-eval/`, root `packages/*`, other `apps/*`) is **not used by `build:daemon`** — the daemon
  build operates entirely within `apps/prism-mobile`.

**Net: adding this `.easignore` is invisible to the droplet.** The only thing it changes is how much
gets uploaded to EAS for the phone app.

---

## Status

- **Not yet applied.** This is the analysis + recommendation. Apply the root `.easignore` above, then
  verify on the next EAS build per the checklist. If anything looks off, deleting the `.easignore`
  fully reverts to today's behavior (535 MB uploads, but working builds).
