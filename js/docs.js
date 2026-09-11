/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init } from './timvw.js';

init();

const theme = document.querySelector('[data-theme-picker]');
const themeButtons = [...theme.querySelectorAll('[data-theme]')];
const preference = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme;
try { savedTheme = localStorage.getItem('tvw-theme'); } catch { /* Storage is optional. */ }
let selectedTheme = ['light', 'dark'].includes(savedTheme) ? savedTheme : 'system';
function applyTheme() {
  document.documentElement.dataset.tvwTheme = selectedTheme === 'system'
    ? (preference.matches ? 'dark' : 'light') : selectedTheme;
  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === selectedTheme));
  });
}
applyTheme();
theme.hidden = false;
themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedTheme = button.dataset.theme;
    applyTheme();
    try { localStorage.setItem('tvw-theme', selectedTheme); } catch { /* Storage is optional. */ }
  });
});
preference.addEventListener('change', applyTheme);

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
