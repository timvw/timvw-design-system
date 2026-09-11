/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const controllers = new WeakMap();
let sequence = 0;
export const getCombobox = element => controllers.get(element);

/** Progressive enhancement of a labeled native select, including multiple selection. */
export function initSelects(root) {
  root.querySelectorAll('[data-tvw-combobox]').forEach(wrapper => {
    if (controllers.has(wrapper)) return;
    const select = wrapper.querySelector('select');
    if (!select || !('showPopover' in HTMLElement.prototype)) return;
    const multiple = select.multiple, required = select.required;
    const uid = `tvw-combo-${++sequence}`;
    const labels = [...select.labels];
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'tvw-input'; input.id = `${uid}-input`;
    input.autocomplete = 'off'; input.spellcheck = false;
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', `${uid}-list`);
    input.setAttribute('aria-required', String(required));
    for (const attr of ['aria-label', 'aria-labelledby', 'aria-describedby']) {
      if (select.hasAttribute(attr)) input.setAttribute(attr, select.getAttribute(attr));
    }
    labels.forEach(label => { label.htmlFor = input.id; });
    input.placeholder = wrapper.dataset.placeholder || (multiple ? 'Search and add…' : 'Search options…');
    const list = document.createElement('div'); list.className = 'tvw-combobox-list';
    list.id = `${uid}-list`; list.popover = 'manual'; list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', labels.map(label => label.textContent.trim()).join(' ') || select.getAttribute('aria-label') || 'Options');
    const chips = document.createElement('div'); chips.className = 'tvw-cluster tvw-combobox-chips';
    const status = document.createElement('span'); status.className = 'tvw-help'; status.setAttribute('role', 'status');
    wrapper.append(chips, input, list, status);
    select.hidden = true; select.required = false;
    let active = -1, matches = [], stop;
    const selected = () => [...select.selectedOptions].filter(option => option.value);
    const available = () => [...select.options].filter(option => option.value && !option.disabled && !option.parentElement.disabled && (!multiple || !option.selected));
    const valid = () => input.setCustomValidity(required && !selected().length ? 'Choose an option from the list.' : '');
    function position() {
      const rect = input.getBoundingClientRect();
      list.style.width = `${Math.min(rect.width, innerWidth - 32)}px`;
      list.style.left = `${Math.max(16, Math.min(rect.left, innerWidth - list.offsetWidth - 16))}px`;
      const space = innerHeight - rect.bottom - 16;
      const above = space < Math.min(240, list.scrollHeight) && rect.top > space;
      list.style.maxHeight = `${Math.max(60, Math.min(280, above ? rect.top - 16 : space))}px`;
      list.style.top = `${above ? Math.max(8, rect.top - list.offsetHeight - 6) : rect.bottom + 6}px`;
    }
    function close() {
      if (list.matches(':popover-open')) list.hidePopover();
      stop?.abort(); stop = null; active = -1;
      input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
    }
    function highlight(index) {
      active = index;
      [...list.children].forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
      if (active < 0 || !matches[active]) { input.removeAttribute('aria-activedescendant'); return; }
      input.setAttribute('aria-activedescendant', list.children[active].id);
      list.children[active].scrollIntoView({ block: 'nearest' });
    }
    function render(query = '') {
      matches = available().filter(option => option.text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
      list.replaceChildren(); active = -1; input.removeAttribute('aria-activedescendant');
      matches.forEach((option, i) => {
        const item = document.createElement('div'); item.id = `${uid}-option-${i}`;
        item.setAttribute('role', 'option'); item.setAttribute('aria-selected', 'false'); item.textContent = option.text;
        item.addEventListener('pointerdown', event => event.preventDefault());
        item.addEventListener('click', () => choose(option)); list.append(item);
      });
      status.textContent = `${matches.length} ${matches.length === 1 ? 'option' : 'options'} available${matches.length ? '.' : '. Try another search.'}`;
      if (!matches.length) { close(); return; }
      if (!list.matches(':popover-open')) {
        list.showPopover(); stop = new AbortController();
        addEventListener('resize', position, { signal: stop.signal });
        document.addEventListener('scroll', position, { capture: true, signal: stop.signal });
      }
      input.setAttribute('aria-expanded', 'true'); position();
    }
    function sync() {
      input.disabled = select.disabled;
      input.value = multiple ? '' : selected()[0]?.text || '';
      chips.replaceChildren(); chips.hidden = !multiple || !selected().length;
      selected().forEach(option => {
        if (!multiple) return;
        const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'tvw-chip';
        chip.textContent = `${option.text} ×`; chip.disabled = select.disabled || option.disabled;
        chip.setAttribute('aria-label', `Remove ${option.text}`);
        chip.addEventListener('click', () => {
          option.selected = false; changed(); input.focus(); close();
          status.textContent = `${option.text} removed. ${selected().length} selected.`;
        }); chips.append(chip);
      });
      valid();
    }
    function changed() { sync(); select.dispatchEvent(new Event('change', { bubbles: true })); }
    function choose(option) {
      if (multiple) option.selected = true; else select.value = option.value;
      changed(); close(); status.textContent = `${option.text} selected${multiple ? `. ${selected().length} selected` : ''}.`;
    }
    select.closest('dialog')?.addEventListener('close', close);
    input.addEventListener('focus', () => render());
    input.addEventListener('click', () => { if (!list.matches(':popover-open')) render(); });
    input.addEventListener('input', () => {
      if (!multiple) { select.selectedIndex = -1; valid(); select.dispatchEvent(new Event('input', { bubbles: true })); }
      render(input.value);
    });
    input.addEventListener('blur', () => { close(); if (!multiple) { input.value = selected()[0]?.text || ''; valid(); } });
    input.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!list.matches(':popover-open')) render(multiple ? input.value : '');
        highlight(event.key === 'ArrowDown' ? Math.min(active + 1, matches.length - 1) : active < 0 ? matches.length - 1 : Math.max(active - 1, 0));
      } else if (event.key === 'Enter' && list.matches(':popover-open')) {
        event.preventDefault(); if (active >= 0) choose(matches[active]);
      } else if (event.key === 'Escape' && list.matches(':popover-open')) {
        event.preventDefault(); event.stopPropagation(); close();
      } else if (event.key === 'Tab') close();
    });
    select.addEventListener('change', sync);
    select.form?.addEventListener('reset', () => queueMicrotask(() => { close(); sync(); status.textContent = ''; }));
    controllers.set(wrapper, { refresh() { close(); sync(); }, getValues: () => selected().map(option => option.value) });
    sync();
  });
}
