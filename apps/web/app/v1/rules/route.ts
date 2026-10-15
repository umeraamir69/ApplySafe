import { readFileSync } from "node:fs";
import { join } from "node:path";
import { corsHeaders, json } from "@/lib/api";
import { repoRoot } from "@/lib/run-scan";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function GET() {
  const rules = JSON.parse(readFileSync(join(repoRoot(), "apps/extension/rules.json"), "utf8")) as {
    id: string;
    weight: string;
    family: string;
    source_url: string;
  }[];
  return json({
    version: "rules_v1",
    rules: rules.map((rule) => ({
      id: rule.id,
      weight: rule.weight,
      family: rule.family,
      source_url: rule.source_url,
    })),
  });
}
