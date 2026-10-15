(function () {
  const DISCLAIMER =
    "Not legal advice. Report fraud to the Canadian Anti-Fraud Centre at 1-888-495-8501.";

  function scan(text, rules) {
    const highlights = [];
    const hits = [];
    for (const rule of rules) {
      if (rule.suppress.some((pattern) => new RegExp(pattern, "i").test(text))) continue;
      const matched = matchRule(rule, text);
      if (!matched) continue;
      hits.push(rule);
      highlights.push(Object.assign({ rule_id: rule.id }, matched));
    }
    const hard = hits.filter((rule) => rule.weight === "hard");
    const soft = hits.filter((rule) => rule.weight === "soft");
    const score = Math.min(100, hard.length * 40 + soft.length * 12);
    return {
      verdict: decide(hard.length, soft.length, text),
      score,
      highlights,
      families: [...new Set(hits.map((rule) => rule.family))],
      confidence: hard.length > 0 ? "high" : soft.length > 0 ? "medium" : "low",
      rules: { hits: hits.map((rule) => rule.id), score },
      engine: "rules_v1",
      disclaimer: DISCLAIMER,
      sources: Object.fromEntries(hits.map((rule) => [rule.id, rule.source_url])),
    };
  }

  function matchRule(rule, text) {
    for (const pattern of rule.patterns) {
      const found = firstMatch(text, pattern);
      if (found) return found;
    }
    if (rule.all_of.length > 0 && rule.all_of.every((pattern) => new RegExp(pattern, "i").test(text))) {
      return firstMatch(text, rule.all_of[0]) || {
        span: text.slice(0, 80),
        start: 0,
        end: Math.min(80, text.length),
      };
    }
    return null;
  }

  function firstMatch(text, pattern) {
    const found = new RegExp(pattern, "i").exec(text);
    if (!found || found.index === undefined) return null;
    return { span: found[0], start: found.index, end: found.index + found[0].length };
  }

  function decide(hardCount, softCount, text) {
    if (hardCount > 0) return "scam";
    if (softCount > 0) return "risky";
    if (looksOk(text)) return "looks_ok";
    return "unclear";
  }

  function looksOk(text) {
    const domain = /@[a-z0-9.-]+\.ca\b|\b[a-z0-9-]+\.ca\/(?:careers|jobs)\b/i.test(text);
    const interview = /\b(?:zoom|phone screen|on[- ]site|in the (?:shop|office|plant|clinic|hotel)|interview)\b/i.test(text);
    const careers = /\b(?:careers|\/jobs)\b/i.test(text);
    return domain && interview && careers;
  }

  const root = typeof globalThis !== "undefined" ? globalThis : window;
  root.ApplySafe = Object.assign(root.ApplySafe || {}, { scan });
})();
