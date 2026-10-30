(function () {
  // Containers that hold the whole open job (header, pay, description, benefits).
  const PANES = [
    "[data-testid='jobsearch-ViewjobPaneWrapper']",
    ".jobsearch-ViewjobPaneWrapper",
    ".jobsearch-RightPane",
    "#vjs-container",
    "#viewJobSSRRoot",
    "[data-testid='viewjob-job-content']",
    ".jobsearch-JobComponent",
    ".jobs-search__job-details--container",
    ".jobs-details",
    ".job-view-layout",
  ];
  // Just the description, used when no pane is found.
  const DESCRIPTIONS = [
    "#jobDescriptionText",
    ".jobsearch-JobComponent-description",
    "[data-testid='jobsearch-JobComponent-description']",
    "#job-details",
    ".jobs-description__content",
    ".jobs-box__html-content",
    ".jobs-description-content__text",
  ];
  const CARDS = [
    "div.job_seen_beacon",
    "li:has([data-jk])",
    "[data-testid='slider_item']",
    ".jobs-search-results__list-item",
    "li[data-occludable-job-id]",
    ".job-card-container",
  ];
  const FIELD = {
    title: [
      "[data-testid='jobsearch-JobInfoHeader-title']",
      ".jobsearch-JobInfoHeader-title",
      ".job-details-jobs-unified-top-card__job-title",
      "h1",
    ],
    company: [
      "[data-testid='inlineHeader-companyName']",
      "[data-testid='company-name']",
      ".jobsearch-CompanyInfoContainer a",
      ".job-details-jobs-unified-top-card__company-name",
    ],
    location: [
      "[data-testid='inlineHeader-companyLocation']",
      "[data-testid='text-location']",
      ".jobsearch-JobInfoHeader-subtitle div:last-child",
      ".job-details-jobs-unified-top-card__primary-description-container",
    ],
  };
  const CARD_FIELD = {
    title: ["h2.jobTitle", "a.jcs-JobTitle", "[data-testid='jobTitle']", ".job-card-list__title", "a[href*='/jobs/view/']"],
    company: ["[data-testid='company-name']", ".companyName", ".artdeco-entity-lockup__subtitle"],
    location: ["[data-testid='text-location']", ".companyLocation", ".artdeco-entity-lockup__caption"],
  };
  const MIN = 40;
  const MAX = 20000;

  function textOf(el) {
    return el && el.innerText ? el.innerText.replace(/\n{3,}/g, "\n\n").trim() : "";
  }

  function pick(root, selectors) {
    for (const selector of selectors) {
      let el = null;
      try {
        el = root.querySelector(selector);
      } catch {
        el = null;
      }
      const text = textOf(el);
      if (text) return text.split("\n")[0].slice(0, 160);
    }
    return "";
  }

  function visibleCards() {
    const seen = new Set();
    const out = [];
    for (const selector of CARDS) {
      let nodes = [];
      try {
        nodes = document.querySelectorAll(selector);
      } catch {
        nodes = [];
      }
      for (const node of nodes) {
        if (seen.has(node) || [...seen].some((other) => other.contains(node) || node.contains(other))) continue;
        if (textOf(node).length < 20) continue;
        seen.add(node);
        out.push(node);
      }
      if (out.length) break;
    }
    return out;
  }

  function listings() {
    const cards = visibleCards();
    cards.forEach((card, index) => card.setAttribute("data-applysafe-id", String(index)));
    return cards.map((card, index) => {
      const link = card.querySelector("a[href*='jk='], a[href*='/rc/clk'], a[href*='/viewjob'], a[href*='/jobs/view/'], a.jcs-JobTitle");
      return {
        id: index,
        title: pick(card, CARD_FIELD.title) || "Job listing",
        company: pick(card, CARD_FIELD.company),
        location: pick(card, CARD_FIELD.location),
        url: link ? link.href : location.href,
        text: textOf(card).slice(0, 4000),
      };
    });
  }

  function openJob() {
    for (const selector of PANES) {
      let el = null;
      try {
        el = document.querySelector(selector);
      } catch {
        el = null;
      }
      const text = textOf(el);
      if (text.length >= MIN) {
        return {
          selector,
          root: el,
          text,
          title: pick(el, FIELD.title),
          company: pick(el, FIELD.company),
          location: pick(el, FIELD.location),
        };
      }
    }
    for (const selector of DESCRIPTIONS) {
      const el = document.querySelector(selector);
      const text = textOf(el);
      if (text.length >= MIN) {
        const head = [pick(document, FIELD.title), pick(document, FIELD.company), pick(document, FIELD.location)]
          .filter(Boolean)
          .join("\n");
        return {
          selector,
          root: el,
          text: head ? head + "\n\n" + text : text,
          title: pick(document, FIELD.title),
          company: pick(document, FIELD.company),
          location: pick(document, FIELD.location),
        };
      }
    }
    return null;
  }

  function extract() {
    const selected = window.getSelection ? window.getSelection().toString().trim() : "";
    if (selected.length >= MIN) {
      return { text: selected.slice(0, MAX), mode: "selection", listings: [] };
    }
    const job = openJob();
    const all = listings();
    if (!job && all.length === 0) {
      return { error: "Open a job posting or a search results page, or select a recruiter message, then press Scan." };
    }
    return {
      mode: job ? "posting" : "results",
      selector: job ? job.selector : "",
      text: job ? job.text.slice(0, MAX) : "",
      title: job ? job.title : "",
      company: job ? job.company : "",
      location: job ? job.location : "",
      listings: all,
    };
  }

  function show(extracted, result, results) {
    ensureStyle();
    if (extracted && extracted.mode === "posting" && extracted.selector && result) {
      let root = null;
      try {
        root = document.querySelector(extracted.selector);
      } catch {
        root = null;
      }
      if (root) {
        clear(root);
        const banner = document.createElement("div");
        banner.className = "applysafe-banner " + result.verdict;
        banner.textContent = "ApplySafe: " + label(result.verdict);
        root.prepend(banner);
        for (const hit of result.highlights) wrapFirst(root, hit.span);
      }
    }
    document.querySelectorAll(".applysafe-chip").forEach((node) => node.remove());
    for (const row of results || []) {
      const card = document.querySelector("[data-applysafe-id='" + row.id + "']");
      if (!card) continue;
      const chip = document.createElement("div");
      chip.className = "applysafe-chip " + row.verdict;
      chip.textContent = label(row.verdict);
      card.appendChild(chip);
    }
  }

  function focusCard(id) {
    const card = document.querySelector("[data-applysafe-id='" + id + "']");
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("applysafe-focus");
    setTimeout(() => card.classList.remove("applysafe-focus"), 1600);
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
      ".applysafe-banner{font:600 13px/1.3 system-ui,sans-serif;padding:6px 10px;margin:0 0 8px;border-radius:8px;background:#fff;border:1px solid #e5e5e5;color:#111}",
      ".applysafe-banner.scam,.applysafe-chip.scam{color:#b42318;border-color:#f3c1bb}",
      ".applysafe-banner.risky,.applysafe-chip.risky{color:#9a5b00;border-color:#f1d9a5}",
      ".applysafe-banner.unclear,.applysafe-chip.unclear{color:#555}",
      ".applysafe-banner.looks_ok,.applysafe-chip.looks_ok{color:#127a47;border-color:#b9e3cc}",
      ".applysafe-chip{display:inline-block;margin:6px 12px 8px;padding:2px 8px;border:1px solid #e5e5e5;border-radius:999px;background:#fff;font:600 11px/1.5 system-ui,sans-serif}",
      "mark.applysafe-hit{background:#ffe08a;color:inherit;border-radius:2px}",
      ".applysafe-focus{outline:2px solid #111;outline-offset:2px;transition:outline .2s}",
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
      try {
        const range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + phrase.length);
        const mark = document.createElement("mark");
        mark.className = "applysafe-hit";
        range.surroundContents(mark);
      } catch {
        // A phrase that crosses elements is skipped; the popup still shows it.
      }
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
        show(message.extracted, message.result, message.results);
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "applysafe:focus") {
        focusCard(message.id);
        sendResponse({ ok: true });
      }
    });
  }
})();
