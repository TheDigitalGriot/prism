---
title: griot_assert — the Griot assertion facade (ICM stage contract)
stage: assert-facade
created: 2026-09-04
decided: Q4 = Option B (full build). Gavin: "half steps is what got us here."
---

# INPUTS (exact)

- **Working file:** `scripts/digital-griot-mcp/digital-griot-mcp.ts` (the shared Griot MCP server).
- **Pattern to follow:** the existing `gavel_*` tools — `GAVEL_TOOLS` list (~:84), `ListToolsRequestSchema`
  handler (~:779), `CallToolRequestSchema` switch (~:788).
- **Governing decisions:** this session's ledger — Q2 (facade + laddered backends), D·layers
  (MCP acts / files remember / skills say how), D·assert (chrome-devtools MCP is the primitive).
- **Ideology check:** `icm/paper/2603.16021v2.pdf` §2.2, §5.1–5.3 (analysis on screen 17).

# STANCE — ICM is the truth; the Griot suite is framework-adjacent

The Griot suite builds infrastructure (daemon, broker, MCP servers, multi-surface apps). ICM's caution about
becoming "a framework itself" is a **real warning we heed**, not positioning to wave off. The
reconciling test is not *"are we allowed to build a server?"* — it is:

> **Does this piece of infrastructure preserve glass-box-ness?**

Infrastructure that writes through to plain files and branches on mechanical facts stays ICM-true.
Infrastructure that hides state in memory and routes on model judgment is precisely what ICM warns
about. Conditions 3 and 4 below are that guard — they are why this facade can exist without
becoming the opaque thing.

**North star:** reproduce, one layer down, the working experience this session produced —
context-scoped, observable by default, reviewable at every gate.

# LOCKED DECISIONS (do not relitigate)

1. **A facade, never a proxy.** MCP servers are siblings and cannot call each other. `griot_assert`
   therefore uses **resolve-and-return** — the same contract `gavel_open` / `gavel_scan` / `gavel_commit`
   already use: the tool assembles the payload and names the action; the agent performs it on wake.
2. **One verb, two phases.** `griot_assert` called *without* `result` returns the plan (which rung, what
   to run). Called *with* `result` it records the outcome. Two phases, **one tool definition** — because
   ICM §2.2 says per-stage tool surface is the thing to minimise.
3. **Write-through is mandatory** (ICM §5.3). Every recorded assertion lands as a plain file. An
   assertion that exists only in a tool response is invisible to the next session and is treated as
   not having happened.
4. **The ladder branches on CAPABILITY, never on model judgment** (ICM §5.2). Detecting "is
   chrome-devtools reachable" is mechanical local-script work. Routing on what the model *thinks*
   would make this the framework ICM exists to avoid.
5. **Never fake a pass.** If no rung can execute, the verdict is `unverified` — never `pass`.

# THE LADDER (mirrors `drive.cjs`, which already ships this shape)

| Rung | Condition | Action returned |
|---|---|---|
| 1 `mcp` | chrome-devtools MCP available to the agent | run `evaluate_script` with the given expression |
| 2 `bridge` | cloud/no direct browser, device bridge present | dispatch device-side over the passive file bus |
| 3 `cli` | a shell exists but no MCP | run the CLI equivalent |
| 4 `none` | nothing | record `unverified` — do not fake a pass |

# PROCESS (numbered)

1. Add `griot_assert` to the tools list with the two-phase schema. [HEARTBEAT: ASSERT-SCHEMA]
2. Implement `resolveRung()` — capability detection only, env/config driven. [HEARTBEAT: ASSERT-RUNG]
3. Implement the recorder — append to `assertions.jsonl` + a readable `assertions.md`. [HEARTBEAT: ASSERT-WRITE]
4. Wire the dispatch case; keep the handler shape identical to the gavel cases. [HEARTBEAT: ASSERT-WIRED]
5. Verify: `tsc`/`node --check` clean, rung resolution returns the right action, a recorded
   assertion is readable on disk, tool count grew by exactly 1. [HEARTBEAT: ASSERT-VERIFIED]

# SUCCESS CRITERIA (the three ICM conditions, as tests)

- [ ] **Write-through** — after a recorded assertion, the verdict is readable in a plain file with no
      tooling. Kill the server; the evidence survives.
- [ ] **Mechanical ladder** — `resolveRung()` contains no model-facing judgment; its inputs are
      environment facts only.
- [ ] **Surface shrinks** — exactly **one** new tool definition. If a second verb is wanted, it must
      replace an existing one, not add to it.
- [ ] Existing gavel tools still list and dispatch unchanged.
- [ ] `claude plugin validate .` passes.

# OUT OF SCOPE

- The Workgraph / worklanes view (parked, own session).
- Rewriting `prism-verify` to consume the facade (carrier edit A/B land separately).
- Any browser-mode work (`--headless --isolated` vs logged-in) — parked as its own tangent.
