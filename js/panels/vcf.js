import { sanitizeHTML, downloadBlob } from '../utils.js';

export function renderVCFPanel(panel, tab) {
  const contacts = parseVCF(tab.content);

  panel.innerHTML = `
    <div class="file-toolbar">
      <input type="text" placeholder="Search contacts..." class="vcf-filter" />
      <button class="btn vcf-export">Export selected VCF</button>
    </div>
    <div class="cards vcf-cards"></div>
  `;

  const filterInput = panel.querySelector('.vcf-filter');
  const exportBtn = panel.querySelector('.vcf-export');
  const cardsEl = panel.querySelector('.vcf-cards');

  let filtered = contacts.slice();
  renderCards(filtered);

  filterInput.addEventListener('input', () => {
    const q = filterInput.value.toLowerCase();
    filtered = contacts.filter(c => JSON.stringify(c).toLowerCase().includes(q));
    renderCards(filtered);
  });

  exportBtn.addEventListener('click', () => {
    const selected = Array.from(cardsEl.querySelectorAll('input[type="checkbox"]:checked'))
      .map(chk => filtered.find(c => c.id === chk.value))
      .filter(Boolean);
    const vcfText = selected.length ? selected.map(toVCF).join('\n') : filtered.map(toVCF).join('\n');
    downloadBlob(new Blob([vcfText], { type: 'text/vcard' }), ensureVcfExt(tab.name));
  });

  tab.export = () => filtered.map(toVCF).join('\n');

  function renderCards(list) {
    cardsEl.innerHTML = '';
    list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4>${sanitizeHTML(c.fn || '(No name)')}</h4>
          <input type="checkbox" value="${sanitizeHTML(c.id)}" />
        </div>
        <div class="meta">UID: ${sanitizeHTML(c.uid || c.id)}</div>
        ${c.tel ? `<p><strong>Phone:</strong> ${sanitizeHTML(c.tel)}</p>` : ''}
        ${c.email ? `<p><strong>Email:</strong> ${sanitizeHTML(c.email)}</p>` : ''}
        ${c.org ? `<p><strong>Org:</strong> ${sanitizeHTML(c.org)}</p>` : ''}
        ${c.title ? `<p><strong>Title:</strong> ${sanitizeHTML(c.title)}</p>` : ''}
        ${c.note ? `<p><strong>Note:</strong> ${sanitizeHTML(c.note)}</p>` : ''}
      `;
      cardsEl.appendChild(card);
    });
  }

  function ensureVcfExt(name) {
    return name.toLowerCase().endsWith('.vcf') ? name : `${name}.vcf`;
  }
}

function parseVCF(text) {
  const entries = text.split(/END:VCARD/i).map(s => s.trim()).filter(Boolean);
  return entries.map((entry, idx) => {
    const lines = entry.split(/\r?\n/).map(l => l.trim());
    const obj = { id: String(idx + 1) };
    lines.forEach(line => {
      const [keyPart, ...rest] = line.split(':');
      const val = rest.join(':').trim();
      const key = keyPart.split(';')[0].toUpperCase();
      switch (key) {
        case 'BEGIN': break;
        case 'FN': obj.fn = val; break;
        case 'N': obj.n = val; break;
        case 'TEL': obj.tel = val; break;
        case 'EMAIL': obj.email = val; break;
        case 'ORG': obj.org = val; break;
        case 'TITLE': obj.title = val; break;
        case 'NOTE': obj.note = val; break;
        case 'UID': obj.uid = val; break;
        default: {
          const k = key.toLowerCase();
          obj[k] = val;
        }
      }
    });
    return obj;
  });
}

function toVCF(c) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    c.fn ? `FN:${c.fn}` : '',
    c.n ? `N:${c.n}` : '',
    c.tel ? `TEL:${c.tel}` : '',
    c.email ? `EMAIL:${c.email}` : '',
    c.org ? `ORG:${c.org}` : '',
    c.title ? `TITLE:${c.title}` : '',
    c.note ? `NOTE:${c.note}` : '',
    c.uid ? `UID:${c.uid}` : '',
    'END:VCARD'
  ].filter(Boolean);
  return lines.join('\n');
}
