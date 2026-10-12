import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { Rule, RuleWeight } from "./types.ts";

const DEFAULT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../data/rules/ca",
);

export function loadRules(dir = DEFAULT_DIR): Rule[] {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .sort();
  const rules = files.map((name) => parseRule(readFileSync(join(dir, name), "utf8"), name));
  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) throw new Error(`Duplicate rule id ${rule.id}`);
    ids.add(rule.id);
    compile(rule);
  }
  return rules;
}

function parseRule(raw: string, file: string): Rule {
  const doc = parse(raw) as Partial<Rule> | null;
  if (!doc || typeof doc.id !== "string") {
    throw new Error(`${file} is missing id`);
  }
  const weight = doc.weight;
  if (weight !== "hard" && weight !== "soft") {
    throw new Error(`${doc.id} weight must be hard or soft`);
  }
  if (typeof doc.family !== "string" || typeof doc.source_url !== "string") {
    throw new Error(`${doc.id} needs family and source_url`);
  }
  const patterns = asList(doc.patterns);
  const allOf = asList(doc.all_of);
  if (patterns.length === 0 && allOf.length === 0) {
    throw new Error(`${doc.id} needs patterns or all_of`);
  }
  return {
    id: doc.id,
    weight: weight as RuleWeight,
    family: doc.family,
    source_url: doc.source_url,
    patterns,
    all_of: allOf,
    suppress: asList(doc.suppress),
  };
}

function asList(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Rule pattern lists must be arrays of strings");
  }
  return value;
}

function compile(rule: Rule): void {
  for (const pattern of [...rule.patterns, ...rule.all_of, ...rule.suppress]) {
    try {
      new RegExp(pattern, "i");
    } catch (error) {
      throw new Error(`${rule.id} has a bad regex ${pattern}: ${String(error)}`);
    }
  }
}
