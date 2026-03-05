//! Development tools detection for the Prism Tauri installer.
//!
//! Detects Cursor IDE and Claude Code CLI installations on Windows,
//! returning structured info (path, version, install method) for each.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};

// ── Data types ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedTool {
    pub name: String,
    pub version: Option<String>,
    pub executable: Option<PathBuf>,
    pub install_location: Option<PathBuf>,
    pub install_method: InstallMethod,
    pub cli_available: bool,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InstallMethod {
    /// InnoSetup installer in Program Files (system-wide)
    SystemInstall,
    /// Per-user install in %LOCALAPPDATA%\Programs
    UserInstall,
    /// Squirrel/auto-update style in %LOCALAPPDATA%
    SquirrelInstall,
    /// Global npm package
    NpmGlobal,
    /// Unknown / manual
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionReport {
    pub cursor: Option<DetectedTool>,
    pub claude_code: Option<DetectedTool>,
    pub node_available: bool,
    pub npm_prefix: Option<PathBuf>,
}

// ── Main entry point ────────────────────────────────────────────────────────

/// Run full detection for all supported dev tools.
/// This is the function you call from your Tauri command.
pub fn detect_all() -> DetectionReport {
    DetectionReport {
        cursor: detect_cursor(),
        claude_code: detect_claude_code(),
        node_available: which_command("node").is_some(),
        npm_prefix: get_npm_prefix(),
    }
}

// ── Cursor detection ────────────────────────────────────────────────────────

fn detect_cursor() -> Option<DetectedTool> {
    // Try detection strategies in order of reliability

    // 1. Registry (most reliable — gives version + path in one shot)
    if let Some(tool) = detect_cursor_from_registry() {
        return Some(tool);
    }

    // 2. Known file system locations
    if let Some(tool) = detect_cursor_from_filesystem() {
        return Some(tool);
    }

    // 3. PATH-based fallback
    if let Some(tool) = detect_cursor_from_path() {
        return Some(tool);
    }

    None
}

fn detect_cursor_from_registry() -> Option<DetectedTool> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hives: &[(winreg::enums::HKEY, &str)] = &[
            (HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
        ];

        for (hive, path) in hives {
            let Ok(uninstall_key) = RegKey::predef(*hive).open_subkey_with_flags(path, KEY_READ) else {
                continue;
            };

            for subkey_name in uninstall_key.enum_keys().filter_map(Result::ok) {
                let Ok(subkey) = uninstall_key.open_subkey_with_flags(&subkey_name, KEY_READ) else {
                    continue;
                };

                let display_name: String = subkey.get_value("DisplayName").unwrap_or_default();
                if !display_name.eq_ignore_ascii_case("cursor") {
                    continue;
                }

                let install_location: String = subkey.get_value("InstallLocation").unwrap_or_default();
                let version: String = subkey.get_value("DisplayVersion").unwrap_or_default();
                let publisher: String = subkey.get_value("Publisher").unwrap_or_default();

                let install_path = PathBuf::from(&install_location);
                let exe_path = install_path.join("Cursor.exe");

                // Determine install method from the path
                let method = if install_location.contains("Program Files") {
                    InstallMethod::SystemInstall
                } else if install_location.contains("AppData\\Local\\Programs") {
                    InstallMethod::UserInstall
                } else if install_location.contains("AppData\\Local") {
                    InstallMethod::SquirrelInstall
                } else {
                    InstallMethod::Unknown
                };

                let cli_path = install_path
                    .join("resources")
                    .join("app")
                    .join("bin")
                    .join("cursor.cmd");

                let mut metadata = HashMap::new();
                metadata.insert("publisher".into(), publisher);
                metadata.insert("registry_key".into(), subkey_name);
                if cli_path.exists() {
                    metadata.insert("cli_path".into(), cli_path.to_string_lossy().into());
                }

                return Some(DetectedTool {
                    name: "Cursor".into(),
                    version: if version.is_empty() { None } else { Some(version) },
                    executable: if exe_path.exists() { Some(exe_path) } else { None },
                    install_location: if install_path.exists() { Some(install_path) } else { None },
                    install_method: method,
                    cli_available: cli_path.exists(),
                    metadata,
                });
            }
        }
    }

    None
}

fn detect_cursor_from_filesystem() -> Option<DetectedTool> {
    // Check known installation paths in priority order
    let candidates = get_cursor_candidate_paths();

    for (base_path, method) in candidates {
        let exe_path = base_path.join("Cursor.exe");
        if !exe_path.exists() {
            continue;
        }

        let cli_path = base_path
            .join("resources")
            .join("app")
            .join("bin")
            .join("cursor.cmd");

        let version = read_cursor_version_from_package_json(&base_path);

        let mut metadata = HashMap::new();
        if cli_path.exists() {
            metadata.insert("cli_path".into(), cli_path.to_string_lossy().into());
        }
        metadata.insert("detection_method".into(), "filesystem".into());

        return Some(DetectedTool {
            name: "Cursor".into(),
            version,
            executable: Some(exe_path),
            install_location: Some(base_path),
            install_method: method,
            cli_available: cli_path.exists(),
            metadata,
        });
    }

    None
}

