export class Sandbox {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(docString, jsEnabled = true) {
        this.container.innerHTML = '';
        const iframe = document.createElement('iframe');
        
        // Setup Sandbox attributes
        // allow-scripts is needed if jsEnabled is true
        const sandboxAttrs = ['allow-same-origin', 'allow-forms'];
        if (jsEnabled) sandboxAttrs.push('allow-scripts', 'allow-popups');
        
        iframe.setAttribute('sandbox', sandboxAttrs.join(' '));
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        this.container.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(docString);
        doc.close();
    }
}