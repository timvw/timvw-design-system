const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');
// Baselines are generated and compared on Ubuntu 24.04 with Playwright 1.57.0.
for (const theme of ['light', 'dark']) {
  for (const [name, path, width] of [['home', '/', 1280], ['patterns', '/patterns.html', 1280], ['explorer', '/explore.html', 375], ['website', '/examples/website.html', 1280], ['website-mobile', '/examples/website.html', 375], ['guide', '/guide.html', 1280], ['playground', '/playground.html', 1280], ['connected', '/examples/workflows.html', 1280], ['article-mobile', '/examples/article.html', 375], ['templates', '/examples/templates.html', 1280], ['packaged', '/examples/packaged-components.html', 1280], ['packaged-mobile', '/examples/packaged-components.html', 375], ['custom-tags', '/examples/custom-elements.html', 1280], ['custom-tags-mobile', '/examples/custom-elements.html', 375], ['localized', '/examples/localized.html?lang=nl', 1280]]) {
    test(`${name} ${theme}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium' || process.env.VISUAL_TESTS !== 'true', 'Visual baselines use pinned Chromium on Linux.');
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' }); await page.setViewportSize({ width, height: 900 });
      await page.goto(path); await page.waitForLoadState('networkidle'); await page.locator('html').evaluate((node, value) => node.dataset.tvwTheme = value, theme);
      await expect(page).toHaveScreenshot(`${name}-${theme}.png`, { fullPage: name === 'website-mobile' });
    });
  }
  test(`project people ${theme}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || process.env.VISUAL_TESTS !== 'true', 'Visual baselines use pinned Chromium on Linux.');
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' }); await page.goto('/examples/create.html');
    await page.locator('#project-name').fill('Customer portal'); await page.locator('#project-due').fill('2026-12-01');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const owner = page.getByRole('combobox', { name: 'Project owner', exact: true }); await owner.fill('sam'); await owner.press('ArrowDown'); await owner.press('Enter');
    await page.locator('h2:visible').click(); await expect(page).toHaveScreenshot(`project-people-${theme}.png`);
  });
}

for (const theme of ['light', 'dark']) test(`packaged dialog ${theme}`, async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || process.env.VISUAL_TESTS !== 'true', 'Visual baselines use pinned Chromium on Linux.');
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/examples/packaged-components.html');
  await page.getByRole('button', {name: 'Open Atlas'}).click();
  await expect(page).toHaveScreenshot(`packaged-dialog-${theme}.png`);
});

for (const theme of ['light', 'dark']) {
  test(`navigation short viewport ${theme}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || process.env.VISUAL_TESTS !== 'true', 'Visual baselines use pinned Chromium on Linux.');
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 600 }); await page.goto('/'); await page.waitForLoadState('networkidle');
    await page.locator('html').evaluate((el, value) => el.dataset.tvwTheme = value, theme);
    await page.locator('.docs-sidebar').evaluate(el => el.scrollTop = el.scrollHeight);
    await expect(page).toHaveScreenshot(`navigation-short-${theme}.png`);
  });
  test(`packaged starter ${theme}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || process.env.VISUAL_TESTS !== 'true', 'Visual baselines use pinned Chromium on Linux.');
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/starter.html'); await page.waitForLoadState('networkidle');
    await page.locator('html').evaluate((el, value) => el.dataset.tvwTheme = value, theme);
    await expect(page).toHaveScreenshot(`starter-${theme}.png`);
  });
}
