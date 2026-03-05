# Dev Tools Detection — Integration Guide

## Cargo.toml dependencies

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
tokio = { version = "1", features = ["full"] }

[target.'cfg(windows)'.dependencies]
winreg = "0.52"
```

## Tauri setup (main.rs / lib.rs)

```rust
mod dev_tools_detection;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            dev_tools_detection::detect_dev_tools,
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
```

## Frontend call (TypeScript)

```typescript
import { invoke } from "@tauri-apps/api/core";

interface DetectedTool {
  name: string;
  version: string | null;
  executable: string | null;
  install_location: string | null;
  install_method: "SystemInstall" | "UserInstall" | "SquirrelInstall" | "NpmGlobal" | "Unknown";
  cli_available: boolean;
  metadata: Record<string, string>;
}

interface DetectionReport {
  cursor: DetectedTool | null;
  claude_code: DetectedTool | null;
  node_available: boolean;
  npm_prefix: string | null;
}

async function detectTools(): Promise<DetectionReport> {
  return await invoke<DetectionReport>("detect_dev_tools");
}

// Example usage in your installer UI
const report = await detectTools();

if (report.cursor) {
  console.log(`Cursor ${report.cursor.version} found at ${report.cursor.install_location}`);
  console.log(`CLI available: ${report.cursor.cli_available}`);
} else {
  console.log("Cursor not installed — offer to install");
}

if (report.claude_code) {
  console.log(`Claude Code ${report.claude_code.version} via ${report.claude_code.install_method}`);
  if (report.claude_code.metadata.node_available === "false") {
    console.warn("Node.js not found — Claude Code won't run");
  }
} else {
  console.log("Claude Code not installed — offer: npm install -g @anthropic-ai/claude-code");
}
```

## Detection priority summary

### Cursor
| Priority | Method | Gives version? | Cross-install-type? |
|----------|--------|---------------|---------------------|
| 1 | Registry `HKLM/HKCU\...\Uninstall` | ✅ | ✅ |
| 2 | Filesystem (`Program Files`, `LocalAppData\Programs`, Squirrel) | via package.json | ✅ |
| 3 | PATH lookup (`where cursor`) → walk up from bin shim | via package.json | ❌ |

### Claude Code
| Priority | Method | Gives version? | Notes |
|----------|--------|---------------|-------|
| 1 | npm prefix → `node_modules/@anthropic-ai/claude-code/package.json` | ✅ | Also checks shims + node availability |
| 2 | Config dir `%APPDATA%\Claude\claude-code\` | version subdir hint | May indicate previous install |

## Extending to more tools

To add VS Code, Windsurf, or other editors, follow the same pattern:

```rust
fn detect_vscode() -> Option<DetectedTool> {
    // 1. Registry: DisplayName == "Microsoft Visual Studio Code"
    //    HKCU or HKLM uninstall keys
    // 2. Filesystem: %LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe
    //    or C:\Program Files\Microsoft VS Code\Code.exe
    // 3. PATH: `where code`
    todo!()
}
```
