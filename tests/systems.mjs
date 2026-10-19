import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const output = 'artifacts/systems';
await mkdir(output, { recursive: true });
const errors = [];
const results = [];
const selected = process.argv.slice(2);
assert(selected.every(id => ['freedos', 'alpine', 'slitaz'].includes(id)), 'Unknown system test selection');
const shouldRun = id => !selected.length || selected.includes(id);
page.on('pageerror', error => errors.push(error.message));
const waitText = async (pattern, timeout = 45000) => {
  assert(await page.evaluate(({ pattern, timeout }) => window.vmLab.emulator.wait_until_vga_screen_contains(new RegExp(pattern), { timeout_msec: timeout }), { pattern, timeout }), `Guest text not found: ${pattern}\n${await textScreen()}`);
};
const textScreen = () => page.evaluate(() => window.vmLab.emulator.screen_adapter.get_text_screen().join('\n'));
const command = async text => {
  await page.locator('#screen').click();
  await page.keyboard.type(text, { delay: 60 });
  await page.keyboard.press('Enter');
};
const release = async () => {
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => !document.pointerLockElement);
};
const boot = async id => {
  await page.locator(`[data-start="${id}"]`).click();
  await page.waitForFunction(id => window.vmLab.disc === id && window.vmLab.phase === 'running', id, { timeout: 60000 });
  console.log('Guest started, waiting for usable environment:', id);
};
const eject = async () => {
  await release();
  await page.locator('#eject-button').click();
  await page.waitForFunction(() => window.vmLab.phase === 'idle' && !window.vmLab.emulator);
};

try {
  await page.goto('http://127.0.0.1:5196/', { waitUntil: 'networkidle' });
  await expect(page.locator('.disc-button')).toHaveCount(8);
  if (shouldRun('freedos')) {
    await page.locator('[data-filter="classic"]').click();
    await expect(page.locator('.disc-button')).toHaveCount(1);
    const started = Date.now();
    await boot('freedos');
    await waitText('C:.*>');
    await waitText('FreeCom version');
    await command('echo freedos-ready');
    await waitText('^freedos-ready\\s*$');
    console.log('FreeDOS echo output verified');
    await command('ver');
    await waitText('FreeCOM|FreeCom');
    await page.screenshot({ path: `${output}/freedos.png` });
    results.push({ id: 'freedos', elapsed_ms: Date.now() - started, text: await textScreen() });
    console.log('PASS FreeDOS 自动退出安装器、真实浏览器键盘命令与版本输出');
    await release();
    await page.locator('#session-help-button').click();
    await expect(page.locator('#details-content')).toContainText('输入 VER');
    await page.locator('#details-dialog .dialog-close').click();
    await eject();
  }

  if (shouldRun('alpine')) {
    await page.locator('[data-filter="lab"]').click();
    await expect(page.locator('.disc-button')).toHaveCount(1);
    const alpineStarted = Date.now();
    await boot('alpine');
    await waitText('localhost login:', 120000);
    await command('root');
    await waitText('localhost:.*#');
    await command('cat /etc/alpine-release');
    await waitText('^3\\.24\\.2\\s*$');
    await command('echo alpine-ready');
    await waitText('^alpine-ready\\s*$');
    await page.screenshot({ path: `${output}/alpine.png` });
    results.push({ id: 'alpine', elapsed_ms: Date.now() - alpineStarted, text: await textScreen() });
    console.log('PASS Alpine 实际 root 登录、浏览器键盘命令与 3.24.2 版本输出');
    await eject();
  }

  if (shouldRun('slitaz')) {
    await page.locator('[data-filter="tiny"]').click();
    await expect(page.locator('.disc-button')).toHaveCount(3);
    const slitazStarted = Date.now();
    await boot('slitaz');
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#vm-screen canvas');
      if (canvas.style.display !== 'block' || canvas.width < 800) return false;
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      const colors = new Set();
      let visible = 0;
      let samples = 0;
      for (let y = 0; y < canvas.height; y += 32) for (let x = 0; x < canvas.width; x += 32) {
        const i = (y * canvas.width + x) * 4;
        colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
        if (data[i] + data[i + 1] + data[i + 2] > 20) visible++;
        samples++;
      }
      return colors.size > 40 && visible / samples > .2;
    }, undefined, { timeout: 180000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${output}/slitaz-desktop.png` });
    const pixels = () => page.evaluate(() => {
      const canvas = document.querySelector('#vm-screen canvas');
      return Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data);
    });
    const difference = (a, b) => a.reduce((count, value, index) => count + (value !== b[index] ? 1 : 0), 0);
    await page.locator('#screen').click();
    await page.mouse.move(1050, 700, { steps: 20 });
    await page.waitForTimeout(500);
    const before = await pixels();
    await page.mouse.click(1050, 700, { button: 'right' });
    await page.waitForTimeout(700);
    const changed = difference(before, await pixels());
    assert(changed > 1000, 'Actual SliTaz desktop menu must respond to the mouse');
    await page.screenshot({ path: `${output}/slitaz-menu.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    assert(difference(before, await pixels()) < changed / 3, 'Actual SliTaz menu must close with keyboard Escape');
    results.push({ id: 'slitaz', elapsed_ms: Date.now() - slitazStarted, changed_channels: changed });
    console.log('PASS SliTaz 真实桌面、鼠标菜单与键盘关闭菜单');
    await eject();
  }
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  await writeFile(`${output}/results.json`, JSON.stringify({ checked_at: new Date().toISOString(), results, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors, failure: String(error) }, null, 2));
  throw error;
} finally { await browser.close(); }
