/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const initializedTabs = new WeakSet();
const initializedTriggers = new WeakSet();
const initializedDialogs = new WeakSet();
const openers = new WeakMap();

/** Enhance tabs and dialog triggers within a Document or Element. Safe to call again. */
export function init(root = document) {
  root.querySelectorAll('[data-tvw-tabs]').forEach((group) => {
    if (initializedTabs.has(group)) return;
    const list = group.querySelector('[data-tvw-tablist]');
    if (!list) return;
    const buttons = [...list.querySelectorAll('button[aria-controls]')];
    const panels = buttons.map((button) => group.ownerDocument.getElementById(button.getAttribute('aria-controls')));
    if (!buttons.length || panels.some((panel) => !panel || !group.contains(panel)) || buttons.some((button) => !button.id)) return;
    initializedTabs.add(group);
    list.setAttribute('role', 'tablist');
    const select = (index, focus = false) => {
      buttons.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) buttons[index].focus();
    };
    buttons.forEach((button, index) => {
      button.setAttribute('role', 'tab');
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', button.id);
      panels[index].tabIndex = 0;
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', (event) => {
        const vertical = list.getAttribute('aria-orientation') === 'vertical';
        const rtl = getComputedStyle(list).direction === 'rtl';
        let next;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (event.key === (vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight')) next = (index + 1) % buttons.length;
        if (event.key === (vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft')) next = (index - 1 + buttons.length) % buttons.length;
        if (next !== undefined) { event.preventDefault(); select(next, true); }
      });
    });
    select(0);
    list.hidden = false;
  });

  root.querySelectorAll('[data-tvw-open]').forEach((button) => {
    if (initializedTriggers.has(button)) return;
    const dialog = button.ownerDocument.getElementById(button.dataset.tvwOpen);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    initializedTriggers.add(button);
    button.hidden = false;
    button.addEventListener('click', () => {
      if (dialog.open) return;
      openers.set(dialog, button);
      dialog.showModal();
    });
    if (!initializedDialogs.has(dialog)) {
      initializedDialogs.add(dialog);
      dialog.addEventListener('close', () => {
        const opener = openers.get(dialog);
        if (opener?.isConnected) opener.focus();
        openers.delete(dialog);
      });
    }
  });
}
