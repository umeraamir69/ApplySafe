# Chrome extension

Unpacked Manifest V3 extension in `apps/extension`. Rules run in the browser. The posting is not uploaded, and the brain is not called.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `apps/extension` folder.

Or pack a release from that folder. The zip already in the repo is `apps/extension/applysafe-extension-0.1.0.zip`. It contains the manifest, popup, privacy page, scanner, bundled rules, and icons. It does not contain the tests.

After a rule file in `data/rules/ca/` changes, rebuild the bundle from the repo root and reload the extension:

```bash
node --experimental-strip-types apps/extension/scripts/bundle-rules.mjs
```

That rewrites `rules.js` and `rules.json` from the YAML. The parity test fails if those files drift from the engine.

## What Scan does

Click the toolbar icon, then **Scan this page**.

| Page | What is read |
|---|---|
| LinkedIn job URL (`/jobs/`) or Indeed job page | The posting text. Indeed’s current split view uses `[data-testid='viewjob-job-content']`. Older Indeed pages still use `#jobDescriptionText`. LinkedIn uses `#job-details` and the other selectors in `content.js`. |
| LinkedIn messaging | The text you have selected, when the selection is at least 40 characters. |
| Anywhere else | The popup says to open a LinkedIn or Indeed job page. |

The three buttons in the popup (crypto-task scam, thin posting, co-op page) run the same scanner on built-in sentences. They do not read the tab and they do not use the network.

A hit is painted on the posting as a mark, with a one-line banner (`ApplySafe: Scam`, and the other three verdicts). The popup shows the verdict, the score, the highlighted sentence, the rule id, a source link, and the Canadian Anti-Fraud Centre line.

Verdicts match the engine: a hard hit is scam, soft hits are risky, a `.ca` address plus an interview plus a careers or jobs link is looks-ok, and anything else is unclear.

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the tab you clicked the icon on. |
| Hosts | `www.linkedin.com`, `www.indeed.com`, `*.indeed.com`, `ca.indeed.com`, `www.indeed.ca`, `*.indeed.ca`. |

No history, no `webRequest`, no access to every site, and no `storage`. Nothing is saved between scans.

Content scripts are limited to LinkedIn jobs, LinkedIn messaging, and Indeed. They wait until you press Scan.

## Privacy page inside the extension

`privacy.html`, linked from the popup. The scan stays on the device. Do not treat the extension as a place to store a social insurance number or a passport photo. It is not legal advice. Report fraud at 1-888-495-8501.

The website privacy page is https://applysafe.vercel.app/privacy. Locally it is http://localhost:3000/privacy while the app is running. The Chrome Web Store listing is not submitted.

## Check it

```bash
node --experimental-strip-types --test apps/extension/test/parity.test.mjs
```

That test checks four things: `rules.js` matches `rules.json`, the packed rules match `data/rules/ca/`, `scan("send SIN on Telegram")` is scam plus `id.sin_early`, and all 500 gold rows return the same verdict and the same rule ids as `packages/engine`.

The popup and the on-page marks were also opened in a browser against a local job-description fixture. A live LinkedIn tab was not part of that check. If a job page has changed its layout, select the description and scan again.
