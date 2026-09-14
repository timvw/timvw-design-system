/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { ready, notify, setTheme, setBusy, getTable } from '../components/page.js?v=0.9.0';
import { sampleProjects, readProjects, storeProjects } from './data.js';
await ready;

const currency = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
let projects = readProjects();
let settings = {};
try { const saved = JSON.parse(localStorage.getItem('tvw-demo-settings')); if (saved && typeof saved === 'object') settings = saved; } catch { /* Optional storage. */ }
const applySettings = () => {
  document.querySelectorAll('[data-workspace-name]').forEach(element => {
    element.textContent = typeof settings.workspace === 'string' && settings.workspace ? settings.workspace : 'Studio workspace';
  });
  document.body.dataset.density = settings.density === 'compact' ? 'compact' : 'comfortable';
};
applySettings();
document.querySelectorAll('[data-example-controls]').forEach(element => { element.hidden = false; });
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close()));

const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
  for (const [name, value] of Object.entries(settings)) {
    const control = settingsForm.elements.namedItem(name);
    if (!control) continue;
    if (control instanceof RadioNodeList) control.value = String(value);
    else if (control.type === 'checkbox') control.checked = value === true;
    else if (typeof value === 'string' || typeof value === 'number') control.value = String(value);
  }
  settingsForm.addEventListener('tvw:valid-submit', async event => {
    event.preventDefault();
    const button = settingsForm.querySelector('[type="submit"]');
    setBusy(button, true, 'Saving…');
    const values = event.detail.formData;
    settings = {
      workspace: String(values.get('workspace')).trim(), email: String(values.get('email')),
      density: values.get('density'), notifications: values.has('notifications'), digest: values.has('digest'),
      digestTime: values.get('digestTime'), capacity: Number(values.get('capacity')),
    };
    let saved = false;
    try { localStorage.setItem('tvw-demo-settings', JSON.stringify(settings)); saved = true; } catch { /* Apply only in memory. */ }
    applySettings();
    await new Promise(resolve => requestAnimationFrame(resolve));
    setBusy(button, false);
    const message = saved ? 'Preferences saved in this browser.' : 'Preferences applied to this page. Browser storage is unavailable.';
    document.getElementById('settings-status').textContent = message;
    notify(message, { tone: saved ? 'success' : 'warning', duration: saved ? 6000 : 0 });
  });
  document.querySelector('[data-reset-settings]').addEventListener('click', () => {
    settingsForm.reset(); settings = {}; applySettings(); setTheme('system');
    let saved = true;
    try { localStorage.removeItem('tvw-demo-settings'); } catch { saved = false; }
    document.getElementById('settings-status').textContent = saved ? 'Default preferences restored.' : 'Defaults applied to this page; browser storage is unavailable.';
    notify(document.getElementById('settings-status').textContent, { tone: saved ? 'success' : 'warning' });
  });
  document.querySelector('[data-preview-notification]').addEventListener('click', () => {
    if (!settingsForm.elements.notifications.checked) {
      document.getElementById('settings-status').textContent = 'Enable notification previews to see an example.';
      return;
    }
    notify('This is a notification preview. No message was sent.', { tone: 'info', duration: 6000 });
  });
}

