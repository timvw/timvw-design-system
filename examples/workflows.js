/* Example service adapters only: nothing is transmitted or persisted. */
import { getForm, watchChanges, getEditor, getCombobox, getFilePicker } from '../components/page.js?v=0.9.0';

document.querySelectorAll('[data-tvw-js-only]').forEach(element => { element.hidden = false; });
export function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
const form = document.getElementById('connected-form'), dirty = watchChanges(form);
form.addEventListener('tvw:dirtychange', event => { document.getElementById('dirty-status').textContent = event.detail.dirty ? 'Unsaved changes.' : 'No unsaved changes.'; });
getForm(form).configure({ validate: async (data, { signal }) => {
  await delay(500, signal);
  if (data.get('workspace').trim().toLowerCase() === 'offline') throw new Error('Unavailable');
  const errors = {};
  if (data.get('workspace').trim().toLowerCase() === 'taken') errors.workspace = 'This workspace name is already in use.';
  if (data.get('end') < data.get('start')) errors.end = 'End date must be on or after the start date.';
  return errors;
} });
form.addEventListener('tvw:valid-submit', event => { event.preventDefault(); dirty.markSaved(); document.getElementById('save-result').textContent = 'Workspace accepted by the example service. Nothing was sent.'; });
const editor = document.getElementById('workspace-editor');
getEditor(editor).configure({ save: async value => { await delay(350); if (value.trim().toLowerCase() === 'offline') throw new Error('Unavailable'); } });
editor.addEventListener('tvw:edited', event => {
  document.getElementById('detail-workspace').textContent = event.detail.value;
  const entry = document.createElement('li'), title = document.createElement('strong'), time = document.createElement('time');
  title.textContent = `Renamed to ${event.detail.value}`; time.dateTime = new Date().toISOString(); time.textContent = 'Just now'; entry.append(title, document.createElement('br'), time); document.getElementById('activity').prepend(entry);
});
getCombobox(document.getElementById('remote-people')).configure({ loadOptions: async (query, { signal }) => {
  await delay(450, signal); if (query.toLowerCase() === 'fail') throw new Error('Unavailable');
  return [{ value: 'alex', label: 'Alex Rivera', group: 'Design' }, { value: 'sam', label: 'Sam Chen', group: 'Design' }, { value: 'morgan', label: 'Morgan Lee', group: 'Engineering' }].filter(option => option.label.toLowerCase().includes(query.toLowerCase()));
} });
const picker = getFilePicker(document.getElementById('cancel-files')), start = document.getElementById('upload-start'), cancel = document.getElementById('upload-cancel');
start.addEventListener('click', async () => {
  start.disabled = true; cancel.disabled = false;
  try { await picker.upload(async (file, progress, { signal }) => { for (let value = 0; value <= 100; value += 10) { await delay(200, signal); progress(value); } }); }
  finally { start.disabled = false; cancel.disabled = true; }
});
cancel.addEventListener('click', () => picker.cancel());
