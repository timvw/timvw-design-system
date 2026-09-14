const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');

test('desktop navigation scrolls independently by wheel and keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');
  const sidebar = page.getByRole('complementary', { name: 'Documentation navigation' });
  await expect(sidebar).toBeVisible();
  const before = await page.evaluate(() => scrollY);
  await sidebar.hover(); await page.mouse.wheel(0, 1800);
  await expect.poll(() => sidebar.evaluate(el => el.scrollTop)).toBeGreaterThan(100);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await sidebar.getByRole('link', { name: 'Accessibility', exact: true }).focus();
  await expect(sidebar.getByRole('link', { name: 'Accessibility', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await sidebar.focus(); await page.keyboard.press('Home'); await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await sidebar.getByRole('link', { name: 'Accessibility', exact: true }).click();
  await expect(page).toHaveURL(/#accessibility$/);
  await expect(page.locator('#accessibility')).toBeInViewport();
});

test('navigation fits a wrapped header and returns to normal page flow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 600 }); await page.goto('/components.html');
  const sidebar = page.getByRole('complementary', { name: 'Documentation navigation' });
  await expect.poll(() => sidebar.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight + 1)).toBeTruthy();
  await sidebar.hover(); await page.mouse.wheel(0, 1400); await expect.poll(() => sidebar.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 375, height: 700 });
  expect(await sidebar.evaluate(el => getComputedStyle(el).overflowY)).toBe('visible');
  expect(await sidebar.evaluate(el => getComputedStyle(el).position)).toBe('static');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('selective packages share CSS, enhance later markup and expose ready controllers', async ({ page }) => {
  const requests = [], errors = [];
  page.on('request', r => { if (/\.(css|js)$/.test(new URL(r.url()).pathname)) requests.push(new URL(r.url()).pathname); });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/package-test.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Package test</title><script type="module" src="/components/forms.js?v=0.9.0"></script><script type="module" src="/components/buttons.js?v=0.9.0"></script><main><form data-tvw-validate><div data-tvw-errors hidden></div><label for="name">Name</label><input id="name" name="name" class="tvw-input" required><button class="tvw-button">Save</button></form></main></html>' }));
  await page.goto('/package-test.html');
  expect(await page.evaluate(async () => { const { getForm, ready } = await import('/components/forms.js?v=0.9.0'); await ready; return !!getForm(document.querySelector('form')); })).toBeTruthy();
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect(page.locator('[data-tvw-errors]')).toBeVisible();
  await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<label for="secret">Secret</label><input type="password" id="secret"><button type="button" data-tvw-password aria-controls="secret" hidden>Show password</button>'));
  await expect(page.getByRole('button', { name: 'Show password', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show password', exact: true }).click(); await expect(page.locator('#secret')).toHaveAttribute('type', 'text');
  expect(requests.filter(path => path === '/css/foundation.css')).toHaveLength(1);
  expect(requests.filter(path => path === '/css/parts/buttons.css')).toHaveLength(1);
  expect(requests.some(path => /timvw\.js|select\.js|table\.js|css\/timvw\.css|css\/components\.css/.test(path))).toBeFalsy();
  expect(errors).toEqual([]);
});

test('starter and playground default to complete packaged markup', async ({ page }) => {
  await page.goto('/starter.html'); await page.getByRole('button', { name: 'Open project' }).click();
  await expect(page.getByRole('dialog', { name: 'My project', exact: true })).toBeVisible(); await page.keyboard.press('Escape');
  await page.goto('/playground.html');
  await expect(page.locator('#play-component')).toHaveValue('card');
  await expect(page.locator('#play-preview tvw-card')).toBeVisible();
  await expect(page.locator('#play-source')).toContainText('src="./components/card.js"');
  await expect(page.locator('#play-source')).not.toContainText('init(');
  await expect(page.locator('#play-dependencies')).not.toContainText('foundation.css');
});
