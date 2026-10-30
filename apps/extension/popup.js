const DEMOS = {
  scam: "Saw your resume online. Easy product-boost tasks 400 a day. Install our app, then pay 80 USDT to unlock withdrawal.",
  unclear: "Hiring customer support. Must be eligible to work in Canada. Email your resume to the manager. Pay competitive. Remote.",
  looks_ok:
    "Maple Desk Ltd (Kitchener) is hiring a junior backend co-op for Winter 2027. Apply on mapledesk.ca/careers. First step is a 30-minute Zoom with the eng manager. We do not ask for SIN or banking until a written offer is signed. hr@mapledesk.ca",
};

const LABELS = { scam: "Scam", risky: "Risky", unclear: "Unclear", looks_ok: "Looks ok" };
const NOTES = {
  scam: "A hard rule fired. The Canada list treats this pattern as a scam.",
  risky: "Soft signals only. This is not proof of a scam, and it is not a clean bill.",
  unclear: "No hard hit and no green flags. A quiet message is not a safe one.",
  looks_ok: "A .ca address, an interview, and a careers or jobs link, with no rule hit.",
};

const statusNode = document.querySelector("#status");
const resultNode = document.querySelector("#result");
const scanButton = document.querySelector("#scan");

function segments(text, highlights) {
  const owners = Array.from({ length: text.length }, () => []);
  for (const hit of highlights) {
    const end = Math.min(hit.end, text.length);
    for (let index = Math.max(0, hit.start); index < end; index += 1) {
      if (!owners[index].includes(hit.rule_id)) owners[index].push(hit.rule_id);
    }
  }
  const parts = [];
  let cursor = 0;
  while (cursor < text.length) {
    const key = owners[cursor].join("\n");
    let next = cursor + 1;
    while (next < text.length && owners[next].join("\n") === key) next += 1;
    parts.push({ text: text.slice(cursor, next), on: owners[cursor].length > 0 });
    cursor = next;
  }
  return parts;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function hitList(result) {
  const wrap = document.createDocumentFragment();
  if (!result.rules.hits.length && !result.lifted) return wrap;
  wrap.append(el("div", "label", "Why"));
  const list = el("ul", "hits");
  if (result.lifted) {
    const item = document.createElement("li");
    item.append(
      el("span", "", "Reads like known scam text"),
      el("span", "tag", Math.round(result.brain.p_scam * 100) + "% match"),
    );
    list.append(item);
  }
  for (const id of result.rules.hits) {
    const item = document.createElement("li");
    item.append(el("code", "", id));
    const href = result.sources[id];
    if (href) {
      const link = el("a", "", "source");
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      item.append(link);
    }
    list.append(item);
  }
  wrap.append(list);
  return wrap;
}

function render(text, result, meta, rows) {
  statusNode.hidden = true;
  resultNode.hidden = false;
  resultNode.replaceChildren();
  if (text) {
    const verdict = el("div", "verdict " + result.verdict);
    verdict.append(el("strong", "", LABELS[result.verdict]), el("span", "", "Score " + result.score));
    resultNode.append(verdict);
    const who = meta && [meta.title, meta.company].filter(Boolean).join(" at ");
    resultNode.append(el("p", "sub", who || NOTES[result.verdict]));
    if (who) resultNode.append(el("p", "sub", NOTES[result.verdict]));
    const message = el("p", "message");
    for (const part of segments(text, result.highlights)) {
      message.append(el(part.on ? "mark" : "span", "", part.text));
    }
    resultNode.append(message, hitList(result));
  }
  if (rows && rows.length) renderListings(rows);
  resultNode.append(el("p", "disclaimer", (result || rows[0] || {}).disclaimer || "Not legal advice. Report fraud to the Canadian Anti-Fraud Centre at 1-888-495-8501."));
}

function renderListings(rows) {
  const flagged = rows.filter((row) => row.verdict === "scam" || row.verdict === "risky").length;
  resultNode.append(
    el("div", "label", rows.length + " listings on this page" + (flagged ? ", " + flagged + " flagged" : ", none flagged")),
  );
  const order = { scam: 0, risky: 1, unclear: 2, looks_ok: 3 };
  const list = el("ul", "list");
  for (const row of [...rows].sort((a, b) => order[a.verdict] - order[b.verdict])) {
    const item = document.createElement("li");
    const button = el("button");
    button.type = "button";
    const name = el("span", "name", row.title);
    if (row.company) name.append(el("small", "", "  " + row.company));
    button.append(el("span", "dot " + row.verdict), name, el("span", "tag", LABELS[row.verdict]));
    button.addEventListener("click", () => focusListing(row.id));
    item.append(button);
    list.append(item);
  }
  resultNode.append(list);
}

let activeTab = null;
async function focusListing(id) {
  if (!activeTab) return;
  try {
    await chrome.tabs.sendMessage(activeTab.id, { type: "applysafe:focus", id });
  } catch {
    // The tab was closed or reloaded.
  }
}

function showStatus(text, isError) {
  resultNode.hidden = true;
  statusNode.hidden = false;
  statusNode.textContent = text;
  statusNode.className = isError ? "note error" : "note";
}

function scanText(text) {
  const result = ApplySafe.scan(text, ApplySafe.rules);
  const brain = globalThis.ApplySafeBrain;
  if (!brain || !brain.ready()) return result;
  const p = brain.pScam(text);
  result.brain = { p_scam: p, version: "brain_v1" };
  const mixed = brain.mix(result.verdict, p);
  if (mixed !== result.verdict) {
    result.verdict = mixed;
    result.lifted = true;
    result.score = Math.max(result.score, 36);
    result.engine = "rules_v1+brain_v1";
  }
  return result;
}

function allowed(url) {
  try {
    const host = new URL(url).hostname;
    return host === "www.linkedin.com" || host === "www.indeed.com" || host.endsWith(".indeed.com") || host === "www.indeed.ca" || host.endsWith(".indeed.ca") || host === "ca.indeed.com";
  } catch {
    return false;
  }
}

async function scanPage() {
  if (!globalThis.chrome || !chrome.tabs) {
    showStatus("Load this folder in Chrome as an unpacked extension to scan a job page. The demo buttons work here.");
    return;
  }
  scanButton.disabled = true;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !allowed(tab.url || "")) {
    scanButton.disabled = false;
    showStatus("Open a LinkedIn or Indeed job page or search results, then scan.", true);
    return;
  }
  let extracted;
  try {
    extracted = await chrome.tabs.sendMessage(tab.id, { type: "applysafe:extract" });
  } catch {
    scanButton.disabled = false;
    showStatus("Reload the job tab so ApplySafe can read it, then scan again.", true);
    return;
  }
  scanButton.disabled = false;
  if (!extracted || extracted.error) {
    showStatus(extracted && extracted.error ? extracted.error : "Nothing to scan.", true);
    return;
  }
  activeTab = tab;
  const result = extracted.text ? scanText(extracted.text) : null;
  const rows = (extracted.listings || []).map((item) => {
    const r = scanText(item.text);
    return { id: item.id, title: item.title, company: item.company, url: item.url, verdict: r.verdict, score: r.score };
  });
  render(extracted.text, result, extracted, rows);
  await noteTrust(tab.url || "");
  if (result) {
    await remember({ url: tab.url, title: extracted.title ? extracted.title + (extracted.company ? " - " + extracted.company : "") : tab.title }, result);
  }
  for (const row of rows.filter((item) => item.verdict === "scam" || item.verdict === "risky").slice(0, 10)) {
    await remember({ url: row.url, title: row.title + (row.company ? " - " + row.company : "") }, row);
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "applysafe:show", extracted, result, results: rows });
  } catch {
    // The popup still has the verdict if the page mark fails.
  }
}

