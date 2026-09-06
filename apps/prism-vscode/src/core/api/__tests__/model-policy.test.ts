/**
 * Unit tests for the Model Control Plane (packages/prism-core/.../model-policy.ts).
 *
 * Run in the prism-vscode jest suite (the module resolves via the `@prism-core/*`
 * moduleNameMapper). Mirrors the fable-flag / fable-gate style: a real temp
 * project root holds the policy store, so the reader + decision + event emission
 * are exercised end-to-end against the filesystem.
 */
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import {
  readModelPolicy,
  resolveModelDecision,
  emitModelEvent,
  resolveEventsFile,
  type ApprovalMode,
  type ModelEvent,
} from "@prism-core/core/api/model-policy"

const roots: string[] = []

/** Temp project root; optionally seed model-policy.json and/or fable.flag. */
function makeProject(opts?: {
  policy?: unknown
  fableFlag?: unknown
}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "model-policy-"))
  roots.push(root)
  const localDir = path.join(root, ".prism", "local")
  fs.mkdirSync(localDir, { recursive: true })
  if (opts?.policy !== undefined) {
    const raw =
      typeof opts.policy === "string" ? opts.policy : JSON.stringify(opts.policy)
    fs.writeFileSync(path.join(localDir, "model-policy.json"), raw, "utf8")
  }
  if (opts?.fableFlag !== undefined) {
    const raw =
      typeof opts.fableFlag === "string"
        ? opts.fableFlag
        : JSON.stringify(opts.fableFlag)
    fs.writeFileSync(path.join(localDir, "fable.flag"), raw, "utf8")
  }
  return root
}

/** Read the events file (deterministic fallback path via an empty env). */
function readEvents(root: string): ModelEvent[] {
  const file = resolveEventsFile(root, {})
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as ModelEvent)
}

afterAll(() => {
  for (const root of roots) {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// readModelPolicy
// ---------------------------------------------------------------------------

describe("readModelPolicy", () => {
  test("safe defaults when store + legacy flag are absent", () => {
    const root = makeProject()
    const policy = readModelPolicy(root)
    // opus5 = "allow", NOT "ask": Opus 5 is the routine ceiling and carries no
    // model-level gate (locked in icm-fuse-CONTEXT.md / OPUS5-INCORPORATION-PLAN.md).
    // Only fable5 is HITL-gated.
    expect(policy.models.opus5.mode).toBe("allow")
    expect(policy.models.fable5.mode).toBe("ask")
    expect(policy.headlessDefault).toBe("allow")
    expect(policy.surfaces).toEqual({})
  })

  test("safe defaults on malformed JSON", () => {
    const root = makeProject({ policy: "{ not valid json " })
    const policy = readModelPolicy(root)
    expect(policy.models.fable5.mode).toBe("ask")
    expect(policy.models.opus5.mode).toBe("allow")
  })

  test("reads an explicit store and fills missing default models", () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { fable5: { mode: "deny" } },
        surfaces: { vscode: { fable5: { mode: "skip" } } },
      },
    })
    const policy = readModelPolicy(root)
    expect(policy.headlessDefault).toBe("deny")
    expect(policy.models.fable5.mode).toBe("deny")
    // opus5 not in the file → filled from safe defaults.
    expect(policy.models.opus5.mode).toBe("allow")
    expect(policy.surfaces.vscode.fable5.mode).toBe("skip")
  })

  test("back-compat: fable.flag enabled:true → fable5 ask", () => {
    const root = makeProject({ fableFlag: { enabled: true } })
    expect(readModelPolicy(root).models.fable5.mode).toBe("ask")
  })

  test("back-compat: fable.flag enabled:false → fable5 deny", () => {
    const root = makeProject({ fableFlag: { enabled: false } })
    expect(readModelPolicy(root).models.fable5.mode).toBe("deny")
  })

  test("explicit store wins over a legacy fable.flag", () => {
    const root = makeProject({
      policy: { version: 1, models: { fable5: { mode: "skip" } } },
      fableFlag: { enabled: false },
    })
    expect(readModelPolicy(root).models.fable5.mode).toBe("skip")
  })
})

