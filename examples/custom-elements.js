/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { registerTemplate } from '../js/templates.js?v=0.9.0';
import { initDialogs } from '../js/dialogs.js?v=0.9.0';

registerTemplate('project-dialog', document.getElementById('project-template'), {
  setup(element) {
    initDialogs(element);
    // A removed open dialog should reconnect in its ordinary closed state.
    return () => element.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  }
});
registerTemplate('status-card', document.getElementById('status-template'));

const atlas = document.getElementById('atlas-tag');
document.getElementById('tag-heading').addEventListener('input', event => atlas.setAttribute('heading', event.target.value));
const container = document.getElementById('tag-instances');
const remove = document.getElementById('remove-tag'), status = document.getElementById('tag-status');
const added = []; let number = 2;
document.getElementById('add-tag').addEventListener('click', () => {
  const element = document.createElement('project-dialog'); number++;
  element.setAttribute('heading', `Project ${number}`); element.setAttribute('action', `Open project ${number}`);
  element.setAttribute('description', 'Added after registration. No extra init call is needed.');
  container.append(element); added.push(element); remove.disabled = false;
  status.textContent = `Project ${number} added.`;
});
remove.addEventListener('click', () => {
  const element = added.pop(); if (!element) return;
  element.remove(); remove.disabled = added.length === 0;
  status.textContent = `${element.getAttribute('heading')} removed.`;
});
document.getElementById('tag-controls').hidden = false;
