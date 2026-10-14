import { rules, scan } from "./scan.ts";

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}

const text = Buffer.concat(chunks).toString("utf8");
const result = scan(text);
const sources: Record<string, string> = {};
for (const id of result.rules.hits) {
  const rule = rules.find((item) => item.id === id);
  if (rule) sources[id] = rule.source_url;
}

process.stdout.write(JSON.stringify({ ...result, sources }));
