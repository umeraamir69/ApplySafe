import { corsHeaders, json } from "@/lib/api";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function GET() {
  return json({ ok: true, rules_version: "rules_v1", brain_version: "brain_v1" });
}
