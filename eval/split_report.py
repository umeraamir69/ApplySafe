"""Audit the brain split and score rules, brain, and mix on held-out text.

brain_v1 stays as trained (gold 450 + all 1,732 EMSCAD). EMSCAD numbers come
from a second fit that never sees its own test slice. That second fit is not
saved over brain_v1.
"""

from __future__ import annotations

import json
import random
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "brain"))

from brain import (  # noqa: E402
    GOLD_PATH,
    EMSCAD_PATH,
    MANIFEST_PATH,
    is_holdout,
    load_jsonl,
    mix_verdict,
    predict,
    scam_bit,
)
from train import binary_counts, build_pipeline  # noqa: E402

OUT = ROOT / "eval" / "split-report-2026-10-13.json"
LABELS = ["scam", "risky", "unclear", "looks_ok"]


def tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def prf(tp: int, fp: int, fn: int) -> dict:
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def class_table(gold: list[str], pred: list[str]) -> list[dict]:
    rows = []
    for label in LABELS:
        tp = sum(g == label and p == label for g, p in zip(gold, pred))
        fp = sum(g != label and p == label for g, p in zip(gold, pred))
        fn = sum(g == label and p != label for g, p in zip(gold, pred))
        rows.append({"label": label, "support": gold.count(label), **prf(tp, fp, fn)})
    return rows


def stratified_holdout(rows: list[dict], frac: float = 0.2, seed: int = 42) -> tuple[list[dict], list[dict]]:
    rng = random.Random(seed)
    train, test = [], []
    by_label: dict[str, list[dict]] = {}
    for row in rows:
        by_label.setdefault(row["label"], []).append(row)
    for group in by_label.values():
        group = sorted(group, key=lambda row: row["id"])
        rng.shuffle(group)
        n_test = int(round(len(group) * frac))
        test.extend(group[:n_test])
        train.extend(group[n_test:])
    return train, test


def scan_verdicts(texts: list[str]) -> list[str]:
    script = """
import { readFileSync } from 'node:fs';
import { scan } from './packages/engine/src/scan.ts';
const rows = JSON.parse(readFileSync(0, 'utf8'));
process.stdout.write(JSON.stringify(rows.map((text) => {
  const result = scan(text);
  return { verdict: result.verdict, hits: result.rules.hits };
})));
"""
    proc = subprocess.run(
        ["node", "--experimental-strip-types", "-e", script],
        input=json.dumps(texts),
        text=True,
        capture_output=True,
        cwd=ROOT,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr)
    return json.loads(proc.stdout)


