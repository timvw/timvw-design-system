const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');

test('asynchronous validation reports field and connection errors, then saves', async ({ page }) => {
  await page.goto('/examples/workflows.html');
  const form = page.locator('#connected-form'), name = page.locator('#connected-name');
  await name.fill('taken'); await page.locator('#end').fill('2026-08-01');
  await form.getByRole('button', { name: 'Save workspace' }).click();
  await expect(form.locator('[data-tvw-errors]')).toBeFocused();
  await expect(form.locator('[data-tvw-errors]')).toContainText('already in use');
  await expect(form.locator('[data-tvw-errors]')).toContainText('End date');
  await form.locator('[data-tvw-errors] a').first().click(); await expect(name).toBeFocused();
  await name.fill('offline'); await page.locator('#end').fill('2026-09-30');
  await form.getByRole('button', { name: 'Save workspace' }).click();
  await expect(form.locator('[data-tvw-errors]')).toContainText('Validation is unavailable');
  await expect(name).toHaveValue('offline');
  await name.fill('Open studio'); await form.getByRole('button', { name: 'Save workspace' }).click();
  await expect(page.locator('#save-result')).toContainText('accepted'); await expect(page.locator('#dirty-status')).toHaveText('No unsaved changes.');
});

test('stale asynchronous validation cannot submit edited data', async ({ page }) => {
  await page.goto('/examples/workflows.html');
  await page.locator('#connected-name').fill('first'); await page.getByRole('button', { name: 'Save workspace' }).click();
  await page.locator('#connected-name').fill('second');
  await expect(page.locator('#connected-form')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#save-result')).toBeEmpty();
  await expect(page.locator('#dirty-status')).toHaveText('Unsaved changes.');
  await page.locator('#connected-form').getByRole('button', { name: 'Reset', exact: true }).click();
});

test('inline edit preserves a failed draft and updates details only after saving', async ({ page }) => {
  await page.goto('/examples/workflows.html'); const editor = page.locator('#workspace-editor');
  await editor.getByRole('button', { name: 'Edit workspace name' }).click(); await page.locator('#edit-name').fill('offline');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(editor.locator('[data-tvw-edit-status]')).toContainText('could not be saved'); await expect(page.locator('#edit-name')).toBeFocused();
  await page.locator('#edit-name').press('Escape'); await expect(editor.locator('[data-tvw-value]')).toHaveText('Studio workspace');
  await editor.getByRole('button', { name: 'Edit workspace name' }).click(); await page.locator('#edit-name').fill('<b>New studio</b>');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#detail-workspace')).toHaveText('<b>New studio</b>'); await expect(page.locator('#activity li').first()).toContainText('<b>New studio</b>');
  await expect(page.locator('#detail-workspace b')).toHaveCount(0);
});

test('grouped async options recover after failure and preserve submitted selection', async ({ page }) => {
  await page.goto('/examples/workflows.html'); const input = page.getByRole('combobox', { name: 'Find a teammate' });
  await input.fill('fail'); await expect(page.locator('#remote-people button').filter({ hasText: 'Retry' })).toBeVisible();
  await input.fill('alex'); await expect(page.getByRole('option', { name: 'Alex Rivera' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Design', exact: true })).toBeVisible();
  await input.press('ArrowDown'); await input.press('Enter'); await expect(input).toHaveValue('Alex Rivera');
  await expect(page.locator('#remote-person')).toHaveValue('alex');
  await input.fill('zzzz'); await expect(page.locator('#remote-people [role=status]')).toContainText('No options');
});

test('upload cancellation keeps unfinished files available for retry', async ({ page }) => {
  await page.goto('/examples/workflows.html');
  await page.locator('#cancel-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') });
  await page.locator('#upload-start').click(); await expect(page.locator('#cancel-files progress')).toBeVisible();
  await page.locator('#upload-cancel').click(); await expect(page.locator('#cancel-files [data-tvw-file-status]')).toContainText('cancelled');
  await expect(page.locator('#cancel-input')).toBeEnabled();
  await page.locator('#upload-start').click(); await expect(page.locator('#cancel-files [data-tvw-file-status]')).toContainText('1 completed, 0 failed');
});

test('table URL filters reload, preserve other parameters and clear together', async ({ page }) => {
  await page.goto('/examples/projects.html?keep=yes&projects.status=active&projects.from=2026-01-01&projects.to=2026-12-31');
  await expect(page.locator('#project-status')).toHaveValue('active'); await expect(page.locator('#due-from')).toHaveValue('2026-01-01');
  await page.locator('#project-search').fill('Atlas'); await page.reload(); await expect(page.locator('#project-search')).toHaveValue('Atlas');
  await page.locator('[data-tvw-clear-filters]').first().click(); await expect(page.locator('#due-from')).toHaveValue('');
  expect(new URL(page.url()).searchParams.get('keep')).toBe('yes'); expect(new URL(page.url()).searchParams.has('projects.status')).toBe(false);
});

test('Dutch messages, number formatting and pagination use the configured locale', async ({ page }) => {
  await page.goto('/examples/localized.html?lang=nl'); await expect(page.locator('html')).toHaveAttribute('lang','nl-BE');
  await expect(page.locator('#locale-number')).toContainText('12.345,67');
  await expect(page.locator('[data-tvw-result-count]')).toContainText('van 2 resultaten');
  await page.getByRole('button', { name: 'Voorbeeld opslaan' }).click(); await expect(page.locator('[data-tvw-errors]')).toContainText('Kies een optie');
  await page.getByRole('button', { name: 'Wachtwoord tonen' }).click(); await expect(page.getByRole('button', { name: 'Wachtwoord verbergen' })).toBeVisible();
  await page.getByRole('button', { name: 'Volgende', exact: true }).click(); await expect(page.locator('tbody tr:visible')).toContainText('Beacon');
});

test('native template instances have isolated IDs, focus return and selective network requests', async ({ page }) => {
  const files = []; page.on('request', request => { const path = new URL(request.url()).pathname; if (/\.(js|css)$/.test(path)) files.push(path); });
  await page.goto('/examples/templates.html');
  await expect(page.getByRole('button', { name: 'Open project 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open project 2', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Project 2', exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Open project 2', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Add another dialog' }).click(); await page.getByRole('button', { name: 'Open project 3', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Project 3', exact: true })).toBeVisible();
  expect(await page.locator('[id]').evaluateAll(nodes => new Set(nodes.map(n => n.id)).size === nodes.length)).toBeTruthy();
  expect(files.sort()).toEqual(['/css/foundation.css','/css/parts/buttons.css','/css/parts/dialogs.css','/examples/templates.js','/js/dialogs.js','/js/templates.js'].sort());
});

test('command palette opens with keyboard and uses ordinary focusable result links', async ({ page }) => {
  await page.goto('/guide.html'); await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Go to…', exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Find a page' }).fill('Playground');
  await page.keyboard.press('ArrowDown'); await expect(page.getByRole('dialog').getByRole('link', { name: 'Playground', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/playground.html$/);
});

test('playground emits safe markup that matches the chosen component state', async ({ page }) => {
  await page.goto('/playground.html'); await page.locator('#play-component').selectOption('input');
  await page.locator('#play-label').fill('<img src=x>'); await page.locator('#play-invalid').check();
  await expect(page.locator('#play-preview img')).toHaveCount(0); await expect(page.locator('#play-source')).toContainText('&lt;img src=x&gt;');
  await expect(page.locator('#preview-field')).toHaveAttribute('aria-invalid','true');
  await page.locator('#play-rtl').check(); await expect(page.locator('#play-preview > div')).toHaveAttribute('dir','rtl');
});

test('new compositions fit narrow screens in both directions', async ({ page }) => {
  await page.setViewportSize({ width:320,height:900 }); const errors=[]; page.on('pageerror', e => errors.push(e.message));
  for (const path of ['/guide.html','/playground.html','/examples/workflows.html','/examples/templates.html','/examples/article.html','/examples/localized.html?lang=nl']) {
    await page.goto(path);
    for (const dir of ['ltr','rtl']) {
      await page.locator('html').evaluate((el, value) => { el.dir = value; },dir);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), `${path} ${dir}`).toBeTruthy();
    }
  } expect(errors).toEqual([]);
});

