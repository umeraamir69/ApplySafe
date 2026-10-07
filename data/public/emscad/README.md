# EMSCAD baseline (not ApplySafe-CA)

Public job ads used only to train and compare the brain. This is not the Canadian dataset, and it is not published as ours.

## Source

Employment Scam Aegean Dataset (EMSCAD). Vidros, Kolias, Kambourakis, and Akoglu, “Automatic Detection of Online Recruitment Frauds: Characteristics, Methods, and a Public Dataset,” *Future Internet* 9(1):6, 2017. [https://doi.org/10.3390/fi9010006](https://doi.org/10.3390/fi9010006)

Mirror used: Kaggle `shivamb/real-or-fake-fake-jobposting-prediction` (`fake_job_postings.csv`), via the public GitHub copy at `abbylmm/fake_job_posting`. Original lab page: [http://emscad.samos.aegean.gr/](http://emscad.samos.aegean.gr/).

Downloaded 6 October 2026. The raw CSV (17,880 rows, about 48 MB) stays on disk as `fake_job_postings.csv` and is gitignored. The file we keep is the balanced extract.

## What we kept

| | n |
|---|---|
| Original file | 17,880 |
| Fraudulent (`fraudulent=1`) | 866 — **all of them** |
| Legitimate in the original file | 17,014 |
| Legitimate kept | 866, drawn with seed `42` from sorted `job_id`s |
| **Training file** | **1,732** |

`emscad-balanced.jsonl` — one JSON object per line. `label` is `scam` or `looks_ok`. `pool` is `fraudulent_all` or `legitimate_matched`.

Repeated fraud descriptions were kept (83 description groups, 321 rows). The decision was every fraudulent ad, including copies of the same template.

## What the counts say

Fraud is 4.8% of the original file, and 730 of the 866 fraudulent ads are coded `US`. Canada (`CA`) has 457 ads and **12** fraudulent ones. Whole-word search finds **zero** fraudulent ads mentioning SIN, social insurance, Interac, LMIA, Telegram, or e-transfer.

The useful internal signals are structural: fraudulent ads more often lack a company profile (67.8% vs 16.0%) and a company logo (67.3% vs 18.1%). Oil & Energy is the sharp industry cell (109 fraudulent of 287 ads, 38.0%).

The seed-42 legitimate draw matches the full legitimate pool within about one percentage point on logo, screening questions, telecommuting, and missing salary.

ApplySafe-CA (the 500 rows we write) is still the set that carries Canada. This file teaches generic 2012–2014 job-ad wording.
