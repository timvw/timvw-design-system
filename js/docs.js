/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init, notify, setBusy } from './timvw.js?v=0.4.0';

init();

const versions = document.querySelector('[data-version-picker]');
document.addEventListener('click', (event) => {
  if (versions && !versions.contains(event.target)) versions.open = false;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && versions?.open) {
    const focusInside = versions.contains(document.activeElement);
    versions.open = false;
    if (focusInside) versions.querySelector('summary').focus();
  }
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  if (!navigator.clipboard?.writeText) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy);
    const status = button.parentElement.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(code.textContent);
      status.textContent = 'Copied.';
    } catch {
      status.textContent = 'Select the code and copy it manually.';
    }
  });
});

// Interactive examples on the component reference page.
document.querySelectorAll('[data-demo-toast]').forEach(button => button.addEventListener('click', () => {
  notify(button.dataset.demoToast || 'Example notification.', { tone: button.dataset.tone || 'info', duration: 6000 });
}));
document.querySelectorAll('[data-demo-loading]').forEach(button => button.addEventListener('click', async () => {
  setBusy(button, true, 'Loading preview…');
  await new Promise(resolve => setTimeout(resolve, 900));
  setBusy(button, false); notify('Loading preview finished.', { tone: 'success', duration: 5000 });
}));
document.querySelectorAll('[data-demo-validation]').forEach(form => form.addEventListener('tvw:valid-submit', event => {
  event.preventDefault(); notify('The example form is valid. Nothing was sent.', { tone: 'success' });
}));
document.querySelectorAll('[data-tvw-js-only]').forEach(element => { element.hidden = false; });