def main() -> None:
    gold = load_jsonl(GOLD_PATH)
    emscad = load_jsonl(EMSCAD_PATH)
    holdout = [row for row in gold if is_holdout(row["id"])]
    train_gold = [row for row in gold if not is_holdout(row["id"])]
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest_ids = set(manifest["train_ids"])
    expected_ids = {row["id"] for row in train_gold} | {row["id"] for row in emscad}
    hold_ids = {row["id"] for row in holdout}
    hold_text = {row["text"].strip() for row in holdout}
    train_text = {row["text"].strip() for row in train_gold} | {row["text"].strip() for row in emscad}

    train_token_sets = [tokens(row["text"]) for row in train_gold]
    overlaps = []
    for row in holdout:
        bag = tokens(row["text"])
        best = max(jaccard(bag, other) for other in train_token_sets)
        overlaps.append({"id": row["id"], "max_jaccard_vs_train_gold": round(best, 3)})
    overlaps.sort(key=lambda item: item["max_jaccard_vs_train_gold"], reverse=True)

    split = {
        "gold_n": len(gold),
        "holdout_n": len(holdout),
        "holdout_ids": "as-ca-0001..as-ca-0050",
        "holdout_id_overlap_with_manifest": sorted(hold_ids & manifest_ids),
        "manifest_matches_gold450_plus_all_emscad": manifest_ids == expected_ids,
        "exact_text_copies_in_train": sorted(hold_text & train_text)[:5],
        "exact_text_copy_count": len(hold_text & train_text),
        "holdout_by_label": dict(Counter(row["label"] for row in holdout)),
        "holdout_by_split": dict(Counter(row["split"] for row in holdout)),
        "train_gold_scam": sum(row["label"] == "scam" for row in train_gold),
        "train_gold_n": len(train_gold),
        "emscad_in_brain_v1_train": len(emscad),
        "highest_token_overlap": overlaps[:8],
    }

    hold_scans = scan_verdicts([row["text"] for row in holdout])
    hold_rules = [item["verdict"] for item in hold_scans]
    hold_brain = [predict(row["text"]) for row in holdout]
    hold_mix = [mix_verdict(rules, brain["p_scam"]) for rules, brain in zip(hold_rules, hold_brain)]
    hold_gold_labels = [row["label"] for row in holdout]
    hold_y = np.array([scam_bit(label) for label in hold_gold_labels])
    brain_hat = np.array([1 if item["p_scam"] >= 0.5 else 0 for item in hold_brain])
    rules_hat = np.array([1 if verdict == "scam" else 0 for verdict in hold_rules])
    mix_hat = np.array([1 if verdict == "scam" else 0 for verdict in hold_mix])
    majority_hat = np.zeros(len(holdout), dtype=int)

    gold_report = {
        "n": len(holdout),
        "what": "Frozen ApplySafe-CA ids as-ca-0001 through as-ca-0050. Not used to fit brain_v1.",
        "binary_scam_vs_other": {
            "majority_not_scam": binary_counts(hold_y, majority_hat),
            "rules": binary_counts(hold_y, rules_hat),
            "brain_v1_at_0.5": binary_counts(hold_y, brain_hat),
            "mix": binary_counts(hold_y, mix_hat),
        },
        "four_class": {
            "rules": class_table(hold_gold_labels, hold_rules),
            "mix": class_table(hold_gold_labels, hold_mix),
        },
        "brain_p_scam_by_gold_label": {
            label: {
                "n": len(vals),
                "min": round(min(vals), 4),
                "max": round(max(vals), 4),
            }
            for label, vals in (
                (label, [item["p_scam"] for item, row in zip(hold_brain, holdout) if row["label"] == label])
                for label in LABELS
            )
            if vals
        },
        "mix_lifts": sum(mixed != rules for mixed, rules in zip(hold_mix, hold_rules)),
        "rules_verdict_counts": dict(Counter(hold_rules)),
    }

    emscad_train, emscad_test = stratified_holdout(emscad, frac=0.2, seed=42)
    diagnostic = build_pipeline()
    fit_rows = train_gold + emscad_train
    diagnostic.fit(
        [row["text"] for row in fit_rows],
        np.array([scam_bit(row["label"]) for row in fit_rows], dtype=np.int8),
    )
    test_text = [row["text"] for row in emscad_test]
    test_y = np.array([scam_bit(row["label"]) for row in emscad_test], dtype=np.int8)
    diag_p = diagnostic.predict_proba(test_text)[:, 1]
    shipped_p = np.array([predict(text)["p_scam"] for text in test_text])
    emscad_scans = scan_verdicts(test_text)
    emscad_rules = [item["verdict"] for item in emscad_scans]
    emscad_hits = [item["hits"] for item in emscad_scans]
    rules_em = np.array([1 if verdict == "scam" else 0 for verdict in emscad_rules])

    emscad_report = {
        "what": "Real EMSCAD ads, 2012–2014, mostly not Canadian. 20% stratified by label, seed 42, held out of a second fit.",
        "n_test": len(emscad_test),
        "n_test_scam": int(test_y.sum()),
        "n_test_looks_ok": int((test_y == 0).sum()),
        "n_fit": len(fit_rows),
        "fit": "ApplySafe-CA 450 + EMSCAD train slice. Gold holdout excluded. This fit is not brain_v1.",
        "diagnostic_brain_at_0.5": binary_counts(test_y, (diag_p >= 0.5).astype(np.int8)),
        "shipped_brain_v1_on_same_slice_but_those_rows_were_in_its_training": binary_counts(
            test_y, (shipped_p >= 0.5).astype(np.int8)
        ),
        "canada_rules_on_same_slice": binary_counts(test_y, rules_em),
        "rules_verdict_counts": dict(Counter(emscad_rules)),
        "rows_with_any_rule_hit": sum(bool(hits) for hits in emscad_hits),
        "diagnostic_p_scam": {
            "scam_min": round(float(diag_p[test_y == 1].min()), 4),
            "scam_max": round(float(diag_p[test_y == 1].max()), 4),
            "legit_min": round(float(diag_p[test_y == 0].min()), 4),
            "legit_max": round(float(diag_p[test_y == 0].max()), 4),
        },
    }

    report = {
        "date": "2026-10-13",
        "split": split,
        "gold_holdout": gold_report,
        "emscad_held_out": emscad_report,
        "bar": {"precision_scam": 0.90, "recall_scam": 0.80},
    }
    OUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    printable = json.loads(json.dumps(report))
    printable["split"]["highest_token_overlap"] = printable["split"]["highest_token_overlap"][:3]
    print(json.dumps(printable, indent=2))


if __name__ == "__main__":
    main()
