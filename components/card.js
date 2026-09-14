// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { createShadow, connectTheme } from './shared.js?v=0.9.0';

export class TvwCard extends HTMLElement {
  #cleanup;
  constructor() {
    super();
    createShadow(this, `<div class="frame" part="surface">
      <slot name="heading"></slot><slot></slot><div part="actions"><slot name="actions"></slot></div>
    </div>`, `
      .frame { background: var(--_tvw-surface); border: 1px solid var(--_tvw-border); border-radius: var(--_tvw-radius); padding: 1.5rem; }
      [part="actions"] { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }
      ::slotted([slot="heading"]) { font-size: 1.25rem; line-height: 1.25; letter-spacing: -.025em; }
    `);
  }
  connectedCallback() { this.#cleanup?.(); this.#cleanup = connectTheme(this); }
  disconnectedCallback() { this.#cleanup?.(); this.#cleanup = undefined; }
}

if (!customElements.get('tvw-card')) customElements.define('tvw-card', TvwCard);
