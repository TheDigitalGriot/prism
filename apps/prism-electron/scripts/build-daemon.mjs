/**
 * build-daemon.mjs — bundles the prism-daemon broker into a single CJS file the
 * desktop forks via Electron utilityProcess.
 *
 * Outputs into apps/prism-electron/daemon-dist/:
 *   - prism-daemon.cjs      the bundled broker (entry = packages/prism-daemon/src/index.ts)
 *   - services.config.json  shipped alongside; the bundle reads it via PRISM_DAEMON_CONFIG
 *   - meta.json             { version } — the version-sync oracle for DaemonManager
 *
 * ws's optional native deps (bufferutil, utf-8-validate) are left external; ws
 * falls back to its pure-JS implementation when they are absent.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const electronRoot = resolve(here, ".."); // apps/prism-electron
const repoRoot = resolve(electronRoot, "..", ".."); // repo root
const daemonPkg = join(repoRoot, "packages", "prism-daemon");
const outDir = join(electronRoot, "daemon-dist");

mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(daemonPkg, "src", "index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: join(outDir, "prism-daemon.cjs"),
  external: ["bufferutil", "utf-8-validate"],
  logLevel: "info",
});

// Ship the service registry config next to the bundle.
copyFileSync(join(daemonPkg, "services.config.json"), join(outDir, "services.config.json"));

// Expected-version oracle for the daemon-manager's version-sync check.
const version = JSON.parse(readFileSync(join(daemonPkg, "package.json"), "utf-8")).version;
writeFileSync(join(outDir, "meta.json"), `${JSON.stringify({ version }, null, 2)}\n`);

console.log(`[build-daemon] bundled prism-daemon v${version} -> ${outDir}`);