const projectTable = document.getElementById('project-table');
let selectedProject = null;
function drawRows() {
  const body = projectTable.querySelector('tbody');
  body.replaceChildren();
  const template = document.getElementById('project-row');
  projects.forEach((project, index) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.status = project.status; row.dataset.due = project.due;
    row.dataset.search = `${project.name} ${project.owner}`;
    const checkbox = row.querySelector('[data-tvw-row-select]');
    checkbox.value = project.id; checkbox.setAttribute('aria-label', `Select ${project.name}`);
    row.querySelector('[data-project-details]').dataset.projectDetails = project.id;
    row.querySelector('[data-project-name]').textContent = project.name;
    row.querySelector('[data-project-owner]').textContent = project.owner;
    const status = row.querySelector('[data-project-status]');
    status.textContent = project.status[0].toUpperCase() + project.status.slice(1);
    status.classList.add(project.status === 'done' ? 'tvw-badge--success' : project.status === 'active' ? 'tvw-badge--info' : 'tvw-badge--warning');
    row.querySelector('[data-project-budget]').textContent = currency.format(project.budget);
    row.querySelector('[data-project-budget]').dataset.sortValue = String(project.budget);
    row.querySelector('[data-project-due]').textContent = project.due;
    const expand = document.createElement('button'); expand.type = 'button';
    expand.className = 'tvw-button tvw-button--quiet tvw-button--sm'; expand.textContent = 'Details';
    expand.dataset.tvwExpand = ''; expand.setAttribute('aria-expanded', 'false');
    expand.setAttribute('aria-label', `Expand details for ${project.name}`);
    expand.setAttribute('aria-controls', `project-extra-${index}`); row.cells[1].append(' ', expand);
    const detail = document.createElement('tr'); detail.id = `project-extra-${index}`; detail.dataset.tvwDetailRow = ''; detail.hidden = true;
    const cell = document.createElement('td'); cell.colSpan = 6;
    const team = Array.isArray(project.team) ? project.team.filter(name => typeof name === 'string').join(', ') : '';
    const files = Array.isArray(project.attachments) ? project.attachments.map(file => typeof file?.name === 'string' ? file.name : '').filter(Boolean).join(', ') : '';
    cell.textContent = `Completion: ${project.progress}%. Team: ${team || 'No additional members'}. Files: ${files || 'None'}.`;
    detail.append(cell); body.append(row, detail);
  });
  getTable(projectTable)?.refresh();

}

function persistProjects(message) {
  const saved = storeProjects(projects);
  notify(saved ? message : `${message} Changes apply only to this page because browser storage is unavailable.`, { tone: saved ? 'success' : 'warning', duration: saved ? 6000 : 0 });
}

function fillDetails(id) {
  const project = projects.find(project => project.id === id);
  if (!project) return;
  selectedProject = id;
  document.getElementById('detail-title').textContent = project.name;
  document.querySelector('[data-detail-owner]').textContent = project.owner;
  document.querySelector('[data-detail-budget]').textContent = currency.format(project.budget);
  document.querySelector('[data-detail-due]').textContent = project.due;
  document.getElementById('detail-status').value = project.status;
  document.getElementById('detail-progress').value = project.progress;
  document.getElementById('detail-progress-value').textContent = `${project.progress}%`;
}

