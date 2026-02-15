import { resolveUrl, blobToBase64, generateHash } from './utils.js';
import { CssRewriter } from './css-rewriter.js';

export class AssetProcessor {
    constructor(fetcher) {
        this.fetcher = fetcher;
        this.cssRewriter = new CssRewriter();
    }

    async process(doc, baseUrl, graph, options = { sandbox: false }) {
        const scopeId = generateHash();
        
        // 1. Process Images (Convert to Base64)
        const imgPromises = graph.images.map(async (asset) => {
            try {
                const absUrl = resolveUrl(baseUrl, asset.url);
                const blob = await this.fetcher.fetchResource(absUrl, true);
                const b64 = await blobToBase64(blob);
                asset.node.src = b64;
                asset.node.removeAttribute('srcset'); // simplified
            } catch (e) {
                console.error('Failed to inline image', asset.url, e);
            }
        });

        // 2. Process Scripts
        const scriptPromises = graph.scripts.map(async (asset) => {
            if (options.sandbox) {
                asset.node.remove(); // Remove JS in sandbox mode
                return;
            }
            try {
                const absUrl = resolveUrl(baseUrl, asset.url);
                const code = await this.fetcher.fetchResource(absUrl, false);
                asset.node.removeAttribute('src');
                asset.node.textContent = code;
            } catch (e) {
                console.error('Failed to inline script', asset.url, e);
            }
        });

        // 3. Process CSS
        const cssPromises = graph.links.map(async (asset) => {
            try {
                const absUrl = resolveUrl(baseUrl, asset.url);
                let css = await this.fetcher.fetchResource(absUrl, false);
                
                // Rewrite relative URLs inside CSS to absolute or Base64 (simplified absolute here)
                css = this.cssRewriter.rewriteUrls(css, absUrl);
                
                // Unique Hash Isolation
                if (options.isolate) {
                    doc.body.classList.add(scopeId);
                    css = this.cssRewriter.isolate(css, scopeId);
                }

                const style = doc.createElement('style');
                style.textContent = css;
                asset.node.replaceWith(style);
            } catch (e) {
                console.error('Failed to inline CSS', asset.url, e);
            }
        });

        await Promise.all([...imgPromises, ...scriptPromises, ...cssPromises]);
        
        return doc;
    }
}