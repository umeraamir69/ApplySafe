import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import "yaml";

export type WebHighlight = {
  span: string;
  rule_id: string;
  start: number;
  end: number;
};

export type BrainScore = {
  p_scam: number;
  label: "scam" | "not_scam";
  version: "brain_v1";
  top_ngrams: { gram: string; weight: number }[];
};

export type WebScan = {
  verdict: "scam" | "risky" | "unclear" | "looks_ok";
  rules_verdict: "scam" | "risky" | "unclear" | "looks_ok";
  score: number;
  highlights: WebHighlight[];
  families: string[];
  confidence: "high" | "medium" | "low";
  rules: { hits: string[]; score: number };
  brain: BrainScore | null;
  engine: string;
  disclaimer: string;
  sources: Record<string, string>;
};

export function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, "packages/engine/src/cli.ts"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const packed = join(process.cwd(), ".applysafe");
  if (existsSync(join(packed, "packages/engine/src/cli.ts"))) return packed;
  throw new Error("ApplySafe repo root was not found from the web app.");
}

export function runScan(text: string): WebScan {
  const root = repoRoot();
  const proc = spawnSync(
    process.execPath,
    ["--experimental-strip-types", join(root, "packages/engine/src/cli.ts")],
    { cwd: root, input: text, encoding: "utf8", maxBuffer: 2_000_000 },
  );
  if (proc.status !== 0) {
    throw new Error(proc.stderr || "The rules scanner failed.");
  }
  const parsed = JSON.parse(proc.stdout) as WebScan;
  parsed.rules_verdict = parsed.verdict;
  parsed.brain = null;
  return parsed;
}

export async function runBrain(text: string): Promise<BrainScore | null> {
  const base = process.env.BRAIN_URL;
  if (base) return scoreOnService(base, text);
  const root = repoRoot();
  const venv = join(root, ".venv/bin/python");
  const python = existsSync(venv) ? venv : "python3";
  const brainDir = existsSync(join(root, "packages/brain/brain.py"))
    ? join(root, "packages/brain")
    : root;
  const proc = spawnSync(python, ["-c", BRAIN_SNIPPET], {
    cwd: brainDir,
    input: text,
    encoding: "utf8",
    maxBuffer: 2_000_000,
    env: { ...process.env, PYTHONPATH: brainDir },
  });
  if (proc.status !== 0 || !proc.stdout.trim()) return null;
  return JSON.parse(proc.stdout) as BrainScore;
}

async function scoreOnService(base: string, text: string): Promise<BrainScore | null> {
  try {
    const root = base.endsWith("/") ? base : `${base}/`;
    const response = await fetch(new URL("score", root), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return null;
    return (await response.json()) as BrainScore;
  } catch {
    return null;
  }
}

const BRAIN_SNIPPET = `
import json, sys
from brain import predict
print(json.dumps(predict(sys.stdin.read())))
`;

const LIFT = 0.75;

export function combine(rules: WebScan, brain: BrainScore | null): WebScan {
  const rulesVerdict = rules.verdict;
  let verdict = rulesVerdict;
  if (brain && rulesVerdict === "unclear" && brain.p_scam >= LIFT) verdict = "risky";
  return {
    ...rules,
    verdict,
    rules_verdict: rulesVerdict,
    brain,
    engine: brain ? "rules_v1+brain_v1" : "rules_v1",
  };
}
