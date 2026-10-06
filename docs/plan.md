# ApplySafe — complete build and publish plan

**Start code:** 13 Oct 2026 (after this week’s CV/GitHub sprint).  
**Launch:** **1 December 2026.**  
**After launch:** Security+ 7–12 Dec. Dataset polish / store approval can continue, but the **public MVP is live on 1 Dec.**  
**Spec:** `applysafe-research.md`.  
**Repo:** `github.com/umeraamir69/applysafe` (create 13 Oct).  
**Do not scrape LinkedIn, Indeed, Facebook, or Telegram.**

When time is short: Coursework > Applications > NeetCode minimum > Security+ study > **this week’s ApplySafe box only**.

**Launch on 1 Dec means all of these are public**

1. Live website (paste → verdict + highlights).  
2. Working `POST /v1/scan` (rules + brain).  
3. ApplySafe-CA **v1** on GitHub + Hugging Face (**500 rows**).  
4. Eval table on a 50-row holdout.  
5. Chrome extension **unpacked zip** on GitHub Releases; store **submitted** (approval may slip past 1 Dec — that is OK).  
6. Short blog + LinkedIn launch post.

SecSentry extras (Action, GIF) shrink to **one weekend (18–19 Oct)** or wait until after the exam. Do not let them steal November.

---

## What “data available” means

| Source | Action | Allowed |
|---|---|---|
| CAFC / IRCC / Settlement.org / campus pages | Phrases → `data/rules/ca/*.yml` + `source_url` | Yes |
| EMSCAD (Kaggle) | Download once; cite; do not claim it is Canadian | Yes |
| ApplySafe-CA | You write **500** rows | Yes |
| One live ad pasted by hand to test the UI | Yes |
| Bulk scrape / unofficial APIs | **No** |

**Quota:** Download **Public-1000** in week 1 (HF balanced EMSCAD: 500 fake + 500 real). Write **500** ApplySafe-CA by **27 Nov**. Hold out **50** of *yours* from day one. ~12 written rows/day. Do not scrape job boards.

```text
{"id":"as-ca-0001","split":"official_scam","channel":"telegram","text":"...","label":"scam","families":["identity_harvest"],"rule_ids_expected":["id.sin_early"],"source_type":"synthetic","notes":""}
```

| Split | n |
|---|---|
| Official-pattern scams | 120 |
| News-pattern scams | 60 |
| Recruiter DMs | 100 |
| Looks-ok | 100 |
| Unclear / soft | 80 |
| Hard negatives | 40 |
| **Total** | **500** |

---

## Calendar (13 Oct → 1 Dec)

### This week · 6–12 Oct · Setup only (no full app)

- [ ] Export 1-page CVs; GitHub clean (still the sprint).
- [ ] Read CAFC job page + IRCC fraud hub.
- [ ] Optional: write **30** gold rows in a notes file so week 1 is faster.
- [ ] Do **not** miss NeetCode minimum.

---

### Week 1 · 13–19 Oct · Repo, data, engine

- [ ] Create public repo. MIT code, CC BY 4.0 for `data/gold/`.
- [ ] Download EMSCAD. `data/emscad/README.md` with citation.
- [ ] **20 hard rules** in YAML (SIN, Interac, LMIA, crypto, cheque, IRCC impersonation).
- [ ] Engine: scan → hits, highlights, score, verdict.
- [ ] Unit tests: one fixture per hard rule. CI green.
- [ ] Gold → **80** (include the 50 holdout ids now).
- [ ] Sat 18 Oct: SecSentry Action **or** skip if engine is not green.
- [ ] LinkedIn #1 (building in public — Dec 1 date).

**Exit:** `engine.scan("send SIN on Telegram")` → `scam` + `id.sin_early`.

---

### Week 2 · 20–26 Oct · Eval + website

- [ ] `eval/run`: precision/recall on the 50 holdout (rules-only).
- [ ] Next.js paste UI + disclaimer + 3 demos. Deploy Vercel.
- [ ] Privacy page.
- [ ] Gold → **160**. Rules → ~30 (soft + green).
- [ ] LinkedIn #2: live paste GIF.

**Exit:** Phone can open the site.

---

### Week 3 · 27 Oct – 2 Nov · API

- [ ] `POST /v1/scan`, `GET /health`, `GET /v1/rules`.
- [ ] Demo key, rate limit, log `sha256(text)` only.
- [ ] Landing `curl` example.
- [ ] Gold → **240**.
- [ ] LinkedIn #3: curl screenshot.

**Exit:** Stranger can curl and get a rule id.

---

### Week 4 · 3–9 Nov · Brain + more data

