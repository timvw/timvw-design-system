/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
let sequence = 0;
/** Clone trusted, same-document HTML. Bind values as text, remap IDs and ID references.
 * Append fragment before calling the required component initializer on its parent.
 * Templates are native DOM elements, not a global string registry or HTML renderer.
 */
export function instantiateTemplate(template, { values = {} } = {}) {
  if (!(template instanceof HTMLTemplateElement)) throw new TypeError('Provide an HTMLTemplateElement');
  const fragment = template.content.cloneNode(true), ids = new Map();
  let prefix;
  do { prefix = `tvw-instance-${++sequence}`; } while ([...fragment.querySelectorAll('[id]')].some(node => document.getElementById(`${prefix}-${node.id}`)));
  fragment.querySelectorAll('[id]').forEach(node => {
    if (ids.has(node.id)) throw new TypeError(`Duplicate template ID: ${node.id}`);
    const next = `${prefix}-${node.id}`; ids.set(node.id, next); node.id = next;
  });
  const references = ['for', 'form', 'list', 'headers', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-details', 'aria-errormessage', 'popovertarget', 'commandfor', 'data-tvw-open', 'data-tvw-command-open'];
  fragment.querySelectorAll('*').forEach(node => {
    references.forEach(attr => {
      if (node.hasAttribute(attr)) node.setAttribute(attr, node.getAttribute(attr).split(/\s+/).map(id => ids.get(id) || id).join(' '));
    });
    for (const attr of ['href', 'xlink:href']) {
      const href = node.getAttribute(attr); if (href?.startsWith('#') && ids.has(href.slice(1))) node.setAttribute(attr, `#${ids.get(href.slice(1))}`);
    }
    if (node.hasAttribute('data-tvw-text')) {
      const key = node.dataset.tvwText;
      if (Object.hasOwn(values, key)) node.textContent = String(values[key]);
    }
  });
  return { fragment, ids, getId: id => ids.get(id) };
}

/** Register a light-DOM custom element backed by a trusted native template.
 * data-tvw-text keys become observed text attributes. setup runs on connection;
 * its signal is aborted and its optional cleanup called after disconnection.
 */
export function registerTemplate(name, template, { setup } = {}) {
  if (!(template instanceof HTMLTemplateElement)) throw new TypeError('Provide an HTMLTemplateElement');
  if (setup != null && typeof setup !== 'function') throw new TypeError('setup must be a function');
  // Freeze the definition: changing the source template later cannot silently
  // change the markup without updating the observed attribute contract.
  const definition = template.cloneNode(true);
  const attributes = [...new Set([...definition.content.querySelectorAll('[data-tvw-text]')].map(node => node.dataset.tvwText))];
  if (attributes.some(attribute => !/^[a-z][a-z0-9-]*$/.test(attribute))) throw new TypeError('Text slot names must be lowercase HTML attribute names');
  // Validate IDs now, so errors occur at registration instead of on each upgrade.
  const ids = [...definition.content.querySelectorAll('[id]')].map(node => node.id);
  if (new Set(ids).size !== ids.length) throw new TypeError('Duplicate template ID');
  class TemplateElement extends HTMLElement {
    static observedAttributes = attributes;
    #instance;
    #bindings;
    #connection;
    connectedCallback() {
      if (!this.isConnected || this.#connection) return;
      if (!this.#instance) {
        this.#instance = instantiateTemplate(definition);
        this.#bindings = [...this.#instance.fragment.querySelectorAll('[data-tvw-text]')].map(node => ({ node, attribute: node.dataset.tvwText, fallback: node.textContent }));
        for (const binding of this.#bindings) binding.node.textContent = this.getAttribute(binding.attribute) ?? binding.fallback;
        // Authored children stay intact: this helper does not project slots or
        // treat the host's HTML as a template expression.
        this.append(this.#instance.fragment);
      }
      const controller = new AbortController();
      const connection = { controller }; this.#connection = connection;
      try {
        const cleanup = setup?.(this, { signal: controller.signal, getId: this.#instance.getId });
        if (cleanup != null && typeof cleanup !== 'function') throw new TypeError('setup must return a cleanup function or nothing');
        connection.cleanup = cleanup;
      } catch (error) {
        controller.abort(); this.#connection = undefined; throw error;
      }
    }
    attributeChangedCallback(attribute, oldValue, value) {
      if (oldValue === value || !this.#bindings) return;
      for (const binding of this.#bindings) if (binding.attribute === attribute) binding.node.textContent = value ?? binding.fallback;
    }
    disconnectedCallback() {
      // Moving within the same document in one turn preserves state/listeners.
      queueMicrotask(() => {
        if (this.isConnected || !this.#connection) return;
        const connection = this.#connection; this.#connection = undefined;
        connection.controller.abort(); connection.cleanup?.();
      });
    }
  }
  // The native registry validates names and rejects duplicate registrations.
  customElements.define(name, TemplateElement);
  return TemplateElement;
}
