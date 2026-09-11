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
