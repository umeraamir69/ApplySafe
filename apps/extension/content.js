(function () {
  const SELECTORS = [
    "#job-details",
    ".jobs-description__content",
    ".jobs-box__html-content",
    ".jobs-description-content__text",
    "#jobDescriptionText",
    ".jobsearch-JobComponent-description",
    "[data-testid='jobsearch-JobComponent-description']",
    "[data-testid='viewjob-job-content']",
  ];

  function extract() {
    const selected = window.getSelection ? window.getSelection().toString().trim() : "";
    if (selected.length >= 40) {
      return { text: selected.slice(0, 20000), mode: "selection" };
    }
    for (const selector of SELECTORS) {
      const element = document.querySelector(selector);
      const text = element && element.innerText ? element.innerText.trim() : "";
      if (text.length >= 40) {
        return { text: text.slice(0, 20000), mode: "posting", selector };
      }
    }
    return {
      error: "Open a job posting, or select the recruiter message, then press Scan.",
    };
  }

  function show(extracted, result) {
    if (!extracted || extracted.mode !== "posting" || !extracted.selector) return;
    const root = document.querySelector(extracted.selector);
    if (!root) return;
    ensureStyle();
    clear(root);
    const banner = document.createElement("div");
    banner.className = "applysafe-banner " + result.verdict;
    banner.textContent = "ApplySafe: " + label(result.verdict);
    root.prepend(banner);
    for (const hit of result.highlights) {
      wrapFirst(root, hit.span);
    }
  }

  function label(verdict) {
    if (verdict === "looks_ok") return "Looks ok";
    return verdict.charAt(0).toUpperCase() + verdict.slice(1);
  }

  function ensureStyle() {
    if (document.getElementById("applysafe-style")) return;
    const style = document.createElement("style");
    style.id = "applysafe-style";
    style.textContent = [
      ".applysafe-banner{font:14px/1.3 Georgia,serif;padding:6px 8px;margin:0 0 8px;border-radius:6px;background:#fffdf8;border:1px solid #e2dacb;color:#1c1915}",
      ".applysafe-banner.scam{color:#8d2e2e}",
      ".applysafe-banner.risky{color:#8a5a12}",
      ".applysafe-banner.unclear{color:#3d4a57}",
      ".applysafe-banner.looks_ok{color:#1d6a43}",
      "mark.applysafe-hit{background:#f4d48a;color:inherit;border-radius:2px}",
    ].join("");
    document.documentElement.appendChild(style);
  }

  function clear(root) {
    root.querySelectorAll("mark.applysafe-hit").forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.textContent || ""));
    });
    root.querySelectorAll(".applysafe-banner").forEach((node) => node.remove());
  }

  function wrapFirst(root, phrase) {
    if (!phrase) return;
    const needle = phrase.toLowerCase();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent && parent.closest("mark.applysafe-hit, .applysafe-banner")) {
        node = walker.nextNode();
        continue;
      }
      const hay = node.nodeValue || "";
      const at = hay.toLowerCase().indexOf(needle);
      if (at === -1) {
        node = walker.nextNode();
        continue;
      }
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + phrase.length);
      const mark = document.createElement("mark");
      mark.className = "applysafe-hit";
      range.surroundContents(mark);
      return;
    }
  }

  const api = globalThis.ApplySafe || {};
  api.extract = extract;
  api.show = show;
  globalThis.ApplySafe = api;

  if (globalThis.chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || message.type === "applysafe:extract") {
        sendResponse(extract());
        return;
      }
      if (message.type === "applysafe:show") {
        show(message.extracted, message.result);
        sendResponse({ ok: true });
      }
    });
  }
})();
