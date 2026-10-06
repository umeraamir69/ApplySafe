# Email to Dr. Usama Mir — ON HOLD

Do not send until there is a live demo (site or `curl /v1/scan`). Then attach a fresh PDF of `proposal.html`.

---

**To:** [umir@wlu.ca](mailto:umir@wlu.ca)  
**Subject:** Insight on a student project — job-scam detection for international students (ApplySafe)

Copy everything below the line. Use your **@mylaurier.ca** address.

**Attach this (2-page proposal):**
1. Open `job-prep/applysafe-proposal.html` in Chrome.
2. File → Print → Destination: **Save as PDF** → `ApplySafe-proposal.pdf`.
3. Attach that PDF. (The editable source is `job-prep/applysafe-proposal.md`.)

---

Dear Dr. Mir,

I hope you are well. I would be grateful if you could look at a project I am building on my own this term, **ApplySafe**, and tell me whether it is worth doing. I am only asking for your comments — not for supervision.

The problem is employment and immigration-adjacent fraud aimed at international students: SIN or passport requests on Telegram, Interac/cheque mule patterns, and paid “LMIA / guaranteed job” offers. IRCC and the Canadian Anti-Fraud Centre already list these signs, but people meet the scam in the browser, not on a PDF.

Pasting the chat into ChatGPT is a weak control. It has no tests, it misses Canada-specific terms, it leaks the message, and it often treats a formal header or “signature” as proof the offer is legitimate.

I want to build a small, explainable tool:

- a **rule engine** from those public red flags (the judge);
- a **TF–IDF + logistic** model for paraphrases (a helper that cannot override a hard rule);
- **evidence checks** the user starts: domain age (RDAP), email vs claimed brand, and one fetch of a careers URL they typed — not a crawl of LinkedIn or Indeed;
- a **Scan API**, a website, and a **Chrome** scan button;
- a **500-row synthetic** Canadian dataset I would publish.

I would not scrape job boards and I would not use an LLM as the verdict. A new domain is a signal, not a finding that the company is fake.

A two-page proposal is attached. If you have comments and want to talk, I can come to your office hours or we can schedule a short call.

Thank you for your time.

Sincerely,  
Muhammad Umer Aamir  
[your @mylaurier.ca]  
[https://github.com/umeraamir69](https://github.com/umeraamir69)

---

**If he replies “send more”:** attach `applysafe-research.md` (or say you can walk through it).  
**If he has no time:** thank him; the project still proceeds as a personal build.  
**Do not** ask him to supervise or call it his project.