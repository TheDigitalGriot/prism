# PASEO_PASSWORD / daemon auth map — Brainstorm Decisions Ledger

**Date:** 2026-07-15
**Status:** Complete — closed early (explanation session, not design). No prism-design phase follows.
**Scope guardrail:** This brainstorm decided. It did not implement.

---

## §1 · Locked Decisions

### Q1 · PASEO_PASSWORD on the droplet → **A · set it (one env line), then forget it**
- Provenance: upstream paseo's feature (public-docs/configuration.md, config.ts:223), not ours. Name survives under the standing "set up first, then go sovereign" deferral.
- It gates ONLY direct `/ws` connections (host allowlist → origin → `paseo.bearer.<secret>` vs bcrypt hash, close 4401 on fail).
- Relay connections bypass it entirely (`attachExternalSocket()` → `attachSocket()`, websocket-server.ts:697 — no bearer check). On the relay path the offer link is the credential (upstream SECURITY.md: "treat it like a password").
- Droplet publishes no ports → relay door only → the password is a non-factor for the always-on mission. Set as zero-cost insurance.
- "Desktop → droplet direct routing" (exposing :6767 via TLS subdomain) explored and **withdrawn as out of scope** — orthogonal to always-on; the mission is laptop-OFF, phone-driven.

## §2 · Deferred Concerns (parking lot)

1. **PASEO_* → PRISM_* rename has a wire-protocol seam** — from Q1
   - Concern: the secret travels as WS subprotocol `paseo.bearer.<secret>` (auth.ts:83 requires the literal `paseo` prefix). The "cosmetic" rename batch touches the wire dialect; old-app ↔ new-daemon back-compat requires the daemon to accept both prefixes.
   - Revisit: when the sovereign rename is greenlit after Model-B acceptance.

## §3 · Reference Artifacts

**Visual companion session:** `.prism/local/brainstorm/1415-1784097983/`
**Final screen:** `.prism/local/brainstorm/1415-1784097983/content/desktop-to-droplet-explained.html`
**Decisions state:** `.prism/local/brainstorm/1415-1784097983/state/decisions.json`
**External references:** apps/prism-mobile/SECURITY.md · packages/server/src/server/{auth,config,websocket-server}.ts

## §4 · Implementation Handoff Notes

No design phase. The single implementation output feeds the Model-B deploy (Phase 0): uncomment `PASEO_PASSWORD` in `deploy/docker-compose.yml` env when deploying via Coolify. The §2 rename seam belongs to the future sovereign-rename workstream, not Model B.
