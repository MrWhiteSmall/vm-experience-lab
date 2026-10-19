import { mkdir, copyFile, readFile, writeFile, rename, stat, unlink } from 'node:fs/promises';
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
  { file: 'images/freedos.img', url: 'https://www.ibiblio.org/pub/micro/pc-stuff/freedos/files/distributions/1.4/FD14-LiteUSB.zip', bytes: 33554432, sha256: 'f539d456b792594bc3ca59d4e0f4c23d4f1fee73370c1390b2da245400718d36', archive: { entry: 'FD14LITE.img', bytes: 17671175, sha256: '857dcd2ebf9d3d094320154db5fb5b830acba6fb98f981a95a0ca7ab3350338b' } },
  { file: 'images/slitaz.iso', url: 'https://mirror.slitaz.org/iso/rolling/slitaz-rolling.iso', bytes: 61849600, sha256: '492b4d846a86443f22a2c58d50e213af9778a979bad2130d614a4efac30df7ee', source_md5: 'fbd81b8d800f314976e9a25a57c33ee6', snapshot: '2026-05-25' },
  { file: 'images/alpine.iso', url: 'https://dl-cdn.alpinelinux.org/alpine/v3.24/releases/x86/alpine-virt-3.24.2-x86.iso', bytes: 51380224, sha256: '62e752e0f674b1537a7fc38d9c3e6eab9644ae93e8610efb64756a00e7592a10' },
];
const derived = [
  { file: 'images/alpine-vmlinuz', source: 'images/alpine.iso', entry: 'boot/vmlinuz-virt', bytes: 8065536, sha256: '95c7b7680a8e57707ce383d7908a322d6b6e2cca52e312c915fa8fb155e76630' },
  { file: 'images/alpine-initramfs', source: 'images/alpine.iso', entry: 'boot/initramfs-virt', bytes: 7766084, sha256: '100a80ca2beece44575c25bf7d8c4cd775b10cbf045f520d533355289409c73f' },
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
    const download = `${target}${asset.archive ? '.zip' : ''}.part`;
    await run('curl', ['-fL', '--retry', '2', '--max-time', '180', asset.url, '-o', download], { maxBuffer: 1024 * 1024 });
    if (asset.archive) {
      const archive = await readFile(download);
      if (archive.length !== asset.archive.bytes || createHash('sha256').update(archive).digest('hex') !== asset.archive.sha256) throw new Error(`Archive verification failed for ${asset.file}`);
      const { stdout } = await run('unzip', ['-p', download, asset.archive.entry], { encoding: 'buffer', maxBuffer: asset.bytes + 1024 });
      await writeFile(`${target}.part`, stdout);
      await unlink(download);
    }
  }
  const data = await readFile(present ? target : `${target}.part`);
  const sha256 = createHash('sha256').update(data).digest('hex');
  if (asset.bytes && asset.bytes !== data.length) throw new Error(`Unexpected size for ${asset.file}: ${data.length}`);
  if (asset.sha256 && asset.sha256 !== sha256) throw new Error(`SHA-256 mismatch for ${asset.file}`);
  if (!present) await rename(`${target}.part`, target);
  console.log(`Ready ${asset.file} (${data.length} bytes)`);
  return { ...asset, bytes: data.length, sha256 };
}));
const derivedRecords = await Promise.all(derived.map(async asset => {
  const target = `${root}public/${asset.file}`;
  let data;
  try { data = await readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!data) {
    const { stdout } = await run('tar', ['-xOf', `${root}public/${asset.source}`, asset.entry], { encoding: 'buffer', maxBuffer: asset.bytes + 1024 });
    data = stdout;
  }
  if (data.length !== asset.bytes || createHash('sha256').update(data).digest('hex') !== asset.sha256) throw new Error(`Derived asset verification failed for ${asset.file}`);
  await writeFile(`${target}.part`, data);
  await rename(`${target}.part`, target);
  console.log(`Ready ${asset.file} (${data.length} bytes, extracted from ${asset.source})`);
  return asset;
}));
await writeFile(`${root}public/asset-manifest.json`, JSON.stringify({ v86: '0.5.471', prepared_at: new Date().toISOString(), assets: [...records, ...derivedRecords] }, null, 2));
