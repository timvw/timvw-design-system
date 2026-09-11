/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init, setTheme, getTheme, setBusy, getTable, notify } from '../js/timvw.js';
const assert = (value, message) => { if (!value) throw new Error(message); };
// Browser close/toggle events and animation frames use different task queues.
// Wait for the observable result instead of assuming they finish within 40 ms.
export async function waitFor(predicate, message) {
  const deadline = performance.now() + 2000;
  while (!predicate()) {
    assert(performance.now() < deadline, message);
    await new Promise(resolve => setTimeout(resolve, 16));
  }
}

export async function runExtendedChecks(check, fixtures) {
  await check('Busy buttons restore original content, listeners, and disabled state', () => {
    const button = document.createElement('button'); const child = document.createElement('span'); child.textContent = 'Save';
    let clicks = 0; child.addEventListener('click', () => { clicks++; }); button.append(child); fixtures.append(button);
    setBusy(button, true); setBusy(button, true);
    assert(button.disabled && button.getAttribute('aria-busy') === 'true', 'Missing loading state');
    setBusy(button, false); child.click();
    assert(!button.disabled && button.firstChild === child && clicks === 1, 'Original content was not preserved');
  });
  await check('Multiple theme pickers stay synchronized', () => {
    const previous = getTheme();
    const holder = document.createElement('div');
    holder.innerHTML = Array.from({ length: 2 }, () => '<div data-tvw-theme-picker hidden><button data-theme="light">Light</button><button data-theme="dark">Dark</button><button data-theme="system">System</button></div>').join('');
    fixtures.append(holder); init(holder);
    holder.querySelector('[data-theme="dark"]').click();
    assert(holder.querySelectorAll('[data-theme="dark"][aria-pressed="true"]').length === 2, 'Pickers differ');
    assert(document.documentElement.dataset.tvwTheme === 'dark', 'Theme was not applied');
    setTheme(previous);
  });
  await check('Password visibility toggles without changing the value', () => {
    const holder = document.createElement('div'); holder.innerHTML = '<input id="ext-password" type="password" value="example"><button data-tvw-password aria-controls="ext-password" hidden>Show password</button>';
    fixtures.append(holder); init(holder); const button = holder.querySelector('button'), input = holder.querySelector('input');
    button.click(); assert(input.type === 'text' && input.value === 'example', 'Show failed');
    button.click(); assert(input.type === 'password' && input.value === 'example', 'Hide failed');
  });
  await check('Validation blocks invalid forms, links errors, and emits valid submissions', () => {
    const holder = document.createElement('div'); holder.innerHTML = '<form data-tvw-validate><div data-tvw-errors tabindex="-1" hidden></div><div class="tvw-field"><label for="ext-email">Email</label><input id="ext-email" name="email" type="email" required aria-describedby="ext-help"><span id="ext-help">Help</span></div><button>Submit</button></form>';
    fixtures.append(holder); init(holder); const form = holder.querySelector('form'), input = holder.querySelector('input'), summary = holder.querySelector('[data-tvw-errors]');
    let valid = 0; form.addEventListener('tvw:valid-submit', event => { event.preventDefault(); valid++; });
    form.requestSubmit(); assert(valid === 0 && !summary.hidden && input.getAttribute('aria-invalid') === 'true', 'Invalid submission passed');
    summary.querySelector('a').click(); assert(document.activeElement === input, 'Error link did not focus input');
    input.value = 'test@example.com'; input.dispatchEvent(new Event('input', { bubbles: true })); form.requestSubmit();
    assert(valid === 1 && summary.hidden && input.getAttribute('aria-describedby') === 'ext-help', 'Valid state not restored');
  });
  await check('Tables sort numerically, paginate, and preserve selection through filters', () => {
    const holder = document.createElement('div');
    holder.innerHTML = '<div data-tvw-table data-page-size="2"><input data-tvw-search><span data-tvw-result-count></span><span data-tvw-selection-count></span><table><thead><tr><th><input type="checkbox" data-tvw-select-all></th><th><button data-tvw-sort="number">Value</button></th></tr></thead><tbody>'+[20,3,100].map((n,i)=>`<tr><td><input type="checkbox" data-tvw-row-select value="${i}"></td><td data-sort-value="${n}">${n}</td></tr>`).join('')+'</tbody></table><nav data-tvw-pagination></nav><div data-tvw-empty hidden>No results</div></div>';
    fixtures.append(holder); init(holder); const container = holder.firstElementChild, search = holder.querySelector('input[data-tvw-search]');
    holder.querySelector('[data-tvw-sort]').click();
    assert(holder.querySelector('tbody tr:not([hidden])').cells[1].textContent === '3', 'Not sorted numerically');
    holder.querySelector('[data-tvw-select-all]').click();
    assert(getTable(container).getSelected().length === 2, 'Page selection failed');
    search.value = 'nothing'; search.dispatchEvent(new Event('input'));
    assert(!holder.querySelector('[data-tvw-empty]').hidden && getTable(container).getSelected().length === 2, 'Selection lost or empty state missing');
    search.value = ''; search.dispatchEvent(new Event('input')); getTable(container).clearSelection();
    assert(getTable(container).getSelected().length === 0, 'Selection did not clear');
    [...holder.querySelectorAll('nav button')].find(button => button.textContent === 'Next').click();
    assert(holder.querySelector('tbody tr:not([hidden])').cells[1].textContent === '100', 'Wrong second page');
  });
  await check('Menus move focus, skip disabled items, and close with Escape', async () => {
    const holder = document.createElement('div'); holder.innerHTML = '<button popovertarget="ext-menu">Actions</button><div id="ext-menu" class="tvw-menu" popover data-tvw-menu role="menu"><button role="menuitem">First</button><button role="menuitem" disabled>Disabled</button><button role="menuitem">Last</button></div>';
    fixtures.append(holder); init(holder); const trigger = holder.firstElementChild, menu = holder.lastElementChild;
    trigger.click(); await waitFor(() => document.activeElement === menu.firstElementChild, 'First item not focused');
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    assert(document.activeElement.textContent === 'Last', 'Disabled item not skipped');
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert(!menu.matches(':popover-open') && document.activeElement === trigger, 'Escape did not restore focus');
  });
  await check('Dialogs opened from a menu restore focus to the visible menu trigger', async () => {
    const holder = document.createElement('div');
    holder.innerHTML = '<button popovertarget="ext-dialog-menu">Actions</button><div id="ext-dialog-menu" class="tvw-menu" popover data-tvw-menu role="menu"><button role="menuitem" data-tvw-open="ext-menu-dialog">Edit</button></div><dialog id="ext-menu-dialog" aria-label="Edit"><form method="dialog"><button>Close</button></form></dialog>';
    fixtures.append(holder); init(holder);
    const trigger = holder.firstElementChild, dialog = holder.querySelector('dialog');
    trigger.click(); await waitFor(() => document.activeElement === holder.querySelector('[role="menuitem"]'), 'Menu did not receive focus');
    holder.querySelector('[role="menuitem"]').click();
    assert(dialog.open && dialog.contains(document.activeElement), 'Dialog did not receive focus');
    dialog.querySelector('button').click(); await waitFor(() => document.activeElement === trigger, 'Focus did not return to visible trigger');
    assert(document.activeElement === trigger, 'Focus did not return to visible trigger');
  });
  await check('Tooltips appear on focus and dismiss with Escape', async () => {
    const holder = document.createElement('div'); holder.innerHTML = '<span data-tvw-tooltip><button aria-describedby="ext-tip">Information</button><span class="tvw-tooltip" id="ext-tip" role="tooltip" popover="manual">More information</span></span>';
    fixtures.append(holder); init(holder); holder.querySelector('button').focus();
    assert(holder.querySelector('[role="tooltip"]').matches(':popover-open'), 'Tooltip not shown');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert(!holder.querySelector('[role="tooltip"]').matches(':popover-open'), 'Tooltip not dismissed');
  });
  await check('Notification messages are treated as text and can be dismissed', async () => {
    const dismiss = notify('<b>Plain text</b>');
    const toast = [...document.querySelectorAll('.tvw-toast')].at(-1);
    await waitFor(() => toast.querySelector('[role="status"]').textContent !== '', 'Notification text was not populated');
    assert(toast.querySelector('[role="status"]').textContent === '<b>Plain text</b>' && !toast.querySelector('b'), 'Message interpreted as HTML');
    dismiss(); assert(!toast.isConnected, 'Notification did not dismiss');
  });
}