// ---------------------------------------------------------------------------
// resolveModelDecision
// ---------------------------------------------------------------------------

describe("resolveModelDecision — modes", () => {
  function policyRoot(models: Record<string, ApprovalMode>, headless?: ApprovalMode): string {
    return makeProject({
      policy: {
        version: 1,
        headlessDefault: headless ?? "allow",
        models: Object.fromEntries(
          Object.entries(models).map(([m, mode]) => [m, { mode }]),
        ),
        surfaces: {},
      },
    })
  }

  test("allow: model runs, no downgrade", async () => {
    const root = policyRoot({ fable5: "allow" })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("fable5")
    expect(d.mode).toBe("allow")
    expect(d.downgradedFrom).toBeUndefined()
  })

  test("skip: model runs, bypassing approval", async () => {
    const root = policyRoot({ fable5: "skip" })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("fable5")
    expect(d.mode).toBe("skip")
  })

  test("deny: downgrades past ask'd opus5 to the opus48 floor", async () => {
    const root = policyRoot({ fable5: "deny", opus5: "ask" })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("opus48")
    expect(d.downgradedFrom).toBe("fable5")
    expect(d.mode).toBe("deny")
  })

  test("deny: with DEFAULT policy, fable5 lands on opus5 (not the floor)", async () => {
    // Regression guard for the un-gating decision: because opus5 now defaults to
    // "allow", a denied fable5 stops at the ceiling instead of falling all the way
    // through to legacy Opus 4.8. If opus5 ever regresses to "ask", this fails.
    const root = policyRoot({ fable5: "deny" })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("opus5")
    expect(d.downgradedFrom).toBe("fable5")
  })

  test("deny: downgrades to opus5 when opus5 is allow", async () => {
    const root = policyRoot({ fable5: "deny", opus5: "allow" })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("opus5")
    expect(d.downgradedFrom).toBe("fable5")
  })

  test("ask headless (no confirm): auto-resolves to run per headlessDefault=allow", async () => {
    const root = policyRoot({ fable5: "ask" }, "allow")
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("fable5")
    expect(d.mode).toBe("ask")
    expect(d.reason).toContain("headlessDefault=allow")
  })

  test("ask headless (no confirm): headlessDefault=deny downgrades", async () => {
    const root = policyRoot({ fable5: "ask", opus5: "ask" }, "deny")
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    expect(d.model).toBe("opus48")
    expect(d.downgradedFrom).toBe("fable5")
  })

  test("ask headless: PRISM_MODEL_HEADLESS_DEFAULT overrides the store", async () => {
    const root = policyRoot({ fable5: "ask", opus5: "ask" }, "allow")
    const d = await resolveModelDecision({
      requested: "fable5",
      projectRoot: root,
      env: { PRISM_MODEL_HEADLESS_DEFAULT: "deny" },
    })
    expect(d.model).toBe("opus48")
  })

  test("ask interactive: confirm=true runs the model", async () => {
    const root = policyRoot({ fable5: "ask" })
    const confirm = jest.fn().mockResolvedValue(true)
    const d = await resolveModelDecision({
      requested: "fable5",
      projectRoot: root,
      env: {},
      confirm,
    })
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(d.model).toBe("fable5")
    expect(d.reason).toBe("confirmed")
  })

  test("ask interactive: confirm=false downgrades", async () => {
    const root = policyRoot({ fable5: "ask", opus5: "ask" })
    const confirm = jest.fn().mockResolvedValue(false)
    const d = await resolveModelDecision({
      requested: "fable5",
      projectRoot: root,
      env: {},
      confirm,
    })
    expect(d.model).toBe("opus48")
    expect(d.downgradedFrom).toBe("fable5")
  })

  test("surface override wins over the base model mode", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "allow",
        models: { fable5: { mode: "deny" } },
        surfaces: { vscode: { fable5: { mode: "skip" } } },
      },
    })
    const d = await resolveModelDecision({
      requested: "fable5",
      surface: "vscode",
      projectRoot: root,
      env: {},
    })
    expect(d.model).toBe("fable5")
    expect(d.mode).toBe("skip")
  })
})

