// Maintainer-only automation. The published site has no test-tool dependency.
const { defineConfig } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['browser.spec.cjs', 'next.spec.cjs', 'bundle.spec.cjs', 'accessibility.spec.cjs', 'visual.spec.cjs'],
  timeout: 30000,
  expect: { timeout: 5000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.002 } },
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'test-results/report', open: 'never' }]],
  outputDir: '../test-results/runs',
  snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{arg}{ext}',
  use: { baseURL: process.env.TVW_BASE_URL || 'http://127.0.0.1:8080', viewport: { width: 1280, height: 900 }, locale: 'en-GB', timezoneId: 'UTC', trace: 'retain-on-failure' },
  webServer: { command: 'python3 -m http.server 8080 --bind 127.0.0.1', url: 'http://127.0.0.1:8080', reuseExistingServer: !process.env.CI, cwd: require('node:path').join(__dirname, '..') },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName } })),
});
