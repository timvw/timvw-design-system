/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const controllers = new WeakMap();
export function getTable(container) { return controllers.get(container); }

export function initTables(root) {
  root.querySelectorAll('[data-tvw-table]').forEach(container => {
    if (controllers.has(container)) return;
    const table = container.querySelector('table');
    const body = table?.tBodies[0];
    if (!body) return;
    const search = container.querySelector('[data-tvw-search]');
    const filters = [...container.querySelectorAll('[data-tvw-filter]')];
    const chips = container.querySelector('[data-tvw-filter-chips]');
    const pagination = container.querySelector('[data-tvw-pagination]');
    const count = container.querySelector('[data-tvw-result-count]');
    const selectedCount = container.querySelector('[data-tvw-selection-count]');
    const selectAll = container.querySelector('[data-tvw-select-all]');
    const empty = container.querySelector('[data-tvw-empty]');
    const pageSize = Math.max(1, parseInt(container.dataset.pageSize, 10) || 10);
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    let rows = [...body.rows], page = 1, sortColumn = -1, direction = 1, visible = [];
    const selected = () => rows.filter(row => row.querySelector('[data-tvw-row-select]')?.checked);

    function selection() {
      const checked = selected();
      if (selectedCount) selectedCount.textContent = `${checked.length} selected`;
      const boxes = visible.map(row => row.querySelector('[data-tvw-row-select]')).filter(box => box && !box.disabled);
      if (selectAll) {
        selectAll.disabled = !boxes.length;
        selectAll.checked = boxes.length > 0 && boxes.every(box => box.checked);
        selectAll.indeterminate = boxes.some(box => box.checked) && !selectAll.checked;
      }
      container.dispatchEvent(new CustomEvent('tvw:selectionchange', { bubbles: true, detail: { values: checked.map(row => row.querySelector('[data-tvw-row-select]').value) } }));
    }

    function render() {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      const filtered = rows.filter(row => (!query || (row.dataset.search || row.textContent).toLocaleLowerCase().includes(query))
        && filters.every(filter => !filter.value || row.dataset[filter.dataset.tvwFilter] === filter.value));
      if (sortColumn >= 0) {
        const type = table.tHead.rows[0].cells[sortColumn].querySelector('[data-tvw-sort]').dataset.tvwSort;
        filtered.sort((a, b) => {
          const value = row => row.cells[sortColumn].dataset.sortValue ?? row.cells[sortColumn].textContent.trim();
          const av = value(a), bv = value(b);
          const compared = type === 'number' ? Number(av) - Number(bv) : type === 'date' ? Date.parse(av) - Date.parse(bv) : collator.compare(av, bv);
          return (Number.isFinite(compared) && compared ? compared * direction : rows.indexOf(a) - rows.indexOf(b));
        });
      }
      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, pages);
      visible = pagination ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;
      rows.forEach(row => { row.hidden = !visible.includes(row); });
      // Keep every original row in the DOM, including filtered-out and selected rows.
      body.append(...filtered, ...rows.filter(row => !filtered.includes(row)));
      if (empty) empty.hidden = filtered.length > 0;
      if (count) count.textContent = filtered.length
        ? `${pagination ? (page - 1) * pageSize + 1 : 1}–${pagination ? Math.min(page * pageSize, filtered.length) : filtered.length} of ${filtered.length} results`
        : 'No results';
      if (pagination) {
        const restoreFocus = pagination.contains(document.activeElement);
        pagination.replaceChildren(); pagination.hidden = pages <= 1;
        const add = (label, target, disabled = false, current = false) => {
          const button = document.createElement('button'); button.type = 'button';
          button.className = 'tvw-button tvw-button--secondary tvw-button--sm';
          button.textContent = label; button.disabled = disabled;
          if (current) button.setAttribute('aria-current', 'page');
          if (/^\d+$/.test(label)) button.setAttribute('aria-label', `Page ${label}`);
          button.addEventListener('click', () => { page = target; render(); });
          pagination.append(button);
        };
        add('Previous', page - 1, page === 1);
        const start = Math.max(1, Math.min(page - 2, pages - 4));
        for (let i = start; i <= Math.min(pages, start + 4); i++) add(String(i), i, false, i === page);
        add('Next', page + 1, page === pages);
        if (restoreFocus) pagination.querySelector('[aria-current]')?.focus();
      }
      if (chips) {
        chips.replaceChildren();
        const active = [search, ...filters].filter(input => input?.value);
        active.forEach(input => {
          const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'tvw-chip';
          const label = input.labels?.[0]?.textContent.trim() || 'Search';
          const value = input.tagName === 'SELECT' ? input.selectedOptions[0].textContent : input.value;
          chip.textContent = `${label}: ${value} ×`; chip.setAttribute('aria-label', `Clear ${label}: ${value}`);
          chip.addEventListener('click', () => { input.value = ''; input.focus(); page = 1; render(); });
          chips.append(chip);
        });
      }
      selection();
      container.dispatchEvent(new CustomEvent('tvw:tablechange', { bubbles: true, detail: { total: rows.length, filtered: filtered.length, page, pages } }));
    }

    search?.addEventListener('input', () => { page = 1; render(); });
    filters.forEach(filter => filter.addEventListener('change', () => { page = 1; render(); }));
    table.querySelectorAll('[data-tvw-sort]').forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        const heading = button.closest('th');
        direction = sortColumn === heading.cellIndex ? -direction : 1;
        sortColumn = heading.cellIndex;
        table.querySelectorAll('th[aria-sort]').forEach(th => th.removeAttribute('aria-sort'));
        heading.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
        page = 1; render();
      });
    });
    selectAll?.addEventListener('change', () => {
      visible.forEach(row => { const box = row.querySelector('[data-tvw-row-select]'); if (box && !box.disabled) box.checked = selectAll.checked; });
      selection();
    });
    body.addEventListener('change', event => { if (event.target.matches('[data-tvw-row-select]')) selection(); });
    container.querySelectorAll('[data-tvw-clear-filters]').forEach(button => button.addEventListener('click', () => {
      if (search) search.value = ''; filters.forEach(filter => { filter.value = ''; }); page = 1; render(); search?.focus();
    }));
    container.querySelectorAll('[data-tvw-table-controls]').forEach(control => { control.hidden = false; });
    controllers.set(container, {
      refresh() { rows = [...body.rows]; render(); },
      getSelected: () => selected().map(row => row.querySelector('[data-tvw-row-select]').value),
      clearSelection() { rows.forEach(row => { const box = row.querySelector('[data-tvw-row-select]'); if (box) box.checked = false; }); selection(); },
    });
    render();
  });
}
