import { sanitizeHTML, downloadBlob, sortByColumn } from '../utils.js';

export function renderCSVPanel(panel, tab) {
  // Internal state for this panel
  const st = {
    rows: [],
    headersOn: true,
    filtered: [],
    sort: { idx: null, asc: true }
  };

  // Parse CSV via PapaParse (fast and robust)
  const parsed = Papa.parse(tab.content, { skipEmptyLines: true });
  st.rows = parsed.data;

  // Build UI
  panel.innerHTML = `
    <div class="file-toolbar">
      <input type="text" placeholder="Filter rows..." class="csv-filter" />
      <label><input type="checkbox" class="csv-headers" checked /> Headers on</label>
      <button class="btn csv-export">Export CSV</button>
    </div>
    <div class="table-wrap">
      <table class="csv-table">
        <thead></thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const filterInput = panel.querySelector('.csv-filter');
  const headersCheckbox = panel.querySelector('.csv-headers');
  const exportBtn = panel.querySelector('.csv-export');
  const thead = panel.querySelector('thead');
  const tbody = panel.querySelector('tbody');

  // Render table
  function renderTable() {
    const rows = st.filtered.length ? st.filtered : st.rows;
    tbody.innerHTML = '';
    thead.innerHTML = '';
    if (!rows.length) return;

    const headerRow = st.headersOn ? rows[0] : rows[0].map((_, i) => `Col ${i+1}`);

    const trh = document.createElement('tr');
    headerRow.forEach((h, idx) => {
      const th = document.createElement('th');
      th.textContent = h;
      th.dataset.idx = idx;
      th.addEventListener('click', () => {
        const asc = (st.sort.idx === idx) ? !st.sort.asc : true;
        st.sort = { idx, asc };
        let data = st.headersOn ? rows.slice(1) : rows.slice(0);
        data = sortByColumn(data, idx, asc);
        st.filtered = st.headersOn ? [rows[0], ...data] : data;
        renderTable();
        [...thead.querySelectorAll('th')].forEach(el => el.classList.remove('sort-asc','sort-desc'));
        th.classList.add(asc ? 'sort-asc' : 'sort-desc');
      });
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    const dataRows = st.headersOn ? rows.slice(1) : rows;
    dataRows.forEach((row, rIdx) => {
      const tr = document.createElement('tr');
      row.forEach((cell, cIdx) => {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        td.textContent = cell;
        td.addEventListener('input', () => {
          const targetRows = st.filtered.length ? st.filtered : st.rows;
          const baseIdx = st.headersOn ? rIdx + 1 : rIdx;
          targetRows[baseIdx][cIdx] = td.textContent;
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // Filter
  filterInput.addEventListener('input', () => {
    const q = filterInput.value.toLowerCase();
    st.filtered = [];
    const rows = st.rows;
    if (!q) {
      renderTable();
      return;
    }
    const dataRows = st.headersOn ? rows.slice(1) : rows;
    const filteredData = dataRows.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(q))
    );
    st.filtered = st.headersOn ? [rows[0], ...filteredData] : filteredData;
    renderTable();
  });

  headersCheckbox.addEventListener('change', () => {
    st.headersOn = headersCheckbox.checked;
    renderTable();
  });

  exportBtn.addEventListener('click', () => {
    const rows = st.filtered.length ? st.filtered : st.rows;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, ensureCsvExt(tab.name));
  });

  // Provide export function for context menu
  tab.export = () => {
    const rows = st.filtered.length ? st.filtered : st.rows;
    return Papa.unparse(rows);
  };

  renderTable();

  function ensureCsvExt(name) {
    return name.toLowerCase().endsWith('.csv') ? name : `${name}.csv`;
  }
}
