---
date: 2026-03-08
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Authentication System Architecture"
tags: [research, auth, secret-storage, api-key, electron, vscode]
status: complete
---

# Research: Authentication System Architecture

## Research Question

"I need to add a new authentication system to this project. Help me figure out the right approach using the Prism workflow."

## Prism Workflow Execution

### Phase Selection

Per the Prism skill (`skills/prism/SKILL.md`), the workflow selection table indicates:

| Scenario | Phases |
|----------|--------|
| New feature, unfamiliar codebase | Full R->P->I->V |

Since adding a new authentication system is a significant feature, the **full Research -> Plan -> Implement -> Validate** workflow applies.

### Step 1: Check for Existing Work (Prism Locator)

Searched `.prism/shared/research/` and `.prism/shared/plans/` for any existing auth-related artifacts. **No prior research or plans exist** for authentication. Per the workflow: "Nothing exists -> Start with Research."

### Step 2: Research Phase Executed

The following agents were simulated in parallel per the `/prism-research` skill:

| Agent | Task | Findings |
|-------|------|----------|
| `prism-locator` | Find existing research about authentication | No existing auth research in `.prism/shared/` |
| `codebase-locator` | Find files related to auth, tokens, credentials | 7 files discovered (see below) |
| `codebase-analyzer` | Analyze auth components, trace data flow | Full analysis below |
| `codebase-pattern-finder` | Find patterns for secret storage, API key management | SecretStore interface pattern identified |

## Summary

The project already has a **complete Anthropic API key authentication system** using a platform-agnostic `SecretStore` interface in `packages/prism-core/src/core/api/auth.ts`, with two implementations: VSCode's `SecretStorage` API and Electron's `safeStorage` API. Any new authentication system should extend this existing architecture rather than replace it.

## Files Discovered

| File | Purpose |
|------|---------|
| `packages/prism-core/src/core/api/auth.ts` | Shared `SecretStore` interface + API key CRUD helpers |
| `cmd/prism-vscode/src/core/api/auth.ts` | VSCode adapter: wraps `vscode.ExtensionContext.secrets` as `SecretStore` |
| `cmd/prism-vscode/src/core/api/claude-sdk.ts` | `PrismApiHandler` — consumes API key to create Anthropic client |
| `cmd/prism-electron/src/auth/ElectronSecretStorage.ts` | Electron adapter: wraps `safeStorage` API as `SecretStore` |
| `cmd/prism-electron/src/hosts/electron/ElectronIPCBridge.ts` | Wires auth IPC handlers (get/set/delete API key) |
| `packages/prism-core/src/core/controller/BasePrismController.ts` | Shared controller base class (no direct auth, delegates to platform) |
| `packages/prism-core/src/shared/PrismState.ts` | Extension state — no auth fields currently broadcast to webview |

## Component Analysis

### SecretStore Interface (Shared Core)

**Location**: `packages/prism-core/src/core/api/auth.ts`

**How it works**:
- Defines `SecretStore` interface at line 12: `get(key)`, `set(key, value)`, `delete(key)`
- Provides CRUD helpers: `getApiKey()` (line 38), `setApiKey()` (line 43), `deleteApiKey()` (line 48)
- Validates API key format: `isValidApiKey()` (line 29) checks for `sk-ant-` prefix and minimum length
- Uses constant `API_KEY_SECRET = 'prism.anthropicApiKey'` (line 22) as the storage key

**Data flow**:
```
Platform SecretStore impl -> auth.ts CRUD helpers -> PrismApiHandler (claude-sdk.ts)
```

### VSCode Auth Adapter

**Location**: `cmd/prism-vscode/src/core/api/auth.ts`

**How it works**:
- `makeVscodeStore()` (line 19) wraps `vscode.ExtensionContext.secrets` into a `SecretStore`
- Re-exports `getApiKey`, `setApiKey`, `deleteApiKey` with `vscode.ExtensionContext` as the argument
- `promptForApiKey()` (line 54) shows a VSCode input box with validation, stores key on success

**Connections**:
- Imports from: `@prism-core/core/api/auth` (the shared interface)
- Used by: `cmd/prism-vscode/src/core/task/index.ts` (PrismTask needs API key to construct PrismApiHandler)

### Electron Auth Adapter

**Location**: `cmd/prism-electron/src/auth/ElectronSecretStorage.ts`

**How it works**:
- `ElectronSecretStorage` class (line 17) implements `SecretStore`
- Stores encrypted JSON map at `<userData>/prism-secrets.enc` using Electron's `safeStorage` API
- Read cycle: `_readMap()` (line 50) decrypts file -> JSON.parse -> returns map
- Write cycle: `_writeMap()` (line 64) JSON.stringify -> encrypt -> write file
- Fallback: plaintext `.plain.json` file when `safeStorage.isEncryptionAvailable()` is false (CI/headless)

**Connections**:
- Implements: `SecretStore` from `@prism-core/core/api/auth`
- Used by: `ElectronIPCBridge` (line 71) which creates the instance and wires IPC handlers

### ElectronIPCBridge Auth Wiring

**Location**: `cmd/prism-electron/src/hosts/electron/ElectronIPCBridge.ts`

**How it works**:
- Imports `getApiKey`, `setApiKey`, `deleteApiKey`, `isValidApiKey` from `@prism-core/core/api/auth` (line 17)
- Creates `ElectronSecretStorage` instance in constructor (line 78)
- Exposes IPC handlers for renderer process to manage API keys

### PrismApiHandler (API Consumer)

**Location**: `cmd/prism-vscode/src/core/api/claude-sdk.ts`

