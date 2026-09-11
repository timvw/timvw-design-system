const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');

test('browser-native component regressions', async ({ page }) => {
  await page.goto('/tests/'); await page.locator('#run').click();
  await expect(page.locator('#summary')).toHaveAttribute('data-failures', '0');
});
test('guided project creation, review, persistence and expanded table details', async ({ page }) => {
  await page.goto('/examples/create.html');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#project-name')).toBeFocused();
  await page.locator('#project-name').fill('Browser test project'); await page.locator('#project-due').fill('2026-12-01');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const owner = page.getByRole('combobox', { name: 'Project owner', exact: true });
  await owner.fill('sam'); await owner.press('ArrowDown'); await owner.press('Enter');
  const team = page.getByRole('combobox', { name: 'Team members (optional)', exact: true });
  await team.fill('alex'); await team.press('ArrowDown'); await team.press('Enter');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('#project-files').setInputFiles({ name: 'brief.txt', mimeType: 'text/plain', buffer: Buffer.from('Project context') });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#project-review')).toContainText('Sam Chen'); await expect(page.locator('#project-review')).toContainText('brief.txt');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('[data-tvw-file-list]')).toContainText('brief.txt');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.locator('#project-created')).toBeVisible(); await page.getByRole('link', { name: 'View project', exact: true }).click();
  await expect(page.locator('#project-drawer')).toHaveAttribute('open', ''); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Expand details for Browser test project' }).click();
  await expect(page.locator('[data-tvw-detail-row]:visible')).toContainText('brief.txt');
  await page.getByText('Columns', { exact: true }).click(); await page.getByLabel('Budget', { exact: true }).uncheck();
  await expect(page.locator('thead th').nth(4)).toBeHidden();
});
test('upload failure and retry do not send network requests', async ({ page }) => {
  const writes = []; page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  await page.goto('/patterns.html');
  await page.locator('#demo-file-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') });
  await page.locator('#simulate-upload-failure').check(); await page.locator('[data-upload-preview]').click();
  await expect(page.locator('#demo-files [data-tvw-file-status]')).toContainText('1 failed');
  await page.locator('#simulate-upload-failure').uncheck(); await page.locator('[data-upload-preview]').click();
  await expect(page.locator('#demo-files [data-tvw-file-status]')).toContainText('1 completed, 0 failed'); expect(writes).toEqual([]);
});
test('component search, no results, icon source and theme tokens', async ({ page }) => {
  await page.goto('/explore.html?q=upload'); await expect(page.locator('[data-catalog-item]:visible')).toHaveCount(1);
  await page.locator('#component-search').fill('nothing matches this'); await expect(page.locator('#component-empty')).toBeVisible();
  await page.locator('#clear-explorer').click(); await expect(page.locator('#component-search')).toBeFocused();
  await page.locator('#icon-search').fill('github'); await page.locator('[data-icon="github"]').click();
  await expect(page.locator('#selected-icon-code')).toContainText('icons.svg#github');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click(); await expect(page.locator('html')).toHaveAttribute('data-tvw-theme', 'dark');
});
test('archive navigation follows current and future catalogues', async ({ page, request }) => {
  const catalog = await (await request.get('/releases.json')).json();
  await page.goto('/v0.3.0/'); await expect(page.locator('[data-version-picker] nav a strong').first()).toHaveText(`Latest · v${catalog.latest}`);
  await page.route('**/releases.json', route => route.fulfill({ json: { latest: '9.0.0', versions: [{ version: '9.0.0', description: 'Future' }, { version: '0.3.0', description: 'Archive' }] } }));
  await page.reload(); await expect(page.locator('[data-version-picker] nav a strong').first()).toHaveText('Latest · v9.0.0');
  await expect(page.locator('[data-version-picker] summary')).toHaveText('v0.3.0');
  await page.unroute('**/releases.json'); await page.route('**/releases.json', route => route.abort()); await page.reload();
  await expect(page.locator('[data-version-picker] nav a strong').first()).toHaveText('Latest');
});
test('narrow layouts have no document overflow and no script errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 900 });
  for (const path of ['/', '/components.html', '/patterns.html', '/explore.html', '/examples/create.html', '/examples/projects.html', '/examples/website.html']) {
    await page.goto(path); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBeTruthy();
  } expect(errors).toEqual([]);
});
test('native fallback remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto('http://127.0.0.1:8080/examples/create.html');
  await expect(page.locator('[data-tvw-step]:visible')).toHaveCount(4); await expect(page.locator('#project-owner')).toBeVisible();
  await expect(page.locator('[data-tvw-wizard-controls]')).toBeHidden(); await context.close();
});

test('failed local saving preserves the completed form', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Unavailable', 'SecurityError'); } }));
  await page.goto('/examples/create.html');
  await page.locator('#project-name').fill('Keep this draft'); await page.locator('#project-due').fill('2026-12-01');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const owner = page.getByRole('combobox', { name: 'Project owner', exact: true }); await owner.fill('alex'); await owner.press('ArrowDown'); await owner.press('Enter');
  await page.getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.locator('#project-wizard')).toBeVisible(); await expect(page.locator('#project-review')).toContainText('Keep this draft');
  await expect(page.locator('.tvw-toast')).toContainText('Browser storage is unavailable');
  await expect(page.getByRole('button', { name: 'Create project', exact: true })).toBeEnabled();
});
