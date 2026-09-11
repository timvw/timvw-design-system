/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init } from '../js/timvw.js';
import { runExtendedChecks } from './extended.js';
import { runWorkflowChecks } from './workflows.js';

const fixtures = document.getElementById('fixtures');
const summary = document.getElementById('summary');
const results = document.getElementById('results');
const run = document.getElementById('run');
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function tabs(prefix) {
  return `<div class="tvw-tabs" data-tvw-tabs>
    <div data-tvw-tablist aria-label="Test tabs" hidden>
      <button type="button" id="${prefix}-a" aria-controls="${prefix}-one">One</button>
      <button type="button" id="${prefix}-b" aria-controls="${prefix}-two">Two</button>
      <button type="button" id="${prefix}-c" aria-controls="${prefix}-three">Three</button>
    </div>
    <section id="${prefix}-one">First panel</section>
    <section id="${prefix}-two">Second panel</section>
    <section id="${prefix}-three">Third panel</section>
  </div>`;
}

run.addEventListener('click', async () => {
  run.disabled = true;
  delete summary.dataset.failures;
  summary.textContent = 'Running…';
  results.replaceChildren();
  fixtures.innerHTML = tabs('test') + tabs('other') + `
    <button type="button" data-tvw-open="test-dialog" hidden>Open test dialog</button>
    <dialog class="tvw-dialog" id="test-dialog" aria-label="Test dialog">
      <form method="dialog"><button autofocus>Close</button></form>
    </dialog>`;
  let passed = 0;
  let failed = 0;
  async function check(name, callback) {
    const item = document.createElement('li');
    try { await callback(); passed++; item.textContent = `PASS: ${name}`; }
    catch (error) { failed++; item.textContent = `FAIL: ${name} — ${error.message}`; }
    results.append(item);
  }
  const get = (id) => document.getElementById(id);
  const key = (id, value) => get(id).dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  const selected = (id) => get(id).getAttribute('aria-selected') === 'true';
  await check('Without enhancement, tab panels remain readable', () => {
    assert(!get('test-one').hidden && !get('test-two').hidden, 'Panels were hidden');
    assert(fixtures.querySelector('[data-tvw-tablist]').hidden, 'Controls should start hidden');
  });
  init(fixtures);
  await check('Tabs expose roles, labels, and one selected panel', () => {
    assert(selected('test-a') && !get('test-one').hidden && get('test-two').hidden, 'Wrong initial selection');
    assert(get('test-one').getAttribute('aria-labelledby') === 'test-a', 'Missing panel label');
    assert(get('test-one').getAttribute('role') === 'tabpanel', 'Missing panel role');
    assert(get('test-a').tabIndex === 0 && get('test-b').tabIndex === -1, 'Wrong tab order');
  });
  await check('Click selection stays within its tab group', () => {
    get('test-b').click();
    assert(selected('test-b') && !get('test-two').hidden && get('test-one').hidden, 'Selection did not change');
    assert(selected('other-a'), 'Other group changed');
  });
  await check('Arrow keys select, move focus, and wrap', () => {
    key('test-b', 'ArrowRight');
    assert(selected('test-c') && document.activeElement === get('test-c'), 'Forward movement failed');
    key('test-c', 'ArrowRight');
    assert(selected('test-a'), 'Wrapping failed');
    key('test-a', 'ArrowLeft');
    assert(selected('test-c'), 'Backward wrapping failed');
  });
  await check('Home and End select the boundary tabs', () => {
    key('test-c', 'Home'); assert(selected('test-a'), 'Home failed');
    key('test-a', 'End'); assert(selected('test-c'), 'End failed');
  });
  await check('Right-to-left tabs reverse horizontal arrow movement', () => {
    const list = get('test-a').parentElement;
    list.dir = 'rtl';
    key('test-c', 'ArrowRight'); assert(selected('test-b'), 'RTL movement failed');
    list.dir = 'ltr';
  });
  await check('Vertical tabs use Up and Down', () => {
    const list = get('test-a').parentElement;
    list.setAttribute('aria-orientation', 'vertical');
    key('test-b', 'ArrowDown'); assert(selected('test-c'), 'Down failed');
    key('test-c', 'ArrowUp'); assert(selected('test-b'), 'Up failed');
    list.removeAttribute('aria-orientation');
  });
  await check('Repeated initialization preserves selection', () => {
    init(fixtures); init(fixtures);
    assert(selected('test-b'), 'Selection reset');
  });
  await check('New descendants can be initialized later', () => {
    fixtures.insertAdjacentHTML('beforeend', tabs('late'));
    init(fixtures);
    assert(selected('late-a'), 'New group not initialized');
  });
  await check('Malformed tab markup is left unenhanced', () => {
    const container = document.createElement('div');
    container.innerHTML = '<div data-tvw-tabs><div data-tvw-tablist hidden><button id="broken" aria-controls="missing">Broken</button></div></div>';
    fixtures.append(container);
    init(container);
    assert(!get('broken').hasAttribute('role'), 'Partial enhancement');
  });
  await check('Dialog opens modally and restores focus on close', async () => {
    const opener = fixtures.querySelector('[data-tvw-open]');
    const dialog = get('test-dialog');
    assert(!opener.hidden, 'Opener not revealed');
    opener.click();
    assert(dialog.open && dialog.matches(':modal'), 'Dialog did not open modally');
    assert(dialog.contains(document.activeElement), 'Focus did not enter dialog');
    dialog.querySelector('button').click();
    await frame(); await frame();
    assert(!dialog.open && document.activeElement === opener, 'Focus did not return');
  });
  await runExtendedChecks(check, fixtures);
  await runWorkflowChecks(check, fixtures);
  fixtures.replaceChildren();
  summary.textContent = `${passed} passed, ${failed} failed.`;
  summary.dataset.failures = String(failed);
  run.disabled = false;
  run.focus();
});
