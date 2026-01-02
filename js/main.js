import { detectType, readFilesAsText, downloadBlob, sanitizeHTML, uniqueId } from './utils.js';
import { State } from './state.js';
import { renderCSVPanel } from './panels/csv.js';
import { renderVCFPanel } from './panels/vcf.js';
import { renderTXTPanel } from './panels/txt.js';
import { renderMDPanel } from './panels/md.js';

const state = new State();

const fileInput = document.getElementById('file-input');
const openFilesBtn = document.getElementById('open-files-btn');
const dropZone = document.getElementById('drop-zone');
const tabsEl = document.getElementById('tabs');
const panelsEl = document.getElementById('tab-panels');
const searchAllInput = document.getElementById('search-all');
const clearSearchAllBtn = document.getElementById('clear-search-all');
const contextMenu = document.getElementById('context-menu');
const fileInfo = document.getElementById('file-info');
const themeToggle = document.getElementById('theme-toggle');
const fontSizeInput = document.getElementById('font-size');

// Initialize UI from settings
initSettings();

// File opening
openFilesBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
  await openFiles(e.target.files);
  fileInput.value = '';
});

// Drag & drop
['dragenter', 'dragover'].forEach(evt =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  })
);
['dragleave', 'drop'].forEach(evt =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  })
);
dropZone.addEventListener('drop', async (e) => {
  const files = e.dataTransfer.files;
  await openFiles(files);
});

// Tabs clicking
tabsEl.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  const id = tab.dataset.id;
  if (e.target.classList.contains('close')) {
    removeTab(id);
  } else {
    activateTab(id);
  }
});

// Tabs drag-to-reorder
let dragId = null;
tabsEl.addEventListener('dragstart', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  dragId = tab.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
});
tabsEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  const tab = e.target.closest('.tab');
  if (!tab || !dragId || tab.dataset.id === dragId) return;
  const fromIndex = state.tabs.findIndex(t => t.id === dragId);
  const toIndex = state.tabs.findIndex(t => t.id === tab.dataset.id);
  if (fromIndex < 0 || toIndex < 0) return;
  const [moved] = state.tabs.splice(fromIndex, 1);
  state.tabs.splice(toIndex, 0, moved);
  renderTabs();
});
tabsEl.addEventListener('dragend', () => { dragId = null; });

// Context menu on tabs
tabsEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const tab = e.target.closest('.tab');
  if (!tab) return;
  const id = tab.dataset.id;
  state.contextTabId = id;
  showContextMenu(e.clientX, e.clientY);
});
document.addEventListener('click', () => hideContextMenu());
contextMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action || !state.contextTabId) return;
  const id = state.contextTabId;
  const tab = state.tabs.find(t => t.id === id);
  switch (action) {
    case 'rename': {
      const name = prompt('Rename file', tab.name);
      if (name) {
        tab.name = name;
        renderTabs();
      }
      break;
    }
    case 'delete':
      removeTab(id);
      break;
    case 'copy': {
      navigator.clipboard.writeText(tab.content || '').then(() => {
        alert('File content copied to clipboard.');
      });
      break;
    }
    case 'download': {
      const blob = new Blob([tab.export ? tab.export() : (tab.content || '')], { type: 'text/plain' });
      downloadBlob(blob, tab.name);
      break;
    }
  }
  hideContextMenu();
});

// Global search
searchAllInput.addEventListener('input', () => {
  const q = searchAllInput.value.trim();
  state.globalQuery = q;
  highlightGlobalSearch(q);
});
clearSearchAllBtn.addEventListener('click', () => {
  searchAllInput.value = '';
  state.globalQuery = '';
  highlightGlobalSearch('');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Next/prev tab
  if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    const idx = state.tabs.findIndex(t => t.id === state.activeId);
    if (idx === -1) return;
    if (e.key === 'ArrowRight' && idx < state.tabs.length - 1) activateTab(state.tabs[idx + 1].id);
    if (e.key === 'ArrowLeft' && idx > 0) activateTab(state.tabs[idx - 1].id);
  }
  // Focus global search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    searchAllInput.focus();
  }
});

// Settings: theme & font size
themeToggle.addEventListener('change', () => {
  const theme = themeToggle.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ufp-theme', theme);
});
fontSizeInput.addEventListener('input', () => {
  const size = fontSizeInput.value + 'px';
  document.documentElement.style.fontSize = size;
  localStorage.setItem('ufp-font-size', size);
});

// Functions

