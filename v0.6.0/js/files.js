/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { translate as t, formatNumber } from './locale.js?v=0.6.0';
const controllers = new WeakMap();
export const getFilePicker = element => controllers.get(element);
export function initFiles(root = document) {
  root.querySelectorAll('[data-tvw-files]').forEach(wrapper => {
    if (controllers.has(wrapper)) return;
    const input = wrapper.querySelector('input[type="file"]');
    const list = wrapper.querySelector('[data-tvw-file-list]');
    const status = wrapper.querySelector('[data-tvw-file-status]');
    if (!input || !list || !status || typeof DataTransfer !== 'function') return;
    let entries = [], busy = false, cancelled = false, uploadController, resetDuringUpload = false;
    const maxBytes = Number(wrapper.dataset.maxBytes) || Infinity;
    const maxFiles = Number(wrapper.dataset.maxFiles) || (input.multiple ? Infinity : 1);
    const accept = (input.accept || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    const accepted = file => !accept.length || accept.some(rule => rule.startsWith('.') ? file.name.toLowerCase().endsWith(rule) : rule.endsWith('/*') ? file.type.toLowerCase().startsWith(rule.slice(0, -1)) : file.type.toLowerCase() === rule);
    function sync() {
      const transfer = new DataTransfer(); entries.forEach(entry => transfer.items.add(entry.file)); input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      wrapper.dispatchEvent(new CustomEvent('tvw:fileschange', { bubbles: true, detail: { files: entries.map(entry => entry.file) } }));
    }
    function render() {
      list.replaceChildren();
      entries.forEach(entry => {
        const row = document.createElement('li'); row.className = 'tvw-file-row';
        const content = document.createElement('div');
        const name = document.createElement('strong'); name.textContent = entry.file.name;
        const info = document.createElement('p'); info.className = 'tvw-help';
        info.textContent = `${Math.max(1, Math.round(entry.file.size / 1024))} KB · ${t(`file${entry.state}`, {}, wrapper)}${entry.error ? `: ${entry.error}` : ''}`;
        content.append(name, info);
        if (entry.state === 'Uploading') {
          const progress = document.createElement('progress'); progress.className = 'tvw-progress'; progress.max = 100; progress.value = entry.progress;
          progress.setAttribute('aria-label', t('uploading', { name: entry.file.name }, wrapper)); content.append(progress);
        }
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'tvw-button tvw-button--quiet tvw-button--sm';
        remove.textContent = t('remove', {}, wrapper); remove.setAttribute('aria-label', t('removeName', { name: entry.file.name }, wrapper)); remove.disabled = busy || input.disabled;
        remove.addEventListener('click', () => {
          entries = entries.filter(item => item !== entry); sync(); render(); input.focus();
          status.textContent = t('fileRemoved', { name: entry.file.name, count: entries.length }, wrapper);
        }); row.append(content, remove); list.append(row);
      });
    }
    function add(files) {
      if (busy || input.disabled) return;
      const errors = [];
      if (!input.multiple) entries = [];
      for (const file of files) {
        if (!accepted(file)) { errors.push(t('fileType', { name: file.name }, wrapper)); continue; }
        if (file.size > maxBytes) { errors.push(t('fileSize', { name: file.name, size: formatNumber(maxBytes / 1024 / 1024, { maximumFractionDigits: 2 }, wrapper) }, wrapper)); continue; }
        if (entries.some(entry => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified)) continue;
        if (entries.length >= maxFiles) { errors.push(t('fileCount', { count: maxFiles }, wrapper)); break; }
        entries.push({ file, state: 'Ready', progress: 0 });
      }
      sync(); render(); status.textContent = errors.length ? errors.join(' ') : t('filesSelected', { count: entries.length }, wrapper);
    }
    // Only user-generated input events add files; sync() emits change for consumers.
    input.addEventListener('input', () => add([...input.files]));
    wrapper.addEventListener('dragover', event => { if (!busy && !input.disabled) { event.preventDefault(); wrapper.dataset.dragging = ''; } });
    wrapper.addEventListener('dragleave', event => { if (!wrapper.contains(event.relatedTarget)) delete wrapper.dataset.dragging; });
    wrapper.addEventListener('drop', event => {
      event.preventDefault(); delete wrapper.dataset.dragging;
      if (!busy && !input.disabled) add([...event.dataTransfer.files]);
    });
    input.form?.addEventListener('reset', () => { cancelled = true; resetDuringUpload = true; uploadController?.abort(); entries = []; queueMicrotask(() => { input.value = ''; render(); status.textContent = ''; }); });
    wrapper.querySelectorAll('[data-tvw-file-enhanced]').forEach(element => { element.hidden = false; });
    controllers.set(wrapper, {
      getFiles: () => entries.map(entry => entry.file),
      clear() { if (busy) return; entries = []; sync(); render(); status.textContent = t('filesCleared', {}, wrapper); },
      cancel() { if (busy) { cancelled = true; uploadController?.abort(); } },
      async upload(adapter) {
        if (typeof adapter !== 'function') throw new TypeError('Provide an upload function');
        if (busy || !entries.length) return { completed: 0, failed: 0 };
        busy = true; cancelled = false; resetDuringUpload = false; uploadController = new AbortController();
        const signal = uploadController.signal; const originallyDisabled = input.disabled; input.disabled = true;
        let completed = 0, failed = 0;
        try {
          for (const entry of entries) {
            if (cancelled) break;
            if (entry.state === 'Complete') continue;
            entry.state = 'Uploading'; entry.error = ''; entry.progress = 0; render();
            status.textContent = t('uploading', { name: entry.file.name }, wrapper);
            try {
              await adapter(entry.file, value => {
                if (!Number.isFinite(value) || cancelled || entry.state !== 'Uploading') return;
                entry.progress = Math.max(0, Math.min(100, value)); render();
              }, { signal });
              if (cancelled) { entry.state = 'Cancelled'; break; }
              entry.state = 'Complete'; completed++;
            } catch (error) {
              if (signal.aborted) { entry.state = 'Cancelled'; break; }
              entry.state = 'Failed'; entry.error = error instanceof Error ? error.message : t('uploadFailed', {}, wrapper); failed++;
            }
          }
        } finally {
          busy = false; input.disabled = originallyDisabled; render();
          status.textContent = resetDuringUpload ? '' : cancelled ? t('uploadCancelled', {}, wrapper) : t('uploadSummary', { completed, failed }, wrapper) + (failed ? ` ${t('retryFiles', {}, wrapper)}` : '');
        }
        return { completed, failed, cancelled };
      },
    }); render();
  });
}