**How it works**:
- Constructor (line 42) accepts `apiKey: string` and creates `new Anthropic({ apiKey })`
- `createMessage()` (line 55) streams messages via the Anthropic SDK
- `buildApiHandler()` (line 151) is a convenience factory

**Data flow**:
```
User enters API key -> SecretStore.set() -> stored securely
Chat request -> SecretStore.get() -> PrismApiHandler constructor -> Anthropic SDK -> API call
```

## Patterns Found

### Platform-Agnostic Interface Pattern

**Example at**: `packages/prism-core/src/core/api/auth.ts:12-16`

```typescript
export interface SecretStore {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}
```

**Also used in**:
- `cmd/prism-vscode/src/core/api/auth.ts:19` (VSCode adapter)
- `cmd/prism-electron/src/auth/ElectronSecretStorage.ts:17` (Electron adapter)

This pattern is the canonical approach in this codebase: define a shared interface in `packages/prism-core`, implement platform-specific adapters in `cmd/prism-vscode` and `cmd/prism-electron`.

### Encrypted-with-Plaintext-Fallback Pattern

**Example at**: `cmd/prism-electron/src/auth/ElectronSecretStorage.ts:50-61`

The Electron adapter checks `safeStorage.isEncryptionAvailable()` and falls back to plaintext JSON in headless/CI environments. New auth mechanisms should follow this same graceful degradation pattern.

## Architecture Notes

- **Pattern**: Shared interface in `prism-core` + platform adapters in `cmd/*`
- **Convention**: Auth secrets stored via OS-level credential APIs (Keychain/DPAPI/libsecret)
- **Decision**: API key validation uses prefix matching (`sk-ant-`) not server-side verification
- **Observation**: `PrismExtensionState` does not include any auth status fields -- the webview cannot currently show whether the user is authenticated
- **Observation**: The current system only stores a single secret (`prism.anthropicApiKey`). The `SecretStore` interface is generic enough to support multiple keys.
- **Observation**: No user accounts, OAuth flows, JWT tokens, or session management exist. Auth is purely "provide your own API key."

## Open Questions

- [ ] What kind of authentication system is needed? (OAuth, user accounts, team/org auth, additional API providers, multi-key management?)
- [ ] Should the webview display auth status? (Currently `PrismExtensionState` has no auth fields)
- [ ] Is multi-provider support needed? (e.g., OpenAI, Google keys in addition to Anthropic)
- [ ] Should there be a server-side component, or remain fully client-side?
- [ ] Does the CLI (`cmd/prism-cli/`) need auth support? (Currently Go-based, no auth)
- [ ] Should API key validation call the Anthropic API to verify the key, rather than just checking the prefix?

## Recommended Next Steps (Prism Workflow)

Per the Prism workflow, now that Research is complete:

1. **Clarify requirements**: Answer the open questions above to scope the authentication system
2. **Run `/prism-plan`**: Create an interactive plan based on clarified requirements
3. **Plan should address**:
   - Which `SecretStore` keys to add
   - Whether `PrismExtensionState` needs auth fields
   - Platform-specific implementations needed (VSCode, Electron, CLI)
   - Whether external dependencies (OAuth libraries, etc.) are required
4. **Run `/prism-implement`**: Execute the plan phase by phase
5. **Run `/prism-validate`**: Verify against success criteria

## Code References

| Reference | Description |
|-----------|-------------|
| `packages/prism-core/src/core/api/auth.ts:12-16` | `SecretStore` interface definition |
| `packages/prism-core/src/core/api/auth.ts:22` | `API_KEY_SECRET` constant |
| `packages/prism-core/src/core/api/auth.ts:29` | `isValidApiKey()` validation |
| `packages/prism-core/src/core/api/auth.ts:38-49` | CRUD helpers (get/set/delete API key) |
| `cmd/prism-vscode/src/core/api/auth.ts:19-25` | VSCode `SecretStore` adapter |
| `cmd/prism-vscode/src/core/api/auth.ts:54-76` | `promptForApiKey()` UI flow |
| `cmd/prism-vscode/src/core/api/claude-sdk.ts:42` | API key consumed by `PrismApiHandler` |
| `cmd/prism-electron/src/auth/ElectronSecretStorage.ts:17-102` | Electron `SecretStore` implementation |
| `cmd/prism-electron/src/hosts/electron/ElectronIPCBridge.ts:17-20` | Auth import wiring |
| `packages/prism-core/src/shared/PrismState.ts:11-82` | Extension state (no auth fields) |
| `packages/prism-core/src/core/controller/BasePrismController.ts:60` | Base controller (delegates auth to platform) |

## Process Log

| Step | Action | Tool/Agent | Result |
|------|--------|------------|--------|
| 1 | Read `skills/prism/SKILL.md` | Read | Identified full R->P->I->V workflow needed |
| 2 | Check existing work | Glob + Grep on `.prism/shared/` | No existing auth research/plans found |
| 3 | Locate auth code | Grep for auth/token/credential patterns | Found 7 key files across 3 packages |
| 4 | Analyze shared core | Read `prism-core/auth.ts` | Documented `SecretStore` interface + CRUD helpers |
| 5 | Analyze VSCode adapter | Read `prism-vscode/auth.ts` | Documented VSCode `SecretStorage` wrapper |
| 6 | Analyze Electron adapter | Read `ElectronSecretStorage.ts` | Documented `safeStorage` implementation |
| 7 | Analyze API consumer | Read `claude-sdk.ts` | Documented `PrismApiHandler` key usage |
| 8 | Trace IPC wiring | Read `ElectronIPCBridge.ts` | Documented how auth flows through IPC |
| 9 | Check state model | Read `PrismState.ts` | Confirmed no auth fields in webview state |
| 10 | Synthesize findings | Write research document | This file |
