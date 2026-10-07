# ApplySafe — project plan

**Owner:** Muhammad Umer Aamir · MAC, Wilfrid Laurier (Brantford)  
**Status:** planning week. Docs and empty folders only.  
**Code starts:** 13 October 2026  
**Public launch:** 1 December 2026  
**Feature freeze:** 2 December 2026 through the Security+ window (7–12 December)  
**This document** is the schedule. Technical detail lives in [research.md](research.md). How to write rows lives in [dataset-howto.md](dataset-howto.md).

When this plan and research §12 disagree, follow this plan. Research §12 is the older six-week sketch.

---

## 1. What “done” means on 1 December

A stranger can open the site, paste a recruiter message, and see **scam / risky / unclear / looks-ok** with the triggering phrases highlighted. The same engine answers `POST /v1/scan`. Hard rules are the judge. A small model can only raise an unclear result toward risky. It cannot cancel a hard hit.

All six of these are public that day:

| # | Gate | Proof |
|---|---|---|
| 1 | Website | Phone can open the paste page. Three demos work. Disclaimer is on every result. |
| 2 | API | `POST /v1/scan` returns rule hits and, if the brain shipped, `brain.p_scam`. |
| 3 | Dataset | ApplySafe-CA v1: **500** synthetic rows on GitHub and Hugging Face (CC BY 4.0). |
| 4 | Eval | Table on the frozen 50-row holdout, in the README. |
| 5 | Extension | Unpacked zip on GitHub Releases. Chrome Web Store **submitted** by 16 Nov. Store approval may land after 1 Dec. |
| 6 | Write-up | Blog live. LinkedIn launch post. |

A rules-only API still counts as a launch if the brain slips. Moving the date past 1 December does not.

---

## 2. Product

Paste a posting or message, or press Scan on the current tab.

| Verdict | When |
|---|---|
| `scam` | One hard hit on money or identity (SIN now, pay the LMIA, Interac then crypto, cheque mule, IRCC impersonation). |
| `risky` | Soft hits stack up, or the brain lifts an unclear text (`p_scam ≥ 0.75`). |
| `unclear` | No hard hit and no green flags. Silence is not “safe.” |
| `looks-ok` | Green flags present (corporate domain, named interview, careers URL) and no hard or soft hit. |

Score: hard hit +40, soft hit +12. Evidence (young domain, brand mismatch, careers page miss) is soft and never a verdict by itself. A new domain is a signal. Logs store `sha256(text)`, verdict, and rule ids. Raw text, SIN, and passport images are not stored.

**In scope for 1 Dec:** TypeScript rule engine, YAML rules with `source_url`, Next.js paste UI, privacy page, public scan API with a demo key and rate limit, TF–IDF + logistic brain, evidence v1 (RDAP, email vs brand, one GET to a careers URL the user typed), Chrome MV3 with rules on the device, 500-row set, holdout eval, blog.

**After 1 Dec:** login and saved scans, user API keys, batch scan, an explain endpoint that only restates fired rules, Corporations Canada / Job Bank / ATS lookups, Gmail scanning.

**Out of scope:** LinkedIn, Indeed, Facebook, or Telegram scraping. ChatGPT or any LLM as the verdict. Onshore (work-permit eligibility). A mobile app. Waiting for Chrome Web Store approval before calling it launched. Legal or IRCC advice.

---

## 3. How a scan works

```text
text (+ optional email, company name, careers URL)
        │
        ▼
   rules (judge) ── hard hit ──────────────► scam
        │
        ▼ no hard hit
   brain (helper) ── unclear and p ≥ 0.75 ► risky
        │
        ▼
   evidence (signals only; never overrides a hard rule)
        │
        ▼
   verdict + highlights + disclaimer
```

```text
packages/engine/      TypeScript rules, score, highlights
packages/brain/       train script; exported model the API loads
packages/evidence/    RDAP, brand check, one careers GET
apps/web/             Next.js paste UI
apps/api/             GET /health, GET /v1/rules, POST /v1/scan
apps/extension/       MV3; rules local; brain only if the user asks
data/rules/ca/        YAML
data/gold/            ApplySafe-CA jsonl
data/public/          EMSCAD download + citation (not “ours”)
eval/                 holdout runner and report
```

Code is MIT. `data/gold/` is CC BY 4.0. Repo already exists: `github.com/umeraamir69/ApplySafe` (`origin` on `main`). Commits and pushes are yours; the agent does not run them.

---

## 4. Rules to ship

Catalogue is in research §9. Week 1 implements that list, not a longer one.

**Hard (week 1, each with a fixture):** `pay.upfront_fee`, `pay.lmia_worker`, `pay.crypto_or_gift`, `mule.forward_funds`, `mule.cheque_split`, `id.sin_early`, `id.passport_chat`, `gov.impersonate`, `crypto.task_boost`.

**Soft and green (week 1 starts them, week 2 finishes ~30 total, cap ~40):** Telegram/WhatsApp-only, webmail pretending to be a brand, hired with no interview, pay that is too good, CAFC classic titles (mystery shopper, car wrap), plus green flags for looks-ok (`ok.corporate_domain`, `ok.interview_named`, `ok.careers_page_mentioned`, `ok.no_money_no_id`).