fn get_cursor_candidate_paths() -> Vec<(PathBuf, InstallMethod)> {
    let mut paths = Vec::new();

    // System-wide (InnoSetup) — what we found on your machine
    paths.push((
        PathBuf::from(r"C:\Program Files\cursor"),
        InstallMethod::SystemInstall,
    ));

    // Per-user install variant
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        paths.push((
            PathBuf::from(&local).join("Programs").join("cursor"),
            InstallMethod::UserInstall,
        ));

        // Squirrel-style (older Cursor versions)
        let squirrel_base = PathBuf::from(&local).join("cursor");
        if squirrel_base.join("Update.exe").exists() {
            // Squirrel puts the actual app in app-X.Y.Z subdirectories
            if let Ok(entries) = std::fs::read_dir(&squirrel_base) {
                let mut app_dirs: Vec<PathBuf> = entries
                    .filter_map(Result::ok)
                    .map(|e| e.path())
                    .filter(|p| {
                        p.is_dir()
                            && p.file_name()
                                .map(|n| n.to_string_lossy().starts_with("app-"))
                                .unwrap_or(false)
                    })
                    .collect();

                // Sort descending so newest version is first
                app_dirs.sort_by(|a, b| b.cmp(a));

                if let Some(latest) = app_dirs.first() {
                    paths.push((latest.clone(), InstallMethod::SquirrelInstall));
                }
            }
        }
    }

    paths
}

fn read_cursor_version_from_package_json(base_path: &Path) -> Option<String> {
    let pkg_path = base_path
        .join("resources")
        .join("app")
        .join("package.json");

    let content = std::fs::read_to_string(pkg_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    json.get("version")
        .and_then(|v| v.as_str())
        .map(String::from)
}

fn detect_cursor_from_path() -> Option<DetectedTool> {
    let cmd_path = which_command("cursor")?;

    // The `cursor` command in PATH is the CLI shim at
    // .../resources/app/bin/cursor — walk up to find the install root
    let install_root = cmd_path
        .parent()? // bin/
        .parent()? // app/
        .parent()? // resources/
        .parent()?; // cursor/

    let exe_path = install_root.join("Cursor.exe");
    let version = read_cursor_version_from_package_json(install_root);

    let mut metadata = HashMap::new();
    metadata.insert("cli_path".into(), cmd_path.to_string_lossy().into());
    metadata.insert("detection_method".into(), "path".into());

    Some(DetectedTool {
        name: "Cursor".into(),
        version,
        executable: if exe_path.exists() {
            Some(exe_path)
        } else {
            None
        },
        install_location: Some(install_root.to_path_buf()),
        install_method: InstallMethod::Unknown,
        cli_available: true,
        metadata,
    })
}

// ── Claude Code detection ───────────────────────────────────────────────────

fn detect_claude_code() -> Option<DetectedTool> {
    // 1. Check npm global install (most common)
    if let Some(tool) = detect_claude_code_npm() {
        return Some(tool);
    }

    // 2. Check config directory existence as a hint
    if let Some(tool) = detect_claude_code_from_config() {
        return Some(tool);
    }

    None
}

fn detect_claude_code_npm() -> Option<DetectedTool> {
    let npm_prefix = get_npm_prefix().or_else(|| {
        // Fallback: standard npm global location on Windows
        std::env::var("APPDATA")
            .ok()
            .map(|appdata| PathBuf::from(appdata).join("npm"))
    })?;

    let package_json_path = npm_prefix
        .join("node_modules")
        .join("@anthropic-ai")
        .join("claude-code")
        .join("package.json");

    if !package_json_path.exists() {
        return None;
    }

    // Parse version from package.json
    let version = std::fs::read_to_string(&package_json_path)
        .ok()
        .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
        .and_then(|json| json.get("version").and_then(|v| v.as_str()).map(String::from));

    // Check which shims exist
    let cmd_shim = npm_prefix.join("claude.cmd");
    let ps1_shim = npm_prefix.join("claude.ps1");
    let bash_shim = npm_prefix.join("claude");
    let cli_js = npm_prefix
        .join("node_modules")
        .join("@anthropic-ai")
        .join("claude-code")
        .join("cli.js");

    let cli_available = cmd_shim.exists() || ps1_shim.exists() || bash_shim.exists();

    let mut metadata = HashMap::new();
    metadata.insert("npm_prefix".into(), npm_prefix.to_string_lossy().into());
    metadata.insert("detection_method".into(), "npm_global".into());

    if cmd_shim.exists() {
        metadata.insert("cmd_shim".into(), cmd_shim.to_string_lossy().into());
    }
    if ps1_shim.exists() {
        metadata.insert("ps1_shim".into(), ps1_shim.to_string_lossy().into());
    }
    if cli_js.exists() {
        metadata.insert("entry_point".into(), cli_js.to_string_lossy().into());
    }

    // Check for Claude Code config directory
    if let Ok(appdata) = std::env::var("APPDATA") {
        let config_dir = PathBuf::from(&appdata).join("Claude").join("claude-code");
        if config_dir.exists() {
            metadata.insert("config_dir".into(), config_dir.to_string_lossy().into());
        }
    }

    // Check node availability (Claude Code won't run without it)
    let node_version = get_command_output("node", &["--version"]);
    if let Some(nv) = &node_version {
        metadata.insert("node_version".into(), nv.clone());
    }
    metadata.insert(
        "node_available".into(),
        node_version.is_some().to_string(),
    );

    Some(DetectedTool {
        name: "Claude Code".into(),
        version,
        executable: if cmd_shim.exists() {
            Some(cmd_shim)
        } else if ps1_shim.exists() {
            Some(ps1_shim)
        } else {
            None
        },
        install_location: Some(
            npm_prefix
                .join("node_modules")
                .join("@anthropic-ai")
                .join("claude-code"),
        ),
        install_method: InstallMethod::NpmGlobal,
        cli_available,
        metadata,
    })
}

fn detect_claude_code_from_config() -> Option<DetectedTool> {
    // If we didn't find it via npm, check for the config directory alone.
    // This could mean it was installed and removed, or installed via a
    // different method (e.g., standalone binary in the future).
    let appdata = std::env::var("APPDATA").ok()?;
    let config_dir = PathBuf::from(&appdata).join("Claude").join("claude-code");

    if !config_dir.exists() {
        return None;
    }

    // Try to find the highest version subdirectory for a version hint
    let version = std::fs::read_dir(&config_dir)
        .ok()?
        .filter_map(Result::ok)
        .filter(|e| e.path().is_dir())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            // Version dirs look like "2.1.51"
            if name.chars().next()?.is_ascii_digit() {
                Some(name)
            } else {
                None
            }
        })
        .max(); // Lexicographic max works for semver when major is single digit

    let mut metadata = HashMap::new();
    metadata.insert("config_dir".into(), config_dir.to_string_lossy().into());
    metadata.insert("detection_method".into(), "config_dir_only".into());
    metadata.insert("warning".into(), "Package not found via npm — may be uninstalled or installed via a non-standard method".into());

    Some(DetectedTool {
        name: "Claude Code".into(),
        version,
        executable: None,
        install_location: None,
        install_method: InstallMethod::Unknown,
        cli_available: false,
        metadata,
    })
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/// Locate a command on PATH (equivalent to `where.exe` / `which`)
fn which_command(name: &str) -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("where.exe")
            .arg(name)
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .next()
                .map(|line| PathBuf::from(line.trim()))
        } else {
            None
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("which")
            .arg(name)
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .next()
                .map(|line| PathBuf::from(line.trim()))
        } else {
            None
        }
    }
}

