/**
 * API key management via VS Code SecretStorage.
 *
 * The Anthropic API key is stored securely in VS Code's SecretStorage,
 * which is OS-level credential storage (Keychain / Windows Credential Store).
 */
import * as vscode from "vscode"

const API_KEY_SECRET = "prism.anthropicApiKey"

/** Retrieve the stored Anthropic API key, or undefined if not set. */
export async function getApiKey(
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  return context.secrets.get(API_KEY_SECRET)
}

/** Store an Anthropic API key in SecretStorage. */
export async function setApiKey(
  context: vscode.ExtensionContext,
  key: string,
): Promise<void> {
  await context.secrets.store(API_KEY_SECRET, key)
}

/** Delete the stored Anthropic API key. */
export async function deleteApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(API_KEY_SECRET)
}

/** Validate that a string looks like an Anthropic API key (starts with sk-ant-). */
export function isValidApiKey(key: string): boolean {
  return key.startsWith("sk-ant-") && key.length > 20
}

/**
 * Prompt the user to enter their Anthropic API key via VS Code input box.
 * Returns the key, or undefined if cancelled.
 */
export async function promptForApiKey(
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  const key = await vscode.window.showInputBox({
    title: "Prism: Anthropic API Key",
    prompt: "Enter your Anthropic API key (starts with sk-ant-)",
    placeHolder: "sk-ant-...",
    ignoreFocusOut: true,
    password: true,
    validateInput: (value) => {
      if (!value) return "API key is required"
      if (!isValidApiKey(value)) return "Invalid API key format — must start with sk-ant-"
      return undefined
    },
  })

  if (key) {
    await setApiKey(context, key)
    vscode.window.showInformationMessage("Prism: API key saved securely.")
  }

  return key
}
