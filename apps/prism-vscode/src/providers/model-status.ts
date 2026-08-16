/**
 * Model Control Plane surface for VS Code — status-bar chip + decisions receipts.
 *
 *   1. ModelStatusBar — a status-bar chip showing the active / last-resolved model
 *      and its approval mode. Ember (warningBackground) when a premium model
 *      (opus5 / fable5) was last resolved. Clicking runs `prism.model.setMode`.
 *   2. ModelDecisionsProvider — a TreeView listing the model-decision bus events
 *      ("HH:mm requested → resolved (mode) [surface]", newest first) with
 *      opus5 / fable5 badges and a downgrade indicator.
 *
 * Both read the SAME events file the CLI hook / gate write to (via the core's
 * `resolveEventsFile`), and are refreshed by a FileSystemWatcher on the gavel
 * events file (wired in extension.ts). Policy writes go through the core's
 * `setModelMode`, so the store location stays defined in one place.
 */

import * as vscode from "vscode"
import * as fs from "fs"
import {
  readModelPolicy,
  resolveEventsFile,
  type ApprovalMode,
  type ModelEvent,
} from "@prism-core/core/api/model-policy"

/** Policy models rendered LOUD (they draw on premium allowances). */
const PREMIUM: ReadonlySet<string> = new Set(["opus5", "fable5"])

/**
 * Read the model-decision events for a project, newest first. Never throws — a
 * missing / malformed events file degrades to an empty list.
 */
export function readModelDecisions(projectRoot: string): ModelEvent[] {
  try {
    const raw = fs.readFileSync(resolveEventsFile(projectRoot), "utf8")
    const out: ModelEvent[] = []
    for (const line of raw.split("\n")) {
      const s = line.trim()
      if (!s) continue
      try {
        const ev = JSON.parse(s) as ModelEvent
        if (ev && ev.type === "model-decision") out.push(ev)
      } catch {
        // skip a malformed / partially-written JSONL line
      }
    }
    return out.reverse()
  } catch {
    return []
  }
}

/** HH:mm from an ISO timestamp; "--:--" on any parse failure. */
function formatTime(ts: string): string {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "--:--"
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

// ---------------------------------------------------------------------------
// Status-bar chip
// ---------------------------------------------------------------------------

export class ModelStatusBar implements vscode.Disposable {
  private readonly _item: vscode.StatusBarItem
  private _root: string | undefined

  constructor() {
    this._item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      97,
    )
    this._item.command = "prism.model.setMode"
    this._item.text = "$(shield) Model policy"
    this._item.tooltip =
      "Model Control Plane — click to set opus5 / fable5 approval mode"
    this._item.show()
  }

  /** Called when the active workspace root is known / changes. */
  setRoot(root: string | undefined): void {
    this._root = root
    this.refresh()
  }

  refresh(): void {
    if (!this._root) {
      this._item.text = "$(shield) Model policy"
      this._item.backgroundColor = undefined
      return
    }

    const last = readModelDecisions(this._root)[0]
    if (!last) {
      // No decision recorded yet — surface the configured premium modes.
      const policy = readModelPolicy(this._root)
      const o = policy.models.opus5?.mode ?? "ask"
      const f = policy.models.fable5?.mode ?? "ask"
      this._item.text = `$(shield) opus5:${o} · fable5:${f}`
      this._item.backgroundColor = undefined
      this._item.tooltip = "Model Control Plane — click to set a model's approval mode"
      return
    }

    const premium = PREMIUM.has(last.resolved) || PREMIUM.has(last.requested)
    const flow = last.downgradedFrom
      ? `${last.requested}→${last.resolved}`
      : last.resolved
    this._item.text = `${premium ? "$(flame)" : "$(shield)"} ${flow} · ${last.mode}`
    this._item.backgroundColor = premium
      ? new vscode.ThemeColor("statusBarItem.warningBackground")
      : undefined
    this._item.tooltip =
      `Last model decision: ${last.requested} → ${last.resolved} ` +
      `(${last.mode}) [${last.surface ?? "?"}]\nClick to set a model's approval mode.`
  }

  dispose(): void {
    this._item.dispose()
  }
}

// ---------------------------------------------------------------------------
// Decisions receipts TreeView
// ---------------------------------------------------------------------------

class ModelDecisionItem extends vscode.TreeItem {
  constructor(ev: ModelEvent) {
    const flow = ev.downgradedFrom
      ? `${ev.requested} → ${ev.resolved}`
      : ev.requested
    super(`${formatTime(ev.ts)}  ${flow}`, vscode.TreeItemCollapsibleState.None)

    this.description = `${ev.mode}${ev.surface ? ` · ${ev.surface}` : ""}`

    const premium = PREMIUM.has(ev.resolved) || PREMIUM.has(ev.requested)
    const downgraded = ev.mode === "deny" || Boolean(ev.downgradedFrom)
    this.iconPath = new vscode.ThemeIcon(
      downgraded ? "arrow-down" : premium ? "flame" : "circle-filled",
      downgraded
        ? new vscode.ThemeColor("charts.red")
        : premium
          ? new vscode.ThemeColor("charts.orange")
          : undefined,
    )
    this.tooltip =
      `${ev.requested} → ${ev.resolved}\n` +
      `mode: ${ev.mode}\nsurface: ${ev.surface ?? "?"}\n${ev.ts}`
    this.contextValue = "modelDecision"
  }
}

export class ModelDecisionsProvider
  implements vscode.TreeDataProvider<ModelDecisionItem>, vscode.Disposable
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    ModelDecisionItem | undefined | null | void
  >()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private _root: string | undefined

  /** Cap on rendered rows — the events file is append-only and can grow. */
  private static readonly MAX_ROWS = 200

  setRoot(root: string | undefined): void {
    this._root = root
    this.refresh()
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: ModelDecisionItem): vscode.TreeItem {
    return element
  }

  getChildren(_element?: ModelDecisionItem): ModelDecisionItem[] {
    if (!this._root) return []
    return readModelDecisions(this._root)
      .slice(0, ModelDecisionsProvider.MAX_ROWS)
      .map((ev) => new ModelDecisionItem(ev))
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose()
  }
}
