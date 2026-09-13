const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');

// Browser emulation and accessibility semantics are regression evidence, not a
// substitute for the screen-reader / Windows / device sessions in ACCESSIBILITY_REVIEW.md.
for (const theme of ['light', 'dark']) for (const styles of ['full', 'selective']) {
  test(`forced colors distinguish control states: ${theme}, ${styles} CSS`, async ({ page, browserName }, info) => {
    test.skip(browserName !== 'chromium', 'Forced-color rendering evidence uses Chromium emulation.');
    await page.emulateMedia({ forcedColors: 'active', colorScheme: theme });
    await page.goto('/components.html');
    if (styles === 'selective') {
      await page.evaluate(async () => {
        document.querySelectorAll('link[rel=stylesheet]').forEach(link => link.remove());
        await Promise.all(['foundation', 'parts/buttons', 'parts/forms', 'parts/theme', 'parts/tables'].map(name => new Promise((resolve, reject) => {
          const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = `/css/${name}.css`;
          link.onload = resolve; link.onerror = reject; document.head.append(link);
        })));
      });
    }
    const enabled = page.getByRole('switch', { name: 'Email notifications' });
    for (const checked of [false, true]) {
      await enabled.setChecked(checked);
      const edge = await page.locator('#switches .tvw-switch-track').first().evaluate(track => {
        const thumb = getComputedStyle(track, '::before');
        return { width: parseFloat(thumb.borderTopWidth), style: thumb.borderTopStyle, border: thumb.borderTopColor, background: getComputedStyle(track).backgroundColor };
      });
      expect(edge.width).toBeGreaterThanOrEqual(1); expect(edge.style).toBe('solid'); expect(edge.border).not.toBe(edge.background);
    }
    await expect(enabled).toBeChecked();
    const disabledEdge = await page.locator('#switches .tvw-switch-track').last().evaluate(track => getComputedStyle(track, '::before').borderTopWidth);
    expect(parseFloat(disabledEdge)).toBeGreaterThanOrEqual(1);
    const picker = page.locator('.docs-header .tvw-theme-picker');
    await picker.getByRole('button', { name: theme === 'light' ? 'Light theme' : 'Dark theme', exact: true }).click();
    const borders = await picker.locator('button').evaluateAll(buttons => buttons.map(button => ({ pressed: button.getAttribute('aria-pressed') === 'true', width: parseFloat(getComputedStyle(button).borderTopWidth), color: getComputedStyle(button).borderTopColor })));
    const selected = borders.find(border => border.pressed);
    for (const other of borders.filter(border => !border.pressed)) {
      expect(selected.width).toBeGreaterThan(other.width); expect(selected.color).not.toBe(other.color);
    }
    const current = page.locator('[data-tvw-pagination] [aria-current=page]').first();
    expect(await current.evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(2);
    await enabled.focus(); await page.keyboard.press('Space');
    expect(await page.locator('#switches .tvw-switch-track').first().evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(3);
    for (const [name, locator] of [['switches', page.locator('#switches .docs-demo')], ['theme', picker], ['pagination', page.locator('[data-tvw-pagination]').first()]]) {
      await info.attach(`${name}-${theme}-${styles}`, { body: await locator.screenshot(), contentType: 'image/png' });
    }
  });
}

test('native modal exposes its name and description and prevents background focus', async ({ page, browserName }) => {
  await page.goto('/examples/templates.html');
  const opener = page.getByRole('button', { name: 'Open project 2', exact: true });
  await opener.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Project 2', exact: true });
  await expect(dialog).toHaveAccessibleDescription(/This dialog was cloned/);
  // Role locators / ariaSnapshot derive semantics from DOM; they do not prove
  // native inertness. Check focus and, in Chromium, the browser's actual AX tree.
  await page.getByRole('button', { name: 'Open project 1', exact: true }).evaluate(node => node.focus());
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  if (browserName === 'chromium') {
    const session = await page.context().newCDPSession(page);
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    const exposed = nodes.filter(node => !node.ignored);
    expect(exposed.some(node => node.role?.value === 'dialog' && node.name?.value === 'Project 2')).toBeTruthy();
    expect(exposed.some(node => node.role?.value === 'button' && node.name?.value === 'Open project 1')).toBeFalsy();
    await session.detach();
  }
  await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
});

test('grouped combobox exposes names and selection through browser accessibility semantics', async ({ page }) => {
  await page.goto('/examples/workflows.html');
  const input = page.getByRole('combobox', { name: 'Find a teammate' });
  await input.fill('alex');
  const group = page.getByRole('group', { name: 'Design', exact: true });
  await expect(group.getByRole('option', { name: 'Alex Rivera' })).toBeVisible();
  await input.press('ArrowDown');
  const selected = page.getByRole('option', { name: 'Alex Rivera', selected: true });
  await expect(selected).toBeVisible(); await expect(input).toHaveAttribute('aria-activedescendant', await selected.getAttribute('id'));
  await input.press('Enter'); await expect(input).toHaveValue('Alex Rivera');
  await expect(input).toHaveAttribute('aria-expanded', 'false'); await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(page.locator('#remote-people [role=status]')).toContainText('Alex Rivera');
});

test.describe('touch-event emulation', () => {
  test.use({ hasTouch: true });
  test('switch, menu and tooltip can be used by tapping without hover', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/components.html');
    await page.locator('#switches .tvw-switch').first().tap(); await expect(page.getByRole('switch', { name: 'Email notifications' })).not.toBeChecked();
    await page.getByRole('button', { name: 'Actions', exact: true }).tap();
    await page.getByRole('menuitem', { name: 'Show notification', exact: true }).tap();
    await expect(page.getByRole('menu', { name: 'Example actions' })).toBeHidden();
    await expect(page.locator('.tvw-toast')).toContainText('Example action completed.');
    await page.getByRole('button', { name: 'Dismiss notification' }).tap();
    const trigger = page.getByRole('button', { name: 'Local storage', exact: true });
    await trigger.tap(); await expect(page.getByRole('tooltip')).toBeVisible();
    await page.locator('#tooltips h2').tap(); await expect(page.getByRole('tooltip')).toBeHidden();
    await trigger.tap(); await expect(page.getByRole('tooltip')).toBeVisible();
  });
  test('options and dialog close remain reachable after viewport changes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/examples/workflows.html');
    const input = page.getByRole('combobox', { name: 'Find a teammate' });
    await input.tap(); await input.fill('alex');
    const option = page.getByRole('option', { name: 'Alex Rivera' }); await expect(option).toBeVisible();
    await page.setViewportSize({ width: 390, height: 400 }); await input.scrollIntoViewIfNeeded();
    await option.tap(); await expect(input).toHaveValue('Alex Rivera'); await expect(page.locator('#remote-person')).toHaveValue('alex');
    await page.goto('/examples/templates.html'); await page.getByRole('button', { name: 'Open project 2', exact: true }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    const close = page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true });
    await close.tap(); await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
