# ApplySafe

Canada-first checker for job and recruiter fraud aimed at international students.

Paste a posting or message, or scan the current tab, and get **scam / risky / unclear / looks-ok**, with the phrases highlighted.

**Status:** local MVP. The paste site, the scan API, the rules, the brain, and an unpacked Chrome extension run on this machine. The public site, Hugging Face upload, and Chrome Web Store submission are not done.

## What it is

- **Rules** (judge) — public CAFC / IRCC red flags (SIN too early, Interac mule, paid LMIA, and the rest). A hard hit is scam.
- **Brain** (helper) — TF–IDF + logistic. It can lift an unclear result to risky when `p_scam` is at least 0.75. It cannot cancel a hard hit.
- **API** — `GET /health`, `GET /v1/rules`, `POST /v1/scan`
- **Chrome MV3** — Scan on LinkedIn, Indeed, and Indeed.ca. Rules run on the device.
- **ApplySafe-CA** — 500 synthetic rows. The code is MIT. `data/gold/` is CC BY 4.0.

Not in this build: a live domain-age lookup, a hosted URL, or the Chrome Web Store listing.

## Run the site and the API

The request and response fields are in [docs/api.md](docs/api.md).

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000. The brain uses the repo `.venv` (`scikit-learn`). If that Python is missing, the page still returns the rules verdict.

## Vercel

`vercel.json` at the repo root is the project Vercel should import. Leave the root directory at `./`.

The public site is the `web` service (`apps/web`) on every path. The `brain` service (`packages/brain`) stays internal. The site calls it through `BRAIN_URL`, which Vercel injects. Do not set `BRAIN_URL` yourself. On this machine, with that variable unset, the page still runs the local Python brain. The demo key stays `ask_demo` unless `APPLYSAFE_DEMO_KEY` is set in the project env.

```bash
curl -s http://localhost:3000/v1/scan \
  -H "Authorization: Bearer ask_demo" \
  -H "Content-Type: application/json" \
  -d '{"text":"send SIN on Telegram","include_brain":true}'
```

The demo key allows 30 scans in 10 minutes. Set `APPLYSAFE_DEMO_KEY` to change it. Each scan appends a hash, the verdict, and the rule ids to `logs/scans.jsonl`. The message is not stored.

## Extension

Load steps, permissions, and the offline scanner are in [docs/extension.md](docs/extension.md).

1. Open `chrome://extensions` and turn on Developer mode.
2. Load unpacked and choose `apps/extension`.
3. Open a LinkedIn or Indeed job page and press Scan.

`apps/extension/applysafe-extension-0.1.0.zip` is the same folder packed for a GitHub release. The store listing still needs a public privacy URL.

## Holdout

On the frozen 50 (`as-ca-0001`–`as-ca-0050`), scam versus other:

| Caller | Precision | Recall |
|---|---:|---:|
| Rules | 1.00 | 1.00 |
| brain_v1 | 1.00 | 1.00 |
| Rules + brain | 1.00 | 1.00 |
| ChatGPT pass | 1.00 | 0.92 |

The full table, including a 346-ad EMSCAD slice the shipped brain was not allowed to memorize, is in [eval/report.md](eval/report.md).

## Docs

- [Plan](docs/plan.md) · [Research](docs/research.md) · [API](docs/api.md) · [Extension](docs/extension.md) · [Dataset howto](docs/dataset-howto.md) · [Gold card](data/gold/README.md)
- Proposal PDF: open [docs/proposal.html](docs/proposal.html) → Print → Save as PDF
- Professor email: on hold until there is a live demo (`docs/email-prof-usama.md`)

Report real fraud: [Canadian Anti-Fraud Centre](https://antifraudcentre-centreantifraude.ca) · 1-888-495-8501

## Author

[Muhammad Umer Aamir](https://github.com/umeraamir69) · MAC, Wilfrid Laurier University (Brantford)
