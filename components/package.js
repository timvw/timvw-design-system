// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
// Internal loader for the native HTML component packages.
const styles = new Map(), initializers = new Set();
let observer;
function loadStyle(path) {
  const url = new URL(`../css/${path}.css?v=0.9.0`, import.meta.url).href;
  if (!styles.has(url)) styles.set(url, new Promise((resolve, reject) => {
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href === url);
    const link = existing || document.createElement('link');
    if (existing?.sheet) { resolve(); return; }
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => { styles.delete(url); if (!existing) link.remove(); reject(new Error(`Could not load component styles: ${url}`)); }, { once: true });
    if (!existing) { link.rel = 'stylesheet'; link.href = url; document.head.append(link); }
  }));
  return styles.get(url);
}
export async function install(parts, enhance = []) {
  await Promise.all(['foundation', ...parts.map(part => `parts/${part}`)].map(loadStyle));
  if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  document.body.classList.add('tvw');
  for (const init of enhance) { initializers.add(init); init(document); }
  if (!observer && initializers.size) {
    observer = new MutationObserver(records => {
      const roots = new Set();
      for (const record of records) for (const node of record.addedNodes) {
        // Text-only updates need no enhancement. Pass a parent because the
        // native initializers enhance descendants, including the inserted root.
        if (node.nodeType === 1 && node.isConnected && node.parentElement) roots.add(node.parentElement);
      }
      for (const root of roots) for (const init of initializers) init(root);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
