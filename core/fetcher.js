export class Fetcher {
    constructor(proxyUrl = 'https://corsproxy.io/?') {
        this.proxyUrl = proxyUrl;
    }

    convertGitUrl(url) {
        let rawUrl = url;
        // GitHub
        if (url.includes('github.com') && url.includes('/blob/')) {
            rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        // GitLab (Generic pattern, may vary by instance)
        else if (url.includes('gitlab.com') && url.includes('/blob/')) {
            rawUrl = url.replace('/blob/', '/raw/');
        }
        // Bitbucket
        else if (url.includes('bitbucket.org') && url.includes('/src/')) {
            rawUrl = url.replace('/src/', '/raw/');
        }
        return rawUrl;
    }

    async fetchResource(url, isBinary = false) {
        const targetUrl = this.proxyUrl + encodeURIComponent(url);
        
        try {
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            
            return isBinary ? await response.blob() : await response.text();
        } catch (error) {
            console.warn(`Direct fetch failed, trying fallback logic or user alert...`, error);
            throw error;
        }
    }
}