const dashButton = document.querySelector("#dash");
const trustNode = document.querySelector("#trust");

function paintStats(rows) {
  const stats = ApplySafeHistory.summarize(rows);
  document.querySelector("#stat-scams").textContent = String(stats.scams);
  document.querySelector("#stat-checked").textContent = String(stats.checked);
  document.querySelector("#stat-safer").textContent = stats.safer + "%";
  document.querySelector("#stats-line").textContent = stats.checked + " checked, " + stats.scams + " scam" + (stats.scams === 1 ? "" : "s") + " flagged";
}

function openDashboard() {
  const url = globalThis.chrome && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL("dashboard.html")
    : "dashboard.html";
  if (globalThis.chrome && chrome.tabs) {
    void chrome.tabs.create({ url });
    return;
  }
  window.open(url, "_blank");
}

async function noteTrust(url) {
  const data = await ApplySafeHistory.load();
  paintStats(data.scans);
  const host = ApplySafeHistory.hostOf(url || "");
  const listed = ApplySafeHistory.trusted(host, data.trustedHosts);
  trustNode.hidden = !listed;
  trustNode.textContent = listed ? host + " is on your trusted list. The rules still run." : "";
}

async function remember(tab, result) {
  const scans = await ApplySafeHistory.saveScan({
    ts: Date.now(),
    url: tab.url || "",
    title: (tab.title || "Job page").slice(0, 140),
    site: ApplySafeHistory.siteOf(tab.url || ""),
    host: ApplySafeHistory.hostOf(tab.url || ""),
    verdict: result.verdict,
    score: result.score,
  });
  paintStats(scans);
}

scanButton.addEventListener("click", () => {
  void scanPage();
});

if (dashButton) dashButton.addEventListener("click", openDashboard);
void noteTrust("");

for (const button of document.querySelectorAll("[data-demo]")) {
  button.addEventListener("click", () => {
    const text = DEMOS[button.getAttribute("data-demo")];
    render(text, scanText(text), null, []);
  });
}
