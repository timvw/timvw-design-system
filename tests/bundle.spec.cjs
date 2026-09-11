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
    const {init}=await import('./js/timvw.js');
    const holder=document.createElement('section');holder.innerHTML='<button type="button" data-tvw-open="bundle-dialog">Open dialog</button><dialog id="bundle-dialog" class="tvw-dialog" aria-labelledby="bundle-title"><h2 id="bundle-title">Bundled dialog</h2><form method="dialog"><button>Close</button></form></dialog>';document.querySelector('main').append(holder);init(holder);
  });
  await page.getByRole('button',{name:'Open dialog'}).click();await expect(page.getByRole('dialog',{name:'Bundled dialog'})).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Open dialog'})).toBeFocused();expect(errors).toEqual([]);
});
