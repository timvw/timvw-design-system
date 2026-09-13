/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { translate as t } from './locale.js?v=0.8.0';
const editors = new WeakMap(), commands = new WeakMap();
export const getEditor = element => editors.get(element);
export const getCommands = element => commands.get(element);
export function initInteractions(root = document) {
  root.querySelectorAll('[data-tvw-editor]').forEach(wrapper => {
    if (editors.has(wrapper)) return;
    const form = wrapper.querySelector('form'), output = wrapper.querySelector('[data-tvw-value]');
    const input = form?.querySelector('[data-tvw-edit-input]'), edit = wrapper.querySelector('[data-tvw-edit]');
    const cancel = form?.querySelector('[data-tvw-edit-cancel]'), status = wrapper.querySelector('[data-tvw-edit-status]');
    if (!form || !input || !edit || !output || !cancel || !status) return;
    let save, busy = false;
    form.hidden = true; edit.hidden = false;
    function close() { form.hidden = true; output.hidden = false; edit.hidden = false; edit.focus(); }
    edit.addEventListener('click', () => { input.value = output.textContent; form.hidden = false; output.hidden = true; edit.hidden = true; status.textContent = ''; input.focus(); });
    cancel.addEventListener('click', () => { if (!busy) { status.textContent = ''; close(); } });
    form.addEventListener('keydown', event => { if (event.key === 'Escape' && !busy) { event.preventDefault(); event.stopPropagation(); cancel.click(); } });
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (busy || !form.reportValidity()) return;
      busy = true; form.setAttribute('aria-busy', 'true'); const value = input.value;
      const fields = [...form.elements].map(field => [field, field.disabled]); fields.forEach(([field]) => { field.disabled = true; });
      let success = false;
      try { if (save) await save(value); output.textContent = value; status.textContent = t('saved', {}, wrapper); success = true; }
      catch { status.textContent = t('saveFailed', {}, wrapper); }
      finally { busy = false; form.removeAttribute('aria-busy'); fields.forEach(([field, disabled]) => { field.disabled = disabled; }); }
      if (success) {
        close(); wrapper.dispatchEvent(new CustomEvent('tvw:edited', { bubbles: true, detail: { value } }));
      } else input.focus();
    });
    editors.set(wrapper, { configure({ save: callback } = {}) { if (callback != null && typeof callback !== 'function') throw new TypeError('save must be a function'); save = callback; } });
  });
  root.querySelectorAll('dialog[data-tvw-commands]').forEach(dialog => {
    if (commands.has(dialog)) return;
    const input = dialog.querySelector('[data-tvw-command-search]'), status = dialog.querySelector('[data-tvw-command-status]');
    if (!input || !status) return;
    const items = [...dialog.querySelectorAll('[data-tvw-command]')]; let visible = [], active = -1, opener;
    function highlight(index) { active = index; items.forEach(item => item.toggleAttribute('data-active', visible[index] === item)); visible[index]?.scrollIntoView({ block: 'nearest' }); if (index >= 0) visible[index]?.focus(); }
    function filter() {
      const query = input.value.trim().toLocaleLowerCase();
      items.forEach(item => { item.closest('li').hidden = !item.textContent.toLocaleLowerCase().includes(query); });
      visible = items.filter(item => !item.closest('li').hidden && !item.disabled);
      highlight(-1); status.textContent = t('commands', { count: visible.length }, dialog);
    }
    function open() { if (dialog.open || document.querySelector('dialog:modal')) return; opener = document.activeElement; input.value = ''; filter(); dialog.showModal(); input.focus(); }
    dialog.addEventListener('close', () => { items.forEach(item => item.removeAttribute('data-active')); opener?.isConnected && opener.focus(); });
    input.addEventListener('input', filter);
    dialog.addEventListener('keydown', event => {
      if (event.target !== input && !event.target.matches('[data-tvw-command]')) return;
      active = visible.indexOf(document.activeElement);
      if (event.isComposing) return;
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); highlight(event.key === 'ArrowDown' ? Math.min(active + 1, visible.length - 1) : active < 0 ? visible.length - 1 : Math.max(0, active - 1)); }
      if (event.key === 'Enter' && event.target === input) { event.preventDefault(); visible[active]?.click(); }
    });
    items.forEach(item => item.addEventListener('click', () => { if (!item.disabled) dialog.close(); }));
    document.addEventListener('keydown', event => {
      if (!dialog.isConnected || event.isComposing || event.repeat || event.altKey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      if (document.querySelector('dialog:modal')) return;
      event.preventDefault(); open();
    });
    document.querySelectorAll('[data-tvw-command-open]').forEach(button => {
      if (button.dataset.tvwCommandOpen !== dialog.id) return;
      button.hidden = false; button.addEventListener('click', open);
    });
    commands.set(dialog, { open });
  });
}
