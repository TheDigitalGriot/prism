---
date: 2026-07-15T03:16:02-04:00
researcher: Claude
git_commit: 08f87b72262cf4d6bc08bc12005fa00275580c79
branch: main
topic: "Model-B Droplet Deploy — Execution Handoff"
tags: [handoff, droplet, coolify, relay, daemon, model-b, deploy]
status: complete
---

# Handoff: Model-B droplet deploy — pre-flight DONE, execution is next

## 0. The mission (unchanged)

Run the Prism agent daemon **always-on** on the DO droplet `digitalgriot-server-tor1`
(159.203.62.10) via Coolify, so the phone pairs over the Griot relay and agents keep working
on repos in `/workspace` **with the P16 completely off**. GitHub is the sync point between
laptop and droplet — they never talk to each other directly; the phone is the full remote
(the agent on the droplet is "your hands on the server": tell it to clone/pull anything).

Prior handoff: `.prism/shared/handoffs/2026-07-07_03-21-33_always-on-droplet-model-b.md`.

## Task(s)

- ✅ **Pre-flight config fix (COMPLETE, pushed)** — found and fixed a deploy-blocking bug
  *before* first deploy: `PASEO_RELAY_ENDPOINT` in all three deploy files was a scheme URL
  (`wss://…/relay`), which the daemon's `parseHostPort()` **rejects with a throw** — the relay
  dial would have failed on every attempt. Fixed to `prism.digitalgriot.studio:443/relay`
  (host:port/path; TLS auto-derived from :443). Commit `de2bb70`.
- ✅ **PASEO_PASSWORD decision closed** — brainstorm ledger
  `.prism/shared/brainstorms/2026-07-15-paseo-password-auth-map.md`. Verdict: upstream paseo's
  feature (not ours); gates ONLY direct `:6767` connections; **relay connections bypass it**
  (`attachExternalSocket`, websocket-server.ts:697 — no bearer check). Non-factor for the
  always-on mission; enabled in compose as zero-cost insurance (`${PASEO_PASSWORD}` from
  Coolify env; empty = disabled).
- ✅ **Git-credentials path for private repos** — optional RO mounts (commented in compose)
  + RUNBOOK prereq 3.
- ⬜ **Droplet prep** (Gavin's hands OR approve Claude SSH — auto-mode classifier blocked
  unapproved SSH to the prod box). Script in Next Steps.
- ⬜ **Coolify resource + deploy** (Gavin's clicks, Claude guides/reads logs).
- ⬜ **Log iteration** until healthy (native-dep friction expected: node-pty / better-sqlite3 /
  sherpa-onnx).
- ⬜ **Model-B acceptance test** — phone pairs to droplet offer, P16 off, agent streams.

## Critical References

1. `apps/prism-mobile/deploy/RUNBOOK.md` — deploy playbook, now with resolved endpoint format
   + git-cred prereq (updated this session).
2. `.prism/shared/docs/SURFACE-CONNECTIVITY-AND-TESTING.md` — §7 droplet, §5 relay/pairing.
3. `apps/prism-mobile/packages/server/src/shared/daemon-endpoints.ts` — `parseHostPort()` (:54),
   `buildRelayWebSocketUrl()` (:181), TLS-from-443 (:207). The ground truth for endpoint format.

## Recent Changes (all in commit `de2bb70`, pushed to main)

- `apps/prism-mobile/deploy/docker-compose.yml:13-17` — endpoint → `prism.digitalgriot.studio:443/relay`;
  PUBLIC_ENDPOINT removed (defaults to ENDPOINT, config.ts:160-163)
- `apps/prism-mobile/deploy/docker-compose.yml:24-26` — `PASEO_PASSWORD: ${PASEO_PASSWORD}` active
- `apps/prism-mobile/deploy/docker-compose.yml:35-39` — commented optional
  `.gitconfig`/`.git-credentials` RO mounts (create host files FIRST — a missing file bind-mounts
  as a directory and breaks git)
- `apps/prism-mobile/deploy/Dockerfile:34` — same endpoint fix in image ENV defaults
- `apps/prism-mobile/deploy/.env.example` — same fixes, documented
- `apps/prism-mobile/deploy/RUNBOOK.md` — prereq 3 (git creds) + "Relay endpoint format —
  RESOLVED (2026-07-15)"
- `.prism/shared/brainstorms/2026-07-15-paseo-password-auth-map.md` (NEW, commit `08f87b7`)

## Learnings

- **L1 — Endpoint format is settled fact, not an iteration point.** `parseHostPort()`
  (daemon-endpoints.ts:73) regex `^(.+):(\d{1,5})(\/.*)?$` has no scheme branch → `wss://…`
  throws. Correct: `prism.digitalgriot.studio:443/relay`. Cross-verified against the WORKING
  local daemon's persisted config `~/.thedigitalgriot/config.json` (`daemon.relay.endpoint` uses
  exactly this form) — the same value proven end-to-end by today's phone pairing.
