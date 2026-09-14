/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { ready, notify, setBusy } from '../components/page.js?v=0.9.0';
await ready;

const palette = document.createElement('dialog');
palette.className = 'tvw-dialog'; palette.id = 'site-commands'; palette.dataset.tvwCommands = ''; palette.setAttribute('aria-labelledby', 'site-commands-title');
palette.innerHTML = '<h2 id="site-commands-title">Go to…</h2><label for="site-command-search">Find a page</label><input class="tvw-input" id="site-command-search" data-tvw-command-search type="search" autocomplete="off"><p class="tvw-help" data-tvw-command-status role="status"></p><ul class="tvw-command-list"></ul><form method="dialog"><button class="tvw-button tvw-button--secondary">Close</button></form>';
for (const [name, path] of [['Foundations', 'index.html'], ['Components', 'components.html'], ['Workflows', 'patterns.html'], ['Component guide', 'guide.html'], ['Playground', 'playground.html'], ['Search, icons and tokens', 'explore.html'], ['Connected workflows', 'examples/workflows.html'], ['Article example', 'examples/article.html'], ['Reusable components', 'examples/packaged-components.html']]) {
  const item = document.createElement('li'), link = document.createElement('a'); link.textContent = name; link.dataset.tvwCommand = ''; link.href = new URL('../' + path, import.meta.url); item.append(link); palette.querySelector('ul').append(item);
}
if (document.querySelector('.docs-controls')) {
  document.body.append(palette);
  const button = document.createElement('button'); button.type = 'button'; button.className = 'tvw-button tvw-button--quiet'; button.dataset.tvwCommandOpen = palette.id; button.textContent = 'Go to…'; button.title = 'Go to a page (Ctrl/⌘ K)'; button.hidden = true; document.querySelector('.docs-controls').prepend(button);
}


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

const header = document.querySelector('.docs-header');
if (header) new ResizeObserver(() => {
  document.documentElement.style.setProperty('--docs-header-height', `${header.getBoundingClientRect().height}px`);
}).observe(header);
for (const sidebar of document.querySelectorAll('.docs-sidebar')) {
  sidebar.tabIndex = 0;
  sidebar.setAttribute('aria-label', 'Documentation navigation');
}