fn get_command_output(cmd: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(cmd).args(args).output().ok()?;
    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        None
    }
}

fn get_npm_prefix() -> Option<PathBuf> {
    let output = get_command_output("npm", &["config", "get", "prefix"])?;
    let path = PathBuf::from(&output);
    if path.exists() {
        Some(path)
    } else {
        None
    }
}

// ── Tauri command ───────────────────────────────────────────────────────────

/// Expose as a Tauri command for your frontend to call.
///
/// ```rust
/// // In your main.rs or lib.rs:
/// fn main() {
///     tauri::Builder::default()
///         .invoke_handler(tauri::generate_handler![detect_dev_tools])
///         .run(tauri::generate_context!())
///         .expect("error running tauri app");
/// }
/// ```
#[tauri::command]
pub async fn detect_dev_tools() -> Result<DetectionReport, String> {
    // Run detection off the main thread
    let report = tokio::task::spawn_blocking(detect_all)
        .await
        .map_err(|e| format!("Detection task failed: {e}"))?;
    Ok(report)
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_all_runs_without_panic() {
        let report = detect_all();
        // Should always return a report, even if nothing is found
        println!("Node available: {}", report.node_available);
        println!("npm prefix: {:?}", report.npm_prefix);

        if let Some(cursor) = &report.cursor {
            println!("Cursor found: {:?}", cursor.version);
            println!("  exe: {:?}", cursor.executable);
            println!("  method: {:?}", cursor.install_method);
            println!("  cli: {}", cursor.cli_available);
        } else {
            println!("Cursor not found");
        }

        if let Some(claude) = &report.claude_code {
            println!("Claude Code found: {:?}", claude.version);
            println!("  exe: {:?}", claude.executable);
            println!("  method: {:?}", claude.install_method);
            println!("  cli: {}", claude.cli_available);
            println!("  node: {:?}", claude.metadata.get("node_available"));
        } else {
            println!("Claude Code not found");
        }
    }

    #[test]
    fn test_cursor_candidate_paths_are_valid() {
        let paths = get_cursor_candidate_paths();
        assert!(!paths.is_empty(), "Should have at least one candidate path");
        // The Program Files path should always be present
        assert!(paths
            .iter()
            .any(|(p, _)| p.to_string_lossy().contains("Program Files")));
    }

    #[test]
    fn test_install_method_serializes() {
        let json = serde_json::to_string(&InstallMethod::NpmGlobal).unwrap();
        assert!(json.contains("NpmGlobal"));
    }
}
