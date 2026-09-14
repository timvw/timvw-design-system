// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { createShadow, connectTheme } from './shared.js?v=0.9.0';

export class TvwDialog extends HTMLElement {
  static observedAttributes = ['heading', 'open-label', 'close-label', 'disabled'];
  #dialog; #cleanup; #opener;
  constructor() {
    super();
    const root = createShadow(this, `<div class="frame">
      <slot name="trigger"><button part="trigger" type="button" aria-haspopup="dialog">Open dialog</button></slot>
      <dialog part="dialog" aria-labelledby="heading">
        <header><div id="heading" part="heading"><slot name="heading"><h2>Dialog</h2></slot></div></header>
        <div part="body"><slot></slot></div>
        <footer part="actions"><slot name="actions"></slot><button part="close" type="button">Close</button></footer>
      </dialog>
    </div>`, `
      :host { display: inline-block; }
      dialog { width: min(34rem, calc(100% - 2rem)); max-width: calc(100% - 2rem); max-height: calc(100% - 2rem); max-height: calc(100dvh - 2rem); overflow: auto; margin: auto; padding: clamp(1.25rem, 4vw, 2rem); color: var(--_tvw-text); background: var(--_tvw-surface); border: 1px solid var(--_tvw-border); border-radius: var(--_tvw-radius); box-shadow: var(--_tvw-shadow); }
      dialog::backdrop { background: oklch(20.64% 0.0205 271.56 / .65); }
      header { margin-block-end: 1.25rem; }
      footer { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: .75rem; margin-block-start: 1.5rem; }
      ::slotted([slot="heading"]) { margin: 0; font-size: 1.5rem; line-height: 1.25; letter-spacing: -.035em; }
    `);
    this.#dialog = root.querySelector('dialog');
    root.querySelector('slot[name="trigger"]').addEventListener('click', event => {
      const button = event.composedPath().find(node => node instanceof HTMLButtonElement);
      if (!event.defaultPrevented && button && !button.disabled && !this.disabled) {
        this.showModal(); this.#opener = button;
      }
    });
    root.querySelector('[part="close"]').addEventListener('click', () => this.close());
    this.#dialog.addEventListener('cancel', event => {
      if (!this.dispatchEvent(new CustomEvent('tvw-cancel', { bubbles: true, composed: true, cancelable: true }))) event.preventDefault();
    });
    this.#dialog.addEventListener('close', () => {
      if (!this.open) {
        if (this.isConnected && this.#opener?.isConnected) this.#opener.focus();
        this.#opener = undefined;
      }
      this.dispatchEvent(new CustomEvent('tvw-close', { bubbles: true, composed: true, detail: { returnValue: this.returnValue } }));
    });
    this.addEventListener('click', event => {
      const button = event.target.closest?.('button[data-tvw-close]');
      if (this.open && !event.defaultPrevented && button && !button.disabled && button.closest('tvw-dialog') === this) {
        event.preventDefault(); this.close(button.value);
      }
    });
    // Slotting preserves the light DOM: bridge method=dialog explicitly. Native
    // validation runs before submit; application submit handlers can prevent it.
    this.addEventListener('submit', event => {
      const form = event.target;
      const method = event.submitter?.getAttribute('formmethod') ?? form.getAttribute('method') ?? '';
      if (this.open && !event.defaultPrevented && form.closest('tvw-dialog') === this && method.toLowerCase() === 'dialog') {
        event.preventDefault(); this.close(event.submitter?.value ?? '');
      }
    });
  }
  connectedCallback() { this.#cleanup?.(); this.#cleanup = connectTheme(this); this.#labels(); }
  disconnectedCallback() { this.close(); this.#cleanup?.(); this.#cleanup = undefined; }
  attributeChangedCallback() { this.#labels(); }
  #labels() {
    const root = this.shadowRoot;
    root.querySelector('h2').textContent = this.getAttribute('heading') || 'Dialog';
    root.querySelector('[part="trigger"]').textContent = this.getAttribute('open-label') || 'Open dialog';
    root.querySelector('[part="trigger"]').disabled = this.disabled;
    root.querySelector('[part="close"]').textContent = this.getAttribute('close-label') || 'Close';
  }
  get open() { return this.#dialog.open; }
  get returnValue() { return this.#dialog.returnValue; }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }
  showModal() {
    if (this.open) return;
    this.#opener = this.ownerDocument.activeElement;
    this.#dialog.returnValue = '';
    this.#dialog.showModal();
    // Firefox does not consistently traverse assigned content for dialog autofocus.
    const autofocus = [...this.querySelectorAll('[autofocus]')].find(node => node.closest('tvw-dialog') === this && node.getClientRects().length && !node.matches(':disabled'));
    autofocus?.focus();
  }
  close(value = '') { if (this.open) this.#dialog.close(String(value)); }
}

if (!customElements.get('tvw-dialog')) customElements.define('tvw-dialog', TvwDialog);
