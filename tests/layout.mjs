import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const sizes = [
  ['desktop', 1440, 1050], ['laptop', 1280, 800], ['wide', 2560, 1080],
  ['tablet', 820, 1180], ['phone', 390, 844], ['small-phone', 320, 568],
  ['landscape', 844, 390],
];
const output = 'artifacts/layout';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });
const errors = [];
const results = [];
page.on('pageerror', error => errors.push(error.message));
const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

try {
  await page.goto('http://127.0.0.1:5196/', { waitUntil: 'networkidle' });
  for (const [name, width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const geometry = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        room: rect('.room'), computer: rect('.computer'), cabinet: rect('.disc-library'),
        intro: rect('.introduction'), caption: rect('.room-caption'),
      };
    });
    assert(!geometry.overflow, `${name}: horizontal overflow`);
    assert.equal(geometry.room.width, width, `${name}: room must fill browser width`);
    assert(!overlaps(geometry.computer, geometry.cabinet), `${name}: cabinet overlaps computer`);
    assert(!overlaps(geometry.computer, geometry.intro), `${name}: introduction overlaps computer`);
    assert(geometry.cabinet.y + geometry.cabinet.height <= geometry.caption.y, `${name}: cabinet clips bottom controls`);
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });

    await page.locator('#desk-focus-button').click();
    await expect(page.locator('.room')).toHaveClass(/focused/);
    await page.locator('.room').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    const screen = await page.locator('#screen').boundingBox();
    const toolbar = await page.locator('#session-toolbar').boundingBox();
    assert(screen.x >= 0 && screen.x + screen.width <= width, `${name}: focused screen clips horizontally`);
    assert(screen.y >= toolbar.y + toolbar.height && screen.y + screen.height <= height, `${name}: focused screen clips vertically`);
    assert(screen.width >= Math.min(330, width - 60), `${name}: focused screen is too small`);
    await page.locator('#back-button').click();
    await expect(page.locator('.room')).not.toHaveClass(/focused/);
    results.push({ name, width, height, geometry, focused_screen: screen });
    console.log('PASS responsive room and focused screen:', name);
  }

  await page.setViewportSize({ width: 1440, height: 1050 });
  for (const scene of ['rain', 'night', 'day']) {
    const button = page.locator(`button[data-scene="${scene}"]`);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-scene', scene);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-scene', scene);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: `${output}/${scene}.png`, fullPage: true });
  }
  console.log('PASS scene switching and reload persistence');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
