globalThis.ApplySafeHistory = {
  siteOf,
  hostOf,
  trusted,
  summarize,
  load,
  saveScan,
  setTrusted,
};

const SCAN_KEY = "scans";
const TRUST_KEY = "trustedHosts";
const MAX_SCANS = 80;

function siteOf(url) {
  try {
    const host = new URL(url).hostname;
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("indeed")) return "Indeed";
    return "Other";
  } catch {
    return "Other";
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function trusted(host, list) {
  const name = String(host || "").toLowerCase();
  return (list || []).some((item) => name === item || name.endsWith("." + item));
}

function summarize(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const checked = list.length;
  const scams = list.filter((row) => row.verdict === "scam").length;
  const risky = list.filter((row) => row.verdict === "risky").length;
  const lower = list.filter((row) => row.verdict === "looks_ok").length;
  const safer = checked === 0 ? 100 : Math.round(((checked - scams) / checked) * 100);
  const buckets = { LinkedIn: 0, Indeed: 0, Other: 0 };
  for (const row of list) {
    const site = buckets[row.site] === undefined ? "Other" : row.site;
    buckets[site] += 1;
  }
  return { checked, scams, risky, lower, high: scams + risky, safer, buckets };
}

function storage() {
  return globalThis.chrome && chrome.storage && chrome.storage.local;
}

const PAGE_KEY = "applysafe.history";

function readPage() {
  try {
    const data = JSON.parse(localStorage.getItem(PAGE_KEY) || "{}");
    return {
      scans: Array.isArray(data.scans) ? data.scans : [],
      trustedHosts: Array.isArray(data.trustedHosts) ? data.trustedHosts : [],
    };
  } catch {
    return { scans: [], trustedHosts: [] };
  }
}

function writePage(patch) {
  const next = { ...readPage(), ...patch };
  localStorage.setItem(PAGE_KEY, JSON.stringify(next));
  return next;
}

function load() {
  const local = storage();
  if (!local) return Promise.resolve(readPage());
  return local.get([SCAN_KEY, TRUST_KEY]).then((data) => ({
    scans: Array.isArray(data[SCAN_KEY]) ? data[SCAN_KEY] : [],
    trustedHosts: Array.isArray(data[TRUST_KEY]) ? data[TRUST_KEY] : [],
  }));
}

function saveScan(entry) {
  return load().then((data) => {
    const scans = [entry, ...data.scans].slice(0, MAX_SCANS);
    const local = storage();
    if (!local) {
      writePage({ scans });
      return scans;
    }
    return local.set({ [SCAN_KEY]: scans }).then(() => scans);
  });
}

function setTrusted(list) {
  const trustedHosts = [...new Set(list.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
  const local = storage();
  if (!local) {
    writePage({ trustedHosts });
    return Promise.resolve(trustedHosts);
  }
  return local.set({ [TRUST_KEY]: trustedHosts }).then(() => trustedHosts);
}

function clearScans() {
  const local = storage();
  if (!local) {
    writePage({ scans: [] });
    return Promise.resolve();
  }
  return local.set({ [SCAN_KEY]: [] });
}

ApplySafeHistory.clearScans = clearScans;
