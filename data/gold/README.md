# ApplySafe-CA

Synthetic English messages about Canadian job and recruiter fraud. This is a benchmark the author wrote. It is not a dump of real victim chats, not a scrape, and not an official file from CAFC or IRCC.

## Citation

Aamir, M. U. (2026). *ApplySafe-CA: synthetic Canadian job-scam texts* (Version 1) [Data set].

**Author:** Muhammad Umer Aamir, Master of Applied Computing, Wilfrid Laurier University (Brantford).  
**Written:** 7 October 2026. Personal project. Not a faculty dataset and not a course deliverable.  
**License:** CC BY 4.0 for this JSONL when it is published.  
**Language:** English.

## How it was made

The author wrote all 500 messages. Each one starts from a public pattern (SIN asked too early, Interac then crypto, a cheque you are told to split, a worker-paid LMIA, a crypto task fee, a normal co-op ad, a thin ad, or a hard negative). The sentences are new. Government pages were not copied in. No live job ad was copied in. No real SIN, phone number, or classmate appears.

Labels were set by the same person, at the time of writing, from what the message does:

| Label | Rule used while writing |
|---|---|
| scam | The message asks for money or identity now. |
| risky | A soft signal only (Telegram-only, hired with no interview, pay that is too high). |
| unclear | No red-flag verb and no real hiring process. |
| looks-ok | A company domain plus a named interview, and no payment or identity ask. |

There is one annotator. Nobody else relabelled the file. `rule_ids_expected` is the author's note of which future rule should fire. It was not given to the model as an input.

## Files and split

`applysafe-ca.jsonl` — 500 lines, `as-ca-0001` through `as-ca-0500`.

| Split | n | Labels |
|---|---|---|
| official_scam | 120 | scam |
| news_scam | 60 | scam |
| recruiter_dm | 100 | 65 scam, 35 risky |
| looks_ok | 100 | looks-ok |
| unclear | 80 | 54 unclear, 26 risky |
| hard_negative | 40 | 36 looks-ok, 4 unclear |

**Holdout:** `as-ca-0001`–`as-ca-0050` (10% of each split). Do not train on these ids.  
**Train pool:** `as-ca-0051`–`as-ca-0500`.

## Early text check (7 Oct 2026)

TF–IDF (word plus character 3–5 grams) and logistic regression. Scam versus everything else. Tested only on the 50 holdout rows. Full numbers: `eval/text-baseline-2026-10-07.json`.

| Model | Trained on | Precision on scam | Recall on scam |
|---|---|---|---|
| Majority class | — | 0.00 | 0.00 |
| Same model | EMSCAD balanced, 1,732 real 2012–14 ads | 0.50 | 0.92 |
| Same model | These 450 train rows | 1.00 | 1.00 |

The EMSCAD model marks 22 of the 26 non-scam holdout rows as scam. It does not know a normal Canadian co-op ad. The model trained on ApplySafe-CA separates all 50 holdout rows, including risky versus unclear. The words it uses are the ones the rows were written around (`lmia`, `usdt`, `cheque`, `you pay` versus `.ca` and `careers`). That is evidence the file is internally consistent. It is not evidence the same model would catch a live Telegram chat. The December eval still has to run the real rule engine on this holdout.

## What a publisher should say

Say it is synthetic, name the author and the date, point at the label rules above, name the holdout ids, and say EMSCAD is a different file. A new domain or a `.ca` address in these rows is a writing choice for the label, not a finding about a real company.
