// Playwright e2e smoke — boot the server, load the page, run a real speed
// test in headless Chromium, assert the results render. Not a substitute for
// the manual quickstart.md walkthrough, but catches the obvious regressions
// (page won't load, JS errors, endpoints unreachable, gauge never updates).

const { test, expect } = require('@playwright/test');
const { start } = require('../server.js');

let server;
let baseUrl;

test.beforeAll(async () => {
  server = await new Promise((resolve) => {
    const s = start();
    s.on('listening', () => resolve(s));
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('runs a full speed test and renders results', async ({ page }) => {
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(baseUrl);

  // Page boots, controls visible.
  await expect(page.getByRole('heading', { name: 'Network Speed Test' })).toBeVisible();
  await expect(page.locator('#start-btn')).toBeVisible();
  await expect(page.locator('#theme-toggle')).toBeVisible();

  // Cap the test at 10s so the e2e stays under a minute.
  await page.locator('#duration').selectOption('10');
  await page.locator('#start-btn').click();

  // Phase walks through Ping -> Download -> Upload -> Done. The results card
  // is hidden until Done, so we wait for it.
  await expect(page.locator('#results')).toBeVisible({ timeout: 60_000 });

  // Three numbers + jitter + duration + ip + server all rendered.
  const fields = ['download', 'upload', 'ping', 'jitter', 'duration', 'ip', 'server'];
  for (const f of fields) {
    const text = await page.locator(`[data-field="${f}"]`).textContent();
    expect(text, `field ${f} is empty`).toBeTruthy();
  }

  // Local loopback is fast; the reported download should be in the Mbps range.
  const download = Number(await page.locator('[data-field="download"]').textContent());
  expect(download).toBeGreaterThan(0);
  expect(download).toBeLessThan(100_000); // sanity ceiling

  // No JS errors during the run.
  expect(consoleErrors, `console errors:\n${consoleErrors.join('\n')}`).toEqual([]);

  // History renders nothing on a fresh session.
  await expect(page.locator('#history')).toBeHidden();
});
