use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Check if a process with the given name is running on the system.
/// Uses `tasklist` on Windows.
#[tauri::command]
fn check_process(name: String) -> bool {
    let output = Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {}*", name)])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            stdout.to_lowercase().contains(&name.to_lowercase())
        }
        Err(_) => false,
    }
}

/// Attempt to run the Antigravity CLI quota command.
/// Returns the raw stdout as a string.
/// If the command fails or is not installed, returns an error.
#[tauri::command]
fn run_antigravity_quota() -> Result<String, String> {
    // Try "agy usage" first
    let result = Command::new("agy")
        .args(["usage"])
        .output();

    match result {
        Ok(out) => {
            if out.status.success() {
                Ok(String::from_utf8_lossy(&out.stdout).to_string())
            } else {
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Antigravity CLI not found: {}", e)),
    }
}

/// Get system resource usage (CPU, RAM) using PowerShell (wmic is deprecated).
#[tauri::command]
fn get_system_stats() -> Result<(u32, u32), String> {
    // Get CPU usage
    let cpu_output = Command::new("powershell")
        .args(["-NoProfile", "-Command", "Get-CimInstance Win32_Processor | Select-Object -ExpandProperty LoadPercentage"])
        .output()
        .map_err(|e| e.to_string())?;

    let cpu_str = String::from_utf8_lossy(&cpu_output.stdout);
    // Grab the last valid number in the output (bypassing any profile banners)
    let cpu: u32 = cpu_str
        .lines()
        .filter_map(|l| l.trim().parse().ok())
        .last()
        .unwrap_or(0);

    // Get RAM usage
    let mem_output = Command::new("powershell")
        .args(["-NoProfile", "-Command", "Get-CimInstance Win32_OperatingSystem | ForEach-Object { \"$($_.FreePhysicalMemory) $($_.TotalVisibleMemorySize)\" }"])
        .output()
        .map_err(|e| e.to_string())?;

    let mem_str = String::from_utf8_lossy(&mem_output.stdout);
    let mut free: u64 = 0;
    let mut total: u64 = 1;
    
    // Find the line that has two numbers
    for line in mem_str.lines() {
        let parts: Vec<&str> = line.trim().split_whitespace().collect();
        if parts.len() == 2 {
            if let (Ok(f), Ok(t)) = (parts[0].parse::<u64>(), parts[1].parse::<u64>()) {
                free = f;
                total = t;
            }
        }
    }
    
    let ram = if total > 0 { ((total - free) * 100 / total) as u32 } else { 0 };

    Ok((cpu, ram))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_process,
            run_antigravity_quota,
            get_system_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
