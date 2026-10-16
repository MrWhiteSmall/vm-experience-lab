import { mkdir, copyFile, readFile, writeFile, rename, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = [
  { file: 'vendor/v86/seabios.bin', url: 'https://raw.githubusercontent.com/copy/v86/master/bios/seabios.bin' },
  { file: 'vendor/v86/vgabios.bin', url: 'https://raw.githubusercontent.com/copy/v86/master/bios/vgabios.bin' },
  { file: 'images/kolibri.img', url: 'https://builds.kolibrios.org/ci/0.7.7.0-9234-gd5a7ef67e/en_US/kolibrios-0.7.7.0-9234-gd5a7ef67e-en_US.img', bytes: 1474560, sha256: '17cc21e0afa10e2d0a8ad00ead6e5f165659312b92a2a43804e7de3410ea5b73' },
  { file: 'images/tinycore.iso', url: 'http://tinycorelinux.net/16.x/x86/release/TinyCore-16.2.iso', bytes: 25165824 },
];
await mkdir(`${root}public/vendor/v86`, { recursive: true });
await mkdir(`${root}public/images`, { recursive: true });
for (const name of ['libv86.js', 'v86.wasm', 'v86-fallback.wasm']) {
  await copyFile(`${root}node_modules/v86/build/${name}`, `${root}public/vendor/v86/${name}`);
}
await copyFile(`${root}node_modules/v86/LICENSE`, `${root}public/vendor/v86/LICENSE`);
const records = await Promise.all(assets.map(async asset => {
  const target = `${root}public/${asset.file}`;
  let present = false;
  try { present = (await stat(target)).size > 0; } catch {}
  if (!present) {
    console.log(`Downloading ${asset.file}`);
    await run('curl', ['-fL', '--retry', '2', '--max-time', '120', asset.url, '-o', `${target}.part`], { maxBuffer: 1024 * 1024 });
  }
  const data = await readFile(present ? target : `${target}.part`);
  const sha256 = createHash('sha256').update(data).digest('hex');
  if (asset.bytes && asset.bytes !== data.length) throw new Error(`Unexpected size for ${asset.file}: ${data.length}`);
  if (asset.sha256 && asset.sha256 !== sha256) throw new Error(`SHA-256 mismatch for ${asset.file}`);
  if (!present) await rename(`${target}.part`, target);
  console.log(`Ready ${asset.file} (${data.length} bytes)`);
  return { ...asset, bytes: data.length, sha256 };
}));
await writeFile(`${root}public/asset-manifest.json`, JSON.stringify({ v86: '0.5.471', prepared_at: new Date().toISOString(), assets: records }, null, 2));
