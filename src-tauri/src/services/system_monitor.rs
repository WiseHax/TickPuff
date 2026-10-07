//! CPU / memory via `sysinfo` (no child processes), GPU via the platform layer.

use std::sync::{Arc, Mutex};

use serde::Serialize;
use sysinfo::System;

use crate::platform::gpu::GpuSampler;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    pub cpu_percent: f32,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    /// `None` when GPU utilisation can't be measured on this system.
    pub gpu_percent: Option<f32>,
}

#[derive(Clone)]
pub struct SystemMonitor {
    system: Arc<Mutex<System>>,
    gpu: Arc<Mutex<GpuSampler>>,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let mut system = System::new();
        // CPU usage is a delta between two refreshes; take the first one now.
        system.refresh_cpu_usage();
        Self {
            system: Arc::new(Mutex::new(system)),
            gpu: Arc::new(Mutex::new(GpuSampler::new())),
        }
    }

    pub fn sample(&self) -> SystemStats {
        let (cpu_percent, memory_used_bytes, memory_total_bytes) = {
            let mut system = self.system.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
            system.refresh_cpu_usage();
            system.refresh_memory();
            (system.global_cpu_usage(), system.used_memory(), system.total_memory())
        };
        let gpu_percent = self
            .gpu
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .sample();
        SystemStats {
            cpu_percent: cpu_percent.clamp(0.0, 100.0),
            memory_used_bytes,
            memory_total_bytes,
            gpu_percent,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Reads real values from this machine: `cargo test -- --ignored --nocapture`.
    #[test]
    #[ignore = "reads live system state"]
    fn live_sample() {
        let monitor = SystemMonitor::new();
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        let stats = monitor.sample();
        println!("{stats:?}");
        assert!(stats.memory_total_bytes > 0);
        assert!((0.0..=100.0).contains(&stats.cpu_percent));
    }
}
