import { sanitizeHTML, downloadBlob } from '../utils.js';

export function renderTXTPanel(panel, tab) {
  panel.innerHTML = `
    <div class="file-toolbar">
      <input type="text" placeholder="Search text..." class="txt-filter" />
      <span class="text-stats"></span>
      <button class="btn txt-download">Download</button>
    </div>
    <div class="text-view">
      <pre><code class="hljs txt-code"></code></pre>
    </div>
  `;

  const filterInput = panel.querySelector('.txt-filter');
  const statsEl = panel.querySelector('.text-stats');
  const codeEl = panel.querySelector('.txt-code');
  const downloadBtn = panel.querySelector('.txt-download');

  // Render text with syntax highlighting auto-detect
  codeEl.textContent = tab.content;
  hljs.highlightElement(codeEl);

  updateStats();

  // Search highlight within code block
  filterInput.addEventListener('input', () => {
    const q = filterInput.value;
    const text = tab.content;
    if (!q) {
      codeEl.textContent = text;
      hljs.highlightElement(codeEl);
      return;
    }
    const safeQ = escapeRegExp(q);
    const re = new RegExp(`(${safeQ})`, 'gi');
    const html = sanitizeHTML(text).replace(re, '<mark>$1</mark>');
    codeEl.innerHTML = html;
  });

  downloadBtn.addEventListener('click', () => {
    downloadBlob(new Blob([tab.content], { type: 'text/plain' }), tab.name);
  });

  tab.export = () => tab.content;

  function updateStats() {
    const lines = tab.content.split(/\r?\n/).length;
    const words = (tab.content.match(/\S+/g) || []).length;
    statsEl.textContent = `${lines} lines • ${words} words`;
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]

\\]

/g, '\\$&');
  }
}
