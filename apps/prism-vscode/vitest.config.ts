import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

/**
 * Vitest config for the prism-vscode unit suites.
 *
 * WHY THIS EXISTS: `src/core/api/__tests__/*.test.ts` import through the
 * `@prism-core/*` and `@shared/*` aliases declared in tsconfig.json. Vitest does
 * NOT read tsconfig `paths`, so without this file every one of those suites fails
 * at import time with "Failed to load url @prism-core/... Does the file exist?" —
 * i.e. the tests for the Arkestra policy module, the Fable gate and the auth
 * resolver could not run AT ALL. Confirmed pre-existing on 2026-09-06 by running
 * the suite against an unmodified checkout.
 *
 * The aliases mirror tsconfig.json exactly; keep the two in sync.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@prism-core": fileURLToPath(new URL("../../packages/prism-core/src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
    },
  },
  test: {
    // The suites call describe/it/expect/afterAll WITHOUT importing them, so the
    // globals must be injected or every file dies at "afterAll is not defined".
    globals: true,
    // Aliases `jest` -> `vi` for the suites written against Jest. See the file.
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/out/**",
      "webview-ui/**",
      // fable-gate imports the `vscode` module, which only exists inside the
      // extension host. It belongs to the `vscode-test` runner (package.json
      // "test"), not this node runner — excluded here so a genuinely
      // host-dependent suite does not read as a failure of the unit suites.
      "**/fable-gate.test.ts",
    ],
  },
})
