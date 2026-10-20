import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { scan } from "../src/scan.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const gold = readFileSync(join(root, "data/gold/applysafe-ca.jsonl"), "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line) as {
    id: string;
    text: string;
    label: string;
    split: string;
    rule_ids_expected: string[];
  });

const HARD = new Set([
  "pay.upfront_fee",
  "pay.lmia_worker",
  "pay.crypto_or_gift",
  "mule.forward_funds",
  "mule.cheque_split",
  "id.sin_early",
  "id.passport_chat",
  "gov.impersonate",
  "crypto.task_boost",
]);

const FIXTURES: Record<string, string> = {
  "id.sin_early": "as-ca-0001",
  "id.passport_chat": "as-ca-0011",
  "pay.lmia_worker": "as-ca-0003",
  "pay.upfront_fee": "as-ca-0008",
  "pay.crypto_or_gift": "as-ca-0004",
  "mule.forward_funds": "as-ca-0010",
  "mule.cheque_split": "as-ca-0002",
  "gov.impersonate": "as-ca-0009",
  "crypto.task_boost": "as-ca-0031",
};

test("everyday wording still trips the matching rule", () => {
  const cases: Array<[string, string, string]> = [
    ["share your passport in this chat", "scam", "id.passport_chat"],
    ["deposit the check and keep $200", "scam", "mule.cheque_split"],
    ["the uniform fee of $150 is due today", "scam", "pay.upfront_fee"],
    ["sell me an LMIA", "scam", "pay.lmia_worker"],
    ["pay the deposit with ethereum", "scam", "pay.crypto_or_gift"],
    ["ESDC officer: text your SIN", "scam", "gov.impersonate"],
    ["like the products then pay USDT to withdraw", "scam", "crypto.task_boost"],
    ["send the rest of the money back", "scam", "mule.forward_funds"],
    ["80 dollars per hour, no experience", "risky", "pay.too_good"],
    ["message me on telegram", "risky", "ch.telegram_only"],
    ["saw the resume and reached out", "risky", "proc.unsolicited"],
    ["secret-shop assignment", "risky", "title.cafc_classic"],
    ["HR Gmail for the hiring desk", "risky", "ch.webmail_as_hr"],
  ];
  for (const [text, verdict, ruleId] of cases) {
    const result = scan(text);
    assert.equal(result.verdict, verdict, text);
    assert.ok(result.rules.hits.includes(ruleId), `${text} missed ${ruleId}: ${result.rules.hits.join(",")}`);
  }
  assert.equal(scan("$45,000 a year").verdict, "unclear");
  assert.equal(scan("Message on WhatsApp or by email, either is fine.").rules.hits.includes("ch.whatsapp_only"), false);
  const meet = scan("Send a resume to lumendraft.jobs@gmail.com. If it fits, we do a Google Meet.");
  assert.equal(meet.rules.hits.includes("ch.webmail_as_hr"), false);
});

test("120$ per hour for someone just told they got the job is risky", () => {
  const result = scan("Congratulations! you got the job. 120$ per hour as intern");
  assert.equal(result.verdict, "risky");
  assert.ok(result.rules.hits.includes("pay.too_good"));
  assert.ok(result.rules.hits.includes("proc.no_interview_hired"));
  assert.equal(scan("$45,000 a year").verdict, "unclear");
  assert.equal(scan("Lumen Draft is hiring at $18 an hour.").verdict, "unclear");
});

test("share sin after you got the job is a scam", () => {
  const result = scan(
    "Hiring customer support. Must be eligible to work in Canada. Email your resume to the manager. Pay competitive. Remote. Congratulations! you got the job. share sin, and other documents",
  );
  assert.equal(result.verdict, "scam");
  assert.ok(result.rules.hits.includes("id.sin_early"));
  assert.ok(result.rules.hits.includes("proc.no_interview_hired"));
});

test("send SIN on Telegram is a scam with id.sin_early", () => {
  const result = scan("send SIN on Telegram");
  assert.equal(result.verdict, "scam");
  assert.ok(result.rules.hits.includes("id.sin_early"));
  assert.ok(result.highlights.some((hit) => hit.rule_id === "id.sin_early" && /sin/i.test(hit.span)));
  assert.ok(result.score >= 40);
});

test("each hard rule fires on a gold sentence", () => {
  for (const [ruleId, id] of Object.entries(FIXTURES)) {
    const row = gold.find((item) => item.id === id);
    assert.ok(row, id);
    assert.ok(row.rule_ids_expected.includes(ruleId), `${id} should expect ${ruleId}`);
    const result = scan(row.text);
    assert.equal(result.verdict, "scam", id);
    assert.ok(result.rules.hits.includes(ruleId), `${id} missed ${ruleId}: ${row.text}`);
    assert.ok(result.highlights.some((hit) => hit.rule_id === ruleId), id);
  }
});

test("gold hard labels keep their hard rules, and non-scams stay clear of them", () => {
  const missed: string[] = [];
  const falseHard: string[] = [];
  for (const row of gold) {
    const result = scan(row.text);
    for (const ruleId of row.rule_ids_expected) {
      if (HARD.has(ruleId) && !result.rules.hits.includes(ruleId)) {
        missed.push(`${row.id} ${ruleId}`);
      }
    }
    if (row.label !== "scam" && result.rules.hits.some((id) => HARD.has(id))) {
      falseHard.push(`${row.id} ${result.verdict} ${result.rules.hits.join(",")}`);
    }
    if (row.split === "hard_negative" && result.verdict === "scam") {
      falseHard.push(`${row.id} ${result.rules.hits.join(",")}`);
    }
  }
  assert.deepEqual(missed, [], `missed hard rules:\n${missed.join("\n")}`);
  assert.deepEqual(falseHard, [], `hard hit on a non-scam:\n${falseHard.join("\n")}`);
});
