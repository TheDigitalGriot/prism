/**
 * Shared auth interface + validation logic for Anthropic API key management.
 *
 * Both VSCode (using SecretStorage) and Electron (using safeStorage) implement
 * the SecretStore interface and delegate to these shared functions.
 */

// ---------------------------------------------------------------------------
// SecretStore interface — platform-agnostic key/value secret storage
// ---------------------------------------------------------------------------

export interface SecretStore {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const API_KEY_SECRET = 'prism.anthropicApiKey'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validate that a string looks like an Anthropic API key (starts with sk-ant-). */
export function isValidApiKey(key: string): boolean {
  return key.startsWith('sk-ant-') && key.length > 20
}

// ---------------------------------------------------------------------------
// CRUD helpers — work with any SecretStore implementation
// ---------------------------------------------------------------------------

/** Retrieve the stored Anthropic API key, or undefined if not set. */
export async function getApiKey(store: SecretStore): Promise<string | undefined> {
  return store.get(API_KEY_SECRET)
}

/** Store an Anthropic API key in the given store. */
export async function setApiKey(store: SecretStore, key: string): Promise<void> {
  return store.set(API_KEY_SECRET, key)
}

/** Delete the stored Anthropic API key. */
export async function deleteApiKey(store: SecretStore): Promise<void> {
  return store.delete(API_KEY_SECRET)
}

// ---------------------------------------------------------------------------
// Claude auth resolution — subscription (OAuth) preferred, metered key fallback
// ---------------------------------------------------------------------------

/** Env var carrying a Claude Code subscription OAuth token (`claude setup-token`). */
export const OAUTH_TOKEN_ENV = 'CLAUDE_CODE_OAUTH_TOKEN'

/** Beta header required when authenticating the Messages API with an OAuth token. */
export const OAUTH_BETA_HEADER = 'oauth-2025-04-20'

/**
 * Env var that opts INTO the metered Anthropic API-key fallback. Absent/empty
 * means STRICT subscription-only: a Griot tool never silently bills the metered
 * API — a missing subscription token resolves to `none` (an error at use). This
 * is the flag-gated escape hatch, mirroring the Fable 5 flag: metered is a
 * deliberate opt-in, never a silent default. Truthy values: 1/true/yes/on.
 */
export const ALLOW_METERED_ENV = 'GRIOT_ALLOW_METERED'

/** Which credential a request should use. */
export type ResolvedAuth =
  | { mode: 'subscription'; authToken: string }
  | { mode: 'api-key'; apiKey: string }
  | { mode: 'none' }

function flagEnabled(value: string | undefined): boolean {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

/**
 * Decide which Claude credential to authenticate with — STRICT subscription-first.
 *
 * 1. A Claude Code subscription OAuth token (`CLAUDE_CODE_OAUTH_TOKEN`, from
 *    `claude setup-token`) always wins — requests bill against the Max
 *    subscription with no API fees, like the daemon and CLI.
 * 2. The metered API key is used ONLY when the subscription token is absent AND
 *    `GRIOT_ALLOW_METERED` is explicitly set — the flag-gated escape hatch. By
 *    default a Griot tool never silently falls to the metered API.
 * 3. Otherwise `none` — the caller surfaces an actionable error (run
 *    `claude setup-token`) rather than quietly billing the API.
 *
 * @param apiKey Metered API key from secret storage (fallback), if any.
 * @param env    Environment to read from (defaults to process.env).
 */
export function resolveAnthropicAuth(
  apiKey?: string,
  env: Record<string, string | undefined> = typeof process !== 'undefined'
    ? process.env
    : {},
): ResolvedAuth {
  const oauth = env[OAUTH_TOKEN_ENV]?.trim()
  if (oauth) return { mode: 'subscription', authToken: oauth }
  const key = apiKey?.trim()
  if (key && flagEnabled(env[ALLOW_METERED_ENV])) return { mode: 'api-key', apiKey: key }
  return { mode: 'none' }
}
