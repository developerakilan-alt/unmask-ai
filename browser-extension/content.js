const API_BASE = "http://localhost:8000/api/v1";

if (!window.__unmaskAiLoaded) {
  window.__unmaskAiLoaded = true;

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .um-card {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      width: 300px;
      background: #0a0f0c;
      border: 1px solid #1f3a2d;
      border-radius: 12px;
      color: #e6f5ec;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.45;
      padding: 14px 16px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
    }
    .um-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .um-brand { font-weight: 700; letter-spacing: 1px; color: #00ff88; font-size: 12px; text-transform: uppercase; }
    .um-close { background: none; border: none; color: #7fa893; font-size: 16px; cursor: pointer; line-height: 1; padding: 2px 4px; }
    .um-close:hover { color: #00ff88; }
    .um-loading { display: flex; align-items: center; gap: 8px; color: #9fd8b8; }
    .um-spinner { width: 14px; height: 14px; border: 2px solid #1f3a2d; border-top-color: #00ff88; border-radius: 50%; animation: umspin 0.8s linear infinite; }
    @keyframes umspin { to { transform: rotate(360deg); } }
    .um-verdict { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
    .um-ai { color: #ff5c5c; }
    .um-real { color: #00ff88; }
    .um-uncertain { color: #ffc266; }
    .um-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .um-row span:first-child { color: #7fa893; }
    .um-bar { height: 6px; background: #14251b; border-radius: 3px; margin: 6px 0 8px; overflow: hidden; }
    .um-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #00ff88, #ffc266, #ff5c5c); }
    .um-note { margin-top: 8px; font-size: 11px; color: #7fa893; }
    .um-error { color: #ff8a8a; }
  `;

  const host = document.createElement("div");
  host.id = "unmask-ai-root";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  function buildCard(html) {
    root.innerHTML = `<style>${STYLE}</style>${html}`;
  }

  function bindClose() {
    const btn = root.querySelector(".um-close");
    if (btn) btn.addEventListener("click", () => (root.innerHTML = ""));
  }

  function showLoading() {
    buildCard(`
      <div class="um-card">
        <div class="um-head">
          <span class="um-brand">Unmask AI</span>
          <button class="um-close" title="Close">&times;</button>
        </div>
        <div class="um-body um-loading">
          <div class="um-spinner"></div>
          <span>Analyzing image&hellip;</span>
        </div>
      </div>
    `);
    bindClose();
  }

  function showError(message) {
    buildCard(`
      <div class="um-card">
        <div class="um-head">
          <span class="um-brand">Unmask AI</span>
          <button class="um-close" title="Close">&times;</button>
        </div>
        <div class="um-body um-error">${escapeHtml(message)}</div>
      </div>
    `);
    bindClose();
  }

  function showVerdict(data, isHeuristic) {
    const verdict = String(data.verdict || data.classification || "uncertain").toLowerCase();
    const label = verdict.startsWith("ai") ? "AI" : verdict === "real" ? "Real" : "Uncertain";
    const cls = verdict.startsWith("ai") ? "um-ai" : verdict === "real" ? "um-real" : "um-uncertain";
    const aiPercent = data.ai_percent != null ? Number(data.ai_percent).toFixed(1) : "—";
    const confidence = data.confidence != null ? Number(data.confidence).toFixed(2) : "—";
    const pct = aiPercent === "—" ? 0 : Math.max(2, Math.min(100, parseFloat(aiPercent)));
    buildCard(`
      <div class="um-card">
        <div class="um-head">
          <span class="um-brand">Unmask AI</span>
          <button class="um-close" title="Close">&times;</button>
        </div>
        <div class="um-body">
          <div class="um-verdict ${cls}">${label}</div>
          <div class="um-row"><span>AI likelihood</span><span>${aiPercent}%</span></div>
          <div class="um-bar"><div class="um-bar-fill" style="width:${pct}%"></div></div>
          <div class="um-row"><span>Confidence</span><span>${confidence}</span></div>
          ${
            isHeuristic
              ? '<div class="um-note">Heuristic preview — backend unavailable.</div>'
              : '<div class="um-note">Model-based estimate.</div>'
          }
        </div>
      </div>
    `);
    bindClose();
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function extensionOf(url) {
    try {
      const path = new URL(url).pathname;
      const m = path.match(/\.(png|jpe?g|webp|gif|avif|bmp|svg|ico)(\?|$)/i);
      return m ? m[1].replace(/^jpeg$/, "jpg").toLowerCase() : "png";
    } catch {
      return "png";
    }
  }

  function heuristicAnalyze(size, width, height) {
    let score = 50;
    const mp = (width * height) / 1e6;
    const ratio = mp > 0 ? width / height : 0;
    if (size > 0 && size < 30 * 1024) score = 42;
    if (mp >= 2 && size / mp < 250 * 1024) score += 14;
    if (ratio > 2.2 || ratio < 0.45) score += 10;
    if (size > 0 && size < 15 * 1024) score = 40;
    const ai_percent = Math.max(5, Math.min(95, Math.round(score)));
    const verdict = ai_percent >= 62 ? "AI" : ai_percent <= 45 ? "Real" : "Uncertain";
    return { verdict, ai_percent, confidence: 0.5 };
  }

  function loadDimensions(blob) {
    return new Promise((resolve) => {
      const objUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve({ width: 0, height: 0 });
      };
      img.src = objUrl;
    });
  }

  async function analyzeImageUrl(url) {
    showLoading();
    let blob;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("fetch failed");
      blob = await resp.blob();
      if (!blob || blob.size === 0) throw new Error("empty body");
    } catch (err) {
      showError("Could not analyze — is the server running?");
      return { ok: false, error: "Could not analyze — is the server running?" };
    }

    const form = new FormData();
    form.append("file", blob, "image." + extensionOf(url));
    try {
      const apiResp = await fetch(API_BASE + "/analyze", { method: "POST", body: form });
      let data;
      try {
        data = await apiResp.json();
      } catch {
        data = null;
      }
      if (!apiResp.ok || !data) throw new Error((data && data.detail) || "API error " + apiResp.status + ".");
      showVerdict(data, false);
      return { ok: true, data };
    } catch (err) {
      const dims = await loadDimensions(blob);
      const heuristic = heuristicAnalyze(blob.size, dims.width, dims.height);
      showVerdict(heuristic, true);
      return { ok: true, heuristic: true, data: heuristic };
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && (msg.type === "unmask" || msg.type === "unmaskUrl")) {
      analyzeImageUrl(msg.url).then(sendResponse);
      return true;
    }
  });
}
