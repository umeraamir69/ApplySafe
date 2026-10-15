# Holdout report — 13–15 October 2026

Scam versus every other label. The bar is precision at least 0.90 and recall at least 0.80.

The frozen test is ApplySafe-CA `as-ca-0001` through `as-ca-0050` (24 scam, 6 risky, 6 unclear, 14 looks-ok). Those ids were not used to fit the brain. Nothing in them is an exact copy of a training sentence.

## Frozen 50

| Caller | Precision | Recall | TP | FP | FN | TN |
|---|---:|---:|---:|---:|---:|---:|
| Majority (always not scam) | 0.00 | 0.00 | 0 | 0 | 24 | 26 |
| Rules | 1.00 | 1.00 | 24 | 0 | 0 | 26 |
| brain_v1 at 0.50 | 1.00 | 1.00 | 24 | 0 | 0 | 26 |
| Rules + brain mix | 1.00 | 1.00 | 24 | 0 | 0 | 26 |
| ChatGPT pass, 13 Oct 2026 | 1.00 | 0.92 | 22 | 0 | 2 | 26 |

The mix never changed a verdict on these 50. Unclear rows scored at most 0.42, and the lift needs 0.75. A hard hit stays scam.

ChatGPT matched 46 of 50 labels. It called `as-ca-0011` and `as-ca-0029` risky. Both ask for a passport photo now, with no interview. Gold and the rules say scam. The model name for that pass was not recorded. Labels were not attached to the prompt. The prompt did include the four label definitions.

Six of the 50 share at least 40% of their word tokens with a training row. The closest pair is `as-ca-0047` and `as-ca-0398` at 0.64. The perfect rules and brain scores are on text from the same writing pass.

## Real ads the shipped brain was not scored on fairly

brain_v1 was fit on all 1,732 EMSCAD ads, so those ads are not its test. A second fit held out 346 ads (173 scam, 173 legitimate, seed 42) and never saw them.

| Caller | Precision | Recall | TP | FP | FN | TN |
|---|---:|---:|---:|---:|---:|---:|
| Canada rules | 0.69 | 0.35 | 60 | 27 | 113 | 146 |
| Second brain, unseen ads | 0.93 | 0.89 | 154 | 12 | 19 | 161 |
| brain_v1 on ads it already fit | 1.00 | 0.97 | 168 | 0 | 5 | 173 |

The second brain clears the bar on those 2012–2014 ads. The Canada rules do not, which fits a file that is mostly not Canadian. The brain_v1 row is memorization, not a test.

Numbers are in `eval/split-report-2026-10-13.json` and `eval/chatgpt50.json`.
