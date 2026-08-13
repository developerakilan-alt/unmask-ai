const urlInput = document.getElementById("url");
const analyzeBtn = document.getElementById("analyze");
const resultEl = document.getElementById("result");

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function setLoading() {
  resultEl.className = "state loading";
  resultEl.innerHTML = '<div class="spinner"></div><p>Analyzing&hellip;</p>';
}

function setError(msg) {
  resultEl.className = "state error";
  resultEl.innerHTML = "<p>" + escapeHtml(msg || "Something went wrong.") + "</p>";
}

function render(data, heuristic) {
  const verdict = String(data.verdict || data.classification || "uncertain").toLowerCase();
  const label = verdict.startsWith("ai") ? "AI" : verdict === "real" ? "Real" : "Uncertain";
  const cls = verdict.startsWith("ai") ? "verdict-ai" : verdict === "real" ? "verdict-real" : "verdict-uncertain";
  const aiPercent = data.ai_percent != null ? Number(data.ai_percent).toFixed(1) : "—";
  const confidence = data.confidence != null ? Number(data.confidence).toFixed(2) : "—";
  const pct = aiPercent === "—" ? 0 : Math.max(2, Math.min(100, parseFloat(aiPercent)));
  resultEl.className = "state result";
  resultEl.innerHTML =
    '<div class="verdict ' + cls + '">' + label + "</div>" +
    '<div class="row"><span>AI likelihood</span><span>' + aiPercent + "%</span></div>" +
    '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div>' +
    '<div class="row"><span>Confidence</span><span>' + confidence + "</span></div>" +
    (heuristic ? '<div class="note">Heuristic preview — backend unavailable.</div>' : "");
}

function onAnalyze() {
  const url = urlInput.value.trim();
  if (!url) return;
  setLoading();
  chrome.runtime.sendMessage({ type: "unmaskUrl", url }, (res) => {
    if (chrome.runtime.lastError) {
      setError(chrome.runtime.lastError.message);
      return;
    }
    if (!res || !res.ok) {
      setError((res && res.error) || "No response from extension.");
      return;
    }
    render(res.data, !!res.heuristic);
  });
}

analyzeBtn.addEventListener("click", onAnalyze);
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onAnalyze();
});
