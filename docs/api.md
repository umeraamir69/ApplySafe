# Scan API

The paste site and the API are the same Next.js app. Start it from `apps/web`:

```bash
cd apps/web
npm install
npm run dev
```

Base URL on this machine: `http://localhost:3000`.

The demo key is `ask_demo` unless `APPLYSAFE_DEMO_KEY` is set. Send it on every `POST /v1/scan`:

```http
Authorization: Bearer ask_demo
```

A missing or wrong key is `401`. The demo key allows **30 scans in 10 minutes**. The 31st is `429`. The limit is kept in memory and resets when the server restarts. `GET /health` and `GET /v1/rules` do not use the key.

## GET /health

```bash
curl -s http://localhost:3000/health
```

```json
{ "ok": true, "rules_version": "rules_v1", "brain_version": "brain_v1" }
```

## GET /v1/rules

Returns the 16 Canada rule ids, each with `weight` (`hard` or `soft`), `family`, and `source_url`. The regex patterns are not in this response.

```bash
curl -s http://localhost:3000/v1/rules
```

## POST /v1/scan

```bash
curl -s http://localhost:3000/v1/scan \
  -H "Authorization: Bearer ask_demo" \
  -H "Content-Type: application/json" \
  -d '{"text":"send SIN on Telegram","include_brain":true}'
```

| Field | Required | What it does |
|---|---|---|
| `text` | yes | The posting or message. Max 20,000 characters. Empty text is `400`. |
| `include_brain` | no | Default `true`. `false` skips the model and sets `brain` to `null`. |
| `from_email` | no | Checked with `company_name` for a webmail address pretending to be a known brand. |
| `company_name` | no | Used only for that brand check. |

`text` that is not a string, or a body that is not JSON, is `400`.

### Verdict

Rules judge first.

| Verdict | When |
|---|---|
| `scam` | One hard hit. Score is 40 per hard hit. |
| `risky` | Soft hits only (12 each), or the rules said `unclear` and `brain.p_scam` is at least 0.75. |
| `looks_ok` | No hits, and the text has a `.ca` address, an interview, and a careers or jobs link. |
| `unclear` | Anything else. A quiet message is not a safe one. |

The score stops at 100. A hard hit stays `scam` even when the model score is low. `looks_ok` and `risky` are not changed by the model. The only model change is `unclear` → `risky`.

### Response

`send SIN on Telegram` with the brain on returns this body:

```json
{
  "verdict": "scam",
  "score": 40,
  "highlights": [
    { "span": "send SIN", "start": 0, "end": 8, "rule_id": "id.sin_early" }
  ],
  "families": ["identity_harvest"],
  "confidence": "high",
  "rules": { "hits": ["id.sin_early"], "score": 40 },
  "engine": "rules_v1+brain_v1",
  "disclaimer": "Not legal advice. Report fraud to the Canadian Anti-Fraud Centre at 1-888-495-8501.",
  "sources": {
    "id.sin_early": "https://antifraudcentre-centreantifraude.ca/scams-fraudes/job-emploi-eng.htm"
  },
  "rules_verdict": "scam",
  "brain": {
    "p_scam": 0.725164,
    "label": "scam",
    "version": "brain_v1",
    "top_ngrams": [
      { "gram": "sin", "weight": 0.21476 },
      { "gram": "on telegram", "weight": 0.118136 },
      { "gram": "send", "weight": 0.117649 },
      { "gram": " sin ", "weight": 0.097032 },
      { "gram": "sin ", "weight": 0.08991 }
    ]
  }
}
```

`rules_verdict` is the rules-only answer. `verdict` is that answer after the one allowed lift. `engine` is `rules_v1` when the brain is off or failed to load. A missing `.venv` does not turn a rules scam into an error: the rules result still comes back and `brain` is `null`.

`brain.label` is the model's own call at 0.50. It is not the product verdict.

### Brand check

This does not change `verdict`. It is an extra note when both fields are sent and the address is Gmail, Yahoo, Outlook, Hotmail, or iCloud while the company name matches a short brand list (Shopify, RBC, TD, Scotiabank, Amazon, Google, Bell, Air Canada, Service Canada).

```bash
curl -s http://localhost:3000/v1/scan \
  -H "Authorization: Bearer ask_demo" \
  -H "Content-Type: application/json" \
  -d '{"text":"Shopify is hiring. Write shopify.hr@gmail.com","from_email":"shopify.hr@gmail.com","company_name":"Shopify","include_brain":false}'
```

The rules may still mark that message `risky` because `ch.webmail_as_hr` fired. The `evidence` object only records the mismatch:

```json
{
  "webmail_as_hr": true,
  "brand_mismatch": true,
  "notes": ["Shopify is named, and the address is on gmail.com."]
}
```

A domain-age lookup and a fetch of a careers URL are not in this API.

## What is stored

Each `POST /v1/scan`, and each check from the paste page, appends one line to `logs/scans.jsonl`:

```json
{ "ts": "2026-10-15T17:00:00.000Z", "sha256": "…", "verdict": "scam", "rules_verdict": "scam", "hits": ["id.sin_early"], "brain": 0.725164 }
```

The message text is not written. `logs/` is gitignored.

## Why the model is not the judge

The brain is a TF–IDF plus logistic model trained on the 450 gold rows after `as-ca-0001`–`as-ca-0050`, plus all 1,732 EMSCAD ads. It reports `p_scam`. The Canada rules are the verdict. That is how a SIN request stays a scam when a later sentence sounds polite, and how the same text returns the same hard hit every time.
