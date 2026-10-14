import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export type WebHighlight = {
  span: string;
  rule_id: string;
  start: number;
  end: number;
};

export type WebScan = {
  verdict: "scam" | "risky" | "unclear" | "looks_ok";
  score: number;
  highlights: WebHighlight[];
  families: string[];
  confidence: "high" | "medium" | "low";
  rules: { hits: string[]; score: number };
  engine: string;
  disclaimer: string;
  sources: Record<string, string>;
};

function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, "packages/engine/src/cli.ts"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
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
  return JSON.parse(proc.stdout) as WebScan;
}
