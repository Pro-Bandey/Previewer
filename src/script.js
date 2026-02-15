import { Fetcher } from '../core/fetcher.js';
import { Parser } from '../core/parser.js';
import { DependencyGraph } from '../core/dependency-graph.js';
import { AssetProcessor } from '../core/asset-processor.js';
import { Sandbox } from '../core/sandbox.js';
import { Exporter } from '../core/exporter.js';
import { getBaseUrl } from '../core/utils.js';

// --- UI Element References ---
const ui = {
    url: document.getElementById('urlInput'),
    proxy: document.getElementById('proxyInput'),
    btn: document.getElementById('previewBtn'),
    closeBtn: document.getElementById('closeBtn'),
    dlBtn: document.getElementById('downloadBtn'),
    wrapper: document.getElementById('deviceWrapper'),
    inspector: document.getElementById('inspectorPane'),
    resList: document.getElementById('resourceList'),
    assetCount: document.getElementById('assetCount'),
    progress: document.getElementById('progressBar'),
    historyBtn: document.getElementById('historyBtn'),
    historyMenu: document.getElementById('historyDropdown'),
    sandboxToggle: document.getElementById('disableJs'),
    cssToggle: document.getElementById('isolateCss'),
    previewContainer: document.getElementById('previewContainer'),
    emptyState: document.getElementById('emptyState')
};

let finalHtmlCache = '';
let currentGitUrl = '';
let hasExternalDeps = false; // Tracks if folder download is needed
const historyKey = 'git-preview-history';
let sandboxInstance = null;

// --- Initialization ---
(function init() {
    sandboxInstance = new Sandbox('previewContainer');

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });

    // Device Switcher
    document.querySelectorAll('.device-switcher button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.currentTarget.dataset.device;
            document.querySelectorAll('.device-switcher button').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            if(mode === 'mobile') ui.wrapper.style.maxWidth = '375px';
            else if(mode === 'tablet') ui.wrapper.style.maxWidth = '768px';
            else ui.wrapper.style.maxWidth = '100%';
        });
    });

    // Inspector Toggle
    document.getElementById('inspectorToggle').addEventListener('click', () => {
        ui.inspector.classList.toggle('collapsed');
        document.getElementById('inspectorToggle').classList.toggle('active');
    });

    // History Logic
    ui.historyBtn.addEventListener('click', toggleHistory);
    loadHistory();

    // Close Button Logic
    ui.closeBtn.addEventListener('click', resetPreview);
    
    // Quick run on Enter
    ui.url.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') ui.btn.click();
    });

    // --- AUTO SYNC (Read on Load) ---
    const urlParams = new URLSearchParams(window.location.search);
    const autoUrl = urlParams.get('prv');
    if (autoUrl) {
        ui.url.value = autoUrl;
        // Wait slightly for DOM to settle
        setTimeout(() => ui.btn.click(), 50); 
    }
})();

// --- Main Logic ---

ui.btn.addEventListener('click', async () => {
    const gitUrl = ui.url.value.trim();
    if (!gitUrl) return;

    currentGitUrl = gitUrl;
    addToHistory(gitUrl);
    syncUrlParam(gitUrl); // Update URL bar
    setLoading(true);
    resetUIForRun(); 
    
    try {
        const fetcher = new Fetcher(ui.proxy.value);
        const parser = new Parser();
        const grapher = new DependencyGraph();
        const processor = new AssetProcessor(fetcher);

        updateProgress(10); 

        // 1. Get Base HTML
        const rawUrl = fetcher.convertGitUrl(gitUrl);
        const baseUrl = getBaseUrl(rawUrl);
        const htmlText = await fetcher.fetchResource(rawUrl);
        updateProgress(30);

        // 2. Parse
        const doc = parser.parseHTML(htmlText);
        
        // 3. Analyze Dependencies
        const graph = grapher.build(doc);
        renderInspector(graph);
        
        // Check for external JS/CSS dependencies
        hasExternalDeps = (graph.links.length > 0 || graph.scripts.length > 0);
        
        updateProgress(50);

        // 4. Inline Assets
        const processedDoc = await processor.process(doc, baseUrl, graph, {
            sandbox: ui.sandboxToggle.checked,
            isolate: ui.cssToggle.checked
        });
        updateProgress(90);

        // 5. Render
        finalHtmlCache = `<!DOCTYPE html>\n` + processedDoc.documentElement.outerHTML;
        
        ui.emptyState.classList.add('hidden');
        ui.closeBtn.classList.remove('hidden');

        sandboxInstance.render(finalHtmlCache, !ui.sandboxToggle.checked);
        
        ui.dlBtn.disabled = false;
        updateProgress(100);

    } catch (err) {
        console.error(err);
        ui.resList.innerHTML = `<div class="info-item" style="color:var(--danger)">Error: ${err.message}</div>`;
        updateProgress(0);
    } finally {
        setLoading(false);
    }
});

