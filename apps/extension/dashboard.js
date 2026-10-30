const LABELS = { scam: "Scam", risky: "Risky", unclear: "Unclear", looks_ok: "Looks ok" };
const views = ["overview", "history", "trusted", "settings"];

function show(name) {
  for (const view of views) {
    document.querySelector("#" + view).hidden = view !== name;
  }
  for (const button of document.querySelectorAll("[data-view]")) {
    button.classList.toggle("on", button.getAttribute("data-view") === name);
  }
}

function render(data) {
  const stats = ApplySafeHistory.summarize(data.scans);
  const risk = stats.checked === 0 ? 0 : Math.round((stats.scams / stats.checked) * 100);
  document.querySelector("#risk").textContent = risk + "%";
  document.querySelector("#checked").textContent = String(stats.checked);
  document.querySelector("#high").textContent = String(stats.high);
  document.querySelector("#lower").textContent = String(stats.lower);
  const max = Math.max(1, ...Object.values(stats.buckets));
  const bars = document.querySelector("#bars");
  bars.replaceChildren();
  for (const site of ["LinkedIn", "Indeed", "Other"]) {
    const count = stats.buckets[site];
    const row = document.createElement("div");
    row.className = "bar";
    const name = document.createElement("span");
    name.textContent = site;
    const track = document.createElement("div");
    track.className = "track";
    const fill = document.createElement("i");
    fill.style.width = Math.round((count / max) * 100) + "%";
    track.append(fill);
    const pct = document.createElement("span");
    const share = stats.checked === 0 ? 0 : Math.round((count / stats.checked) * 100);
    pct.textContent = share + "%";
    row.append(name, track, pct);
    bars.append(row);
  }
  const list = document.querySelector("#list");
  list.replaceChildren();
  if (!data.scans.length) {
    const item = document.createElement("li");
    item.textContent = "No scans yet. Open a job and press Scan this page.";
    list.append(item);
  }
  for (const row of data.scans) {
    const item = document.createElement("li");
    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = row.title || "Job page";
    const meta = document.createElement("div");
    const when = new Date(row.ts);
    meta.textContent = row.site + " · " + when.toLocaleString();
    left.append(title, meta);
    const verdict = document.createElement("span");
    verdict.className = "pill " + row.verdict;
    verdict.textContent = (LABELS[row.verdict] || row.verdict) + " · " + row.score;
    item.append(left, verdict);
    list.append(item);
  }
  const hosts = document.querySelector("#hosts");
  hosts.replaceChildren();
  if (!data.trustedHosts.length) {
    const item = document.createElement("li");
    item.textContent = "No trusted sites yet.";
    hosts.append(item);
  }
  for (const host of data.trustedHosts) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = host;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      void ApplySafeHistory.setTrusted(data.trustedHosts.filter((item) => item !== host)).then(refresh);
    });
    item.append(name, remove);
    hosts.append(item);
  }
}

function refresh() {
  return ApplySafeHistory.load().then(render);
}

for (const button of document.querySelectorAll("[data-view]")) {
  button.addEventListener("click", () => show(button.getAttribute("data-view")));
}

document.querySelector("#host").addEventListener("input", (event) => {
  event.target.setCustomValidity("");
});

document.querySelector("#trust-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#host");
  const host = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  if (!host || host.includes(" ") || !host.includes(".")) {
    input.setCustomValidity("Enter a site such as jobs.example.ca");
    input.reportValidity();
    return;
  }
  input.setCustomValidity("");
  void ApplySafeHistory.load().then((data) =>
    ApplySafeHistory.setTrusted([...data.trustedHosts, host]).then(() => {
      input.value = "";
      return refresh();
    }),
  );
});

document.querySelector("#clear").addEventListener("click", () => {
  void ApplySafeHistory.clearScans().then(refresh);
});

void refresh();
