# How to make the data (1000 public + 500 ours)

**Yes — 1000 from public files + 500 you write. No scraping live job sites.**

Almost every Kaggle “fake job” set is the **same** EMSCAD dump under a new name. Download **once**. Do not scrape Indeed/LinkedIn/Kijiji and call it a dataset.

| Pack | n | Where | What it is |
|---|---|---|---|
| **Public-1000** | 1000 | Hugging Face `gplsi/fake_job_postings_balanced_en` (or Kaggle `shivamb/real-or-fake-fake-jobposting-prediction`) | **500 fraudulent + 500 legitimate** sampled from EMSCAD (2012–14, not Canada). License: treat as the original research set; cite Vidros et al. 2017. |
| **ApplySafe-CA** | 500 | You write | Canada / SIN / Interac / LMIA / Telegram. This is the set you **publish** as yours. |
| **Total for the brain** | 1500 | — | Train on public-1000 + 450 of yours. Hold out 50 of yours. |

Optional extras (only if the license is clear and it is **not** another EMSCAD copy): Kaggle `sohaibdevv/detecting-fake-job-postings-and-internship-scams` (1k). Open 20 rows first. If it looks AI-slop or scraped Indeed, skip it.

**Do not use:** “10k fake jobs only” sets with no real ads; Telegram dumps; anything you crawled.

Map public labels: `fraudulent=1` → `scam`, `fraudulent=0` → `looks_ok`. They have **no** `risky` / `unclear`. That is why your 500 still matter.

Keep files separate:

```text
data/public/emscad1000.jsonl    # downloaded, cited, not “ours”
data/gold/applysafe-ca.jsonl    # 500 you wrote, CC BY 4.0
```

**File:** `data/gold/applysafe-ca.jsonl`  
**One JSON object per line.** 500 lines. First **50** ids (`as-ca-0001` … `as-ca-0050`) are the **test holdout** — never train the brain on them.

---

## What one row is

| Field | What to put |
|---|---|
| `id` | `as-ca-0001` … `as-ca-0500` |
| `split` | One of: `official_scam` `news_scam` `recruiter_dm` `looks_ok` `unclear` `hard_negative` |
| `channel` | `posting` `email` `sms` `telegram` `whatsapp` |
| `text` | The ad or message **you invented** (2–20 sentences) |
| `label` | `scam` `risky` `unclear` `looks_ok` |
| `families` | List: `money_out` `mule` `identity_harvest` `channel` `process` `crypto_task` `immigration_doc` `none` |
| `rule_ids_expected` | Which rules should fire, e.g. `["id.sin_early"]`. Empty `[]` if none. |
| `source_type` | Always `synthetic` for v1 |
| `notes` | Why you labelled it that way (for you, not for the model) |

**Never in `text`:** real SIN, real phone, real classmate name, real company HR email, copy-paste of a live Indeed ad, copy-paste of a CAFC paragraph.

Use fake orgs: `Maple Desk Ltd`, `Northlake Retail`, `fakehr@mail.test`.

---

## What the 500 rows include

| split | n | label | What you write |
|---|---|---|---|
| `official_scam` | 120 | `scam` | CAFC/IRCC patterns in **your** words: SIN too early, Interac then Bitcoin, pay LMIA, mystery shopper cheque, crypto “boost tasks,” fake IRCC |
| `news_scam` | 60 | `scam` | Same *idea* as sold-LMIA / guaranteed PR stories — new wording, no article quotes |
| `recruiter_dm` | 100 | mostly `scam` or `risky` | Short Telegram/WhatsApp/SMS: “you’re hired,” move off LinkedIn, gift cards |
| `looks_ok` | 100 | `looks_ok` | Normal junior/co-op ads: `@company.ca`, Zoom interview, no money, no SIN |
| `unclear` | 80 | `unclear` or `risky` | Silent or messy: “must be eligible to work in Canada,” Gmail + real-sounding startup, thin ad |
| `hard_negative` | 40 | `looks_ok` or `unclear` | Looks a bit spicy but is **not** a scam: payroll mentions SIN **after** a written offer; “Interac e-Transfer for **salary** on payday” from `@company.ca` |

`hard_negative` exists so the engine does not mark every use of “SIN” or “Interac” as scam.

