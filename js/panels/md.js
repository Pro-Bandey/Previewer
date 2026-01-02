import { sanitizeHTML, downloadBlob } from '../utils.js';

export function renderMDPanel(panel, tab) {
  panel.innerHTML = `
    <div class="file-toolbar">
      <button class="btn md-export">Export .md</button>
    </div>
    <div class="md-split">
      <div class="md-editor">
        <textarea class="md-input" placeholder="Write Markdown..."></textarea>
      </div>
      <div class="md-preview"></div>
    </div>
  `;

  const inputEl = panel.querySelector('.md-input');
  const previewEl = panel.querySelector('.md-preview');
  const exportBtn = panel.querySelector('.md-export');

  inputEl.value = tab.content;
  renderPreview();

  inputEl.addEventListener('input', () => {
    tab.content = inputEl.value;
    renderPreview();
  });

  exportBtn.addEventListener('click', () => {
    downloadBlob(new Blob([tab.content], { type: 'text/markdown' }), ensureMdExt(tab.name));
  });

  tab.export = () => tab.content;

  function renderPreview() {
    // Configure marked for safe rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    const html = marked.parse(inputEl.value || '');
    previewEl.innerHTML = html;
    // Syntax highlight code blocks
    previewEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  }

  function ensureMdExt(name) {
    return name.toLowerCase().endsWith('.md') ? name : `${name}.md`;
  }
}