// ---------------------------------------------------------------------------
// emitModelEvent
// ---------------------------------------------------------------------------

describe("emitModelEvent", () => {
  test("appends one JSONL model-decision line to the events file", () => {
    const root = makeProject()
    const file = emitModelEvent(
      root,
      {
        requested: "fable5",
        resolved: "opus48",
        mode: "deny",
        surface: "vscode",
        downgradedFrom: "fable5",
      },
      {},
    )
    expect(file).not.toBeNull()
    const events = readEvents(root)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: "model-decision",
      requested: "fable5",
      resolved: "opus48",
      mode: "deny",
      surface: "vscode",
      downgradedFrom: "fable5",
    })
    expect(typeof events[0].ts).toBe("string")
  })

  test("appends (never truncates) across multiple emits", () => {
    const root = makeProject()
    emitModelEvent(root, { requested: "fable5", resolved: "fable5", mode: "allow" }, {})
    emitModelEvent(root, { requested: "opus5", resolved: "opus5", mode: "skip" }, {})
    const events = readEvents(root)
    expect(events).toHaveLength(2)
    expect(events[1].requested).toBe("opus5")
  })

  test("resolveEventsFile honors GAVEL_STATE_DIR precedence", () => {
    const root = makeProject()
    const stateDir = path.join(root, "custom-state")
    expect(resolveEventsFile(root, { GAVEL_STATE_DIR: stateDir })).toBe(
      path.join(stateDir, "events"),
    )
  })
})

// ---------------------------------------------------------------------------
// End-to-end: decision + event (the visibility fix)
// ---------------------------------------------------------------------------

describe("decision + event emission", () => {
  test("a denied model downgrades AND writes a bus event naming the downgrade", async () => {
    const root = makeProject({
      policy: { version: 1, models: { fable5: { mode: "deny" }, opus5: { mode: "ask" } } },
    })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    emitModelEvent(
      root,
      {
        requested: d.requested,
        resolved: d.model,
        mode: d.mode,
        surface: "vscode",
        downgradedFrom: d.downgradedFrom,
      },
      {},
    )
    expect(d.model).toBe("opus48")
    const events = readEvents(root)
    expect(events).toHaveLength(1)
    expect(events[0].downgradedFrom).toBe("fable5")
    expect(events[0].resolved).toBe("opus48")
  })

  test("an ask model auto-resolves headlessly AND writes an event", async () => {
    const root = makeProject({
      policy: { version: 1, headlessDefault: "allow", models: { fable5: { mode: "ask" } } },
    })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root, env: {} })
    emitModelEvent(
      root,
      { requested: d.requested, resolved: d.model, mode: d.mode, surface: "vscode" },
      {},
    )
    expect(d.model).toBe("fable5")
    const events = readEvents(root)
    expect(events).toHaveLength(1)
    expect(events[0].mode).toBe("ask")
    expect(events[0].resolved).toBe("fable5")
  })
})