- **L2 — Password ≠ relay security.** Direct door: host allowlist → origin check →
  `paseo.bearer.<secret>` subprotocol vs bcrypt hash (auth.ts, config.ts:223-229,
  websocket-server.ts:639-661). Relay door: offer-link possession + Curve25519/NaCl E2EE, NO
  password check. Upstream SECURITY.md: the pairing link is the trust anchor — "treat it like a
  password". **Guard the offer link.**
- **L3 — Rename seam parked:** the literal `paseo` prefix in the `paseo.bearer.` WS subprotocol
  is wire-visible; the future PASEO_*→PRISM_* sovereign rename must keep accepting the old
  prefix (old-app ↔ new-daemon back-compat rule in apps/prism-mobile/CLAUDE.md).
- **L4 — Repo renamed** `prism-plugin` → `prism` (v4.0.0). Coolify source must be
  `TheDigitalGriot/prism` (old name redirects, don't rely on it). NOTE: RUNBOOK prereq 2 still
  says `prism-plugin.git` — harmless (redirect) but fix on next doc touch.
- **L5 — SSH to droplet from Claude requires explicit user approval** (auto-mode classifier
  blocks unapproved prod SSH). Either Gavin approves in-session or runs the prep script himself.
- **L6 — Fidelity note:** the config fix is evidence-verified (source + working-config
  cross-check) but **no container build has ever run** — first-deploy native-dep friction
  remains the expected, planned iteration (RUNBOOK "Known iteration points").

## Artifacts

- `apps/prism-mobile/deploy/{docker-compose.yml, Dockerfile, .env.example, RUNBOOK.md}` (fixed, `de2bb70`)
- `.prism/shared/brainstorms/2026-07-15-paseo-password-auth-map.md` (`08f87b7`)
- This handoff.

## Action Items & Next Steps (in order)

1. **Droplet prep** — SSH `root@159.203.62.10` (Gavin, or approve Claude SSH):
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude login                    # browser flow, Max account → ~/.claude
   ls ~/.claude                    # confirm credentials exist
   mkdir -p /opt/griot-workspace && cd /opt/griot-workspace
   git clone https://github.com/TheDigitalGriot/prism.git
   # private-repo agents only:
   git config --global credential.helper store
   printf "https://<gh-user>:<PAT>@github.com\n" > ~/.git-credentials && chmod 600 ~/.git-credentials
   ```
2. **Coolify** (Gavin's clicks): + New Resource → Docker Compose → source
   `TheDigitalGriot/prism`, branch `main`, **base directory `apps/prism-mobile`**, compose file
   `docker-compose.yml`. Env: set `PASEO_PASSWORD=<strong secret>` (only var needed — rest is
   baked in). Confirm mounts: `/root/.claude:ro`, named vol → `/data`, `/opt/griot-workspace` →
   `/workspace`. Deploy.
3. **Watch build/runtime logs** (Claude iterates): success signature in order —
   `Server listening on http://0.0.0.0:6767` → `WebSocket server initialized on /ws` →
   `relay_control_connected` → offer URL reading `https://prism.digitalgriot.studio/#offer=…`
   (NEVER `app.paseo.sh`). Native-dep failures → add apt lib to Dockerfile (or disable speech
   env) and redeploy.
4. **Acceptance test**: grab offer URL from logs (or `docker exec` the container —
   `PASEO_HOME=/data` is baked in — and run the pair command). Phone: **in-app paste/scan**
   (dev-client build; browser tap-to-open needs the optional interactive EAS `preview` rebuild,
   handoff 2026-07-07 §L5). **P16 off.** Open workspace under `/workspace` → start Claude Code
   agent → message → watch it stream. Streaming = Model B accepted.
5. **Wrap**: validation doc in `.prism/shared/validation/`, mark RUNBOOK/connectivity docs,
   consider `.easignore` + stale-branch cleanups from prior handoff §5.

## Other Notes

- **Node 22 only** locally (`nvm use 22.20.0`); droplet container is `node:22-bookworm` —
  correct by construction.
- **Don't casually kill a running local `:6767` daemon** — it supervises live agents.
- **Paseo rename stays deferred** ("set up first, then go sovereign") — wire is already 100%
  Griot; verify any offer's `relay.endpoint` reads `prism.digitalgriot.studio`.
- Working tree still carries Gavin's unrelated local changes (CLAUDE.md one-liner, prism.vsix,
  prism-eval gitlink, untracked .claude/skills + AGENTS.md + .superpowers + 2026-07-12 plan) —
  deliberately NOT committed.
- Token-budget note for resuming session: go straight to Action Items; all investigation is
  already banked in Learnings — do not re-derive.
