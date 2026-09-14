// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import tokens from './tokens.js?v=0.9.0';

const sheets = new Map();
function stylesheet(css) {
  if (!sheets.has(css)) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    sheets.set(css, sheet);
  }
  return sheets.get(css);
}

const base = `${tokens}
  :host { display: block; min-width: 0; }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
  .frame { color-scheme: light dark; color: var(--_tvw-text); font: 1rem/1.6 var(--_tvw-font); overflow-wrap: anywhere; }
  button { font: inherit; cursor: pointer; min-height: 2.75rem; padding: .6rem 1.125rem; border: 1px solid var(--_tvw-border); border-radius: var(--_tvw-radius); background: var(--_tvw-surface); color: var(--_tvw-text); font-weight: 650; line-height: 1.35; }
  button:hover:not(:disabled) { background: var(--_tvw-subtle); }
  button:disabled { cursor: not-allowed; opacity: .5; }
  :focus-visible, ::slotted(:focus-visible) { outline: 3px solid var(--_tvw-focus); outline-offset: 4px; }
  h2 { margin: 0; font-size: 1.5rem; line-height: 1.25; letter-spacing: -.035em; }
  ::slotted(*) { box-sizing: border-box; }
  ::slotted(p), ::slotted(h2), ::slotted(h3) { margin-block: 0 1rem; }
  ::slotted(a) { color: var(--_tvw-link); text-underline-offset: .2em; }
  ::slotted(button) { font: inherit; cursor: pointer; min-height: 2.75rem; padding: .6rem 1.125rem; border: 1px solid var(--_tvw-border); border-radius: var(--_tvw-radius); background: var(--_tvw-surface); color: var(--_tvw-text); }
  ::slotted(button:disabled) { cursor: not-allowed; opacity: .5; }
  @media (forced-colors: active) { button, ::slotted(button) { border-color: ButtonText; } }
`;

// Internal helper: only trusted library templates and CSS are passed here.
export function createShadow(host, html, css) {
  const root = host.attachShadow({ mode: 'open' });
  root.adoptedStyleSheets = [stylesheet(base), stylesheet(css)];
  root.innerHTML = html;
  return root;
}

const themes = new WeakMap();
function applyTheme(host) {
  let node = host, preference;
  while (node) {
    const value = node.getAttribute?.('data-tvw-theme');
    if (['light', 'dark', 'system'].includes(value)) { preference = value; break; }
    node = node.parentElement || node.getRootNode().host;
  }
  host.shadowRoot.querySelector('.frame').style.colorScheme = preference && preference !== 'system' ? preference : 'light dark';
}

// One observer per document, released when the last component disconnects.
export function connectTheme(host) {
  const document = host.ownerDocument;
  let state = themes.get(document);
  if (!state) {
    state = { hosts: new Set(), observer: new MutationObserver(() => state.hosts.forEach(applyTheme)) };
    state.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tvw-theme'], subtree: true });
    themes.set(document, state);
  }
  state.hosts.add(host); applyTheme(host);
  return () => {
    state.hosts.delete(host);
    if (!state.hosts.size) { state.observer.disconnect(); themes.delete(document); }
  };
}
