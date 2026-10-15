import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRules } from "../../../packages/engine/src/loadRules.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..");
const rules = loadRules().map((rule) => ({
  id: rule.id,
  weight: rule.weight,
  family: rule.family,
  source_url: rule.source_url,
  patterns: rule.patterns,
  all_of: rule.all_of,
  suppress: rule.suppress,
}));
const json = JSON.stringify(rules);
writeFileSync(join(dir, "rules.json"), json);
writeFileSync(
  join(dir, "rules.js"),
  `globalThis.ApplySafe = Object.assign(globalThis.ApplySafe || {}, { rules: ${json} });\n`,
);
console.log(`wrote ${rules.length} rules`);
