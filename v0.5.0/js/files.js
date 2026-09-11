/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const controllers = new WeakMap();
export const getFilePicker = element => controllers.get(element);
export function initFiles(root) {
  root.querySelectorAll('[data-tvw-files]').forEach(wrapper => {
    if (controllers.has(wrapper)) return;
    const input = wrapper.querySelector('input[type="file"]');
    const list = wrapper.querySelector('[data-tvw-file-list]');
    const status = wrapper.querySelector('[data-tvw-file-status]');
    if (!input || !list || !status || typeof DataTransfer !== 'function') return;
    let entries = [], busy = false, cancelled = false;
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
        info.textContent = `${Math.max(1, Math.round(entry.file.size / 1024))} KB · ${entry.state}${entry.error ? `: ${entry.error}` : ''}`;
        content.append(name, info);
        if (entry.state === 'Uploading') {
          const progress = document.createElement('progress'); progress.className = 'tvw-progress'; progress.max = 100; progress.value = entry.progress;
          progress.setAttribute('aria-label', `Uploading ${entry.file.name}`); content.append(progress);
        }
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'tvw-button tvw-button--quiet tvw-button--sm';
        remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${entry.file.name}`); remove.disabled = busy || input.disabled;
        remove.addEventListener('click', () => {
          entries = entries.filter(item => item !== entry); sync(); render(); input.focus();
          status.textContent = `${entry.file.name} removed. ${entries.length} files selected.`;
        }); row.append(content, remove); list.append(row);
      });
    }
    function add(files) {
      if (busy || input.disabled) return;
      const errors = [];
      if (!input.multiple) entries = [];
      for (const file of files) {
        if (!accepted(file)) { errors.push(`${file.name}: file type is not accepted.`); continue; }
        if (file.size > maxBytes) { errors.push(`${file.name}: exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`); continue; }
        if (entries.some(entry => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified)) continue;
        if (entries.length >= maxFiles) { errors.push(`Select at most ${maxFiles} files.`); break; }
        entries.push({ file, state: 'Ready', progress: 0 });
      }
      sync(); render(); status.textContent = errors.length ? errors.join(' ') : `${entries.length} files selected.`;
    }
    // Only user-generated input events add files; sync() emits change for consumers.
    input.addEventListener('input', () => add([...input.files]));
    wrapper.addEventListener('dragover', event => { if (!busy && !input.disabled) { event.preventDefault(); wrapper.dataset.dragging = ''; } });
    wrapper.addEventListener('dragleave', event => { if (!wrapper.contains(event.relatedTarget)) delete wrapper.dataset.dragging; });
    wrapper.addEventListener('drop', event => {
      event.preventDefault(); delete wrapper.dataset.dragging;
      if (!busy && !input.disabled) add([...event.dataTransfer.files]);
    });
    input.form?.addEventListener('reset', () => { cancelled = true; entries = []; queueMicrotask(() => { input.value = ''; render(); status.textContent = ''; }); });
    wrapper.querySelectorAll('[data-tvw-file-enhanced]').forEach(element => { element.hidden = false; });
    controllers.set(wrapper, {
      getFiles: () => entries.map(entry => entry.file),
      clear() { if (busy) return; entries = []; sync(); render(); status.textContent = 'Files cleared.'; },
      async upload(adapter) {
        if (typeof adapter !== 'function') throw new TypeError('Provide an upload function');
        if (busy || !entries.length) return { completed: 0, failed: 0 };
        busy = true; cancelled = false; const originallyDisabled = input.disabled; input.disabled = true;
        let completed = 0, failed = 0;
        try {
          for (const entry of entries) {
            if (cancelled) break;
            if (entry.state === 'Complete') continue;
            entry.state = 'Uploading'; entry.error = ''; entry.progress = 0; render();
            status.textContent = `Uploading ${entry.file.name}.`;
            try {
              await adapter(entry.file, value => {
                if (!Number.isFinite(value) || cancelled || entry.state !== 'Uploading') return;
                entry.progress = Math.max(0, Math.min(100, value)); render();
              });
              entry.state = 'Complete'; completed++;
            } catch (error) { entry.state = 'Failed'; entry.error = error instanceof Error ? error.message : 'Upload failed'; failed++; }
          }
        } finally {
          busy = false; input.disabled = originallyDisabled; render();
          status.textContent = cancelled ? 'Selection cleared.' : `${completed} completed, ${failed} failed.${failed ? ' Retry to send failed files again.' : ''}`;
        }
        return { completed, failed };
      },
    }); render();
  });
}
