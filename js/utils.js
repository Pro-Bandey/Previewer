export function detectType(name, text) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'vcf' || text.includes('BEGIN:VCARD')) return 'vcf';
    if (ext === 'md' || ext === 'markdown') return 'md';
    if (ext === 'txt') return 'txt';
    // content-based heuristics
    if (text.includes(',') && /\r?\n/.test(text)) return 'csv';
    if (/^#{1,6}\s/m.test(text) || /

    \[.*?\]

    \(.*?\)/.test(text)) return 'md';
    return 'txt';
}

export function readFilesAsText(fileList) {
    const arr = Array.from(fileList);
    return Promise.all(arr.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, text: reader.result });
        reader.onerror = reject;
        reader.readAsText(file);
    })));
}

export function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function sanitizeHTML(str) {
    // minimal sanitization for display purposes
    return String(str).replace(/[&<>"'`]/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    }[s]));
}

export function uniqueId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sortByColumn(rows, idx, asc = true) {
    const copy = rows.slice();
    copy.sort((a, b) => {
        const va = a[idx] ?? '';
        const vb = b[idx] ?? '';
        const na = isNumeric(va), nb = isNumeric(vb);
        if (na && nb) return asc ? (+va - +vb) : (+vb - +va);
        return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return copy;
}

function isNumeric(v) {
    return v !== '' && !isNaN(parseFloat(v)) && isFinite(v);
}
