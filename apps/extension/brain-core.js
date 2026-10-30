(function () {
  // Reproduces the shipped brain_v1: two TF-IDF vectorizers (words 1-2, char_wb 3-5), L2 per
  // vectorizer, then logistic regression. It reads ApplySafeBrainData from brain.js.
  let model = null;

  function load() {
    if (model) return model;
    const data = globalThis.ApplySafeBrainData;
    if (!data) return null;
    const build = (rows) => {
      const map = new Map();
      for (const [term, idf, coef] of rows) map.set(term, [idf, coef]);
      return map;
    };
    model = { word: build(data.word), char: build(data.char), intercept: data.intercept, lift: data.lift };
    return model;
  }

  function wordGrams(text) {
    const tokens = text.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) || [];
    const grams = tokens.slice();
    for (let i = 0; i + 1 < tokens.length; i += 1) grams.push(tokens[i] + " " + tokens[i + 1]);
    return grams;
  }

  function charGrams(text) {
    const grams = [];
    const words = text.toLowerCase().replace(/\s\s+/g, " ").split(/\s+/).filter(Boolean);
    for (const raw of words) {
      const w = Array.from(" " + raw + " ");
      for (let n = 3; n <= 5; n += 1) {
        let offset = 0;
        grams.push(w.slice(offset, offset + n).join(""));
        while (offset + n < w.length) {
          offset += 1;
          grams.push(w.slice(offset, offset + n).join(""));
        }
        if (offset === 0) break;
      }
    }
    return grams;
  }

  function part(grams, table) {
    const counts = new Map();
    for (const gram of grams) if (table.has(gram)) counts.set(gram, (counts.get(gram) || 0) + 1);
    let norm = 0;
    const weighted = [];
    for (const [gram, count] of counts) {
      const [idf, coef] = table.get(gram);
      const value = (1 + Math.log(count)) * idf;
      norm += value * value;
      weighted.push([value, coef]);
    }
    if (norm === 0) return 0;
    const scale = 1 / Math.sqrt(norm);
    let sum = 0;
    for (const [value, coef] of weighted) sum += value * scale * coef;
    return sum;
  }

  function pScam(text) {
    const m = load();
    if (!m) return null;
    const z = part(wordGrams(text), m.word) + part(charGrams(text), m.char) + m.intercept;
    return 1 / (1 + Math.exp(-z));
  }

  function mix(verdict, p) {
    const lift = (load() || { lift: 0.75 }).lift;
    return verdict === "unclear" && p !== null && p >= lift ? "risky" : verdict;
  }

  globalThis.ApplySafeBrain = { pScam, mix, ready: () => load() !== null };
})();
