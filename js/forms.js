/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { translate as t } from './locale.js?v=0.6.0';
const controllers = new WeakMap();
let sequence = 0;
export const getForm = form => controllers.get(form);
export function initForms(root = document) {
  root.querySelectorAll('form[data-tvw-validate]').forEach(form => {
    if (controllers.has(form) || form.hasAttribute('data-tvw-wizard')) return;
    const summary = form.querySelector('[data-tvw-errors]');
    if (!summary) return;
    form.noValidate = true; summary.tabIndex = -1;
    let attempted = false, validator, pending, revision = 0, bypass = false;
    let errors = {};
    const messages = new Map();
    const fields = () => [...form.elements].filter(field => field.willValidate);
    const targetFor = key => {
      const field = [...form.elements].find(field => field.name === key || field.id === key);
      return field?.dataset.tvwProxy ? document.getElementById(field.dataset.tvwProxy) : field;
    };
    function draw(focus = false) {
      const remote = new Map(), general = [];
      Object.entries(errors).forEach(([key, value]) => {
        if (!value) return;
        const field = targetFor(key);
        if (field?.willValidate) remote.set(field, String(value)); else general.push(String(value));
      });
      const invalid = [];
      fields().forEach(field => {
        if (!field.id) { do { field.id = `tvw-validated-${++sequence}`; } while (document.querySelectorAll(`[id="${field.id}"]`).length > 1); }
        let message = messages.get(field);
        if (!message) {
          message = document.createElement('span'); message.id = `${field.id}-error-${++sequence}`;
          message.className = 'tvw-error'; (field.closest('.tvw-field') || field.parentElement).append(message); messages.set(field, message);
        }
        const text = remote.get(field) || (!field.validity.valid ? field.validationMessage : '');
        const ids = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        if (text) ids.add(message.id); else ids.delete(message.id);
        if (ids.size) field.setAttribute('aria-describedby', [...ids].join(' ')); else field.removeAttribute('aria-describedby');
        field.setAttribute('aria-invalid', String(Boolean(text)));
        message.textContent = text; message.hidden = !text;
        if (text) invalid.push({ field, text });
      });
      summary.replaceChildren(); summary.hidden = !invalid.length && !general.length;
      if (!summary.hidden) {
        const heading = document.createElement('p'); heading.textContent = t(invalid.length ? 'correct' : 'formError', { count: invalid.length }, form);
        const list = document.createElement('ul');
        invalid.forEach(({ field, text }) => {
          const item = document.createElement('li'), link = document.createElement('a'); link.href = `#${field.id}`;
          link.textContent = `${field.labels?.[0]?.textContent.trim() || field.name || t('field', {}, form)}: ${text}`;
          link.addEventListener('click', event => { event.preventDefault(); field.focus(); }); item.append(link); list.append(item);
        });
        general.forEach(text => { const item = document.createElement('li'); item.textContent = text; list.append(item); });
        summary.append(heading, list); if (focus) summary.focus();
      }
      return summary.hidden;
    }
    function cancel() { revision++; pending?.abort(); pending = undefined; }
    async function validate() {
      cancel(); attempted = true; errors = {};
      if (!draw()) return false;
      if (!validator) return true;
      const run = revision, controller = new AbortController(); pending = controller;
      let onAbort;
      const interrupted = new Promise((_, reject) => { onAbort = () => reject(new DOMException('Cancelled', 'AbortError')); controller.signal.addEventListener('abort', onAbort, { once: true }); });
      try {
        const data = new FormData(form);
        const result = await Promise.race([Promise.resolve().then(() => validator(data, { signal: controller.signal })), interrupted]);
        if (controller.signal.aborted || run !== revision) return false;
        if (result != null && (typeof result !== 'object' || Array.isArray(result) || Object.values(result).some(value => typeof value !== 'string'))) throw new TypeError('Validation errors must be a string map');
        errors = result || {};
      } catch (error) {
        if (controller.signal.aborted || run !== revision) return false;
        errors = { _form: t('validationFailed', {}, form) };
      } finally { controller.signal.removeEventListener('abort', onAbort); if (pending === controller) pending = undefined; }
      return draw();
    }
    function emit(submitter) {
      return form.dispatchEvent(new CustomEvent('tvw:valid-submit', { bubbles: true, cancelable: true, detail: { formData: new FormData(form, submitter || undefined), submitter } }));
    }
    let submitting = false;
    form.addEventListener('submit', async event => {
      if (bypass) return;
      attempted = true;
      if (!validator) { if (!draw(true) || !emit(event.submitter)) event.preventDefault(); return; }
      event.preventDefault(); if (submitting) return;
      submitting = true; const submitter = event.submitter;
      const busy = form.getAttribute('aria-busy'); form.setAttribute('aria-busy', 'true');
      const buttons = [...form.elements].filter(field => ['submit','image'].includes(field.type)).map(field => [field, field.disabled]);
      buttons.forEach(([field]) => { field.disabled = true; });
      let valid;
      try { valid = await validate(); }
      finally {
        submitting = false; buttons.forEach(([field, disabled]) => { field.disabled = disabled; });
        if (busy === null) form.removeAttribute('aria-busy'); else form.setAttribute('aria-busy', busy);
      }
      if (!valid) { if (!summary.hidden) summary.focus(); return; }
      if (emit(submitter)) { bypass = true; try { form.requestSubmit(submitter || undefined); } finally { bypass = false; } }
    });
    const changed = () => { cancel(); errors = {}; if (attempted) draw(); };
    form.addEventListener('input', changed); form.addEventListener('change', changed);
    form.addEventListener('reset', () => {
      cancel(); attempted = false; errors = {}; summary.hidden = true; summary.replaceChildren();
      messages.forEach((message, field) => {
        message.hidden = true; message.textContent = ''; field.removeAttribute('aria-invalid');
        const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== message.id);
        if (ids.length) field.setAttribute('aria-describedby', ids.join(' ')); else field.removeAttribute('aria-describedby');
      });
    });
    controllers.set(form, {
      configure({ validate: callback } = {}) { if (callback != null && typeof callback !== 'function') throw new TypeError('validate must be a function'); cancel(); validator = callback; },
      validate,
      setErrors(value = {}, { focus = true } = {}) { cancel(); errors = value; attempted = true; return draw(focus); },
      clearErrors() { cancel(); errors = {}; if (attempted) draw(); }
    });
  });
}

/** Track unsaved form values. Dispose when removing the form. No data is persisted. */
export function watchChanges(form) {
  const snapshot = () => JSON.stringify([...new FormData(form)].map(([name, value]) => [name, value instanceof File ? [value.name, value.size, value.lastModified] : value]));
  let saved = snapshot(), dirty = false;
  const controller = new AbortController(), options = { signal: controller.signal };
  const beforeUnload = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
  function refresh() {
    const next = snapshot() !== saved;
    if (next === dirty) return;
    dirty = next;
    if (dirty) addEventListener('beforeunload', beforeUnload); else removeEventListener('beforeunload', beforeUnload);
    form.dispatchEvent(new CustomEvent('tvw:dirtychange', { bubbles: true, detail: { dirty } }));
  }
  form.addEventListener('input', refresh, options); form.addEventListener('change', refresh, options);
  form.addEventListener('reset', () => queueMicrotask(refresh), options);
  return { isDirty: () => { refresh(); return dirty; }, refresh,
    markSaved() { saved = snapshot(); refresh(); },
    destroy() { controller.abort(); removeEventListener('beforeunload', beforeUnload); }
  };
}