// ---------------------------------------------------------------------------
// ARKESTRA — the provider axis
// ---------------------------------------------------------------------------
//
// These are the tests that would have caught the defect. Reproduced 2026-09-06
// by executing the pre-Arkestra logic:
//
//     requested=gpt:gpt-6-astra   -> downgraded to: opus5
//     requested=local:griotmodel  -> downgraded to: opus5
//
// `nextRunnable` did `DOWNGRADE_CHAIN.indexOf(requested)`, which returns -1 for
// any `${provider}:${model}` key, so the walk began at the TOP of the Anthropic
// chain. A Codex request silently became an Anthropic one billed to the Max
// subscription; a LOCAL model escaped to the cloud. It never reached the floor.
describe("Arkestra — the provider axis", () => {
  const deniedEverything = {
    version: 1,
    headlessDefault: "deny",
    models: {
      opus5: { mode: "allow" },
      fable5: { mode: "ask" },
      "gpt:gpt-6-astra": { mode: "deny" },
      "local:griotmodel": { mode: "deny" },
    },
    surfaces: {},
  }

  test("a denied CODEX model never becomes an Anthropic model", async () => {
    const root = makeProject({ policy: deniedEverything })
    const d = await resolveModelDecision({ requested: "gpt:gpt-6-astra", projectRoot: root })
    expect(d.model).not.toBe("opus5")
    expect(d.model).not.toBe("opus48")
    expect(d.model).not.toBe("fable5")
    expect(d.blocked).toBe(true)
    expect(d.provider).toBe("gpt")
  })

  test("a denied LOCAL model never escapes to the cloud (local-first guarantee)", async () => {
    const root = makeProject({ policy: deniedEverything })
    const d = await resolveModelDecision({ requested: "local:griotmodel", projectRoot: root })
    expect(d.blocked).toBe(true)
    expect(d.provider).toBe("local")
    // the whole point: nothing from another provider's chain
    expect(["fable5", "opus5", "opus48"]).not.toContain(d.model)
  })

  test("ANTHROPIC downgrade behaviour is unchanged (no regression)", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { fable5: { mode: "deny" }, opus5: { mode: "allow" } },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({ requested: "fable5", projectRoot: root })
    expect(d.model).toBe("opus5")
    expect(d.downgradedFrom).toBe("fable5")
    expect(d.blocked).toBeFalsy()
    expect(d.provider).toBe("anthropic")
  })

  test("an explicit provider on the entry overrides the key prefix", async () => {
    // The key says nothing about a provider; the entry declares one. Without
    // `coerceEntry` preserving `provider`, this resolves to "unknown" — which is
    // the bug this test caught during the Arkestra commit.
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { weird: { mode: "deny", provider: "openai" } },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({ requested: "weird", projectRoot: root })
    expect(d.provider).toBe("openai")
    // openai HAS a chain, so this correctly downgrades within openai rather than
    // blocking — and above all never lands on Anthropic.
    expect(["fable5", "opus5", "opus48"]).not.toContain(d.model)
  })

  test("a provider with NO declared chain fails closed", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { "mistral:large": { mode: "deny" } },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({ requested: "mistral:large", projectRoot: root })
    expect(d.provider).toBe("mistral")
    expect(d.blocked).toBe(true)
    expect(d.reason).toMatch(/not crossing providers/i)
  })

  test("a credential-bound request is NEVER failed over, even within its provider", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { fable5: { mode: "deny" }, opus5: { mode: "allow" } },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({
      requested: "fable5",
      projectRoot: root,
      credentialBound: true,
    })
    // without credentialBound this downgrades to opus5 (asserted above)
    expect(d.model).toBe("fable5")
    expect(d.blocked).toBe(true)
    expect(d.reason).toMatch(/credential-bound/i)
  })

  test("the bus event carries provider and blocked, so a fail-closed is visible", () => {
    const root = makeProject()
    emitModelEvent(
      root,
      {
        requested: "gpt:gpt-6-astra",
        resolved: "gpt:gpt-6-astra",
        mode: "deny",
        provider: "gpt",
        blocked: true,
      },
      {},
    )
    const [e] = readEvents(root)
    expect(e.provider).toBe("gpt")
    expect(e.blocked).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ARKESTRA — the Codex/OpenAI roster
// ---------------------------------------------------------------------------
describe("Arkestra — Codex roster", () => {
  test("a denied Codex model downgrades WITHIN openai, never to Anthropic", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: {
          "openai:gpt-6-astra": { mode: "deny" },
          "openai:gpt-5.6-sol": { mode: "allow" },
        },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({ requested: "openai:gpt-6-astra", projectRoot: root })
    expect(d.provider).toBe("openai")
    expect(d.model).toBe("openai:gpt-5.6-sol")
    expect(d.blocked).toBeFalsy()
    expect(["fable5", "opus5", "opus48"]).not.toContain(d.model)
  })

  test("the openai chain terminates at its OWN floor, not Anthropic's", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: {
          "openai:gpt-6-astra": { mode: "deny" },
          "openai:gpt-5.6-sol": { mode: "deny" },
          "openai:gpt-5.6-terra": { mode: "deny" },
        },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({ requested: "openai:gpt-6-astra", projectRoot: root })
    expect(d.model.startsWith("openai:")).toBe(true)
    expect(d.model).not.toBe("opus48")
  })
})

