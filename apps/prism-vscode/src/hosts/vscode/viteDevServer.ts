import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';

/**
 * Resolve a *live* Vite dev-server URL for a webview, or `null` to use the
 * production build.
 *
 * Each webview (`webview-ui`, `webview-panel`, `webview-office`) advertises its
 * dev-server port by writing a small file (e.g. `.vite-port`) when `vite dev`
 * starts. The providers previously trusted that file's mere existence — so a
 * stale file left behind by a dead dev server routed the webview at a dead
 * `http://localhost:<port>` and it rendered blank.
 *
 * This helper instead verifies a server is *actually listening* on the
 * advertised port before choosing dev mode. A stale port file (no listener)
 * resolves to `null`, so the caller falls back to the production build.
 *
 * Cross-platform, no child processes. Only does network work when a port file
 * exists, so the common production path (no file) stays synchronous-fast.
 *
 * @param extensionFsPath  `context.extensionUri.fsPath` (extension root)
 * @param portRelPath      port file path relative to the extension root,
 *                         e.g. `path.join('webview-ui', '.vite-port')`
 * @param timeoutMs        max time to wait for the TCP connect probe
 */
export async function resolveLiveViteServer(
  extensionFsPath: string,
  portRelPath: string,
  timeoutMs = 300,
): Promise<string | null> {
  // A production build never wants the dev server.
  if (process.env['IS_PRODUCTION'] === 'true') return null;

  let port: string;
  try {
    port = fs.readFileSync(path.join(extensionFsPath, portRelPath), 'utf-8').trim();
  } catch {
    return null; // no port file → not in dev mode
  }
  if (!/^\d{2,5}$/.test(port)) return null; // empty/garbage file

  const listening = await isPortListening(Number(port), timeoutMs);
  return listening ? `http://localhost:${port}` : null;
}

/** Resolve `true` iff something is accepting TCP connections on 127.0.0.1:port. */
function isPortListening(port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (result: boolean): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, '127.0.0.1');
  });
}
