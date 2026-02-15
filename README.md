# 🚀 GitPreview Engine 
### *The Ultimate Developer Playground for Git-hosted HTML.*

[![Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)]()

**GitPreview Engine** is a high-performance, modular previewing system that turns raw code from GitHub, GitLab, or Bitbucket into live, interactive previews instantly. Built with a "Zero Dependency" philosophy, it handles asset inlining, CSS isolation, and security sandboxing entirely in the browser.

---

## ✨ Key Features

- **📦 Intelligent Inlining**: Automatically fetches and embeds CSS (`@import` included), JavaScript, and Images into a single document.
- **🛡️ Secure Sandboxing**: Run untrusted code with JS disabled or enabled in a isolated `iframe` environment.
- **🎨 CSS Isolation**: Uses unique hash-based scoping to prevent preview styles from "leaking" into your UI.
- **📱 Dev-First UI**: 
  - **Device Switcher**: Test responsiveness with Mobile, Tablet, and Desktop presets.
  - **Dark Mode**: High-contrast, VS Code-inspired interface.
  - **Asset Inspector**: Real-time breakdown of detected dependencies.
- **🔗 Smart Syncing**: Deep-link any file via `?prv=[URL]`.
- **📥 Hybrid Export**: 
  - Downloads standalone files as fully inlined HTML.
  - Integrates with **GitFolderDownloader** for complex projects with directory structures.

---

## 🏗️ Architecture

The engine is built on a strictly modular ES6 architecture:

```text
/core
  ├── fetcher.js           # Git URL ➔ Raw URL conversion
  ├── parser.js            # DOM orchestration
  ├── dependency-graph.js  # Asset discovery logic
  ├── asset-processor.js   # The "Engine" (Base64 conversion & Inlining)
  ├── css-rewriter.js      # URL path correction & isolation hashes
  ├── sandbox.js           # Iframe rendering context
  └── exporter.js          # Download & Blob management
/web
  ├── index.html           # Modern DevUI Layout
  ├── ui.js                # UI State Controller
  └── style.css            # Variable-based Design System
```

---

## 🚀 Quick Start

### 1. Requirements
A local web server is required to support ES Modules (CORS/Module security).

### 2. Run locally
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```
Access the dashboard at `http://localhost:8000/web`.

### 3. Usage
1. Paste a GitHub URL (e.g., `https://github.com/user/repo/blob/main/index.html`).
2. Hit **Run**.
3. Toggle **Scoped CSS** or **No JS** as needed.
4. Export the result for offline use.

---

## 🛠️ Deep Linking (Auto-Sync)
Share a live preview of a specific file instantly by appending the `prv` parameter:
`your-site.com/web/?prv=https://github.com/Octocat/Hello-World/blob/master/index.html`

---

## 🛡️ Security & CORS
Since this tool runs entirely in the browser, it uses a CORS proxy to fetch assets from Git providers. 
- **Default Proxy**: `https://corsproxy.io/?`
- **Configurable**: You can change the proxy endpoint directly in the UI settings.

---

## 🤝 Contributing
This project is built with vanilla technology to ensure longevity and speed.
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---


Developed with ❤️ for the open-source community.
```