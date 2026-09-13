const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');

test('one import provides the tag, styles and behavior with no global CSS', async ({ page }) => {
  const requests = [], errors = [];
  page.on('request', r => { if (/\.(css|js)$/.test(new URL(r.url()).pathname)) requests.push(new URL(r.url()).pathname); });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/isolated-component.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Isolated component</title><script type="module" src="/components/dialog.js"></script><tvw-dialog open-label="Open project"><h2 slot="heading">Project Atlas</h2><p>Details</p></tvw-dialog></html>' }));
  await page.goto('/isolated-component.html');
  await page.getByRole('button', { name: 'Open project' }).click();
  await expect(page.getByRole('dialog', { name: 'Project Atlas' })).toBeVisible();
  expect(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).borderRadius)).toBe('8px');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open project' })).toBeFocused();
  expect(requests.sort()).toEqual(['/components/dialog.js', '/components/shared.js', '/components/tokens.js']);
  expect(await page.evaluate(() => customElements.get('tvw-card'))).toBeUndefined();
  expect(errors).toEqual([]);
});

test('slots retain authored nodes, listeners, labels and form state across heading edits', async ({ page }) => {
  await page.goto('/examples/packaged-components.html');
  await page.evaluate(() => {
    window.originalNote = document.getElementById('atlas-note'); window.edits = 0;
    originalNote.addEventListener('input', () => window.edits++);
  });
  await page.getByRole('button', { name: 'Open Atlas' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit Atlas' }), note = page.getByRole('textbox', { name: 'Project note' });
  await expect(dialog).toBeVisible(); await expect(note).toBeFocused(); await note.fill('Keep this draft');
  await page.evaluate(() => document.querySelector('#atlas [slot="heading"] em').textContent = 'Atlas updated');
  await expect(page.getByRole('dialog', { name: 'Edit Atlas updated' })).toBeVisible();
  await expect(note).toBeFocused();
  expect(await page.evaluate(() => originalNote === document.getElementById('atlas-note') && edits === 1)).toBeTruthy();
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Open Atlas' })).toBeFocused();
  await page.getByRole('button', { name: 'View Beacon' }).click();
  await expect(page.getByRole('dialog', { name: 'Beacon details' })).toBeVisible(); await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'View Beacon' })).toBeFocused();
  await page.getByRole('button', { name: 'Open Atlas' }).click(); await expect(note).toHaveValue('Keep this draft');
});

test('slotted dialog forms validate, return submitter values and allow application cancellation', async ({ page }) => {
  await page.goto('/examples/packaged-components.html');
  await page.getByRole('button', { name: 'Open Atlas' }).click();
  await page.getByRole('button', { name: 'Save note' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.getByRole('textbox').fill('Valid note');
  await page.evaluate(() => {
    window.dialogClosures = [];
    document.getElementById('atlas').addEventListener('tvw-close', e => window.dialogClosures.push(e.detail.returnValue));
    document.querySelector('#atlas form').addEventListener('submit', e => e.preventDefault(), { once: true });
  });
  await page.getByRole('button', { name: 'Save note' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Save note' }).click(); await expect(page.getByRole('dialog')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.dialogClosures)).toEqual(['saved']);
  await page.getByRole('button', { name: 'Open Atlas' }).click();
  await page.getByRole('textbox').fill(''); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.dialogClosures)).toEqual(['saved', 'cancelled']);
  await page.getByRole('button', { name: 'Open Atlas' }).click();
  await page.evaluate(() => document.getElementById('atlas').addEventListener('tvw-cancel', e => e.preventDefault(), { once: true }));
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeHidden();
});

test('ordinary forms keep their submit semantics and formmethod dialog is supported', async ({ page }) => {
  await page.goto('/examples/packaged-components.html');
  await page.evaluate(() => {
    const form = document.querySelector('#atlas form'); form.method = 'post';
    window.submissions = 0;
    form.addEventListener('submit', event => { if (form.method === 'post' && !event.submitter.hasAttribute('formmethod')) { event.preventDefault(); window.submissions++; } });
  });
  await page.getByRole('button', { name: 'Open Atlas' }).click(); await page.getByRole('textbox').fill('Draft');
  await page.getByRole('button', { name: 'Save note' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => window.submissions)).toBe(1);
  await page.evaluate(() => document.querySelector('#atlas form button').setAttribute('formmethod', 'dialog'));
  await page.getByRole('button', { name: 'Save note' }).click(); await expect(page.getByRole('dialog')).toBeHidden();
});

test('dynamic instances and reconnection preserve content without duplicate handlers', async ({ page }) => {
  await page.goto('/examples/packaged-components.html');
  await page.evaluate(async () => {
    await import('/components/dialog.js?v=other-cache-key');
    window.added = document.createElement('tvw-dialog'); added.setAttribute('heading', 'New project'); added.setAttribute('open-label', 'Open new');
    added.innerHTML = '<label>New note<input name="new-note"></label>';
    document.querySelector('main').append(added); window.closeCount = 0; added.addEventListener('tvw-close', () => window.closeCount++);
  });
  await page.getByRole('button', { name: 'Open new' }).click(); await page.getByRole('textbox', { name: 'New note' }).fill('Survives removal');
  await page.evaluate(() => window.added.remove());
  await expect.poll(() => page.evaluate(() => window.closeCount)).toBe(1);
  await page.evaluate(() => document.querySelector('main').append(window.added));
  await page.getByRole('button', { name: 'Open new' }).click();
  await expect(page.getByRole('textbox', { name: 'New note' })).toHaveValue('Survives removal');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.closeCount)).toBe(2);
  await expect(page.locator('tvw-dialog').last().locator('dialog')).toHaveCount(1);
});

test('system, explicit themes and consumer tokens work without a foundation stylesheet', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' }); await page.goto('/examples/packaged-components.html');
  const surface = page.locator('tvw-card').first().locator('[part="surface"]');
  const color = () => surface.evaluate(el => getComputedStyle(el).backgroundColor);
  const dark = await color();
  await page.getByRole('button', { name: 'Light theme', exact: true }).click();
  await expect.poll(color).not.toBe(dark); const light = await color();
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click(); await expect.poll(color).toBe(dark);
  await page.getByRole('button', { name: 'System theme', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light' }); await expect.poll(color).toBe(light);
  await page.locator('tvw-card').first().evaluate(el => el.style.setProperty('--tvw-surface', 'rgb(240, 245, 250)'));
  await expect.poll(color).toBe('rgb(240, 245, 250)');
});

test('mobile dialog keeps actions reachable, focus contained and forced-color borders visible', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 320, height: 480 }); await page.goto('/examples/packaged-components.html');
  await page.getByRole('button', { name: 'Open Atlas' }).click();
  const dialog = page.getByRole('dialog'), close = page.getByRole('button', { name: 'Close', exact: true });
  for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => { const host = document.getElementById('atlas'); return host.contains(document.activeElement) || host.shadowRoot.activeElement !== null || document.activeElement === document.body; })).toBeTruthy(); }
  await close.scrollIntoViewIfNeeded(); await expect(close).toBeInViewport();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  if (browserName === 'chromium') {
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await close.evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid');
  }
  await close.click(); await expect(page.getByRole('button', { name: 'Open Atlas' })).toBeFocused();
});
