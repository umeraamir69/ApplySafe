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

function render(text, result) {
  statusNode.hidden = true;
  resultNode.hidden = false;
  resultNode.replaceChildren();
  const verdict = document.createElement("div");
  verdict.className = "verdict " + result.verdict;
  const strong = document.createElement("strong");
  strong.textContent = LABELS[result.verdict];
  const score = document.createElement("span");
  score.textContent = "Score " + result.score;
  verdict.append(strong, score);
  const note = document.createElement("p");
  note.className = "note";
  note.textContent = NOTES[result.verdict];
  const message = document.createElement("p");
  message.className = "message";
  for (const part of segments(text, result.highlights)) {
    const node = document.createElement(part.on ? "mark" : "span");
    node.textContent = part.text;
    message.append(node);
  }
  resultNode.append(verdict, note, message);
  if (result.rules.hits.length) {
    const list = document.createElement("ul");
    list.className = "hits";
    for (const id of result.rules.hits) {
      const item = document.createElement("li");
      const code = document.createElement("code");
      code.textContent = id;
      item.append(code);
      const href = result.sources[id];
      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = " source";
        item.append(link);
      }
      list.append(item);
    }
    resultNode.append(list);
  } else {
    const empty = document.createElement("p");
    empty.className = "note";
    empty.textContent = "No rule fired.";
    resultNode.append(empty);
  }
  const disclaimer = document.createElement("p");
  disclaimer.className = "disclaimer";
  disclaimer.textContent = result.disclaimer;
  resultNode.append(disclaimer);
}

function showStatus(text, isError) {
  resultNode.hidden = true;
  statusNode.hidden = false;
  statusNode.textContent = text;
  statusNode.className = isError ? "note error" : "note";
}

function scanText(text) {
  return ApplySafe.scan(text, ApplySafe.rules);
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
    showStatus("Open a LinkedIn or Indeed job page, then scan.", true);
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
  const result = scanText(extracted.text);
  render(extracted.text, result);
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "applysafe:show", extracted, result });
  } catch {
    // The popup still has the verdict if the page mark fails.
  }
}

scanButton.addEventListener("click", () => {
  void scanPage();
});

for (const button of document.querySelectorAll("[data-demo]")) {
  button.addEventListener("click", () => {
    const text = DEMOS[button.getAttribute("data-demo")];
    render(text, scanText(text));
  });
}
