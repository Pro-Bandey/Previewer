document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('fileList');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('github.com')) {
        list.innerHTML = '<div class="info-item">Not a GitHub page.</div>';
        return;
    }

    const isBlob = tab.url.includes('/blob/') && tab.url.endsWith('.html');
    
    if (isBlob) {
        renderFileItem(tab.url, 'Current File');
    } else {
        // Simple heuristic: Look for links in the page that end in .html
        // In a real app, use GitHub API for folder contents
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => Array.from(document.querySelectorAll('a[href$=".html"]')).map(a => a.href)
        }, (results) => {
            const files = results[0].result;
            if (files.length === 0) {
                list.innerHTML = '<div class="info-item">No HTML files found.</div>';
            } else {
                list.innerHTML = '';
                // Deduplicate
                [...new Set(files)].forEach(url => renderFileItem(url, url.split('/').pop()));
            }
        });
    }

    function renderFileItem(url, name) {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'flex-start';
        div.style.gap = '8px';
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid var(--border)';

        div.innerHTML = `
            <strong style="font-size:0.9rem">${name}</strong>
            <div style="display:flex; gap:10px; width:100%">
                <button class="primary-btn btn-sm" id="btn-side">Side Panel</button>
                <button class="action-btn btn-sm" id="btn-tab">New Tab</button>
            </div>
        `;

        div.querySelector('#btn-side').addEventListener('click', () => {
            // Save URL for side panel to pick up
            chrome.storage.local.set({ 'targetPreviewUrl': url });
            // Chrome doesn't allow programmatic opening easily, so we instruct user or rely on default behavior
            // But we can update the panel content if it is already open
            alert('Open the Side Panel to view this file.');
        });

        div.querySelector('#btn-tab').addEventListener('click', () => {
            const tabUrl = chrome.runtime.getURL(`ui/tab.html?prv=${encodeURIComponent(url)}`);
            chrome.tabs.create({ url: tabUrl });
        });

        list.appendChild(div);
    }
});