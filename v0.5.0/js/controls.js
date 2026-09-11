/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const enhanced = new WeakSet();
const busyButtons = new WeakMap();
let preference;
let mode = 'system';
let fieldSequence = 0;

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
export function setBusy(button, busy, label = 'Working…') {
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

function validation(form) {
  const summary = form.querySelector('[data-tvw-errors]');
  if (!summary) return;
  form.noValidate = true;
  let attempted = false;
  const messages = new Map();
  const validate = () => {
    const invalid = [];
    [...form.elements].filter(field => field.willValidate).forEach(field => {
      if (!field.id) {
        do { field.id = `tvw-field-${++fieldSequence}`; } while (document.querySelectorAll(`[id="${field.id}"]`).length > 1);
      }
      let message = messages.get(field);
      if (!message) {
        message = document.createElement('span');
        message.id = `${field.id}-validation`;
        message.className = 'tvw-error';
        message.hidden = true;
        (field.closest('.tvw-field') || field.parentElement).append(message);
        messages.set(field, message);
      }
      const valid = field.validity.valid;
      field.setAttribute('aria-invalid', String(!valid));
      const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      if (valid) descriptions.delete(message.id); else descriptions.add(message.id);
      if (descriptions.size) field.setAttribute('aria-describedby', [...descriptions].join(' '));
      else field.removeAttribute('aria-describedby');
      message.hidden = valid;
      message.textContent = valid ? '' : field.validationMessage;
      if (!valid) invalid.push(field);
    });
    summary.replaceChildren();
    summary.hidden = !invalid.length;
    if (invalid.length) {
      const heading = document.createElement('p');
      heading.textContent = `Please correct ${invalid.length} ${invalid.length === 1 ? 'field' : 'fields'}.`;
      const list = document.createElement('ul');
      invalid.forEach(field => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${field.id}`;
        link.textContent = `${field.labels?.[0]?.textContent.trim() || field.name || 'Field'}: ${field.validationMessage}`;
        link.addEventListener('click', event => { event.preventDefault(); field.focus(); });
        item.append(link); list.append(item);
      });
      summary.append(heading, list);
    }
    return invalid.length === 0;
  };
  form.addEventListener('submit', event => {
    attempted = true;
    if (!validate()) { event.preventDefault(); summary.focus(); return; }
    // Consumers cancel this event to handle a valid form locally. Otherwise submit normally.
    if (!form.dispatchEvent(new CustomEvent('tvw:valid-submit', {
      bubbles: true, cancelable: true, detail: { formData: new FormData(form) },
    }))) event.preventDefault();
  });
  form.addEventListener('input', () => { if (attempted) validate(); });
  form.addEventListener('change', () => { if (attempted) validate(); });
  form.addEventListener('reset', () => {
    attempted = false; summary.hidden = true; summary.replaceChildren();
    messages.forEach((message, field) => {
      message.hidden = true; field.removeAttribute('aria-invalid');
      const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== message.id);
      if (ids.length) field.setAttribute('aria-describedby', ids.join(' ')); else field.removeAttribute('aria-describedby');
    });
  });
}

export function initControls(root) {
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
      button.textContent = visible ? 'Hide password' : 'Show password';
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
  root.querySelectorAll('form[data-tvw-validate]').forEach(form => {
    if (enhanced.has(form)) return;
    enhanced.add(form); validation(form);
  });
}
