import { resolveUrl } from './utils.js';

export class CssRewriter {
    rewriteUrls(cssContent, baseUrl) {
        // Regex to capture url(...)
        return cssContent.replace(/url\((['"]?)(.*?)\1\)/gi, (match, quote, url) => {
            if (url.startsWith('data:') || url.startsWith('#')) return match;
            const absoluteUrl = resolveUrl(baseUrl, url);
            return `url("${absoluteUrl}")`;
        });
    }

    // Basic regex-based isolation (prefixing selectors)
    // Note: A robust solution requires a CSS AST parser, but this is pure Regex/JS.
    isolate(cssContent, scopeId) {
        // Naive implementation: Prepend scopeId to class/id selectors
        // Excluding @media, @keyframes, etc.
        const lines = cssContent.split('}');
        return lines.map(line => {
            if (line.trim() === '' || line.includes('@')) return line;
            return line.replace(/([#\.][\w-]+)/g, `.${scopeId} $1`);
        }).join('}');
    }
}