import { vi } from "vitest"

/**
 * Jest-compat shim.
 *
 * Some suites under `src/core/api/__tests__/` were written against Jest and call
 * `jest.fn()` / `jest.spyOn()` directly. The runner here is Vitest, whose
 * equivalent is `vi`, so those calls die with "jest is not defined" — 2 of the 22
 * model-policy tests did exactly that (pre-existing; confirmed 2026-09-06 against
 * an unmodified checkout).
 *
 * `vi` is API-compatible for the surface these suites use (`fn`, `spyOn`,
 * `mockResolvedValue`, `clearAllMocks`), so aliasing is enough and avoids
 * rewriting working tests. Prefer `vi` directly in NEW tests.
 */
;(globalThis as unknown as { jest: typeof vi }).jest = vi
