export function generateHash() {
    return 'css-' + Math.random().toString(36).substr(2, 9);
}

export function resolveUrl(base, relative) {
    try {
        return new URL(relative, base).href;
    } catch (e) {
        return relative;
    }
}

export function getBaseUrl(url) {
    return url.substring(0, url.lastIndexOf('/') + 1);
}

export async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}