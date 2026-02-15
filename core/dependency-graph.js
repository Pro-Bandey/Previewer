export class DependencyGraph {
    build(doc) {
        const graph = {
            links: [],
            scripts: [],
            images: [],
            fonts: [] // Populated via CSS analysis usually
        };

        // CSS
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
            if (el.href) graph.links.push({ node: el, url: el.getAttribute('href') });
        });

        // Scripts
        doc.querySelectorAll('script[src]').forEach(el => {
            if (el.src) graph.scripts.push({ node: el, url: el.getAttribute('src') });
        });

        // Images
        doc.querySelectorAll('img[src]').forEach(el => {
            if (el.src) graph.images.push({ node: el, url: el.getAttribute('src') });
        });

        return graph;
    }
}