if (projectTable) {
  projectTable.addEventListener('tvw:selectionchange', event => {
    document.querySelector('[data-delete-selected]').disabled = event.detail.values.length === 0;
  });
  const query = new URLSearchParams(location.search);
  if (['active', 'draft', 'done'].includes(query.get('status'))) document.getElementById('project-status').value = query.get('status');
  drawRows();
  document.addEventListener('click', event => {
    const detail = event.target.closest('[data-project-details]');
    if (detail) fillDetails(detail.dataset.projectDetails);
    const confirm = event.target.closest('[data-confirm-kind]');
    if (confirm) {
      const dialog = document.getElementById('confirm-projects');
      dialog.dataset.action = confirm.dataset.confirmKind;
      const resetting = dialog.dataset.action === 'reset';
      document.getElementById('confirm-heading').textContent = resetting ? 'Restore sample projects?' : 'Delete selected projects?';
      document.getElementById('confirm-description').textContent = resetting
        ? 'This replaces your local example projects with the original sample data.'
        : `Delete ${getTable(projectTable).getSelected().length} selected projects from this local example?`;
      dialog.querySelector('[data-confirm-projects]').textContent = resetting ? 'Restore samples' : 'Delete projects';
    }
  }, { capture: true });
  document.getElementById('detail-progress').addEventListener('input', event => {
    document.getElementById('detail-progress-value').textContent = `${event.target.value}%`;
  });
  document.querySelector('[data-save-project]').addEventListener('click', () => {
    const project = projects.find(project => project.id === selectedProject);
    if (!project) return;
    project.status = document.getElementById('detail-status').value;
    project.progress = project.status === 'done' ? 100 : project.status === 'draft' ? 0 : Number(document.getElementById('detail-progress').value);
    document.getElementById('project-drawer').close(); drawRows(); persistProjects('Project updated.');
    requestAnimationFrame(() => {
      const button = [...projectTable.querySelectorAll('[data-project-details]')].find(button => button.dataset.projectDetails === selectedProject && button.getClientRects().length);
      (button || document.getElementById('project-search')).focus();
    });
  });
  document.getElementById('create-form').addEventListener('tvw:valid-submit', event => {
    event.preventDefault(); const values = event.detail.formData;
    const project = { id: crypto.randomUUID(), name: String(values.get('name')).trim(), owner: String(values.get('owner')).trim(), budget: Number(values.get('budget')), due: String(values.get('due')), status: 'draft', progress: 0 };
    projects.push(project); document.getElementById('create-project').close();
    event.target.reset(); drawRows();
    document.getElementById('project-status').value = '';
    const search = document.getElementById('project-search'); search.value = project.name;
    search.dispatchEvent(new Event('input')); search.focus(); persistProjects('Project created.');
  });
  document.querySelector('[data-confirm-projects]').addEventListener('click', () => {
    const dialog = document.getElementById('confirm-projects');
    if (dialog.dataset.action === 'reset') projects = sampleProjects.map(project => ({ ...project }));
    else { const selected = new Set(getTable(projectTable).getSelected()); projects = projects.filter(project => !selected.has(project.id)); }
    dialog.close(); drawRows();
    persistProjects(dialog.dataset.action === 'reset' ? 'Sample projects restored.' : 'Selected projects deleted.');
    document.getElementById('project-search').focus();
  });
  document.querySelector('[data-export]').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'timvw-example-projects.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Project data prepared for download.', { tone: 'success', duration: 5000 });
  });
}

const dashboard = document.getElementById('dashboard-projects');
if (dashboard) {
  const metrics = { total: projects.length, active: projects.filter(project => project.status === 'active').length, done: projects.filter(project => project.status === 'done').length, budget: currency.format(projects.reduce((sum, project) => sum + project.budget, 0)) };
  document.querySelectorAll('[data-metric]').forEach(element => { element.textContent = metrics[element.dataset.metric]; });
  document.querySelectorAll('[data-status-count]').forEach(element => {
    const count = projects.filter(project => project.status === element.dataset.statusCount).length;
    element.textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
    const meter = document.querySelector(`[data-status-meter="${element.dataset.statusCount}"]`);
    meter.max = Math.max(1, projects.length); meter.value = count; meter.textContent = `${count} of ${projects.length}`;
  });
  dashboard.replaceChildren();
  const upcoming = projects.filter(project => project.status !== 'done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  document.getElementById('dashboard-empty').hidden = upcoming.length > 0;
  upcoming.forEach(project => {
    const row = document.createElement('tr');
    const heading = document.createElement('th'); heading.scope = 'row';
    const link = document.createElement('a'); link.href = `./projects.html?project=${encodeURIComponent(project.id)}`; link.textContent = project.name;
    heading.append(link); row.append(heading);
    for (const value of [project.owner, project.due, `${project.progress}%`]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
    dashboard.append(row);
  });
}


// Let automatic enhancement process the rows before following a deep link.
await new Promise(queueMicrotask);
if (projectTable) {
  const id = new URLSearchParams(location.search).get('project');
  const button = [...projectTable.querySelectorAll('[data-project-details]')].find(button => button.dataset.projectDetails === id);
  if (button) {
    const search = document.getElementById('project-search');
    document.getElementById('project-status').value = '';
    search.value = projects.find(project => project.id === id).name;
    search.dispatchEvent(new Event('input'));
    button.click();
  }
}
