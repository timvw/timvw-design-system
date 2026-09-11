/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { init, getCombobox, getFilePicker, getWizard, setRegionState } from '../js/timvw.js';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
const press = (target, key) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
export async function runWorkflowChecks(check, fixtures) {
  const fixture = markup => { const holder = document.createElement('div'); holder.innerHTML = markup; fixtures.append(holder); init(holder); return holder; };
  await check('Combobox keyboard selection updates native form data and skips disabled options', () => {
    const holder = fixture('<form><div data-tvw-combobox><label for="wf-owner">Owner</label><select id="wf-owner" name="owner" required><option value="">Choose</option><option disabled>Unavailable</option><option value="alex">Alex</option><option value="sam">Sam</option></select></div></form>');
    const input = holder.querySelector('[role="combobox"]'); input.focus(); press(input, 'ArrowDown'); press(input, 'Enter');
    assert(new FormData(holder.querySelector('form')).get('owner') === 'alex', 'Wrong submitted value');
    assert(input.value === 'Alex' && input.validity.valid && input.getAttribute('aria-expanded') === 'false', 'Selection not committed');
    assert(holder.querySelector('label').control === input, 'Label did not follow enhanced input');
  });
  await check('Combobox rejects unselected required text and restores defaults on reset', async () => {
    const holder = fixture('<form><div data-tvw-combobox><label for="wf-reset">Owner</label><select id="wf-reset" required><option value="">Choose</option><option selected>Alex</option></select></div></form>');
    const input = holder.querySelector('[role="combobox"]'); input.value = 'Unknown'; input.dispatchEvent(new Event('input'));
    assert(!input.validity.valid, 'Arbitrary text passed selection validation');
    holder.querySelector('form').reset(); await frame(); assert(input.value === 'Alex' && input.validity.valid, 'Reset failed');
  });
  await check('Multiple selection submits all values and chips remove individual values', () => {
    const holder = fixture('<form><div data-tvw-combobox><label for="wf-tags">Tags</label><select id="wf-tags" name="tags" multiple><option selected>Design</option><option>Research</option></select></div></form>');
    const input = holder.querySelector('[role="combobox"]'); input.focus(); press(input, 'ArrowDown'); press(input, 'Enter');
    assert(new FormData(holder.querySelector('form')).getAll('tags').join(',') === 'Design,Research', 'Multiple values missing');
    holder.querySelector('[aria-label="Remove Design"]').click();
    assert(getCombobox(holder.querySelector('[data-tvw-combobox]')).getValues().join(',') === 'Research', 'Chip did not remove value');
    input.blur();
  });
  await check('Wizard validates steps, preserves previous values, and includes every step on completion', () => {
    const holder = fixture('<form data-tvw-wizard><ol data-tvw-step-list></ol><p data-tvw-step-error hidden></p><section data-tvw-step="Name"><h2>Name</h2><label for="wf-name">Name</label><input id="wf-name" name="name" required></section><section data-tvw-step="Review"><h2>Review</h2></section><button type="button" data-tvw-previous>Back</button><button type="button" data-tvw-next>Next</button><button data-tvw-finish>Finish</button></form>');
    const form = holder.querySelector('form'), wizard = getWizard(form);
    assert(!wizard.goTo(1) && wizard.getStep() === 0, 'Invalid step was skipped');
    holder.querySelector('input').value = 'Atlas'; assert(wizard.goTo(1), 'Valid step blocked');
    wizard.goTo(0); assert(holder.querySelector('input').value === 'Atlas', 'Back cleared values'); wizard.goTo(1);
    let data; form.addEventListener('tvw:complete', event => { event.preventDefault(); data = event.detail.formData; }); form.requestSubmit();
    assert(data.get('name') === 'Atlas', 'Hidden step was omitted from form data');
  });
  await check('File picker filters types and sizes and synchronizes removal to native files', () => {
    const holder = fixture('<div data-tvw-files data-max-bytes="5" data-max-files="2"><label for="wf-file">File</label><input id="wf-file" type="file" multiple accept=".txt"><ul data-tvw-file-list></ul><p data-tvw-file-status></p></div>');
    const input = holder.querySelector('input'), transfer = new DataTransfer();
    transfer.items.add(new File(['ok'], 'notes.txt')); transfer.items.add(new File(['bad'], 'image.exe')); transfer.items.add(new File(['too long'], 'large.txt'));
    input.files = transfer.files; input.dispatchEvent(new Event('input'));
    assert(input.files.length === 1 && input.files[0].name === 'notes.txt', 'Rejected files remained selected');
    holder.querySelector('button').click(); assert(input.files.length === 0, 'Removal did not reach native input');
  });
  await check('Uploads report failures and retry only unfinished files', async () => {
    const holder = fixture('<div data-tvw-files><label for="wf-upload">Files</label><input id="wf-upload" type="file" multiple><ul data-tvw-file-list></ul><p data-tvw-file-status></p></div>');
    const input = holder.querySelector('input'), transfer = new DataTransfer();
    transfer.items.add(new File(['a'], 'a.txt')); transfer.items.add(new File(['b'], 'b.txt')); input.files = transfer.files; input.dispatchEvent(new Event('input'));
    const picker = getFilePicker(holder.firstElementChild);
    const first = await picker.upload(async file => { if (file.name === 'b.txt') throw new Error('Try again'); });
    assert(first.completed === 1 && first.failed === 1 && !input.disabled, 'Failure states incorrect');
    const retried = []; await picker.upload(async file => { retried.push(file.name); });
    assert(retried.join(',') === 'b.txt', 'Retry resent completed files');
  });
  await check('Region states update busy status and preserve focus when hiding an action', () => {
    const holder = fixture('<section><span data-tvw-region-status></span><div data-tvw-state="ready"><button>Load</button></div><div data-tvw-state="loading" hidden>Loading</div><div data-tvw-state="error" hidden>Retry</div></section>');
    const region = holder.firstElementChild; holder.querySelector('button').focus(); setRegionState(region, 'loading');
    assert(region.getAttribute('aria-busy') === 'true' && document.activeElement === region, 'Busy or focus state incorrect');
    setRegionState(region, 'error'); assert(region.getAttribute('aria-busy') === 'false' && !region.querySelector('[data-tvw-state="error"]').hidden, 'Error state missing');
  });
  await check('Expandable table rows follow their parent and column visibility updates detail spans', () => {
    const holder = fixture('<div data-tvw-table data-page-size="1"><label>Search<input data-tvw-search></label><label>Owner<input type="checkbox" data-tvw-column="1" checked></label><table><thead><tr><th>Project</th><th>Owner</th></tr></thead><tbody><tr><th>Atlas<button data-tvw-expand aria-controls="wf-detail" aria-expanded="false">Details</button></th><td>Alex</td></tr><tr id="wf-detail" data-tvw-detail-row hidden><td colspan="2">Context</td></tr><tr><th>Beacon</th><td>Sam</td></tr></tbody></table><nav data-tvw-pagination></nav></div>');
    holder.querySelector('[data-tvw-expand]').click(); assert(!holder.querySelector('#wf-detail').hidden, 'Expansion failed');
    holder.querySelector('[data-tvw-column]').click(); assert(holder.querySelector('#wf-detail td').colSpan === 1, 'Detail span did not track columns');
    const search = holder.querySelector('[data-tvw-search]'); search.value = 'Beacon'; search.dispatchEvent(new Event('input'));
    assert(holder.querySelector('#wf-detail').hidden, 'Filtered parent left its details visible');
  });
}
