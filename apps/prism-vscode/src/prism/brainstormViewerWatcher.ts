/**
 * BrainstormViewerWatcher
 *
 * Watches `.prism/local/brainstorm/<session>/state/open-viewer` trigger files
 * written by `server.cjs` when the brainstorm visual companion starts. When
 * a trigger file appears (or changes), reads the URL from it and opens it in
 * VS Code's Simple Browser.
 *
 * Phase A of the brainstorm-redesign plan. The watcher is the user-facing
 * piece of the "auto-open viewer" leg — it pairs with the persistent MCP
 * channel server (registered in plugin.json) that handles wake-on-click.
 */

import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"

export class BrainstormViewerWatcher implements vscode.Disposable {
  private _watcher: vscode.FileSystemWatcher | undefined

  /**
   * Start watching the workspace for brainstorm `open-viewer` trigger files.
   * Calling start() again replaces any existing watcher.
   */
  start(workspaceRoot: string): void {
    this.dispose()

    const pattern = new vscode.RelativePattern(
      workspaceRoot,
      ".prism/local/brainstorm/*/state/open-viewer",
    )
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)

    const handler = (uri: vscode.Uri): void => {
      void this.openFromTrigger(uri)
    }
    watcher.onDidCreate(handler)
    watcher.onDidChange(handler)

    this._watcher = watcher
  }

  private async openFromTrigger(uri: vscode.Uri): Promise<void> {
    try {
      const raw = await fs.promises.readFile(uri.fsPath, "utf-8")
      const url = raw.trim()
      if (!url || !/^https?:\/\//.test(url)) {
        console.warn(
          `[BrainstormViewerWatcher] ignoring trigger ${path.basename(uri.fsPath)}: invalid URL`,
        )
        return
      }
      await vscode.commands.executeCommand("simpleBrowser.show", url)
    } catch (err) {
      console.warn(
        `[BrainstormViewerWatcher] failed to open viewer from ${uri.fsPath}: ${String(err)}`,
      )
    }
  }

  dispose(): void {
    this._watcher?.dispose()
    this._watcher = undefined
  }
}
