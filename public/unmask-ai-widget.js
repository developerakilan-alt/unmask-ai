/*!
 * Unmask AI — embeddable widget
 * Drop this script into any page to add an AI-image analyzer:
 *
 *   <script src="https://unmask-ai.app/unmask-ai/unmask-ai-widget.js"></script>
 *   <script>UnmaskWidget.init({ base: 'https://unmask-ai.app/unmask-ai/' });</script>
 *
 * The analyzer runs on-device inside a hosted iframe; nothing is uploaded.
 * Results are returned to the page via postMessage with type "unmask:result".
 */
(function (global) {
  'use strict';

  var DEFAULT_BASE = 'https://unmask-ai.app/unmask-ai/';

  function pickBase() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      var m = src.match(/(https?:[^?#]*\/)unmask-ai-widget\.js/i);
      if (m) return m[1];
    }
    return DEFAULT_BASE;
  }

  function init(opts) {
    opts = opts || {};
    var base = (opts.base || pickBase()).replace(/\/?$/, '/');
    var container = document.createElement('div');
    container.id = 'unmask-ai-widget';
    var style = document.createElement('style');
    style.textContent =
      '#unmask-ai-widget{position:fixed;right:20px;bottom:20px;z-index:99999;font-family:Inter,ui-sans-serif,system-ui,sans-serif;}' +
      '#unmask-ai-widget *{box-sizing:border-box;}' +
      '.uw-toggle{display:flex;align-items:center;gap:8px;border:0;cursor:pointer;color:#03172e;font-weight:700;font-size:14px;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#58ddf2,#2fa8cc);box-shadow:0 10px 30px rgba(88,221,242,.4);}' +
      '.uw-panel{display:none;width:340px;max-width:calc(100vw - 40px);overflow:hidden;border:1px solid rgba(220,255,255,.25);border-radius:18px;background:#06203a;color:#eaf7fb;box-shadow:0 24px 70px rgba(0,0,0,.55);}' +
      '.uw-panel.open{display:block;animation:uw-pop .18s ease-out;}' +
      '@keyframes uw-pop{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}' +
      '.uw-frame{width:100%;height:430px;border:0;display:block;}' +
      '.uw-result{padding:14px;}' +
      '.uw-row{display:flex;align-items:center;gap:10px;}' +
      '.uw-badge{font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;}' +
      '.uw-note{font-size:10px;color:rgba(234,247,251,.5);margin-top:6px;}';

    var el = document.createElement('div');
    el.className = 'uw-panel';
    var frame = document.createElement('iframe');
    frame.className = 'uw-frame';
    frame.title = 'Unmask AI analyzer';
    frame.src = base + '#/widget';
    frame.setAttribute('loading', 'lazy');
    el.appendChild(frame);

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'uw-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Verify image';

    var open = false;
    button.addEventListener('click', function () {
      open = !open;
      el.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      if (open) frame.contentWindow && frame.contentWindow.focus();
    });

    container.appendChild(style);
    container.appendChild(el);
    container.appendChild(button);
    document.body.appendChild(container);

    global.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'unmask:result') return;
      var r = e.data.payload || {};
      if (typeof r.classification === 'undefined') return;
      var ai = r.classification === 'AI_GENERATED';
      var unc = r.classification === 'UNCERTAIN';
      var color = ai ? '#ff5f5f' : unc ? '#fbbf24' : '#58ddf2';
      var label = ai ? 'AI-generated' : unc ? 'Uncertain' : 'Likely real';
      var result = document.createElement('div');
      result.className = 'uw-result';
      result.innerHTML =
        '<div class="uw-row"><span class="uw-badge" style="background:' + color + ';color:#03172e">' + label + '</span>' +
        '<span style="font-size:14px;font-weight:700;color:' + color + '">' + (r.aiPercent != null ? r.aiPercent + '%' : '') + ' AI</span></div>' +
        (r.attribution && r.attribution.generator
          ? '<div class="uw-note">Attributed to ' + r.attribution.generator + ' (heuristic)</div>'
          : '') +
        '<div class="uw-note">Runs locally in your browser · results are indicative, not proof</div>';
      el.insertBefore(result, frame);
      frame.style.display = 'none';
    });
  }

  global.UnmaskWidget = { init: init };
})(typeof window !== 'undefined' ? window : this);
