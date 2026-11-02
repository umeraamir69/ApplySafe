import assert from "node:assert/strict";
import { test } from "node:test";
import { evidenceFor } from "./evidence.ts";

test("Proton and Tuta catch as webmail-as-HR when a brand is named", () => {
  const proton = evidenceFor({ from_email: "hr@shop.proton.me", company_name: "Shopify" });
  assert.equal(proton?.webmail_as_hr, true);
  assert.ok(proton?.notes.some((note) => note.includes("proton.me")));

  const tuta = evidenceFor({ from_email: "recruiter@desk.tuta.com", company_name: "Shopify" });
  assert.equal(tuta?.webmail_as_hr, true);
  assert.ok(tuta?.notes.some((note) => note.includes("tuta.com")));
});

test("gmail still works, and a company domain does not", () => {
  const gmail = evidenceFor({ from_email: "hr@gmail.com", company_name: "Shopify" });
  assert.equal(gmail?.webmail_as_hr, true);

  const corp = evidenceFor({ from_email: "hr@shopify.com", company_name: "Shopify" });
  assert.equal(corp?.webmail_as_hr, false);
  assert.deepEqual(corp?.notes, []);
});

  const ircc = evidenceFor({ from_email: "ircc.jobs@gmail.com", company_name: "IRCC" });
  assert.equal(ircc?.webmail_as_hr, true);
  assert.equal(ircc?.brand_mismatch, true);

  const cra = evidenceFor({ from_email: "cra.refunds@yahoo.com", company_name: "CRA" });
  assert.equal(cra?.webmail_as_hr, true);
