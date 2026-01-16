// ===== SIM Ticketing UI JS =====
(() => {
  // Elements
  const actionsBtn   = document.getElementById('actionsBtn');
  const actionsMenu  = document.getElementById('actionsMenu');
  const updateKA     = document.getElementById('actionUpdateKA');
  const tableBody    = document.querySelector('.table-body');
  const selectAll    = document.querySelector('.table-head input[type="checkbox"]');

  // ----- Helpers -----
  function openMenu() {
    if (actionsMenu) {
      actionsMenu.removeAttribute('hidden');
      actionsBtn?.setAttribute('aria-expanded', 'true');
    }
  }

  function closeMenu() {
    if (actionsMenu && !actionsMenu.hasAttribute('hidden')) {
      actionsMenu.setAttribute('hidden', '');
      actionsBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  function getSelectedRows() {
    return Array.from(document.querySelectorAll('.table-body .tr'))
      .filter(row => {
        const cb = row.querySelector('.td-check input[type="checkbox"]');
        return cb && cb.checked;
      });
  }

  function getSelectedShortIds() {
    const rows = getSelectedRows();
    const ids = [];
    rows.forEach(row => {
      // Order of cells in each row:
      // [0]=label.td.td-check, [1]=severity, [2]=Short ID, ...
      const cells = row.querySelectorAll('.td');
      const shortIdCell = cells[2];
      if (shortIdCell) {
        const id = shortIdCell.textContent.trim();
        if (id) ids.push(id);
      }
    });
    return ids;
  }

  // ----- Dropdown toggle -----
  actionsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (actionsMenu?.hasAttribute('hidden')) openMenu();
    else closeMenu();
  });

  // Close on outside click
  document.addEventListener('click', () => closeMenu());
  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // ----- Select All -----
  selectAll?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.table-body .td-check input[type="checkbox"]').forEach(cb => {
      cb.checked = checked;
    });
  });

  // If any individual row is toggled off, uncheck "Select All" automatically
  tableBody?.addEventListener('change', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'checkbox') return;

    // If any row is unchecked, uncheck the header checkbox
    if (!target.checked) {
      if (selectAll) selectAll.checked = false;
    } else {
      // If all row checkboxes are checked, check the header checkbox
      const all = Array.from(document.querySelectorAll('.table-body .td-check input[type="checkbox"]'));
      const allChecked = all.length > 0 && all.every(cb => cb.checked);
      if (selectAll) selectAll.checked = allChecked;
    }
  });

  // ----- Actions: Update KA -----
  // HTML has an <a href="aimagic.html" id="actionUpdateKA"> inside the dropdown.
  // We intercept to enforce selection and pass ?ids=
  updateKA?.addEventListener('click', (e) => {
    // allow anchor default behavior only if we have ids
    const ids = getSelectedShortIds();
    if (!ids.length) {
      e.preventDefault();
      alert('Please select at least one ticket first.');
      return;
    }

    // Build URL with selected IDs
    e.preventDefault();
    const url = new URL('aimagic.html', window.location.href);
    url.searchParams.set('ids', ids.join(','));
    window.location.href = url.toString();
  });
})();
