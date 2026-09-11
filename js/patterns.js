/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init, setRegionState, getFilePicker, setBusy, notify } from './timvw.js?v=0.5.0';
const region = document.getElementById('region-preview');
let timer;
function load() { clearTimeout(timer); setRegionState(region, 'loading'); timer = setTimeout(() => setRegionState(region, 'ready'), 900); }
document.querySelectorAll('[data-preview-state]').forEach(button => button.addEventListener('click', () => {
  clearTimeout(timer);
  if (button.dataset.previewState === 'loading') load(); else setRegionState(region, button.dataset.previewState);
}));
document.querySelector('[data-retry-region]').addEventListener('click', load);
const wizard = document.getElementById('demo-wizard');
wizard.addEventListener('tvw:stepchange', event => { wizard.querySelector('[data-wizard-review]').textContent = `Name: ${event.detail.formData.get('name') || 'Not entered'}`; });
wizard.addEventListener('tvw:complete', event => { event.preventDefault(); notify('Preview complete. Nothing was sent.', { tone: 'success' }); });
document.querySelector('[data-upload-preview]').addEventListener('click', async event => {
  const picker = getFilePicker(document.getElementById('demo-files'));
  if (!picker.getFiles().length) { notify('Choose a file before starting the preview.'); return; }
  const button = event.currentTarget; setBusy(button, true, 'Simulating…');
  try {
    await picker.upload(async (file, progress) => {
      for (let value = 25; value <= 100; value += 25) { await new Promise(resolve => setTimeout(resolve, 150)); progress(value); }
      if (document.getElementById('simulate-upload-failure').checked) throw new Error('Simulated failure. Uncheck the failure option and retry.');
    });
  } finally { setBusy(button, false); }
});
init();
