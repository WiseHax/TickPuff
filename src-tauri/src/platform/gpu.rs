//! GPU utilisation.
//!
//! Windows: the "GPU Engine" performance counters (the same source Task
//! Manager uses). Elsewhere: unsupported, reported as `None`.

use std::collections::HashMap;

/// Combine per-process, per-engine samples into one utilisation figure.
///
/// Instance names look like `pid_1234_luid_0x0_0xD1B8_phys_0_eng_3_engtype_3D`.
/// Usage is summed per physical engine across processes; the busiest engine
/// is the GPU's utilisation (Task Manager's definition).
pub fn aggregate_engine_utilization<I>(samples: I) -> Option<f32>
where
    I: IntoIterator<Item = (String, f64)>,
{
    let mut engines: HashMap<String, f64> = HashMap::new();
    for (name, value) in samples {
        let engine = match name.find("luid_") {
            Some(index) => name[index..].to_string(),
            None => name,
        };
        *engines.entry(engine).or_default() += value.max(0.0);
    }
    if engines.is_empty() {
        return None;
    }
    let busiest = engines.values().copied().fold(0.0_f64, f64::max);
    Some(busiest.min(100.0) as f32)
}

#[cfg(windows)]
pub use windows_impl::GpuSampler;

#[cfg(not(windows))]
pub struct GpuSampler;

#[cfg(not(windows))]
impl GpuSampler {
    pub fn new() -> Self {
        Self
    }

    pub fn sample(&mut self) -> Option<f32> {
        None
    }
}

#[cfg(windows)]
mod windows_impl {
    use std::{mem::size_of, thread, time::Duration};

    use windows::{
        core::{w, PCWSTR},
        Win32::System::Performance::{
            PdhAddEnglishCounterW, PdhCloseQuery, PdhCollectQueryData, PdhGetFormattedCounterArrayW, PdhOpenQueryW,
            PDH_CSTATUS_VALID_DATA, PDH_FMT_COUNTERVALUE_ITEM_W, PDH_FMT_DOUBLE, PDH_HCOUNTER, PDH_HQUERY,
            PDH_MORE_DATA,
        },
    };

    use super::aggregate_engine_utilization;

    const ERROR_SUCCESS: u32 = 0;

    struct PdhGpuQuery {
        query: PDH_HQUERY,
        counter: PDH_HCOUNTER,
    }

    // PDH handles are plain handles that may be used from any thread; access
    // is serialized by the Mutex in SystemMonitor.
    unsafe impl Send for PdhGpuQuery {}

    impl PdhGpuQuery {
        fn open() -> Option<Self> {
            // SAFETY: out-pointers reference live locals; handles are closed on failure / drop.
            unsafe {
                let mut query = PDH_HQUERY::default();
                if PdhOpenQueryW(PCWSTR::null(), 0, &mut query) != ERROR_SUCCESS {
                    return None;
                }
                let mut counter = PDH_HCOUNTER::default();
                let path = w!("\\GPU Engine(*)\\Utilization Percentage");
                if PdhAddEnglishCounterW(query, path, 0, &mut counter) != ERROR_SUCCESS {
                    PdhCloseQuery(query);
                    return None;
                }
                // Rate counters need a previous sample.
                PdhCollectQueryData(query);
                Some(Self { query, counter })
            }
        }

        fn read(&mut self) -> Option<f32> {
            // SAFETY: the buffer is sized from PDH's reported byte count and
            // aligned for PDH_FMT_COUNTERVALUE_ITEM_W; PDH writes `count` items
            // followed by their name strings inside that buffer.
            unsafe {
                if PdhCollectQueryData(self.query) != ERROR_SUCCESS {
                    return None;
                }
                for _ in 0..3 {
                    let mut size = 0u32;
                    let mut count = 0u32;
                    let status =
                        PdhGetFormattedCounterArrayW(self.counter, PDH_FMT_DOUBLE, &mut size, &mut count, None);
                    if status != PDH_MORE_DATA {
                        return None;
                    }
                    let item_size = size_of::<PDH_FMT_COUNTERVALUE_ITEM_W>();
                    let mut buffer: Vec<PDH_FMT_COUNTERVALUE_ITEM_W> =
                        Vec::with_capacity((size as usize).div_ceil(item_size) + 1);
                    let status = PdhGetFormattedCounterArrayW(
                        self.counter,
                        PDH_FMT_DOUBLE,
                        &mut size,
                        &mut count,
                        Some(buffer.as_mut_ptr()),
                    );
                    if status == PDH_MORE_DATA {
                        continue; // instances appeared between calls
                    }
                    if status != ERROR_SUCCESS {
                        return None;
                    }
                    let items = std::slice::from_raw_parts(buffer.as_ptr(), count as usize);
                    let samples = items
                        .iter()
                        .filter(|item| item.FmtValue.CStatus == PDH_CSTATUS_VALID_DATA)
                        .map(|item| {
                            (
                                item.szName.to_string().unwrap_or_default(),
                                item.FmtValue.Anonymous.doubleValue,
                            )
                        });
                    return aggregate_engine_utilization(samples.collect::<Vec<_>>());
                }
                None
            }
        }
    }

    impl Drop for PdhGpuQuery {
        fn drop(&mut self) {
            // SAFETY: the query handle came from PdhOpenQueryW and is closed once.
            unsafe {
                PdhCloseQuery(self.query);
            }
        }
    }

    /// Lazily opened GPU counter query. If the counters don't exist (old
    /// drivers, some VMs) it stops trying and reports `None`.
    pub struct GpuSampler {
        query: Option<PdhGpuQuery>,
        unsupported: bool,
    }

    impl GpuSampler {
        pub fn new() -> Self {
            Self {
                query: None,
                unsupported: false,
            }
        }

        pub fn sample(&mut self) -> Option<f32> {
            if self.unsupported {
                return None;
            }
            if self.query.is_none() {
                match PdhGpuQuery::open() {
                    Some(query) => {
                        self.query = Some(query);
                        // Give the first rate sample a short window.
                        thread::sleep(Duration::from_millis(250));
                    }
                    None => {
                        self.unsupported = true;
                        return None;
                    }
                }
            }
            self.query.as_mut().and_then(PdhGpuQuery::read)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::aggregate_engine_utilization;

    fn sample(name: &str, value: f64) -> (String, f64) {
        (name.to_string(), value)
    }

    #[test]
    fn sums_processes_per_engine_and_takes_the_busiest() {
        let samples = vec![
            sample("pid_1_luid_0x0_0x1_phys_0_eng_0_engtype_3D", 20.0),
            sample("pid_2_luid_0x0_0x1_phys_0_eng_0_engtype_3D", 15.0),
            sample("pid_1_luid_0x0_0x1_phys_0_eng_3_engtype_VideoDecode", 30.0),
        ];
        assert_eq!(aggregate_engine_utilization(samples), Some(35.0));
    }

    #[test]
    fn clamps_to_100_and_ignores_negative_noise() {
        let samples = vec![
            sample("pid_1_luid_a_phys_0_eng_0_engtype_3D", 80.0),
            sample("pid_2_luid_a_phys_0_eng_0_engtype_3D", 45.0),
            sample("pid_3_luid_a_phys_0_eng_1_engtype_Copy", -3.0),
        ];
        assert_eq!(aggregate_engine_utilization(samples), Some(100.0));
    }

    #[test]
    fn no_engines_means_unknown() {
        assert_eq!(aggregate_engine_utilization(Vec::new()), None);
    }
}