test('template helper rewrites references and treats supplied values as text', async ({ page }) => {
  await page.goto('/examples/templates.html');
  const result = await page.evaluate(async () => {
    const { instantiateTemplate } = await import('/js/templates.js?v=0.9.0');
    const template = document.createElement('template');
    template.innerHTML = '<label for="field" id="label">Name</label><input id="field" aria-labelledby="label" aria-describedby="help"><p id="help" data-tvw-text="message"></p><a href="#field">Focus</a>';
    const instance = instantiateTemplate(template, { values: { message: '<img src=x onerror=alert(1)>' } });
    const holder = document.createElement('div'); holder.append(instance.fragment); document.body.append(holder);
    return { label: holder.querySelector('label').control === holder.querySelector('input'), help: holder.querySelector('input').getAttribute('aria-describedby') === holder.querySelector('p').id, link: holder.querySelector('a').hash === '#' + holder.querySelector('input').id, text: holder.querySelector('p').textContent, images: holder.querySelectorAll('img').length };
  });
  expect(result).toEqual({ label:true, help:true, link:true, text:'<img src=x onerror=alert(1)>', images:0 });
});

test('server errors target enhanced native selections without overwriting help text', async ({ page }) => {
  await page.goto('/examples/localized.html?lang=en');
  await page.evaluate(async () => {
    const { getForm } = await import('/components/page.js?v=0.9.0');
    getForm(document.getElementById('locale-form')).setErrors({ owner: 'This owner is no longer available.' });
  });
  await page.locator('[data-tvw-errors] a').first().click(); await expect(page.getByRole('combobox', { name:'Owner', exact:true })).toBeFocused();
  await expect(page.getByRole('combobox', { name:'Owner', exact:true })).toHaveAttribute('aria-invalid','true');
});

