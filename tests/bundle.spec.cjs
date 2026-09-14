const { test, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || '@playwright/test');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { latest } = require('../releases.json');
test.beforeAll(() => { execFileSync('python3', ['-m','zipfile','-e',`downloads/timvw-${latest}.zip`,`test-results/bundle-${test.info().project.name}`], {cwd:resolve(__dirname,'..')}); });
test('downloaded runtime bundle works independently of the repository modules', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto(`/test-results/bundle-${test.info().project.name}/timvw-${latest}/starter.html`);
  await expect(page.getByRole('heading',{name:'Hello, timvw.'})).toBeVisible();
  await page.evaluate(async () => {
    const {registerTemplate}=await import('./components/page.js');
    const holder=document.createElement('section');holder.innerHTML='<button type="button" data-tvw-open="bundle-dialog">Open dialog</button><dialog id="bundle-dialog" class="tvw-dialog" aria-labelledby="bundle-title"><h2 id="bundle-title">Bundled dialog</h2><form method="dialog"><button>Close</button></form></dialog>';document.querySelector('main').append(holder);
    const template=document.createElement('template');template.innerHTML='<h2 data-tvw-text="heading">Default card</h2>';
    registerTemplate('bundled-card',template);const card=document.createElement('bundled-card');card.setAttribute('heading','Bundled custom tag');holder.append(card);
  });
  await expect(page.getByRole('heading',{name:'Bundled custom tag'})).toBeVisible();
  await page.getByRole('button',{name:'Open dialog'}).click();await expect(page.getByRole('dialog',{name:'Bundled dialog'})).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Open dialog'})).toBeFocused();expect(errors).toEqual([]);
});

test('packaged tags load from the extracted ZIP with no repository CSS or modules', async ({ page }) => {
  const base = `/test-results/bundle-${test.info().project.name}/timvw-${latest}/`;
  const requested = [], errors = [];
  page.on('request', r => { if (/\.(css|js)$/.test(new URL(r.url()).pathname)) requested.push(new URL(r.url()).pathname); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.url()); });
  await page.route(`**${base}isolated.html`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><title>Bundled tags</title><script type="module" src="./components/dialog.js"></script><script type="module" src="./components/card.js"></script><tvw-card><h2 slot="heading">Bundled card</h2><tvw-dialog slot="actions" open-label="Open bundled"><h2 slot="heading">Bundled modal</h2><p>Independent of the repository.</p></tvw-dialog></tvw-card></html>` }));
  await page.goto(`${base}isolated.html`);
  await expect(page.getByRole('heading', { name: 'Bundled card' })).toBeVisible();
  await page.getByRole('button', { name: 'Open bundled' }).click();
  await expect(page.getByRole('dialog', { name: 'Bundled modal' })).toBeVisible();
  expect(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).borderRadius)).toBe('8px');
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Open bundled' })).toBeFocused();
  expect(requested.sort()).toEqual(['dialog','card','shared','tokens'].map(name => `${base}components/${name}.js`).sort());
  expect(errors).toEqual([]);
});
