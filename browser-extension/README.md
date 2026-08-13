# Unmask AI — Browser Extension

A self-contained Manifest V3 Chrome extension that detects AI-generated images
using the Unmask AI backend.

## Install

1. Open `chrome://extensions` in Chrome (or `edge://extensions` in Edge).
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this `browser-extension` folder.
5. Pin the extension for easy access (optional).

## How it works

- **Right-click menu:** Right-click any image on a page and choose
  **"Unmask image"**. The extension fetches the image bytes and POSTs them to
  the backend as `multipart/form-data` (`file` field) at
  `http://localhost:8000/api/v1/analyze`, then shows a floating result card in
  the top-right corner of the page (rendered in a Shadow DOM so page CSS can't
  interfere). The card shows the verdict (**AI / Real / Uncertain**), the AI
  likelihood percentage, and the model confidence.
- **Popup:** Click the extension icon and paste any image URL, then press
  **Analyze**. The result is shown inline in the popup. The popup asks the
  background service worker, which forwards the URL to the active tab's content
  script (which fetches + posts the image and shows the floating card). If the
  active tab isn't scriptable (e.g. `chrome://` pages), the background worker
  fetches and analyzes the URL directly instead.
- **Fallback heuristic:** If the backend request fails, the content script
  falls back to an extremely simple client-side heuristic that compares only
  file size and image dimensions. Results produced this way are clearly marked
  with a **"Heuristic preview"** disclaimer. If even fetching the image itself
  fails, the card shows *"Could not analyze — is the server running?"*.

## Backend requirement

The backend must be running locally on **port 8000**:

```
http://localhost:8000/api/v1/analyze
```

To point the extension at a deployed backend instead, edit the `API_BASE`
constant at the top of **`content.js`**, **`background.js`**, and
**`popup/popup.js`** and reload the extension on `chrome://extensions`.
Remember that the deployed backend must allow cross-origin requests from the
extension origin (`chrome-extension://<id>`) or be reachable by the service
worker.

## Files

| File                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `manifest.json`     | MV3 manifest (permissions, worker, popup, content)   |
| `background.js`     | Context menu, message routing, direct-analysis fallback |
| `content.js`        | Fetches the image, calls the API, renders the card   |
| `popup/popup.html`  | Popup markup                                         |
| `popup/popup.js`    | Popup logic (URL analysis + inline result)           |
| `popup/popup.css`   | Dark neon-green popup theme                          |

## Limitations

- Requires the local backend at port 8000 (or an edited `API_BASE`).
- Images behind login walls or CORS-restricted hosts may fail to fetch.
- The heuristic fallback is intentionally crude (file size + dimensions only)
  and is not a reliable detector — it only fills in when the API is down.
- The extension sends the image bytes to the backend; do not analyze sensitive
  images against a server you don't trust.
- Content scripts cannot run on restricted pages (`chrome://`, the Chrome Web
  Store); the popup's background fallback covers those cases for URL analysis.
- No icons are bundled, so the extension shows a default puzzle-piece icon.
