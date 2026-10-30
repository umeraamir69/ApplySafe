# Handoff

This is the project memory for a new computer or a new Cursor chat. The old chats stay on the machine that made them. Cursor does not import those chats from GitHub. Read this file instead.

Checked 29 Oct 2026.

## Product

ApplySafe checks a Canadian job posting or recruiter message before the student replies. Verdicts are scam, risky, unclear, and looks ok. A hard rule hit is scam. Soft hits are risky. No hits and no green flags is unclear. Looks ok needs a `.ca` address, an interview, and a careers or jobs link, with no hard or soft hit.

Score: hard +40, soft +12, cap 100. Engine ids: `rules_v1` and `brain_v1`. The brain is TF–IDF plus logistic regression. It may change unclear to risky when `p_scam` is at least 0.75. It never overrides a hard hit.

Report fraud to the Canadian Anti-Fraud Centre at 1-888-495-8501. This is not legal advice and not an immigration decision.

## Where the code lives

- Rules: `data/rules/ca/`. Sixteen families. Green flags are code in the scanner, not YAML.
- Engine: `packages/engine`. Tests: `node --test --experimental-strip-types packages/engine/test/scan.test.ts`.
- Brain: `packages/brain/dist/brain_v1.joblib`. The extension copy is `apps/extension/brain.js`, rebuilt with `.venv/bin/python apps/extension/scripts/export-brain.py`.
- Site: `apps/web`, Next.js. Production is https://applysafe.vercel.app. `vercel.json` at the repo root. The brain service stays internal. Vercel sets `BRAIN_URL`.
- Extension: `apps/extension`. Load unpacked from that folder. Store package: `apps/extension/applysafe-extension-0.2.0.zip`.

## What is already public

- Site: https://applysafe.vercel.app
- Chrome Web Store: https://chromewebstore.google.com/detail/applysafe/mjgkehogloekmonnmkkmcpjnibamahjp
- Store version 0.2.0 went public on 23 Oct 2026. Publisher account `umeraamir45@gmail.com`. Item id `mjgkehogloekmonnmkkmcpjnibamahjp`.
- GitHub: https://github.com/umeraamir69/ApplySafe.git on `main`.

The extension popup is a dark review desk. Dashboard opens from the popup and has overview, scan history, trusted sites, and settings. History stays in `chrome.storage` on that computer: time, site, page title, verdict, and score. The posting text is not saved. There is no email sign-in and no paid plan.

A high wage by itself is not `pay.too_good`. That soft rule needs the high wage next to a no-skills or anyone-can-start claim. `$45,000 a year` must stay unclear.

## Leave alone unless asked

- Do not train on holdout ids `as-ca-0001`–`as-ca-0050`.
- Do not email Dr. Usama Mir. The draft is `docs/email-prof-usama.md`.
- Do not write LinkedIn posts.
- Do not move the 1 Dec 2026 launch target.
- Do not add a Gmail login, trial, or upgrade button to the extension.
- Git commit and push stay with the user unless the current chat asks for them.

## Still open

Hugging Face upload, domain-age lookup, a live careers-page check, more rules toward about 30, a live LinkedIn DOM pass, GitHub Actions, the 1 Dec blog, and a v1.0.0 tag. The public privacy page should mention the on-device scan list. That sentence is in `apps/web/app/privacy/page.tsx` and needs a production deploy to show on https://applysafe.vercel.app/privacy.
