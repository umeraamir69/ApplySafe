import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "@/lib/run-scan";

export const DEMO_KEY = process.env.APPLYSAFE_DEMO_KEY ?? "ask_demo";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;
const hits = new Map<string, number[]>();

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

export function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function authorize(request: Request): Response | null {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token !== DEMO_KEY) {
    return json({ error: "Send Authorization: Bearer and the demo key." }, 401);
  }
  const now = Date.now();
  const recent = (hits.get(token) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(token, recent);
    return json({ error: "Demo key limit is 30 scans in 10 minutes." }, 429);
  }
  recent.push(now);
  hits.set(token, recent);
  return null;
}

export function logScan(text: string, verdict: string, ruleIds: string[]): void {
  try {
    const dir = join(repoRoot(), "logs");
    mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      sha256: createHash("sha256").update(text).digest("hex"),
      verdict,
      rule_ids: ruleIds,
    });
    appendFileSync(join(dir, "scans.jsonl"), `${line}\n`);
  } catch {
    // A failed log must not change the verdict.
  }
}
