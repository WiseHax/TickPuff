fn main() {
    // `STORE_BUILD` (lib.rs) reads this at compile time; rebuild when it changes.
    println!("cargo:rerun-if-env-changed=TICKPUFF_STORE");
    tauri_build::build()
}
