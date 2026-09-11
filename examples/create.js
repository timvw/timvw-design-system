/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init, getFilePicker, setBusy, notify } from '../js/timvw.js?v=0.5.0';
import { readProjects, storeProjects } from './data.js';
const form = document.getElementById('project-wizard');
form.addEventListener('tvw:stepchange', event => {
  if (event.detail.index !== 3) return;
  const data = event.detail.formData;
  const files = getFilePicker(form.querySelector('[data-tvw-files]')).getFiles();
  const values = { Project: data.get('name'), Owner: data.get('owner'), Team: data.getAll('team').join(', ') || 'No additional members', Budget: new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(Number(data.get('budget'))), 'Due date': data.get('due'), Files: files.map(file => file.name).join(', ') || 'No files' };
  const review = document.getElementById('project-review'); review.replaceChildren();
  Object.entries(values).forEach(([name, value]) => {
    const term = document.createElement('dt'), description = document.createElement('dd');
    term.textContent = name; description.textContent = value; review.append(term, description);
  });
});
form.addEventListener('tvw:complete', event => {
  event.preventDefault();
  const button = form.querySelector('[data-tvw-finish]'); setBusy(button, true, 'Creating…');
  try {
    const projects = readProjects();
    if (projects.length >= 500) { notify('This local example supports up to 500 projects. Remove a project before adding another.', { tone: 'warning' }); return; }
    const values = event.detail.formData;
    const project = { id: crypto.randomUUID(), name: values.get('name').trim(), owner: values.get('owner'), team: values.getAll('team'), budget: Number(values.get('budget')), due: values.get('due'), status: 'draft', progress: 0,
      attachments: getFilePicker(form.querySelector('[data-tvw-files]')).getFiles().map(file => ({ name: file.name, size: file.size, type: file.type })) };
    projects.push(project);
    if (!storeProjects(projects)) { notify('Browser storage is unavailable. Your form is still here; enable storage and try again.', { tone: 'warning' }); return; }
    form.hidden = true;
    document.getElementById('created-message').textContent = `${project.name} was saved in this browser.`;
    document.getElementById('created-link').href = `./projects.html?project=${encodeURIComponent(project.id)}`;
    const success = document.getElementById('project-created'); success.hidden = false; success.focus();
  } finally { setBusy(button, false); }
});
document.getElementById('create-another').addEventListener('click', () => {
  document.getElementById('project-created').hidden = true; form.hidden = false; form.reset();
  requestAnimationFrame(() => document.getElementById('project-name').focus());
});
init();