test('date range filtering includes boundaries and hides rows outside the interval', async ({ page }) => {
  await page.goto('/examples/projects.html');
  const result = await page.evaluate(async () => {
    const { initTables } = await import('/js/table.js?v=0.9.0');
    const holder = document.createElement('div'); holder.innerHTML = '<div data-tvw-table><input type="date" data-tvw-filter="due" data-filter-mode="min" value="2026-09-01"><input type="date" data-tvw-filter="due" data-filter-mode="max" value="2026-09-30"><table><thead><tr><th>Project</th></tr></thead><tbody><tr data-due="2026-08-31"><td>Before</td></tr><tr data-due="2026-09-01"><td>Start</td></tr><tr data-due="2026-09-30"><td>End</td></tr><tr data-due="2026-10-01"><td>After</td></tr></tbody></table></div>'; document.body.append(holder); initTables(holder);
    return [...holder.querySelectorAll('tbody tr:not([hidden])')].map(row => row.textContent);
  }); expect(result).toEqual(['Start','End']);
});

test('late option responses cannot replace results for a newer query', async ({ page }) => {
  await page.goto('/examples/workflows.html');
  await page.evaluate(async () => {
    const { getCombobox } = await import('/js/timvw.js?v=0.9.0');
    window.pendingOptions = {};
    getCombobox(document.getElementById('remote-people')).configure({ debounce:0, loadOptions: query => new Promise(resolve => { window.pendingOptions[query] = resolve; }) });
  });
  const input = page.getByRole('combobox', { name:'Find a teammate' }); await input.fill('old'); await page.waitForFunction(() => window.pendingOptions.old);
  await input.fill('new'); await page.waitForFunction(() => window.pendingOptions.new);
  await page.evaluate(() => window.pendingOptions.new([{value:'new',label:'New teammate'}])); await expect(page.getByRole('option', { name:'New teammate' })).toBeVisible();
  await page.evaluate(() => window.pendingOptions.old([{value:'old',label:'Old teammate'}]));
  await expect(page.getByRole('option', { name:'New teammate' })).toBeVisible(); await expect(page.getByRole('option', { name:'Old teammate' })).toHaveCount(0);
});

test('text scaling and forced-colors preserve usable content and focus affordances', async ({ page, browserName }) => {
  await page.goto('/examples/workflows.html');
  await page.setViewportSize({width:640,height:900}); await page.locator('html').evaluate(node=>node.style.fontSize='200%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.getByRole('button',{name:'Edit workspace name'}).click();await expect(page.locator('#edit-name')).toBeFocused();
  if (browserName === 'chromium') {
    await page.emulateMedia({forcedColors:'active'});
    expect(await page.evaluate(()=>matchMedia('(forced-colors: active)').matches)).toBeTruthy();
    await expect(page.locator('#edit-name')).toBeVisible();
    expect(await page.locator('#edit-name').evaluate(node=>getComputedStyle(node).borderTopStyle)).not.toBe('none');
  }
});