---

## How to write (repeat this)

1. Pick the next empty id and a split that is still short of its n.  
2. Open CAFC job page or IRCC fraud page. Read **one** warning. Close it.  
3. Write a new message as if you were the scammer or a real HR person.  
4. Assign `label` from the **verbs**, not the vibe:
   - asks for **money or ID now** → `scam`
   - Telegram-only + hired with no interview, no money yet → `risky`
   - no red flag, no green process → `unclear`
   - corporate domain + named interview + no pay/ID ask → `looks_ok`
5. List the rule ids you expect. If you cannot name a rule, either add a rule later or the label is `unclear`.  
6. Paste one JSON line into the file.  
7. After every **20** rows, re-read 5 at random: no real PII, label still makes sense.

**Pace:** 30 this week if you want a head start. Then ~12/day until 500 (done by 27 Nov on the Dec-1 plan).

---

## Six templates (copy and change the words)

```json
{"id":"as-ca-0001","split":"official_scam","channel":"telegram","text":"Hi you are selected as remote data clerk for Northlake Retail. Start tomorrow. Send a photo of your SIN and student permit in this chat so payroll can be opened today.","label":"scam","families":["identity_harvest"],"rule_ids_expected":["id.sin_early","id.passport_chat","proc.no_interview_hired"],"source_type":"synthetic","notes":"SIN before any offer"}

{"id":"as-ca-0002","split":"official_scam","channel":"email","text":"Congratulations. Deposit this cheque, keep $200 as your mystery-shopper fee, and Interac the rest to our graphics vendor so we can wrap your car.","label":"scam","families":["mule"],"rule_ids_expected":["mule.cheque_split","mule.forward_funds"],"source_type":"synthetic","notes":"CAFC cheque pattern"}

{"id":"as-ca-0003","split":"news_scam","channel":"whatsapp","text":"We can lock a food-service LMIA job in Brantford. You pay 18000 CAD this week for the employer filing. PR path included. No interview needed.","label":"scam","families":["money_out","immigration_doc"],"rule_ids_expected":["pay.lmia_worker","proc.no_interview_hired"],"source_type":"synthetic","notes":"worker-paid LMIA"}

{"id":"as-ca-0004","split":"recruiter_dm","channel":"sms","text":"Saw your resume online. Easy product-boost tasks 400 a day. Install our app, then pay 80 USDT to unlock withdrawal.","label":"scam","families":["crypto_task","money_out"],"rule_ids_expected":["crypto.task_boost","pay.crypto_or_gift"],"source_type":"synthetic","notes":"CAFC crypto task"}

{"id":"as-ca-0005","split":"looks_ok","channel":"posting","text":"Maple Desk Ltd (Kitchener) is hiring a junior backend co-op for Winter 2027. Apply on mapledesk.ca/careers. First step is a 30-minute Zoom with the eng manager. We do not ask for SIN or banking until a written offer is signed. hr@mapledesk.ca","label":"looks_ok","families":["none"],"rule_ids_expected":[],"source_type":"synthetic","notes":"green flags only"}

{"id":"as-ca-0006","split":"hard_negative","channel":"email","text":"From hr@mapledesk.ca: welcome aboard. After you sign the attached offer, PeopleOps will collect your SIN for the Record of Employment and T4, as required. Interview already completed 12 Oct.","label":"looks_ok","families":["none"],"rule_ids_expected":[],"source_type":"synthetic","notes":"SIN after written offer — must NOT fire id.sin_early"}
```

Unclear example (no money, no process):

```json
{"id":"as-ca-0007","split":"unclear","channel":"posting","text":"Hiring customer support. Must be eligible to work in Canada. Email your resume to the manager. Pay competitive. Remote.","label":"unclear","families":["none"],"rule_ids_expected":[],"source_type":"synthetic","notes":"eligible-to-work is not a scam by itself"}
```

---

## What you do **not** put in the dataset

- EMSCAD rows (different file, later, for training only)  
- Real chats from friends  
- Screenshots of live LinkedIn  
- Long quotes from canada.ca  

---

## When a row is done enough to publish

You invented every sentence. No real person can be identified. `label` matches the verbs. Holdout ids 0001–0050 are marked and left out of training.