async function openFiles(fileList) {
  const files = await readFilesAsText(fileList);
  files.forEach(({ name, text }) => {
    const type = detectType(name, text);
    const id = uniqueId('tab');
    const tab = { id, name, type, content: text, export: null };
    state.tabs.push(tab);
    createPanel(tab);
    renderTabs();
    activateTab(id);
  });
  dropZone.style.display = 'none';
}

function removeTab(id) {
  const idx = state.tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  state.tabs.splice(idx, 1);
  const panel = document.getElementById(`panel-${id}`);
  if (panel) panel.remove();
  renderTabs();
  if (state.tabs.length === 0) {
    state.activeId = null;
    dropZone.style.display = '';
    fileInfo.innerHTML = '<p>Select a tab to view details.</p>';
  } else {
    const next = state.tabs[Math.max(0, idx - 1)];
    activateTab(next.id);
  }
}

function activateTab(id) {
  state.activeId = id;
  [...tabsEl.children].forEach(tab => tab.setAttribute('aria-selected', tab.dataset.id === id ? 'true' : 'false'));
  [...panelsEl.children].forEach(panel => panel.classList.toggle('active', panel.id === `panel-${id}`));
  const tab = state.tabs.find(t => t.id === id);
  updateFileInfo(tab);
}

function renderTabs() {
  tabsEl.innerHTML = '';
  state.tabs.forEach(t => {
    const el = document.createElement('button');
    el.className = 'tab';
    el.type = 'button';
    el.setAttribute('role', 'tab');
    el.setAttribute('aria-selected', t.id === state.activeId ? 'true' : 'false');
    el.dataset.id = t.id;
    el.draggable = true;
    el.innerHTML = `${sanitizeHTML(t.name)} <span class="muted">(${t.type.toUpperCase()})</span> <span class="close" title="Close">✖</span>`;
    tabsEl.appendChild(el);
  });
}

function createPanel(tab) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.id = `panel-${tab.id}`;
  panelsEl.appendChild(panel);

  switch (tab.type) {
    case 'csv':
      renderCSVPanel(panel, tab);
      break;
    case 'vcf':
      renderVCFPanel(panel, tab);
      break;
    case 'md':
      renderMDPanel(panel, tab);
      break;
    case 'txt':
    default:
      renderTXTPanel(panel, tab);
      break;
  }
}

function updateFileInfo(tab) {
  if (!tab) return;
  const size = new Blob([tab.content || '']).size;
  const lines = (tab.content || '').split(/\r?\n/).length;
  fileInfo.innerHTML = `
    <p><strong>Name:</strong> ${sanitizeHTML(tab.name)}</p>
    <p><strong>Type:</strong> ${tab.type.toUpperCase()}</p>
    <p><strong>Size:</strong> ${size} bytes</p>
    <p><strong>Lines:</strong> ${lines}</p>
  `;
}

function showContextMenu(x, y) {
  contextMenu.hidden = false;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
}
function hideContextMenu() {
  contextMenu.hidden = true;
  state.contextTabId = null;
}

function highlightGlobalSearch(query) {
  state.tabs.forEach(t => {
    const panel = document.getElementById(`panel-${t.id}`);
    if (!panel) return;
    panel.querySelectorAll('.global-highlight').forEach(el => el.classList.remove('global-highlight'));
    if (!query) return;
    // naive highlight within text nodes of panel
    panel.querySelectorAll('pre, td, .card, .md-preview').forEach(container => {
      highlightInElement(container, query, 'global-highlight');
    });
  });
}

function highlightInElement(container, query, cls) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const matches = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const idx = node.nodeValue.toLowerCase().indexOf(query.toLowerCase());
    if (idx !== -1 && query.length > 0) {
      matches.push({ node, idx });
    }
  }
  matches.forEach(({ node, idx }) => {
    const span = document.createElement('span');
    const before = node.nodeValue.slice(0, idx);
    const match = node.nodeValue.slice(idx, idx + query.length);
    const after = node.nodeValue.slice(idx + query.length);
    span.innerHTML = `${sanitizeHTML(before)}<mark class="${cls}">${sanitizeHTML(match)}</mark>${sanitizeHTML(after)}`;
    node.parentNode.replaceChild(span, node);
  });
}

function initSettings() {
  const theme = localStorage.getItem('ufp-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.checked = theme === 'dark';
  const size = localStorage.getItem('ufp-font-size') || '16px';
  document.documentElement.style.fontSize = size;
  fontSizeInput.value = parseInt(size, 10);
}
