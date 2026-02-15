// Allows opening the side panel programmatically
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    // Store the URL to be previewed so side.js can read it
    chrome.storage.local.set({ 'targetPreviewUrl': message.url });
    
    // Open Side Panel (Chrome specific requirement: needs user interaction context)
    chrome.sidePanel.setOptions({
        path: 'ui/side.html',
        enabled: true
    });
    
    // We cannot force open side panel via API without user click, 
    // usually handled by browser UI or action click override.
    // For this demo, the user clicks the extension icon -> popup -> "Open in Side Panel"
  }
});