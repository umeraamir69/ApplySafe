# ApplySafe

Canada-first checker for **job and recruiter fraud** aimed at international students.

Paste a posting or message (or scan the current tab) → **scam / risky / unclear / looks-ok**, with the phrases highlighted.

**Status:** in progress (public MVP this term). Not legal or IRCC advice.

## What it is
- **Rules** (judge) — public CAFC / IRCC red flags (SIN too early, Interac mule, paid LMIA, …)
- **Brain** (helper) — TF–IDF + logistic for paraphrases; cannot override a hard rule
- **Evidence** — domain age (RDAP), email vs claimed brand, one GET to a careers URL *you* type
- **API** — `POST /v1/scan`
- **Chrome MV3** — user-gesture scan; rules run on the device
- **ApplySafe-CA** — 500 synthetic rows, to be published (CC BY 4.0)

**Not:** LinkedIn/Indeed scrape. Not ChatGPT as the verdict. A new domain is a signal, not “the company is fake.”

## Links
- Proposal and plan live in the student’s job-prep notes until the first release
- Report real fraud: [Canadian Anti-Fraud Centre](https://antifraudcentre-centreantifraude.ca) · 1-888-495-8501

## Author
[Muhammad Umer Aamir](https://github.com/umeraamir69) · MAC, Wilfrid Laurier University (Brantford)
