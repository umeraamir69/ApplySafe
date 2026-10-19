import { authorize, corsHeaders, json, scanText } from "@/lib/api";
import { evidenceFor } from "@/lib/evidence";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;
  let body: {
    text?: unknown;
    include_brain?: unknown;
    from_email?: unknown;
    company_name?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send a JSON body with text." }, 400);
  }
  if (typeof body.text !== "string" || !body.text.trim()) {
    return json({ error: "text is required." }, 400);
  }
  if (body.text.length > 20_000) return json({ error: "text is longer than 20000 characters." }, 400);
  const includeBrain = body.include_brain !== false;
  const result = await scanText(body.text, includeBrain);
  const evidence = evidenceFor({
    from_email: typeof body.from_email === "string" ? body.from_email : undefined,
    company_name: typeof body.company_name === "string" ? body.company_name : undefined,
  });
  return json(evidence ? { ...result, evidence } : result);
}
