import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { scan as engineScan } from "../../../packages/engine/src/scan.ts";
import { loadRules } from "../../../packages/engine/src/loadRules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "../..");

function extensionScan() {
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(root, "scan.js"), "utf8"), sandbox);
  return sandbox.ApplySafe.scan;
}

const scan = extensionScan();
const packed = JSON.parse(readFileSync(join(root, "rules.json"), "utf8"));

test("packed rules match the engine files", () => {
  const live = loadRules().map((rule) => ({
    id: rule.id,
    weight: rule.weight,
    family: rule.family,
    source_url: rule.source_url,
    patterns: rule.patterns,
    all_of: rule.all_of,
    suppress: rule.suppress,
  }));
  assert.deepEqual(packed, live);
});

test("send SIN on Telegram matches the engine", () => {
  const text = "send SIN on Telegram";
  const local = scan(text, packed);
  const engine = engineScan(text);
  assert.equal(local.verdict, "scam");
  assert.equal(local.verdict, engine.verdict);
  assert.equal(local.rules.hits.join("|"), engine.rules.hits.join("|"));
  assert.ok(local.highlights.some((hit) => hit.rule_id === "id.sin_early" && /sin/i.test(hit.span)));
});

test("every gold row matches the engine verdict and hits", () => {
  const rows = readFileSync(join(repo, "data/gold/applysafe-ca.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
  assert.equal(rows.length, 500);
  const mismatches = [];
  for (const row of rows) {
    const local = scan(row.text, packed);
    const engine = engineScan(row.text);
    if (local.verdict !== engine.verdict || local.rules.hits.join("|") !== engine.rules.hits.join("|")) {
      mismatches.push(`${row.id} ext=${local.verdict}:${local.rules.hits.join(",")} engine=${engine.verdict}:${engine.rules.hits.join(",")}`);
    }
  }
  assert.deepEqual(mismatches, []);
});
