const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');

test('registered HTML tags isolate dialogs and load only their component dependencies', async ({ page }) => {
  const requests = []; page.on('request', request => { const path = new URL(request.url()).pathname; if (/\.(css|js)$/.test(path)) requests.push(path); });
  await page.goto('/examples/custom-elements.html');
  const atlas = page.locator('#atlas-tag'), beacon = page.locator('#beacon-tag');
  await atlas.getByRole('button', { name: 'Open Atlas' }).click();
  await expect(page.getByRole('dialog', { name: 'Atlas workspace' })).toBeVisible();
  const note = atlas.getByRole('textbox', { name: 'Note for this project' }); await note.fill('Keep this draft');
  await page.evaluate(() => document.getElementById('atlas-tag').setAttribute('heading', 'Atlas updated'));
  await expect(page.getByRole('dialog', { name: 'Atlas updated' })).toBeVisible(); await expect(note).toBeFocused();
  await page.keyboard.press('Escape'); await expect(atlas.getByRole('button', { name: 'Open Atlas' })).toBeFocused();
  await page.locator('#tag-heading').fill('Atlas renamed');
  await beacon.getByRole('button', { name: 'Open Beacon' }).click();
  await expect(beacon.getByRole('textbox', { name: 'Note for this project' })).toHaveValue('');
  await page.keyboard.press('Escape'); await atlas.getByRole('button', { name: 'Open Atlas' }).click();
  await expect(page.getByRole('dialog', { name: 'Atlas renamed' })).toBeVisible(); await expect(note).toHaveValue('Keep this draft');
  await page.keyboard.press('Escape');
  expect(await page.locator('[id]').evaluateAll(nodes => new Set(nodes.map(node => node.id)).size === nodes.length)).toBeTruthy();
  expect(await page.locator('project-dialog').evaluateAll(nodes => nodes.every(node => node.shadowRoot === null))).toBeTruthy();
  expect(requests.sort()).toEqual(['/css/foundation.css','/css/parts/buttons.css','/css/parts/cards.css','/css/parts/forms.css','/css/parts/dialogs.css','/examples/custom-elements.js','/js/templates.js','/js/dialogs.js'].sort());
});

test('tags added after registration enhance automatically and reconnect without duplicating markup', async ({ page }) => {
  await page.goto('/examples/custom-elements.html'); await page.getByRole('button', { name: 'Add a project tag' }).click();
  await page.getByRole('button', { name: 'Open project 3', exact: true }).click();
  await page.getByRole('textbox', { name: 'Note for this project' }).fill('Preserved after reconnect');
  await page.evaluate(async () => {
    const node = document.querySelector('project-dialog:last-child'); window.removedTag = node;
    node.remove(); await Promise.resolve();
  });
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.evaluate(() => document.getElementById('tag-instances').append(window.removedTag));
  await page.getByRole('button', { name: 'Open project 3', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Note for this project' })).toHaveValue('Preserved after reconnect');
  await expect(page.locator('project-dialog').last().locator('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
});

test('text attributes update safely and removal restores the registered default', async ({ page }) => {
  await page.goto('/examples/custom-elements.html');
  const card = page.locator('status-card');
  await card.evaluate(node => node.setAttribute('message', '<img src=x onerror=alert(1)>'));
  await expect(card.locator('img')).toHaveCount(0); await expect(card.locator('p')).toHaveText('<img src=x onerror=alert(1)>');
  await page.evaluate(() => document.querySelector('#status-template').content.querySelector('p').textContent = 'Changed definition');
  await card.evaluate(node => node.removeAttribute('message')); await expect(card.locator('p')).toHaveText('No message yet.');
});

test('late registration upgrades existing tags and disposes connection listeners', async ({ page }) => {
  await page.goto('/examples/custom-elements.html');
  const result = await page.evaluate(async () => {
    const { registerTemplate } = await import('/js/templates.js?v=0.8.0');
    const form = document.createElement('form'); form.innerHTML = '<test-profile heading="Existing"><span>Authored content</span></test-profile>'; document.body.append(form);
    const template = document.createElement('template'); template.innerHTML = '<h2 data-tvw-text="heading">Default</h2><label for="field">Note</label><input id="field" name="note">';
    let setups = 0, cleanups = 0, events = 0;
    registerTemplate('test-profile', template, { setup(element, { signal, getId }) {
      setups++; if (!element.querySelector(`#${getId('field')}`)) throw new Error('Setup ran before insertion');
      window.addEventListener('tag-check', () => events++, { signal }); return () => cleanups++;
    } });
    const host = form.querySelector('test-profile'), field = host.querySelector('input'); const id = field.id; field.value = 'Retained';
    window.dispatchEvent(new Event('tag-check'));
    form.append(host); await Promise.resolve(); const moved = { setups, cleanups };
    host.remove(); await Promise.resolve(); window.dispatchEvent(new Event('tag-check')); const removed = { setups, cleanups, events };
    form.append(host); window.dispatchEvent(new Event('tag-check'));
    return { moved, removed, reconnected: { setups, cleanups, events }, fields: host.querySelectorAll('input').length, sameID: field.id === id, label: host.querySelector('label').control === field, submitted: new FormData(form).get('note'), heading: host.querySelector('h2').textContent, authored: host.querySelector('span').textContent };
  });
  expect(result).toEqual({ moved: { setups:1,cleanups:0 }, removed: { setups:1,cleanups:1,events:1 }, reconnected: { setups:2,cleanups:1,events:2 }, fields:1,sameID:true,label:true,submitted:'Retained',heading:'Existing',authored:'Authored content' });
});

test('registration rejects invalid definitions and cannot replace an existing tag', async ({ page }) => {
  await page.goto('/examples/custom-elements.html');
  const errors = await page.evaluate(async () => {
    const { registerTemplate } = await import('/js/templates.js?v=0.8.0'); const template = document.createElement('template'); template.innerHTML = '<p data-tvw-text="message">Text</p>';
    const result = [];
    for (const run of [() => registerTemplate('dialog', template), () => registerTemplate('status-card', template), () => registerTemplate('bad-setup', template, {setup:42}), () => {
      const invalid = document.createElement('template'); invalid.innerHTML = '<p id="same"></p><p id="same"></p>'; registerTemplate('bad-ids', invalid);
    }]) { try { run(); result.push('accepted'); } catch (error) { result.push(error.name); } }
    return result;
  }); expect(errors).toEqual(['SyntaxError','NotSupportedError','TypeError','TypeError']);
});
