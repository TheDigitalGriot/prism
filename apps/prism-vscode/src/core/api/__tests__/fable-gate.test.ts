/**
 * Unit tests for src/core/api/fable-gate.ts
 *
 * `vscode` is not resolvable outside the extension host, so it is virtually
 * mocked here. `isFableEnabled` reads a real temp-file flag, mirroring the
 * fable-flag tests, so the gate is exercised end-to-end against the flag.
 */
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

// Virtual mock: vscode has no node_modules entry in the jest environment.
const showWarningMessage = jest.fn()
jest.mock(
  "vscode",
  () => ({
    window: {
      showWarningMessage: (...args: unknown[]) => showWarningMessage(...args),
    },
  }),
  { virtual: true },
)

import { resolveGatedModel } from "../fable-gate"

/** Create a temp workspace root and write `.prism/local/fable.flag` if given. */
function makeWorkspace(flagContent?: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fable-gate-"))
  if (flagContent !== undefined) {
    const localDir = path.join(root, ".prism", "local")
    fs.mkdirSync(localDir, { recursive: true })
    fs.writeFileSync(path.join(localDir, "fable.flag"), flagContent, "utf8")
  }
  return root
}

describe("resolveGatedModel", () => {
  const roots: string[] = []

  afterEach(() => {
    showWarningMessage.mockReset()
  })

  afterAll(() => {
    for (const root of roots) {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  test("passes non-Fable models through unchanged, no modal", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    await expect(resolveGatedModel("opus", root)).resolves.toBe("opus")
    await expect(resolveGatedModel("sonnet", root)).resolves.toBe("sonnet")
    await expect(resolveGatedModel("haiku", root)).resolves.toBe("haiku")
    expect(showWarningMessage).not.toHaveBeenCalled()
  })

  test("the `opus` alias is policy-governed and EMITS an event", async () => {
    // Regression guard. Post-flip `opus` resolves to claude-opus-5-5 (the current
    // ceiling, 2026-09-30 refresh) — policy key "opus55" — so it must enter the
    // control plane. It was previously absent from MODELNAME_TO_POLICY, which
    // meant every dispatch through the default alias skipped policy AND emitted
    // no bus event: a silent observability hole.
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    const eventsFile = path.join(root, ".prism", "local", "gavel", "_mcp", "state", "events")
    try {
      fs.rmSync(eventsFile, { force: true })
    } catch {
      /* no prior events */
    }

    // opus55 defaults to "allow", so the model runs unchanged — but observably.
    await expect(resolveGatedModel("opus", root)).resolves.toBe("opus")
    expect(showWarningMessage).not.toHaveBeenCalled()

    const lines = fs
      .readFileSync(eventsFile, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { requested: string; resolved: string; mode: string })
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[lines.length - 1].requested).toBe("opus55")
    expect(lines[lines.length - 1].mode).toBe("allow")
  })

  // A denied Fable now stops at the CEILING (opus55, the 2026-09-30 refresh — was
  // opus5 under the same rule before it), not the legacy opus48 floor, because the
  // ceiling defaults to "allow" — the chain returns the first freely runnable
  // entry. Before opus5/opus55 existed with a default, the walk fell through to
  // Opus 4.8.
  test("flag OFF + fable -> opus55, no modal", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: false }))
    roots.push(root)
    await expect(resolveGatedModel("fable", root)).resolves.toBe("opus55")
    expect(showWarningMessage).not.toHaveBeenCalled()
  })

  test("no workspace root + fable -> opus, no modal", async () => {
    // No workspace => no policy store to consult, so this takes the early-return
    // path and yields the `opus` SDK alias (which now resolves to Opus 5).
    await expect(resolveGatedModel("fable", undefined)).resolves.toBe("opus")
    expect(showWarningMessage).not.toHaveBeenCalled()
  })

  test("flag ON + fable + Confirm -> fable (modal shown)", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    showWarningMessage.mockResolvedValueOnce("Confirm")
    await expect(resolveGatedModel("fable", root)).resolves.toBe("fable")
    expect(showWarningMessage).toHaveBeenCalledTimes(1)
    expect(showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining("Fable 5.1"),
      { modal: true },
      "Confirm",
      "Deny",
    )
  })

  test("flag ON + fable + Deny -> opus55", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    showWarningMessage.mockResolvedValueOnce("Deny")
    await expect(resolveGatedModel("fable", root)).resolves.toBe("opus55")
    expect(showWarningMessage).toHaveBeenCalledTimes(1)
  })

  test("flag ON + fable + dismissed (undefined) -> opus55", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    showWarningMessage.mockResolvedValueOnce(undefined)
    await expect(resolveGatedModel("fable", root)).resolves.toBe("opus55")
  })
})
