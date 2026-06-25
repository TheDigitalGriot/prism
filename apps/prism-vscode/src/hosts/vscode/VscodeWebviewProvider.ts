import * as vscode from "vscode"
import * as path from "path"
import { WebviewProvider, getNonce } from "../../core/webview/WebviewProvider"
import { PrismController } from "../../core/controller/index"
import { handleGrpcRequest, registerBrokerForwarder } from "@prism-core/core/controller/grpc-handler"
import { WebviewToExtMessage } from "@prism-core/shared/PrismMessage"
import { resolveLiveViteServer } from "./viteDevServer"

/**
 * VS Code WebviewViewProvider implementation.
 *
 * Responsibilities:
 * - Generate webview HTML with proper CSP headers
 * - Set up bidirectional message passing (postMessage ↔ grpc handler)
 * - Manage lifecycle (dispose, visibility)
 */
export class VscodeWebviewProvider extends WebviewProvider implements vscode.WebviewViewProvider {
  public static readonly SIDEBAR_ID = "prism.sidebar"

  /** Services the daemon broker owns — gRPC calls for these forward to it. */
  private static readonly BROKER_SERVICES = new Set([
    "agent-run", "code-intel", "design-gen", "knowledge", "3d-gen", "cinopsis", "notebooks",
  ])
  private static readonly BROKER_PORT = 6780

  private _webviewView: vscode.WebviewView | undefined
  private _controller: PrismController
  private _disposables: vscode.Disposable[] = []

  constructor(private readonly _context: vscode.ExtensionContext) {
    super()
    this._controller = new PrismController(_context)
    // Seam bridge: route gRPC calls for brokered services to the daemon broker
    // (if it's running). VS Code doesn't supervise the daemon, so it uses the
    // default port and treats the broker as adopt-only.
    this._registerBrokerForwarder()
  }

  private _registerBrokerForwarder(): void {
    registerBrokerForwarder(async (req, respond) => {
      if (!VscodeWebviewProvider.BROKER_SERVICES.has(req.service)) return false // not ours
      if (req.is_streaming) return false // unary only for now
      try {
        const res = await fetch(`http://127.0.0.1:${VscodeWebviewProvider.BROKER_PORT}/call`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ service: req.service, method: req.method, payload: req.message }),
        })
        const json = (await res.json()) as { ok: boolean; result?: unknown; error?: string }
        if (json.ok) await respond(json.result, true)
        else await respond({ error: json.error ?? "broker call failed" }, true)
      } catch (err) {
        await respond({ error: `broker unreachable: ${String(err)}` }, true)
      }
      return true
    })
  }

  get controller(): PrismController {
    return this._controller
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    this._webviewView = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._context.extensionUri, "webview-ui", "build"),
        vscode.Uri.joinPath(this._context.extensionUri, "media"),
      ],
    }

    webviewView.webview.html = await this.getHtmlContent(webviewView.webview)

    // Wire the controller's post-message function to this webview
    this._controller.setPostMessageFn(async (msg) => {
      await this.sendToWebview(msg)
    })

    this._setWebviewMessageListener(webviewView.webview)

    // Re-send state when webview becomes visible again
    const visibilityListener = webviewView.onDidChangeVisibility(async () => {
      if (webviewView.visible) {
        await this._controller._detectPrismDir()
      }
    })

    webviewView.onDidDispose(() => {
      visibilityListener.dispose()
      this._disposables.forEach((d) => d.dispose())
      this._disposables = []
    })
  }

  private _setWebviewMessageListener(webview: vscode.Webview): void {
    const disposable = webview.onDidReceiveMessage(async (message: unknown) => {
      await this.handleMessage(message)
    })
    this._disposables.push(disposable)
  }

  async handleMessage(message: unknown): Promise<void> {
    const msg = message as WebviewToExtMessage

    if (msg.type === "grpc_request") {
      await handleGrpcRequest(
        async (response) => await this.sendToWebview(response),
        msg.grpc_request,
      )
    } else if (msg.type === "grpc_request_cancel") {
      this._controller.removeSubscriber(msg.grpc_request_cancel.request_id)
    }
  }

  async sendToWebview(message: unknown): Promise<void> {
    if (this._webviewView) {
      await this._webviewView.webview.postMessage(message)
    }
  }

  /** Send a command directly to the webview (bypasses gRPC). */
  async sendCommandToWebview(command: string, payload?: unknown): Promise<void> {
    await this.sendToWebview({ type: "command", command, payload })
  }

  async getHtmlContent(webview: vscode.Webview): Promise<string> {
    const nonce = getNonce()
    const cspSource = webview.cspSource

    // In production: load bundled assets from webview-ui/build
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "webview-ui", "build", "assets", "main.js"),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "webview-ui", "build", "assets", "index.css"),
    )

    // Use the Vite dev server ONLY if one is actually listening on the port it
    // advertised. A stale `.vite-port` left by a dead dev server resolves to null,
    // so we fall back to the production build instead of rendering a blank webview.
    const devServerUrl = await resolveLiveViteServer(
      this._context.extensionUri.fsPath,
      path.join("webview-ui", ".vite-port"),
    )
    if (devServerUrl) {
      // HMR mode: load from Vite dev server
      return this._getDevHtml(nonce, devServerUrl)
    }

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      font-src ${cspSource} data:;
      style-src ${cspSource} 'unsafe-inline';
      img-src ${cspSource} https: data:;
      script-src 'nonce-${nonce}' 'unsafe-eval';
    "
  />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Prism</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
  }

  private _getDevHtml(nonce: string, devServerUrl: string): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      connect-src ${devServerUrl} ws://localhost:*;
      font-src ${devServerUrl} data:;
      style-src 'unsafe-inline' ${devServerUrl};
      img-src https: data:;
      script-src 'nonce-${nonce}' 'unsafe-eval' ${devServerUrl};
    "
  />
  <title>Prism (Dev)</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" type="module">
    import RefreshRuntime from '${devServerUrl}/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
  </script>
  <script nonce="${nonce}" type="module" src="${devServerUrl}/@vite/client"></script>
  <script nonce="${nonce}" type="module" src="${devServerUrl}/src/main.tsx"></script>
</body>
</html>`
  }
}
