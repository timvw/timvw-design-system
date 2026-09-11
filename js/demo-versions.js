/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
// Shared demo navigation only. Archived component modules remain versioned.
const site = new URL('../', import.meta.url);
const pickers = [...document.querySelectorAll('[data-version-picker]')];

async function refreshVersions() {
  try {
    const response = await fetch(new URL('releases.json', site), { cache: 'no-cache' });
    if (!response.ok) return;
    const catalog = await response.json();
    const version = /^\d+\.\d+\.\d+$/;
    if (!version.test(catalog.latest) || !Array.isArray(catalog.versions)
      || !catalog.versions.every(item => item && version.test(item.version) && typeof item.description === 'string')
      || !catalog.versions.some(item => item.version === catalog.latest)) return;
    pickers.forEach(picker => {
      const current = picker.dataset.demoVersion;
      const nav = picker.querySelector('nav');
      if (!nav) return;
      const focused = nav.contains(document.activeElement) ? document.activeElement.closest('a')?.href : null;
      const choices = [
        { url: site, label: `Latest · v${catalog.latest}`, description: 'Current development', active: current === 'latest' },
        ...catalog.versions.map(item => ({ url: new URL(`v${item.version}/`, site), label: `v${item.version}`, description: item.description, active: current === item.version })),
      ];
      const links = choices.map(choice => {
        const link = document.createElement('a'); link.href = choice.url;
        if (choice.active) link.setAttribute('aria-current', 'page');
        const name = document.createElement('strong'); name.textContent = choice.label;
        const description = document.createElement('small'); description.textContent = choice.description;
        link.append(name, description); return link;
      });
      nav.replaceChildren(...links);
      if (focused) links.find(link => link.href === focused)?.focus();
      if (current === 'latest') {
        const summary = picker.querySelector('summary');
        summary.textContent = `Latest · v${catalog.latest}`;
        summary.setAttribute('aria-label', `Demo version: Latest · v${catalog.latest}`);
      }
    });
  } catch { /* Static navigation, including the unversioned Latest link, stays usable. */ }
}

if (pickers.length) refreshVersions();
