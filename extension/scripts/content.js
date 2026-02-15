const WEB_PREVIEW_URL = "http://localhost:8000/web/"; // Change this to your hosted URL

function injectButton() {
    // Check if we are on a blob page ending in .html
    if (!location.pathname.endsWith('.html') || !location.href.includes('/blob/')) return;
    if (document.getElementById('git-preview-btn')) return;

    // Find the button container (GitHub's UI changes often, targeting "Raw" button group)
    const rawButton = document.querySelector('[data-testid="raw-button"]');
    
    if (rawButton) {
        const btnGroup = rawButton.parentElement;
        
        const btn = document.createElement('a');
        btn.id = 'git-preview-btn';
        btn.className = rawButton.className; // Copy GitHub styling
        btn.innerHTML = `<span>Preview Live</span>`;
        btn.style.marginLeft = '8px';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#238636'; // GitHub Green
        btn.style.color = '#fff';
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = `${WEB_PREVIEW_URL}?prv=${encodeURIComponent(location.href)}`;
            window.open(target, '_blank');
        });

        btnGroup.appendChild(btn);
    }
}

// Observe DOM changes (GitHub is a SPA)
const observer = new MutationObserver(injectButton);
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
injectButton();