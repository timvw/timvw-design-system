/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init } from './timvw.js';

init();

const theme = document.getElementById('theme');
const preference = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme;
try { savedTheme = localStorage.getItem('tvw-theme'); } catch { /* Storage is optional. */ }
theme.value = ['light', 'dark'].includes(savedTheme) ? savedTheme : 'system';
function applyTheme() {
  document.documentElement.dataset.tvwTheme = theme.value === 'system'
    ? (preference.matches ? 'dark' : 'light') : theme.value;
}
applyTheme();
theme.closest('label').hidden = false;
theme.addEventListener('change', () => {
  applyTheme();
  try { localStorage.setItem('tvw-theme', theme.value); } catch { /* Storage is optional. */ }
});
preference.addEventListener('change', applyTheme);

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
