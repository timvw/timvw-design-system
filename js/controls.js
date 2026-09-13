/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const enhanced = new WeakSet();
const busyButtons = new WeakMap();
let preference;
let mode = 'system';
import { translate as t } from './locale.js?v=0.8.0';

function applyTheme() {
  const resolved = mode === 'system' ? (preference.matches ? 'dark' : 'light') : mode;
  document.documentElement.dataset.tvwTheme = resolved;
  document.querySelectorAll('[data-tvw-theme-picker] [data-theme]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === mode));
  });
  document.dispatchEvent(new CustomEvent('tvw:themechange', { detail: { mode, resolved } }));
}

function startTheme() {
  if (preference) return;
  preference = matchMedia('(prefers-color-scheme: dark)');
  try {
    const saved = localStorage.getItem('tvw-theme');
    if (['light', 'dark', 'system'].includes(saved)) mode = saved;
  } catch { /* Preferences work even when storage is blocked. */ }
  preference.addEventListener('change', applyTheme);
}

export function setTheme(value) {
  if (!['light', 'dark', 'system'].includes(value)) throw new TypeError('Unknown theme');
  startTheme();
  mode = value;
  try { localStorage.setItem('tvw-theme', mode); } catch { /* Optional persistence. */ }
  applyTheme();
}

export function getTheme() { startTheme(); return mode; }

/** Preserve the original label, child listeners, disabled state, and busy attribute. */
export function setBusy(button, busy, label = t('working', {}, button)) {
  if (busy && !busyButtons.has(button)) {
    busyButtons.set(button, { nodes: [...button.childNodes], disabled: button.disabled, busy: button.getAttribute('aria-busy') });
    button.textContent = label;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else if (!busy && busyButtons.has(button)) {
    const saved = busyButtons.get(button);
    button.replaceChildren(...saved.nodes);
    button.disabled = saved.disabled;
    if (saved.busy === null) button.removeAttribute('aria-busy');
    else button.setAttribute('aria-busy', saved.busy);
    busyButtons.delete(button);
  }
}

export function initControls(root = document) {
  root.querySelectorAll('[data-tvw-theme-picker]').forEach(picker => {
    if (enhanced.has(picker)) return;
    enhanced.add(picker); startTheme();
    picker.querySelectorAll('[data-theme]').forEach(button => {
      button.addEventListener('click', () => setTheme(button.dataset.theme));
    });
    picker.hidden = false; applyTheme();
  });
  root.querySelectorAll('[data-tvw-password]').forEach(button => {
    if (enhanced.has(button)) return;
    const input = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
    if (!input || input.type !== 'password') return;
    enhanced.add(button); button.hidden = false;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = t(visible ? 'hidePassword' : 'showPassword', {}, button);
      button.setAttribute('aria-pressed', String(visible));
    });
  });
  root.querySelectorAll('[data-tvw-app]').forEach(app => {
    if (enhanced.has(app)) return;
    const toggle = app.querySelector('[data-tvw-nav-toggle]');
    const nav = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
    if (!nav || !app.contains(nav)) return;
    enhanced.add(app); app.dataset.tvwEnhanced = ''; toggle.hidden = false;
    function close() { app.removeAttribute('data-nav-open'); toggle.setAttribute('aria-expanded', 'false'); }
    close();
    toggle.addEventListener('click', () => {
      const open = !app.hasAttribute('data-nav-open');
      app.toggleAttribute('data-nav-open', open); toggle.setAttribute('aria-expanded', String(open));
    });
    app.addEventListener('keydown', event => {
      if (event.key === 'Escape' && app.hasAttribute('data-nav-open')) { close(); toggle.focus(); }
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    matchMedia('(min-width: 52rem)').addEventListener('change', close);
  });
}
