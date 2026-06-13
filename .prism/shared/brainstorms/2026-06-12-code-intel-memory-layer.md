# Code Intelligence & Memory Layer — Brainstorm Decisions Ledger

**Date:** 2026-06-12
**Status:** Complete — ready for `prism-design` phase (the daemon-broker)
**Scope guardrail:** This brainstorm decided. It did not implement.
**Visual companion session:** `.prism/local/brainstorm/6520-1781316817/` (http://localhost:51391)

---

## §1 · Locked Decisions

### Q1 · Code-intel placement → **Daemon-brokered service**
Code-intel lives *behind* the Prism daemon, not in-process-only — reachable by every surface including mobile. The convergence across paseo (`:6767`), open-design (`:7456`), and idea_init's `POST /api/chat` handoff settled it: the local daemon brokers services, clients are thin. In-process-only was rejected — it can't serve mobile and can't share one index across surfaces.

### Q2 · Daemon shape → **Multi-service broker (not paseo-plus)**
The unified Prism daemon is a broker/gateway that speaks each donor's **native** protocol (paseo WebSocket, open-design REST, codebase-memory-mcp stdio-MCP) and normalizes them into **one** client-facing protocol. Responsibilities: service registry, SKILL.md capability discovery, auth + relay, try-local→cloud. Trade-off accepted: this is more than forking paseo's daemon — but anything narrower breaks on the next fold. In the awareness circle: the design-studio relay (`:7457` fronting `:7456`) is an existing per-service-relay data point.

### Q3 · Memory layer → **C · Layer both — Graphify powers Synaptiq**
Two distinct memory services on the broker, not one tool:
- **code-intel service = codebase-memory-mcp** — keep it. Surgical Go-native blast-radius / dead-code / detect_changes, already integrated (graph-navigator across all 4 phases, evals passing). The "magic" stays.
- **knowledge/STORE service = Graphify** — adopt as **Synaptiq's multi-modal graph engine** (code + docs + papers + images + video; provenance tags EXTRACTED/INFERRED/AMBIGUOUS; portable git-committable 3-file output; ~58–63K★). Synaptiq becomes the agentic visual front-end over Graphify's engine.

Rationale: they're not rivals — **codebasemem is STRUCTURE, Graphify is STORE**. This fills the ecosystem's vacant STORE slot and serves the whole creative pipeline (Cinopsis video, Lucid assets), not just code. Trade-off accepted: two engines to run — but the broker brokers both.

## §2 · Deferred Concerns (parking lot)

1. **open-design fold-in** — from Q2. Already in flight via the concurrent idea_init session (`TheDigitalGriot/prism-design-engine` fork + `apps/prism-design-studio` relay `:7457` + `DesignView.tsx`). Two tasks pending there (DesignEngineHost.ts wiring, Griotwave DESIGN.md) — owned by that session. Revisit: coordinate so the broker accounts for the DesignEngineHost 6-message contract.

2. **Build approach: extend paseo vs new broker** — from Q2. Does the broker *extend* paseo's daemon into a gateway, or stand as a *new* broker fronting paseo + design-studio + codebasemem as backends? `design-studio :7457` already hints at a per-service-relay pattern (distributed) vs one monolith. **This is the next decision to make.** Revisit: daemon-design thread.

3. **Graphify license** — from Q3. ✅ **RESOLVED 2026-06-12** — verified **MIT** (`safishamsi/graphify`). Fork, modify, self-host all clear. Install: `pip install graphifyy`. Decision: fork it sovereignly (see worklist) — execution pending user go.

4. **How Synaptiq wraps Graphify** — from Q3. Design the seam — Synaptiq's agentic visual canvas (force-directed, read-write nodes, workflow triggers) over Graphify's graph engine. Node model, cross-project addressing, vector/hybrid-search layer (Graphify graph + a vector layer à la Atomic/sqlite-vec?). Revisit: Synaptiq design phase.

## §3 · Reference Artifacts

- **Visual companion screens:** `code-intel-spec-vs-reality`, `unified-daemon-services`, `daemon-broker-accounts-for-it`, `memory-layer-graphify-vs-codebasemem`, `graphify-powers-synaptiq` (in the session content dir)
- **Grounding research:**
  - `.prism/shared/docs/code-intel/prism-code-intelligence-integration.md` — codebase-memory-mcp integration spec (graph-navigator, phase integration — already LIVE)
  - `.prism/shared/docs/code-intel/2026-04-11-memory-and-context-research.md` — Graphify/GitNexus/Atomic comparison; the 5 gaps
  - `.prism/shared/research/2026-04-11-griot-ecosystem-knowledge-architecture.md` — Capture→Store→Structure→Use→Observe pipeline
  - `.prism/shared/research/2026-06-12-paseo-daemon-architecture-surface-impact.md` — daemon/surface mapping
  - `.prism/shared/research/2026-06-12-prism-design-engine-integration.md` — idea_init design-engine drop
- **External:** Graphify (graphify.net, ~58–63K★, license TBV) · open-design (nexu-io/open-design, Apache-2.0) · codebase-memory-mcp (Go, on PATH)

## §4 · Implementation Handoff Notes

**This file hands off to `prism-design`** (the daemon-broker architecture). The next design round should:
1. Preserve §1 decisions verbatim as "Locked Decisions."
2. Carry §2 deferred concerns as a first-class appendix — esp. the **build approach (extend vs new broker)**, the immediate next decision.
3. Generate the broker architecture: client-facing protocol, service-registry + SKILL.md discovery, per-backend adapters (WebSocket / REST / stdio-MCP normalization), the relay for remote, and how the two memory services (codebasemem + Graphify/Synaptiq) register.
4. Account for the in-flight design-gen service (`prism-design-studio` relay + DesignEngineHost contract).

**Sovereignty invariant (applies to all):** Everything self-hosted, Prism-owned end-to-end (DO / Coolify). paseo, open-design, Graphify, codebase-memory-mcp are **donors folded into the sovereign spine** — never external dependencies that traffic routes through.
