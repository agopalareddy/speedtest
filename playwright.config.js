// Playwright config — e2e spec boots the speedtest server itself (see
// test/e2e/speedtest.spec.js) so we don't need a webServer block and the
// port can be random.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.js$/,
  fullyParallel: false,
  workers: 1, // speed test is single-client; parallel runs would compete for bandwidth
  reporter: 'list',
  timeout: 90_000,
  use: {
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
