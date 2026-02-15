import { Fetcher } from '../core/fetcher.js';
import { Parser } from '../core/parser.js';
import { AssetProcessor } from '../core/asset-processor.js';
import { DependencyGraph } from '../core/dependency-graph.js';
import { Sandbox } from '../core/sandbox.js';
import { Exporter } from '../core/exporter.js';

const els = {
    refresh: document.getElementById('refreshBtn'),
    dl: document.getElementById('downloadBtn'),
    newTab: document.getElementById('newTabBtn'),
    sandbox: document.getElementById('disableJs'),
    isolate: document.getElementById('isolateCss'),
    status: document.getElementById('status'),
    proxy: document.getElementById('proxyInput')
};

let currentUrl = '';
let currentCache = '';
const sandbox = new Sandbox('previewContainer');

// Listen for file selection from Popup
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.targetPreviewUrl) {
        loadPreview(changes.targetPreviewUrl.newValue);
    }
});

// Check if there is already a url in storage on load
chrome.storage.local.get(['targetPreviewUrl'], (result) => {
    if(result.targetPreviewUrl) loadPreview(result.targetPreviewUrl);
});

async function loadPreview(url) {
    if (!url) return;
    currentUrl = url;
    els.status.textContent = 'Loading...';
    els.dl.disabled = true;

    try {
        const fetcher = new Fetcher(els.proxy.value);
        const parser = new Parser();
        const processor = new AssetProcessor(fetcher);
        const grapher = new DependencyGraph();

        // 1. Fetch
        const rawUrl = fetcher.convertGitUrl(url);
        const baseUrl = rawUrl.substring(0, rawUrl.lastIndexOf('/') + 1);
        const html = await fetcher.fetchResource(rawUrl);

        // 2. Process
        const doc = parser.parseHTML(html);
        const graph = grapher.build(doc);
        const processed = await processor.process(doc, baseUrl, graph, {
            sandbox: els.sandbox.checked,
            isolate: els.isolate.checked
        });

        // 3. Render
        currentCache = processed.documentElement.outerHTML;
        sandbox.render(currentCache, !els.sandbox.checked);
        
        els.status.textContent = 'Active';
        els.dl.disabled = false;

    } catch (e) {
        els.status.textContent = 'Error';
        console.error(e);
    }
}

// Controls
els.refresh.addEventListener('click', () => loadPreview(currentUrl));

els.dl.addEventListener('click', () => {
    if(currentCache) new Exporter().download(currentCache, 'sidebar-preview.html');
});

els.newTab.addEventListener('click', () => {
    if(currentUrl) {
        chrome.tabs.create({ 
            url: chrome.runtime.getURL(`ui/tab.html?prv=${encodeURIComponent(currentUrl)}`) 
        });
    }
});