/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { translate as t } from './locale.js?v=0.7.0';
const controllers = new WeakMap();
export const getWizard = form => controllers.get(form);
export function initWorkflows(root = document) {
  root.querySelectorAll('form[data-tvw-wizard]').forEach(form => {
    if (controllers.has(form)) return;
    const steps = [...form.querySelectorAll('[data-tvw-step]')];
    const list = form.querySelector('[data-tvw-step-list]');
    const error = form.querySelector('[data-tvw-step-error]');
    if (!steps.length || !list || !error) return;
    let current = 0;
    form.noValidate = true;
    const previous = form.querySelector('[data-tvw-previous]');
    const next = form.querySelector('[data-tvw-next]');
    const submit = form.querySelector('[data-tvw-finish]');
    function show(index, focus = true) {
      current = index;
      steps.forEach((step, i) => { step.hidden = i !== current; });
      list.replaceChildren();
      steps.forEach((step, i) => {
        const item = document.createElement('li'); item.textContent = `${i + 1}. ${step.dataset.tvwStep}`;
        if (i === current) item.setAttribute('aria-current', 'step');
        if (i < current) item.dataset.complete = '';
        list.append(item);
      });
      if (previous) previous.disabled = current === 0;
      if (next) next.hidden = current === steps.length - 1;
      if (submit) submit.hidden = current !== steps.length - 1;
      error.hidden = true; error.textContent = '';
      const heading = steps[current].querySelector('h2,h3,legend');
      if (focus && heading) { heading.tabIndex = -1; heading.focus(); }
      form.dispatchEvent(new CustomEvent('tvw:stepchange', { bubbles: true, detail: { index: current, total: steps.length, formData: new FormData(form) } }));
    }
    function validate(index) {
      const fields = [...steps[index].querySelectorAll('input,select,textarea')].filter(field => field.willValidate);
      const invalid = fields.filter(field => !field.validity.valid);
      fields.forEach(field => field.setAttribute('aria-invalid', String(!field.validity.valid)));
      if (!invalid.length) return true;
      if (index !== current) show(index, false);
      const first = invalid[0];
      error.textContent = `${first.labels?.[0]?.textContent.trim() || first.name || t('field', {}, form)}: ${first.validationMessage}`;
      error.hidden = false; first.focus(); first.reportValidity(); return false;
    }
    function goTo(index) {
      if (!Number.isInteger(index) || index < 0 || index >= steps.length) return false;
      if (index > current) for (let i = 0; i < index; i++) if (!validate(i)) return false;
      show(index); return true;
    }
    next?.addEventListener('click', () => goTo(current + 1));
    previous?.addEventListener('click', () => goTo(current - 1));
    form.addEventListener('submit', event => {
      if (current < steps.length - 1) { event.preventDefault(); goTo(current + 1); return; }
      for (let i = 0; i < steps.length; i++) {
        if (!validate(i)) { event.preventDefault(); return; }
      }
      if (!form.dispatchEvent(new CustomEvent('tvw:complete', { bubbles: true, cancelable: true,
        detail: { formData: new FormData(form, event.submitter) } }))) event.preventDefault();
    });
    form.addEventListener('input', event => {
      if (event.target.willValidate && event.target.validity.valid) event.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('reset', () => queueMicrotask(() => {
      form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
      show(0, false);
    }));
    form.querySelectorAll('[data-tvw-wizard-controls]').forEach(control => { control.hidden = false; });
    controllers.set(form, { goTo, getStep: () => current }); show(0, false);
  });
}

/** Switch a region between ready, loading, empty, and error views. */
export function setRegionState(region, state, message) {
  if (!['ready', 'loading', 'empty', 'error'].includes(state)) throw new TypeError('Unknown region state');
  const panels = [...region.querySelectorAll('[data-tvw-state]')];
  const target = panels.find(panel => panel.dataset.tvwState === state);
  if (!target) throw new TypeError(`Region has no ${state} panel`);
  const movingFocus = panels.some(panel => panel !== target && panel.contains(document.activeElement));
  panels.forEach(panel => { panel.hidden = panel !== target; });
  region.setAttribute('aria-busy', String(state === 'loading'));
  region.dataset.state = state;
  const status = region.querySelector('[data-tvw-region-status]');
  if (status) status.textContent = message || t(state, {}, region);
  if (movingFocus) { region.tabIndex = -1; region.focus(); }
}

const avatars = new WeakSet();
export function initAvatars(root = document) {
  root.querySelectorAll('.tvw-avatar img').forEach(img => {
    if (avatars.has(img)) return;
    avatars.add(img);
    const fallback = () => { img.hidden = true; };
    img.addEventListener('error', fallback);
    img.addEventListener('load', () => { img.hidden = false; });
    if (img.complete && !img.naturalWidth) fallback();
  });
}