- [ ] Train TF–IDF + logistic on (gold minus 50) + EMSCAD.
- [ ] API returns `brain.p_scam`. Brain cannot override a hard rule.
- [ ] Evidence v1: RDAP domain age + email/domain vs brand list + optional one GET to user-given `company_site`. No LinkedIn fetch.
- [ ] Freeze ChatGPT answers on the 50 (`eval/chatgpt50.json`) — one manual pass.
- [ ] `eval/report.md`: rules vs brain vs mix vs ChatGPT.
- [ ] Gold → **340**.
- [ ] LinkedIn #4: comparison table.

**Exit:** `/v1/scan` returns `rules` + `brain`.

---

### Week 5 · 10–16 Nov · Extension + submit store

- [ ] Chrome MV3: Indeed.ca + LinkedIn job view. Scan button. Rules **offline**.
- [ ] Optional “use brain” → API.
- [ ] Privacy policy = Vercel page. Tiny permissions.
- [ ] Screenshots. **Submit Chrome Web Store by 16 Nov.**
- [ ] Gold → **420**.
- [ ] LinkedIn #5: Indeed GIF.

**Exit:** Unpacked works. Store submitted.

---

### Week 6 · 17–23 Nov · 500 rows + HF + harden

- [ ] Gold → **500**. PII spot-check.
- [ ] Hugging Face `umeraamir69/applysafe-ca` + dataset card.
- [ ] API keys, OWASP notes, README diagram + eval table.
- [ ] Pin repo.
- [ ] LinkedIn #6: dataset published.

**Exit:** 500 live on HF.

---

### Week 7 · 24–30 Nov · Blog + launch dry run

- [ ] Write blog (`blog/2026-12-applysafe.md`) → Dev.to / Hashnode.
- [ ] Fix whatever is broken on the live site.
- [ ] Release `v1.0.0` (site, API, unpacked zip, data-v1).
- [ ] Draft LinkedIn #7 (launch). Do not post until 1 Dec.
- [ ] Security+ review still happens this week (Domain 5 / practice). Do not skip.

**Exit:** Ready to flip “public” on 1 Dec.

---

### 1 Dec 2026 · Launch day

- [ ] Post LinkedIn #7 + blog link.
- [ ] Tweet/X optional. One email to Dr. Mir: “MVP is live, thank you for any earlier comments.”
- [ ] Optional one-paragraph note to Laurier international / career — only if he was OK with campus mention.
- [ ] Update CVs with the live URL.

### 2–6 Dec · Freeze features

- [ ] Security+ final practice. Hotfix only if the site is down.
- [ ] Chrome store: if approved, post a 1-line update. If not, unpacked zip stays the launch.

### 7–12 Dec · Exam

No ApplySafe features.

---

## Blog (write 24–30 Nov, publish 1 Dec)

**Title:** ApplySafe: a Canada job-scam checker that is not a ChatGPT wrapper  
**Length:** 900–1200 words.

1. Who gets hurt (SIN, Interac, LMIA).  
2. Why ChatGPT is a weak control.  
3. Rules (judge) + brain (helper) + API + extension.  
4. ApplySafe-CA 500 + EMSCAD as old baseline.  
5. Holdout table.  
6. How to try it.  
7. Not legal advice. CAFC number.

---

## LinkedIn (post after that week’s exit)

**#1 · 19 Oct** — Building ApplySafe for a **1 Dec** public launch. Canada job/recruiter fraud (SIN, Interac, paid LMIA). Rules first. No LinkedIn scrape. Synthetic dataset will be public.

**#2 · 26 Oct** — Paste demo is live: [url]. Highlights, not a vibe score.

**#3 · 2 Nov** — `POST /v1/scan`. We log a hash, not the text.

**#4 · 9 Nov** — Brain added. It cannot override a hard SIN rule. Table on 50 holdout rows.

**#5 · 16 Nov** — Chrome scan on Indeed.ca. Submitted to the Web Store. Unpacked zip on GitHub.

**#6 · 23 Nov** — ApplySafe-CA v1: 500 synthetic rows. Hugging Face: [link].

**#7 · 1 Dec · Launch** — Site, API, dataset, extension (store or unpacked). Blog: [link]. If a recruiter asks for your SIN on Telegram, that is the product.

---

## Hours

| Day | ApplySafe | Do not cut |
|---|---|---|
| Mon Tue Thu | 1.5 hr (was Security+ only — split 45/45 if behind on SY0-701) | NeetCode 1 |
| Wed | 0 (THM or rest) | — |
| Fri | 1 hr if applications are done | 5–10 apps in Oct |
| Sat | 3 hr project | — |
| Sun | Checkboxes + 15 gold rows | — |

Behind one week → cut SecSentry GIF, not the API.  
Behind two weeks → launch **rules-only** brain-less API, still 500 rows, still the site. Brain becomes a 15 Dec hotfix. **Do not move launch past 1 Dec.**

---

## Out of scope

Onshore, minikv, ChatGPT as judge, LinkedIn scrape, Legal RAG, mini-SIEM, mobile, waiting for Chrome approval before launch.
