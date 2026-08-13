const API_BASE = "http://localhost:8000/api/v1";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "unmask-image",
    title: "Unmask image",
    contexts: ["image"],
  });
});

function activeTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs && tabs[0]);
    });
  });
}

function ensureContentScript(tabId) {
  return chrome.scripting
    .executeScript({ target: { tabId }, files: ["content.js"] })
    .catch(() => null);
}

async function analyzeDirectly(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Could not fetch image (HTTP " + resp.status + ").");
  const blob = await resp.blob();
  const form = new FormData();
  form.append("file", blob, "image.png");
  const apiResp = await fetch(API_BASE + "/analyze", { method: "POST", body: form });
  let data;
  try {
    data = await apiResp.json();
  } catch {
    data = null;
  }
  if (!apiResp.ok || !data) throw new Error((data && data.detail) || "API error " + apiResp.status + ".");
  return data;
}

async function handleUnmaskUrl(url) {
  const tab = await activeTab();
  if (tab && tab.id != null) {
    try {
      await ensureContentScript(tab.id);
      const res = await chrome.tabs.sendMessage(tab.id, { type: "unmaskUrl", url });
      if (res && res.ok) return res;
      if (res && res.error) return res;
    } catch (err) {
      // page not scriptable (chrome://, web store, etc.) — fall through
    }
  }
  const data = await analyzeDirectly(url);
  return { ok: true, data };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "unmaskUrl") {
    handleUnmaskUrl(msg.url)
      .then(sendResponse)
      .catch((err) =>
        sendResponse({ ok: false, error: String((err && err.message) || err) })
      );
    return true;
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "unmask-image") return;
  if (!tab || tab.id == null) return;
  ensureContentScript(tab.id)
    .then(() => chrome.tabs.sendMessage(tab.id, { type: "unmask", url: info.srcUrl }))
    .catch(() => {});
});
