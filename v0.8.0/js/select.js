/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { translate as t } from './locale.js?v=0.8.0';
const controllers = new WeakMap();
let sequence = 0;
export const getCombobox = element => controllers.get(element);

/** Progressive enhancement of a labeled native select, including multiple selection. */
export function initSelects(root = document) {
  root.querySelectorAll('[data-tvw-combobox]').forEach(wrapper => {
    if (controllers.has(wrapper)) return;
    const select = wrapper.querySelector('select');
    if (!select || !('showPopover' in HTMLElement.prototype)) return;
    const multiple = select.multiple, required = select.required;
    const initialOptions = [...select.children].map(node => node.cloneNode(true));
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
    input.placeholder = wrapper.dataset.placeholder || t(multiple ? 'searchAdd' : 'searchOptions', {}, wrapper);
    const list = document.createElement('div'); list.className = 'tvw-combobox-list';
    list.id = `${uid}-list`; list.popover = 'manual'; list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', labels.map(label => label.textContent.trim()).join(' ') || select.getAttribute('aria-label') || t('options', {}, wrapper));
    const chips = document.createElement('div'); chips.className = 'tvw-cluster tvw-combobox-chips';
    const status = document.createElement('span'); status.className = 'tvw-help'; status.setAttribute('role', 'status');
    wrapper.append(chips, input, list, status);
    select.hidden = true; select.required = false; select.dataset.tvwProxy = input.id;
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'tvw-button tvw-button--secondary tvw-button--sm'; retry.textContent = t('retry', {}, wrapper); retry.hidden = true; wrapper.append(retry);
    retry.addEventListener('click', () => { input.focus(); requestOptions(input.value, true); });
    let loader, delay = 200, minLength = 0, timer, request, revision = 0;
    let active = -1, matches = [], stop;
    const selected = () => [...select.selectedOptions].filter(option => option.value);
    const available = () => [...select.options].filter(option => option.value && !option.disabled && !option.parentElement.disabled && (!multiple || !option.selected));
    const valid = () => input.setCustomValidity(required && !selected().length ? t('choose', {}, wrapper) : '');
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
      [...list.querySelectorAll('[role="option"]')].forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
      if (active < 0 || !matches[active]) { input.removeAttribute('aria-activedescendant'); return; }
      const item = list.querySelectorAll('[role="option"]')[active];
      input.setAttribute('aria-activedescendant', item.id);
      item.scrollIntoView({ block: 'nearest' });
    }
    function render(query = '') {
      matches = available().filter(option => option.text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
      list.replaceChildren(); active = -1; input.removeAttribute('aria-activedescendant');
      const groups = new Map();
      matches.forEach((option, i) => {
        const item = document.createElement('div'); item.id = `${uid}-option-${i}`;
        item.setAttribute('role', 'option'); item.setAttribute('aria-selected', 'false'); item.textContent = option.text;
        item.addEventListener('pointerdown', event => event.preventDefault());
        // Preserve input focus through compatibility mouse events after a tap.
        // WebKit can otherwise blur/hide the list before the option's click.
        item.addEventListener('mousedown', event => event.preventDefault());
        item.addEventListener('click', () => choose(option));
        const groupName = option.parentElement.tagName === 'OPTGROUP' ? option.parentElement.label : '';
        if (groupName) {
          if (!groups.has(groupName)) {
            const group = document.createElement('div'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', groupName);
            const heading = document.createElement('div'); heading.className = 'tvw-option-group'; heading.textContent = groupName; heading.setAttribute('aria-hidden', 'true');
            group.append(heading); groups.set(groupName, group); list.append(group);
          }
          groups.get(groupName).append(item);
        } else list.append(item);
      });
      status.textContent = t(matches.length ? 'available' : 'noOptions', { count: matches.length }, wrapper);
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
        chip.textContent = `${option.text} ×`; chip.disabled = select.disabled || option.disabled || option.parentElement.disabled;
        chip.setAttribute('aria-label', t('removeName', { name: option.text }, wrapper));
        chip.addEventListener('click', () => {
          option.selected = false; changed(); input.focus(); close();
          status.textContent = t('removed', { name: option.text, count: selected().length }, wrapper);
        }); chips.append(chip);
      });
      valid();
    }
    function changed() { sync(); select.dispatchEvent(new Event('change', { bubbles: true })); }
    function choose(option) {
      if (multiple) option.selected = true; else select.value = option.value;
      changed(); close(); status.textContent = t('selected', { name: option.text }, wrapper) + (multiple ? ` ${t('selectedCount', { count: selected().length }, wrapper)}` : '');
    }
    function cancelRequest() { revision++; clearTimeout(timer); request?.abort(); request = undefined; input.removeAttribute('aria-busy'); }
    function requestOptions(query = '', immediate = false) {
      if (!loader) { render(query); return; }
      cancelRequest(); close(); retry.hidden = true;
      if (query.length < minLength) { status.textContent = t('noOptions', {}, wrapper); return; }
      const run = revision;
      status.textContent = t('loading', {}, wrapper); input.setAttribute('aria-busy', 'true');
      timer = setTimeout(async () => {
        const controller = new AbortController(); request = controller;
        try {
          const options = await loader(query, { signal: controller.signal });
          if (controller.signal.aborted || run !== revision) return;
          if (!Array.isArray(options) || options.some(option => !option || typeof option.value !== 'string' || typeof option.label !== 'string')) throw new TypeError('Options need string values and labels');
          const retained = selected().map(option => ({ value: option.value, label: option.text, selected: true }));
          const values = new Set(); const groups = new Map(); select.replaceChildren();
          for (const item of [...retained, ...options]) {
            if (!item.value || values.has(item.value)) continue;
            values.add(item.value); const option = new Option(item.label, item.value, false, Boolean(item.selected)); option.disabled = Boolean(item.disabled);
            if (item.group) {
              if (!groups.has(item.group)) { const group = document.createElement('optgroup'); group.label = String(item.group); select.append(group); groups.set(item.group, group); }
              groups.get(item.group).append(option);
            } else select.append(option);
          }
          if (!multiple && !retained.length) select.selectedIndex = -1;
          valid(); if (document.activeElement === input) render(query);
        } catch (error) {
          if (!controller.signal.aborted && run === revision) { status.textContent = t('remoteFailed', {}, wrapper); retry.hidden = false; }
        } finally { if (run === revision) input.removeAttribute('aria-busy'); }
      }, immediate ? 0 : delay);
    }
    select.closest('dialog')?.addEventListener('close', () => { cancelRequest(); close(); });
    input.addEventListener('focus', () => requestOptions());
    input.addEventListener('click', () => { if (!list.matches(':popover-open') && !input.hasAttribute('aria-busy')) requestOptions(); });
    input.addEventListener('input', () => {
      if (!multiple) { select.selectedIndex = -1; valid(); select.dispatchEvent(new Event('input', { bubbles: true })); }
      requestOptions(input.value);
    });
    input.addEventListener('blur', () => { cancelRequest(); close(); if (!multiple) { input.value = selected()[0]?.text || ''; valid(); } });
    input.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!list.matches(':popover-open')) { if (loader) { requestOptions(input.value, true); return; } render(multiple ? input.value : ''); }
        highlight(event.key === 'ArrowDown' ? Math.min(active + 1, matches.length - 1) : active < 0 ? matches.length - 1 : Math.max(active - 1, 0));
      } else if (event.key === 'Enter' && list.matches(':popover-open')) {
        event.preventDefault(); if (active >= 0) choose(matches[active]);
      } else if (event.key === 'Escape' && (list.matches(':popover-open') || input.hasAttribute('aria-busy'))) {
        event.preventDefault(); event.stopPropagation(); cancelRequest(); close();
      } else if (event.key === 'Tab') close();
    });
    select.addEventListener('change', sync);
    select.form?.addEventListener('reset', () => queueMicrotask(() => { cancelRequest(); close(); if (loader) select.replaceChildren(...initialOptions.map(node => node.cloneNode(true))); sync(); retry.hidden = true; status.textContent = ''; }));
    controllers.set(wrapper, { refresh() { cancelRequest(); close(); sync(); }, getValues: () => selected().map(option => option.value),
      configure({ loadOptions, debounce = 200, minimumLength = 0 } = {}) {
        if (loadOptions != null && typeof loadOptions !== 'function') throw new TypeError('loadOptions must be a function');
        cancelRequest(); loader = loadOptions; delay = Math.max(0, Number(debounce) || 0); minLength = Math.max(0, Number(minimumLength) || 0);
      }
    });
    sync();
  });
}
