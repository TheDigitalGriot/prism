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

  // A denied Fable now stops at the CEILING (opus5), not the legacy opus48 floor,
  // because opus5 defaults to "allow" — the chain returns the first freely runnable
  // entry. Previously opus5 defaulted to "ask" and the walk fell through to Opus 4.8.
  test("flag OFF + fable -> opus5, no modal", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: false }))
    roots.push(root)
    await expect(resolveGatedModel("fable", root)).resolves.toBe("opus5")
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

  test("flag ON + fable + Deny -> opus5", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    showWarningMessage.mockResolvedValueOnce("Deny")
    await expect(resolveGatedModel("fable", root)).resolves.toBe("opus5")
    expect(showWarningMessage).toHaveBeenCalledTimes(1)
  })

  test("flag ON + fable + dismissed (undefined) -> opus5", async () => {
    const root = makeWorkspace(JSON.stringify({ enabled: true }))
    roots.push(root)
    showWarningMessage.mockResolvedValueOnce(undefined)
    await expect(resolveGatedModel("fable", root)).resolves.toBe("opus5")
  })
})
