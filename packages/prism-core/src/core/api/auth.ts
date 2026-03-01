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