// ---------------------------------------------------------------------------
// ARKESTRA — adversarial: try to BREAK the provider guarantee
// ---------------------------------------------------------------------------
// Written as the Step-0 release gate. The question is not "does the happy path
// work" but "can any input still land a non-Anthropic request on an Anthropic
// model" — the defect this release exists to fix.
describe("Arkestra — adversarial provider-crossing attempts", () => {
  const ANTHROPIC = ["fable5", "opus5", "opus48"]

  test("a surface OVERRIDE cannot push a Codex model onto the Anthropic chain", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { "openai:gpt-6-astra": { mode: "allow" } },
        surfaces: { cli: { "openai:gpt-6-astra": { mode: "deny" } } },
      },
    })
    const d = await resolveModelDecision({
      requested: "openai:gpt-6-astra",
      surface: "cli",
      projectRoot: root,
    })
    expect(ANTHROPIC).not.toContain(d.model)
    expect(d.provider).toBe("openai")
  })

  test("a MALFORMED policy still cannot cross providers", async () => {
    const root = makeProject({ policy: "{ this is not json" })
    const d = await resolveModelDecision({ requested: "local:griotmodel", projectRoot: root })
    expect(ANTHROPIC).not.toContain(d.model)
  })

  test("an entry claiming provider 'anthropic' does NOT smuggle a foreign key onto the chain", async () => {
    // The nastiest case: a key that is not an Anthropic model, declaring itself Anthropic.
    // nextRunnable must still refuse to return it as if it were a chain member.
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: {
          "openai:gpt-6-astra": { mode: "deny", provider: "anthropic" },
          opus5: { mode: "allow" },
        },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({ requested: "openai:gpt-6-astra", projectRoot: root })
    // It may downgrade within the declared provider, but must NEVER return the
    // requested foreign id as a runnable Anthropic model.
    expect(d.model).not.toBe("openai:gpt-6-astra")
  })

  test("a colon-prefixed key (empty provider) fails closed", async () => {
    const root = makeProject({
      policy: { version: 1, headlessDefault: "deny", models: { ":weird": { mode: "deny" } }, surfaces: {} },
    })
    const d = await resolveModelDecision({ requested: ":weird", projectRoot: root })
    expect(ANTHROPIC).not.toContain(d.model)
    expect(d.blocked).toBe(true)
  })

  test("a bare unknown key (no colon, not an Anthropic id) fails closed", async () => {
    const root = makeProject({
      policy: { version: 1, headlessDefault: "deny", models: { mystery: { mode: "deny" } }, surfaces: {} },
    })
    const d = await resolveModelDecision({ requested: "mystery", projectRoot: root })
    expect(d.provider).toBe("unknown")
    expect(d.blocked).toBe(true)
    expect(ANTHROPIC).not.toContain(d.model)
  })

  test("EVERY blocked decision keeps `model` === requested, so an ignoring caller cannot silently switch provider", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { "local:griotmodel": { mode: "deny" }, "mistral:large": { mode: "deny" } },
        surfaces: {},
      },
    })
    for (const req of ["local:griotmodel", "mistral:large"]) {
      const d = await resolveModelDecision({ requested: req, projectRoot: root })
      expect(d.blocked).toBe(true)
      // The safety property: even a caller that ignores `blocked` runs the model
      // it asked for, never someone else's.
      expect(d.model).toBe(req)
    }
  })

  test("credential-bound + Anthropic: still blocks rather than downgrading", async () => {
    const root = makeProject({
      policy: {
        version: 1,
        headlessDefault: "deny",
        models: { fable5: { mode: "deny" }, opus5: { mode: "allow" } },
        surfaces: {},
      },
    })
    const d = await resolveModelDecision({
      requested: "fable5",
      projectRoot: root,
      credentialBound: true,
    })
    expect(d.model).toBe("fable5")
    expect(d.blocked).toBe(true)
  })
})
