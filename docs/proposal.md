# Project proposal: ApplySafe  
**A Canada-first job-scam detection tool for international students**

**Student:** Muhammad Umer Aamir  
Master of Applied Computing (MAC), Wilfrid Laurier University (Brantford)  
**Date:** 6 October 2026  
**Status:** My own independent project. Asking for comments only — not supervision, not a course deliverable, not funding.  
**Related courses:** Cyber Attack and Defense; data / ML coursework; full-stack practice.  
**GitHub:** [github.com/umeraamir69](https://github.com/umeraamir69) · this project: [github.com/umeraamir69/applysafe](https://github.com/umeraamir69/applysafe)  
**Related public work:** [secsentry](https://github.com/umeraamir69/secsentry) · [Urdu text-reuse demo](https://urduplagdetect.vercel.app)

---

## 1. The problem

International students and PGWP holders in Ontario are a documented target of **employment and immigration-adjacent fraud**. Typical harm is not “a wasted application.” It is:

- Early requests for a **SIN, passport, or void cheque** in Telegram / WhatsApp.
- **Interac in, crypto out** (money-mule / counterfeit-cheque patterns named by the Canadian Anti-Fraud Centre).
- **Worker-paid “LMIA” or “guaranteed job / PR”** schemes (illegal fee-shifting; CBC/IJF reporting on sold LMIAs).
- **Crypto “task / boost product” jobs** impersonating real Canadian firms (CAFC alert, May 2024).

Campus international offices (e.g. UAlberta, SAIT) and IRCC already publish checklists. Students do not open a PDF while a recruiter is waiting in chat. Generic chatbots (ChatGPT) are a poor control: they are not on the job page, they are not tested, they miss Canada-specific terms (SIN, Interac, LMIA, Service Canada), they leak the student’s message into a third-party model, and they can be talked into “this looks professional.”

**Gap:** there is no small, explainable, **Canada-specific** tool that (a) highlights *why* a message is risky and (b) can be evaluated on a public set. US browser tools that “send the JD to an LLM” do not fill that gap.

---

## 2. What I propose to build

**ApplySafe** — paste a posting or recruiter message (or scan the current tab in Chrome) → label **scam / risky / unclear / looks-ok**, with the triggering phrases highlighted.

| Layer | Role |
|---|---|
| **Rule engine** | Deterministic judge. Encodes public CAFC / IRCC / Settlement.org red flags (SIN-too-early, Interac-then-crypto, worker-paid LMIA, etc.). Unit-tested. Hard rules **cannot** be overridden by a model. |
| **Brain** | Small **TF–IDF + logistic regression** classifier for paraphrases (“pls send social for payroll”). May lift *unclear → risky* only. Not ChatGPT. |
| **Scan API** | `POST /v1/scan` — same engine as the website. |
| **Website** | Next.js paste UI, disclaimer, privacy page. |
| **Chrome extension (MV3)** | User-gesture scan on Indeed.ca / LinkedIn job view. Rules run **on device**; brain optional via API. |
| **Evidence** | Per-scan lookups only: domain age (RDAP), email vs claimed brand, one GET to a careers URL the user typed. **Not** a LinkedIn scrape. A new domain is a signal, not a verdict. |
| **ApplySafe-CA** | **500 synthetic** English (Canada) texts I write and publish (GitHub + Hugging Face, CC BY 4.0). No scraped LinkedIn, no real SINs. |

**Explicitly not:** legal or IRCC advice; a work-permit eligibility checker; bulk scraping of job boards; an LLM as the verdict.

---

## 3. What we get if it works

**For students (impact)**  
A warning *in the path* (the page / the paste box) instead of a poster. A classmate who almost sent a SIN on Telegram is the intended user story.

**For Laurier / MAC**  
A public, Canadian artefact: live URL, API, dataset, and write-up. Possible workshop for international students / career services (optional, after ethics/privacy sanity-check). Aligns with applied cybersecurity + a bit of ML.

**For me (learning and CV)**  
Security-with-a-product, not another notebook. Interview line: tested rules, small model, public API, extension, published data. I already have a secret-scanner (SecSentry) and an Urdu text-reuse demo; this is the Canada-facing security project.

**For research (modest, honest)**  
A **labelled synthetic benchmark** + an eval table: rules vs brain vs mix vs a frozen ChatGPT pass on a 50-row holdout. That is enough for a short technical report or blog, not a claim of SOTA on real dark-web chats.

---

## 4. How realistic is this?

**Realistic as a 7-week part-time build (13 Oct – 1 Dec 2026).** Public MVP on **1 December 2026**, before the Security+ exam window (7–12 Dec). I am not proposing a corpus of real victim chats, nor a production anti-fraud platform.

| In favour | Constraint |
|---|---|
| Rules map 1:1 to **public** government text — no secret data needed | Phrases go stale; scammers paraphrase (that is why a small brain exists) |
| 500 synthetic rows is a writing task, not a crawl | Must not copy official pages or live ads; quality control needed |
| EMSCAD (~18k old ads) exists to **compare** a baseline model | EMSCAD is 2012–14 and not Canadian — I will say so |
| Chrome MV3 + Vercel + sklearn are skills I already use | Chrome Web Store review can take weeks; unpacked GitHub release is the fallback |
| Scope is frozen (no Onshore, no homemade KV store, no LLM judge) | False “scam” on a real Gmail startup is the main product risk — Gmail is a *soft* signal only |

**Success bar (all five):** 500-row public set; live site; working API; eval table on a frozen holdout; extension submitted (or unpacked zip). I will not call it “AI that detects all scams.”

---

## 5. Ethics and safety

- Disclaimer on every result: not legal advice; report to the Canadian Anti-Fraud Centre (1-888-495-8501).
- No storage of ID images or raw SIN. Production logs: hash of text, not the text.
- Dataset is **synthetic** so it can be published without exposing students.
- If offered to Laurier students, I will treat it as a personal tool until you (or the appropriate office) advise on privacy/ethics.

---

## 6. Timeline (summary)

| Window | Work |
|---|---|
| 6–12 Oct 2026 | CV/GitHub sprint; first 30 gold rows if time |
| 13–26 Oct | Repo, rules, engine tests, live paste website |
| 27 Oct – 9 Nov | Public Scan API + small TF–IDF brain + holdout eval |
| 10–23 Nov | Chrome extension (submit store by 16 Nov); finish and publish 500-row set |
| 24 Nov – 1 Dec | Blog, harden, **public launch 1 Dec** |
| 7–12 Dec | Security+ exam — feature freeze |

Full calendar: [docs/plan.md](plan.md). Technical detail: [docs/research.md](research.md). The plan wins if the two schedules differ.

---

## 7. What I am asking

This is **my own project**. I am only asking whether the idea is sound and worth building. I am not asking you to supervise it or to take it on as a faculty project. If you have comments and want to talk, I can come to office hours or we can schedule a short call.

1. Is the **rules-first + small classifier** split sound, or would you suggest a different ML setup?
2. Is a **synthetic 500-row** set acceptable to publish?
3. Any **ethics / branding** issue if I mention Laurier or offer the tool to international students?
4. If the design is weak, what would you change without exploding the scope?

---

## Short references (public)

- Canadian Anti-Fraud Centre — Job fraud (incl. crypto-task alert, 30 May 2024).  
- IRCC — Protect yourself from fraud; fraud targeting newcomers.  
- Settlement.org (Ontario) — Identifying fake online jobs.  
- Vidros et al., EMSCAD, *Future Internet*, 2017.  
- CBC / IJF investigations on sold / fake LMIA job offers (2024–25).