`id.sin_early` must not fire when the SIN is requested after a written offer. That is what the hard-negative rows are for.

---

## 5. Data

| Pack | n | Role |
|---|---|---|
| ApplySafe-CA | 500 written | The set we publish. Canada: SIN, Interac, LMIA, Telegram. |
| Holdout | first 50 ids, `as-ca-0001`–`as-ca-0050` | Frozen on day one. Never used to train. |
| EMSCAD balanced | all 866 fraudulent + 866 legitimate | Train and compare the brain. The original file is 17,880 ads (2012–14, not Canadian). Cite Vidros et al. 2017. |

| Split | n | Label |
|---|---|---|
| Official-pattern scams | 120 | scam |
| News-pattern scams | 60 | scam |
| Recruiter DMs | 100 | scam or risky |
| Looks-ok | 100 | looks-ok |
| Unclear | 80 | unclear or risky |
| Hard negatives | 40 | looks-ok or unclear |
| **Total** | **500** | |

Every sentence is invented. No real SIN, phone, classmate, HR inbox, live ad, or copied government paragraph. Fake orgs only (`Maple Desk Ltd`, `hr@mapledesk.ca`).

Running total: 30 optional this week, then 80 → 160 → 240 → 340 → 420 → **500 by 27 November**. About 12 new rows on a build day, 15 on Sunday. Holdout ids are reserved in week 1 even if the text is filled later.

Eval bar on the 50, before launch: precision on scam ≥ 0.90, recall on scam ≥ 0.80, mix recall at least as high as rules-only, precision still ≥ 0.90. One unit test per hard rule.

---

## 6. Schedule

Priority when the day is short: **coursework → applications → NeetCode minimum → Security+ → this week’s ApplySafe box only.**

| Day | ApplySafe |
|---|---|
| Mon, Tue, Thu | 1.5 hr (split 45/45 with SY0-701 if that is behind) |
| Wed | 0 |
| Fri | 1 hr after applications |
| Sat | 3 hr |
| Sun | close the week’s checkboxes and write 15 gold rows |

### This week · 6–12 Oct · setup

No app. No repo yet.

- [ ] One-page CVs exported. GitHub profile cleaned (pinned repos, no empty noise).
- [ ] Read the CAFC job-fraud page and the IRCC fraud hub. Write a phrase list in a notes file (SIN, Interac, LMIA, cheque, crypto task). YAML comes next week.
- [ ] Optional: **30** gold rows in that notes file, using the templates in dataset-howto. Include a few holdout-shaped ids so week 1 is typing, not inventing.
- [ ] NeetCode minimum still happens.
- [ ] Leave the email to Dr. Mir unsent until a live demo exists (`email-prof-usama.md`).

**Exit:** phrase list exists. CV/GitHub sprint is done. Zero application code.

### Week 1 · 13–19 Oct · engine

- [ ] Repo already exists (`umeraamir69/ApplySafe`). Add the MIT license and note CC BY 4.0 on `data/gold/`. You commit and push.
- [x] EMSCAD balanced file is in `data/public/emscad/` (done 6 Oct 2026): all 866 fraudulent ads plus 866 legitimate ads, seed `42`. Citation is in `data/public/emscad/README.md`. Raw CSV is local and gitignored.
- [ ] Hard rules above, plus the first soft and green rules, in `data/rules/ca/*.yml` with `source_url`.
- [ ] `engine.scan` returns hits, highlights, score, verdict.
- [ ] One fixture test per hard rule. CI green.
- [ ] Gold at **80**, holdout ids reserved.
- [ ] Saturday 18 Oct: SecSentry Action **or** skip it if the engine is not green. Do not spend the weekend on a GIF.
- [ ] LinkedIn #1 after the exit, not before.

**Exit:** `engine.scan("send SIN on Telegram")` → `scam` + `id.sin_early`.

### Week 2 · 20–26 Oct · site

- [ ] `eval/run` on the 50 holdout, rules only. Record the numbers even if they miss the bar.
- [ ] Next.js: paste box, disclaimer, three demos (scam, unclear, looks-ok). Deploy on Vercel.
- [ ] Privacy page (the extension will point at it).
- [ ] Rules toward ~30. Gold at **160**.
- [ ] LinkedIn #2: paste demo.

**Exit:** the site opens on a phone and a crypto-task sample highlights.

### Week 3 · 27 Oct – 2 Nov · API

- [ ] `GET /health`, `GET /v1/rules`, `POST /v1/scan`.
- [ ] Demo key, rate limit (demo key tight; keyed route 30 requests / 10 minutes).
- [ ] Log hash, verdict, rule ids. Never the text.
- [ ] Landing page shows a `curl` example.
- [ ] Gold at **240**.
- [ ] LinkedIn #3: curl screenshot.

**Exit:** someone else can curl a message and get a rule id back.

### Week 4 · 3–9 Nov · brain and evidence

