//! Detects Antigravity and Claude Code without running them.
//!
//! Only the process table and well-known install locations are inspected.
//! Each tool is classified independently; one is never inferred from the other.

use std::{
    env,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

use serde::Serialize;
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System, UpdateKind};

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AntigravityReport {
    pub ide_running: bool,
    pub cli_running: bool,
    pub installed: bool,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeCodeReport {
    pub running: bool,
    pub installed: bool,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiDetectionReport {
    pub antigravity: AntigravityReport,
    pub claude_code: ClaudeCodeReport,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DetectedTool {
    AntigravityIde,
    AntigravityCli,
    ClaudeCode,
}

/// Normalized view of one process used for classification.
pub struct ProcessView<'a> {
    /// Lower-case executable name, e.g. `claude.exe`.
    pub name: &'a str,
    /// Lower-case executable path with `/` separators, when readable.
    pub exe: Option<&'a str>,
    /// Lower-case command line joined with spaces.
    pub cmd: &'a str,
}

/// Install locations of the Claude *desktop app*, which ships an executable
/// also called `claude.exe` and must not be mistaken for Claude Code.
const CLAUDE_DESKTOP_MARKERS: &[&str] = &["/windowsapps/claude_", "/anthropicclaude/", "/claude.app/"];

pub fn classify(process: &ProcessView) -> Option<DetectedTool> {
    match process.name {
        "antigravity.exe" | "antigravity ide.exe" | "antigravity" => Some(DetectedTool::AntigravityIde),
        "agy.exe" | "agy" => Some(DetectedTool::AntigravityCli),
        "claude.exe" | "claude" => {
            // Without a readable path we can't tell the desktop app apart; don't guess.
            let exe = process.exe?;
            if CLAUDE_DESKTOP_MARKERS.iter().any(|marker| exe.contains(marker)) {
                None
            } else {
                Some(DetectedTool::ClaudeCode)
            }
        }
        // npm installs run Claude Code through Node.
        "node.exe" | "node" if process.cmd.contains("@anthropic-ai/claude-code") => Some(DetectedTool::ClaudeCode),
        _ => None,
    }
}

#[derive(Clone)]
pub struct AiDetector {
    system: Arc<Mutex<System>>,
}

impl AiDetector {
    pub fn new() -> Self {
        Self {
            system: Arc::new(Mutex::new(System::new())),
        }
    }

    pub fn detect(&self) -> AiDetectionReport {
        let mut report = AiDetectionReport::default();
        {
            let mut system = self.system.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
            system.refresh_processes_specifics(
                ProcessesToUpdate::All,
                true,
                ProcessRefreshKind::nothing()
                    .with_exe(UpdateKind::OnlyIfNotSet)
                    .with_cmd(UpdateKind::OnlyIfNotSet),
            );
            for process in system.processes().values() {
                let name = process.name().to_string_lossy().to_lowercase();
                let exe = process
                    .exe()
                    .map(|path| path.to_string_lossy().to_lowercase().replace('\\', "/"));
                let cmd = if name.starts_with("node") {
                    process
                        .cmd()
                        .iter()
                        .map(|arg| arg.to_string_lossy().to_lowercase().replace('\\', "/"))
                        .collect::<Vec<_>>()
                        .join(" ")
                } else {
                    String::new()
                };
                let view = ProcessView {
                    name: &name,
                    exe: exe.as_deref(),
                    cmd: &cmd,
                };
                match classify(&view) {
                    Some(DetectedTool::AntigravityIde) => report.antigravity.ide_running = true,
                    Some(DetectedTool::AntigravityCli) => report.antigravity.cli_running = true,
                    Some(DetectedTool::ClaudeCode) => report.claude_code.running = true,
                    None => {}
                }
            }
        }
        report.antigravity.installed = antigravity_installed();
        report.claude_code.installed = claude_code_installed();
        report
    }
}

fn env_path(var: &str) -> Option<PathBuf> {
    env::var_os(var).map(PathBuf::from)
}

/// Whether an executable with one of `names` exists in a PATH directory.
fn on_path(names: &[&str]) -> bool {
    let Some(path) = env::var_os("PATH") else {
        return false;
    };
    env::split_paths(&path).any(|dir| names.iter().any(|name| dir.join(name).is_file()))
}

fn any_exists(paths: impl IntoIterator<Item = Option<PathBuf>>) -> bool {
    paths.into_iter().flatten().any(|path| path.exists())
}

fn under(base: Option<PathBuf>, relative: &str) -> Option<PathBuf> {
    base.map(|base| base.join(Path::new(relative)))
}

fn antigravity_installed() -> bool {
    let local = env_path("LOCALAPPDATA");
    any_exists([
        under(local.clone(), "Programs/Antigravity/Antigravity.exe"),
        under(local.clone(), "Programs/Antigravity IDE/Antigravity IDE.exe"),
        under(local, "agy/bin/agy.exe"),
    ]) || on_path(&["agy.exe", "agy", "antigravity.exe", "antigravity"])
}

fn claude_code_installed() -> bool {
    let home = env_path("USERPROFILE").or_else(|| env_path("HOME"));
    any_exists([
        under(home.clone(), ".local/bin/claude.exe"),
        under(home, ".local/bin/claude"),
        // Claude Code bundled with the Claude desktop app.
        under(env_path("APPDATA"), "Claude/claude-code"),
    ]) || on_path(&["claude.exe", "claude.cmd", "claude"])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn view<'a>(name: &'a str, exe: Option<&'a str>, cmd: &'a str) -> ProcessView<'a> {
        ProcessView { name, exe, cmd }
    }

    #[test]
    fn claude_desktop_app_is_not_claude_code() {
        let msix = view(
            "claude.exe",
            Some("c:/program files/windowsapps/claude_2.26454.0.0_x64__pzs8sxrjxfjjc/app/claude.exe"),
            "",
        );
        let squirrel = view(
            "claude.exe",
            Some("c:/users/u/appdata/local/anthropicclaude/app-0.9.0/claude.exe"),
            "",
        );
        let mac = view("claude", Some("/applications/claude.app/contents/macos/claude"), "");
        assert_eq!(classify(&msix), None);
        assert_eq!(classify(&squirrel), None);
        assert_eq!(classify(&mac), None);
    }

    #[test]
    fn claude_code_binaries_are_detected() {
        let native = view("claude.exe", Some("c:/users/u/.local/bin/claude.exe"), "");
        let bundled = view(
            "claude.exe",
            Some("c:/users/u/appdata/roaming/claude/claude-code/2.1.289/abc/claude.exe"),
            "",
        );
        let npm = view(
            "node.exe",
            Some("c:/program files/nodejs/node.exe"),
            "node c:/npm/node_modules/@anthropic-ai/claude-code/cli.js",
        );
        assert_eq!(classify(&native), Some(DetectedTool::ClaudeCode));
        assert_eq!(classify(&bundled), Some(DetectedTool::ClaudeCode));
        assert_eq!(classify(&npm), Some(DetectedTool::ClaudeCode));
    }

    #[test]
    fn unreadable_claude_path_is_not_guessed() {
        assert_eq!(classify(&view("claude.exe", None, "")), None);
    }

    #[test]
    fn antigravity_ide_and_cli_are_separate() {
        assert_eq!(
            classify(&view("antigravity.exe", None, "")),
            Some(DetectedTool::AntigravityIde)
        );
        assert_eq!(
            classify(&view("antigravity ide.exe", None, "")),
            Some(DetectedTool::AntigravityIde)
        );
        assert_eq!(classify(&view("agy.exe", None, "")), Some(DetectedTool::AntigravityCli));
    }

    #[test]
    fn unrelated_processes_are_ignored() {
        assert_eq!(classify(&view("node.exe", None, "node server.js")), None);
        assert_eq!(classify(&view("code.exe", Some("c:/vscode/code.exe"), "")), None);
        assert_eq!(classify(&view("claudette.exe", Some("c:/x/claudette.exe"), "")), None);
    }
}

#[cfg(test)]
mod live {
    /// Prints what this machine reports: `cargo test -- --ignored --nocapture`.
    #[test]
    #[ignore = "reads live process table"]
    fn live_detection() {
        println!("{:?}", super::AiDetector::new().detect());
    }
}
