/**
 * Builds the Microsoft Store package: `npm run build:msix`.
 *
 * 1. Builds the app with TICKPUFF_STORE=1 (no self-updater; the Store updates the app).
 * 2. Stages tickpuff.exe, the Store icons and AppxManifest.xml.
 * 3. Packs `TickPuff_<version>_x64.msix` with MakeAppx (Windows SDK).
 *
 * The package is unsigned on purpose: the Store signs it after certification.
 * Upload it in Partner Center → TickPuff → Submit your product → Packages.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
// Store versions have four parts and the last must be 0.
const storeVersion = `${version.split('-')[0]}.0`;

function findMakeAppx() {
  const kits = 'C:/Program Files (x86)/Windows Kits/10/bin';
  if (!existsSync(kits)) return null;
  const versions = readdirSync(kits)
    .filter((dir) => /^10\./.test(dir))
    .sort()
    .reverse();
  for (const v of versions) {
    const candidate = join(kits, v, 'x64', 'makeappx.exe');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const makeappx = findMakeAppx();
if (!makeappx) {
  console.error('MakeAppx.exe not found. Install the Windows SDK (Visual Studio Installer → Individual components).');
  process.exit(1);
}

console.log(`Building TickPuff ${version} for the Microsoft Store…`);
execFileSync('npx', ['tauri', 'build', '--no-bundle'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, TICKPUFF_STORE: '1' },
});

const targetDir = process.env.CARGO_TARGET_DIR
  ? resolve(process.env.CARGO_TARGET_DIR)
  : join(root, 'src-tauri', 'target');
const exe = join(targetDir, 'release', 'tickpuff.exe');
const stage = join(root, 'packaging', 'msix', 'stage');
const out = join(root, 'packaging', 'msix', `TickPuff_${version}_x64.msix`);

rmSync(stage, { recursive: true, force: true });
mkdirSync(join(stage, 'Assets'), { recursive: true });
copyFileSync(exe, join(stage, 'tickpuff.exe'));
for (const icon of ['StoreLogo.png', 'Square150x150Logo.png', 'Square44x44Logo.png']) {
  copyFileSync(join(root, 'src-tauri', 'icons', icon), join(stage, 'Assets', icon));
}
const manifest = readFileSync(join(root, 'packaging', 'msix', 'AppxManifest.xml'), 'utf8').replace(
  'Version="{{VERSION}}"',
  `Version="${storeVersion}"`,
);
writeFileSync(join(stage, 'AppxManifest.xml'), manifest);

execFileSync(makeappx, ['pack', '/o', '/d', stage, '/p', out], { stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });
console.log(`\nStore package: ${out}`);
