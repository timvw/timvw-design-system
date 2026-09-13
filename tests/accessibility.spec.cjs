const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');
test.skip(({ browserName }) => browserName !== 'chromium' || process.env.AXE_TESTS !== 'true', 'Automated accessibility audit runs in Chromium when AXE_TESTS=true.');
const paths = ['/', '/components.html', '/patterns.html', '/explore.html', '/guide.html', '/playground.html', '/examples/create.html', '/examples/projects.html', '/examples/settings.html', '/examples/dashboard.html', '/examples/website.html', '/examples/workflows.html', '/examples/localized.html?lang=nl', '/examples/templates.html', '/examples/article.html', '/examples/custom-elements.html', '/examples/packaged-components.html'];
for (const theme of ['light', 'dark']) for (const path of paths) {
  test(`automated accessibility ${theme} ${path}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('tvw-theme', value), theme);
    await page.goto(path); await page.locator('html').evaluate((node,value) => node.dataset.tvwTheme=value,theme);
    await page.addScriptTag({ path: process.env.AXE_CORE_PATH || require.resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(async () => (await axe.run(document, { runOnly: { type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] } })).violations.map(({ id, help, nodes }) => ({ id,help,nodes:nodes.map(({ target,failureSummary })=>({target,failureSummary})) })));
    expect(results).toEqual([]);
  });
}

test('interactive error, grouped-option and modal states have no automated violations', async ({ page }) => {
  const audit = async () => {
    await page.addScriptTag({path:process.env.AXE_CORE_PATH || require.resolve('axe-core/axe.min.js')});
    const errors = await page.evaluate(async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(({id,nodes})=>({id,targets:nodes.map(n=>n.target)})));
    expect(errors).toEqual([]);
  };
  await page.goto('/examples/workflows.html'); await page.getByRole('button',{name:'Save workspace'}).click(); await audit();
  await page.getByRole('combobox',{name:'Find a teammate'}).fill('alex'); await expect(page.getByRole('option',{name:'Alex Rivera'})).toBeVisible(); await audit();
  await page.goto('/examples/templates.html'); await page.getByRole('button',{name:'Open project 1',exact:true}).click(); await audit();
  await page.goto('/examples/packaged-components.html'); await page.getByRole('button',{name:'Open Atlas'}).click(); await audit();
  await page.goto('/guide.html'); await page.keyboard.press('Control+k'); await expect(page.getByRole('dialog')).toBeVisible(); await audit();
});