// --- Download / Export Logic ---
ui.dlBtn.addEventListener('click', () => {
    if(!finalHtmlCache) return;
    
    if (hasExternalDeps) {
        // If file uses external resources, use GitFolderDownloader on the parent folder
        let folderUrl = currentGitUrl;
        // Convert blob URL to directory URL if possible for better context
        // e.g., .../blob/main/index.html -> .../tree/main/
        if (folderUrl.includes('/blob/')) {
            folderUrl = folderUrl.substring(0, folderUrl.lastIndexOf('/'));
            folderUrl = folderUrl.replace('/blob/', '/tree/');
        }

        // Redirect to the API
        const apiLink = `https://gitfolderdownloader.github.io/?url=${encodeURIComponent(folderUrl)}`;
        window.open(apiLink, '_blank');
    } else {
        // Single file (Inline Only) - Download directly
        const exporter = new Exporter();
        const fileName = currentGitUrl.split('/').pop() || 'preview.html';
        exporter.download(finalHtmlCache, fileName);
    }
});

// --- Helper Functions ---

/**
 * Syncs the ?prv= parameter in the URL bar without reloading
 */
function syncUrlParam(url) {
    if (window.history.pushState) {
        const newUrl = new URL(window.location);
        if(url) {
            newUrl.searchParams.set('prv', url);
        } else {
            newUrl.searchParams.delete('prv');
        }
        window.history.pushState({path: newUrl.href}, '', newUrl.href);
    }
}

function resetUIForRun() {
    ui.resList.innerHTML = '';
    ui.assetCount.textContent = '0';
    ui.emptyState.classList.add('hidden');
}

function resetPreview() {
    const iframe = ui.previewContainer.querySelector('iframe');
    if(iframe) iframe.remove();
    
    finalHtmlCache = '';
    currentGitUrl = '';
    hasExternalDeps = false;
    
    ui.dlBtn.disabled = true;
    ui.closeBtn.classList.add('hidden');
    ui.emptyState.classList.remove('hidden'); 
    
    ui.resList.innerHTML = '<div class="info-item">No assets loaded.</div>';
    ui.assetCount.textContent = '0';
    
    // Clear URL param
    syncUrlParam(null);
}

function setLoading(isLoading) {
    ui.btn.disabled = isLoading;
    ui.btn.innerHTML = isLoading 
        ? `<svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run`;
}

function updateProgress(percent) {
    ui.progress.style.width = percent + '%';
    if(percent >= 100) {
        setTimeout(() => { ui.progress.style.width = '0%'; }, 500);
    }
}

function renderInspector(graph) {
    const total = graph.links.length + graph.scripts.length + graph.images.length;
    ui.assetCount.textContent = total;
    
    const createItem = (type, url) => `
        <div class="resource-item type-${type}">
            <span class="res-name" title="${url}">${url.split('/').pop() || 'Asset'}</span>
        </div>
    `;

    let html = '';
    graph.links.forEach(l => html += createItem('css', l.url));
    graph.scripts.forEach(s => html += createItem('js', s.url));
    graph.images.forEach(i => html += createItem('img', i.url));

    ui.resList.innerHTML = html || '<div class="info-item">No external assets found.</div>';
}

// --- History Management ---

function loadHistory() {
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    ui.historyMenu.innerHTML = history.map(url => `
        <div class="dropdown-item">
            <span onclick="loadUrl('${url}')">${url.substring(0, 30)}...</span>
            <span class="remove-hist" onclick="removeHistory('${url}')">&times;</span>
        </div>
    `).join('');
}

function addToHistory(url) {
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history = [url, ...history.filter(u => u !== url)].slice(0, 5); 
    localStorage.setItem(historyKey, JSON.stringify(history));
    loadHistory();
}

window.loadUrl = (url) => {
    ui.url.value = url;
    ui.historyMenu.classList.add('hidden');
};

window.removeHistory = (url) => {
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history = history.filter(u => u !== url);
    localStorage.setItem(historyKey, JSON.stringify(history));
    loadHistory();
};

function toggleHistory() {
    ui.historyMenu.classList.toggle('hidden');
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
    if (!ui.historyBtn.contains(e.target) && !ui.historyMenu.contains(e.target)) {
        ui.historyMenu.classList.add('hidden');
    }
});