- [ ] Train TF–IDF (word + char 3–5 grams) + logistic regression on gold minus the 50, plus the EMSCAD balanced file (866 + 866).
- [ ] API returns `brain.p_scam`. A hard rule still wins if the model disagrees.
- [ ] Evidence v1: RDAP domain age, email domain vs a short brand list, one GET to a user-supplied `company_site` (5s, 1 MB, no cookies). Timeout skips the check.
- [ ] One manual ChatGPT pass on the 50, frozen in `eval/chatgpt50.json`.
- [ ] `eval/report.md`: rules vs brain vs mix vs that frozen pass.
- [ ] Gold at **340**.
- [ ] LinkedIn #4: the comparison table.

**Exit:** `/v1/scan` returns `rules` and `brain`.

### Week 5 · 10–16 Nov · extension

- [ ] Chrome MV3. Scan button. Hosts: LinkedIn, Indeed, Indeed.ca. Rules run offline in the extension.
- [ ] Optional “use brain” calls the API. Offline path is rules only.
- [ ] Permissions: `activeTab`, those hosts, `storage`. No history, no webRequest, no “all sites.”
- [ ] Screenshots. **Submit the Chrome Web Store listing by 16 Nov.**
- [ ] Gold at **420**.
- [ ] LinkedIn #5: Indeed.ca scan.

**Exit:** unpacked extension works with the network off. Store submission is in.

### Week 6 · 17–23 Nov · 500 rows

- [ ] Gold at **500**. Read random rows for real PII and copied official text.
- [ ] Hugging Face `umeraamir69/applysafe-ca` and a dataset card.
- [ ] README: diagram, threat model, API, eval table, “why the model is not the judge.”
- [ ] Pin the repo.
- [ ] LinkedIn #6: dataset link.

**Exit:** 500 rows are public on Hugging Face.

### Week 7 · 24–30 Nov · launch rehearsal

- [ ] Blog draft `blog/2026-12-applysafe.md` (900–1200 words). Publish on 1 Dec, not this week.
- [ ] Fix what is broken on the live site. No new features.
- [ ] Tag `v1.0.0`: site, API, unpacked zip, data v1.
- [ ] Draft LinkedIn #7. Do not post it.
- [ ] Security+ Domain 5 / practice still happens.

**Exit:** launching is a publish step, not a build step.

### 1 Dec · launch

- [ ] Post LinkedIn #7 and the blog.
- [ ] Email Dr. Mir only if a demo is live: short note, fresh PDF of `docs/proposal.html`. Comments only. Do not ask him to supervise.
- [ ] Campus career or international office: one paragraph only if he was fine with a Laurier mention.
- [ ] Put the live URL on the CV.

### 2–12 Dec · freeze

Hotfix only if the site is down. If the store approves, one follow-up line. Security+ 7–12 Dec: no ApplySafe features.

---

## 7. If a week slips

| Slip | Cut | Keep |
|---|---|---|
| One week | SecSentry GIF, login, saved scans, batch endpoint | API and the 1 Dec date |
| Two weeks | Brain. Ship rules-only. Brain becomes a 15 Dec hotfix. | Site, API, 500 rows, unpacked extension |
| Store review runs long | — | Unpacked zip is the launch. Approval is a one-line update later. |

Do not cut the holdout, the disclaimer, or the “no scrape” rule to save a weekend.

---

## 8. Risks

| Risk | What we do |
|---|---|
| A real Gmail startup gets “scam” | Webmail is soft. Looks-ok needs green flags. Hard negatives cover SIN-after-offer. |
| Scammers paraphrase | Brain lifts unclear → risky only. Rules stay the judge. |
| Chrome Web Store rejects the listing | Tiny permissions, privacy page, unpacked zip already public. |
| EMSCAD is not Canadian | Cited as a baseline. ApplySafe-CA is the set we claim. |
| False confidence | Copy says not legal advice and prints the CAFC number: 1-888-495-8501. |
| Scope creep | Section 2 is the cap. New ideas go under “After 1 Dec.” |

---

## 9. Blog and posts

**Title:** ApplySafe: a Canada job-scam checker that is not a ChatGPT wrapper.  
Write 24–30 Nov. Publish 1 Dec.

1. Who gets hurt (SIN, Interac, paid LMIA).  
2. Why pasting the chat into ChatGPT is a weak control.  
3. Rules, brain, API, extension.  
4. ApplySafe-CA and EMSCAD as an old baseline.  
5. Holdout table.  
6. How to try it.  
7. Not legal advice. CAFC number.

LinkedIn goes out only after that week’s exit: 19 Oct, 26 Oct, 2 Nov, 9 Nov, 16 Nov, 23 Nov, and the launch post on 1 Dec. Drafts can sit in a notes file. The feed does not get a post for an unfinished week.

---

## 10. Where to look

| Question | File |
|---|---|
| Why these threats, scoring, API shape, rule ids | [research.md](research.md) |
| How to write a gold row | [dataset-howto.md](dataset-howto.md) |
| Two-page leave-behind | [proposal.md](proposal.md) · print [proposal.html](proposal.html) |
| Email, still on hold | [email-prof-usama.md](email-prof-usama.md) |
