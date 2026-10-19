import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { combine, repoRoot, runBrain, runScan, type WebScan } from "@/lib/run-scan";

const DEMO_KEY = process.env.APPLYSAFE_DEMO_KEY || "ask_demo";
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;
const hits = new Map<string, number[]>();

export function demoKey(): string {
  return DEMO_KEY;
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders() });
}

export function bearer(request: Request): string {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? "";
}

export function authorize(request: Request): Response | null {
  const key = bearer(request);
  if (key !== DEMO_KEY) return json({ error: "Use Authorization: Bearer and the demo key." }, 401);
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return json({ error: "Demo key limit is 30 scans in 10 minutes." }, 429);
  }
  recent.push(now);
  hits.set(key, recent);
  return null;
}

export async function scanText(text: string, includeBrain = true): Promise<WebScan> {
  const rules = runScan(text);
  const brain = includeBrain ? await runBrain(text) : null;
  const result = combine(rules, brain);
  remember(text, result);
  return result;
}

function remember(text: string, result: WebScan): void {
  try {
    const dir = join(repoRoot(), "logs");
    mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      sha256: createHash("sha256").update(text).digest("hex"),
      verdict: result.verdict,
      rules_verdict: result.rules_verdict,
      hits: result.rules.hits,
      brain: result.brain ? result.brain.p_scam : null,
    });
    appendFileSync(join(dir, "scans.jsonl"), `${line}\n`);
  } catch {
    // A log failure must not change the verdict.
  }
}
