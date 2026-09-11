/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const search = document.getElementById('component-search');
const category = document.getElementById('component-category');
const cards = [...document.querySelectorAll('[data-catalog-item]')];
function filter() {
  const query = search.value.trim().toLocaleLowerCase(); let count = 0;
  cards.forEach(card => {
    card.hidden = !(card.textContent.toLocaleLowerCase().includes(query) && (!category.value || card.dataset.category === category.value));
    if (!card.hidden) count++;
  });
  document.getElementById('component-count').textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
  document.getElementById('component-empty').hidden = count !== 0;
  const params = new URLSearchParams(location.search);
  if (search.value) params.set('q', search.value); else params.delete('q');
  if (category.value) params.set('category', category.value); else params.delete('category');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
}
const params = new URLSearchParams(location.search);
search.value = params.get('q') || ''; category.value = params.get('category') || '';
search.addEventListener('input', filter); category.addEventListener('change', filter);
document.getElementById('clear-explorer').addEventListener('click', () => { search.value = ''; category.value = ''; filter(); search.focus(); });
document.querySelectorAll('[data-explorer-controls]').forEach(control => { control.hidden = false; }); filter();
const icons = [...document.querySelectorAll('[data-icon]')];
icons.forEach(icon => { icon.disabled = false; });
document.getElementById('icon-search').addEventListener('input', event => {
  icons.forEach(icon => { icon.hidden = !icon.dataset.icon.includes(event.target.value.trim().toLowerCase()); });
  document.getElementById('icon-status').textContent = `${icons.filter(icon => !icon.hidden).length} icons`;
});
icons.forEach(icon => icon.addEventListener('click', async () => {
  const source = `<svg class="tvw-icon" aria-hidden="true"><use href="./icons.svg#${icon.dataset.icon}"></use></svg>`;
  document.getElementById('selected-icon-code').textContent = source;
  document.getElementById('icon-source').open = true;
  try { await navigator.clipboard.writeText(source); document.getElementById('icon-status').textContent = `${icon.dataset.icon} markup copied.`; }
  catch { document.getElementById('icon-status').textContent = 'Select and copy the HTML below.'; }
}));
function tokens() {
  const style = getComputedStyle(document.documentElement);
  document.querySelectorAll('[data-token]').forEach(element => { element.textContent = style.getPropertyValue(element.dataset.token).trim(); });
}
document.addEventListener('tvw:themechange', tokens); tokens();
