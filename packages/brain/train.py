"""Train brain_v1. Holdout ids as-ca-0001 through as-ca-0050 are never fit."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline

from brain import (
    EMSCAD_PATH,
    GOLD_PATH,
    MANIFEST_PATH,
    MODEL_PATH,
    VERSION,
    is_holdout,
    load_jsonl,
    scam_bit,
)

EVAL_PATH = Path(__file__).resolve().parents[2] / "eval" / "brain-v1-holdout.json"


def build_pipeline() -> Pipeline:
    features = FeatureUnion(
        [
            (
                "word",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=2,
                    max_features=40_000,
                    sublinear_tf=True,
                    dtype=np.float32,
                ),
            ),
            (
                "char",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=2,
                    max_features=40_000,
                    sublinear_tf=True,
                    dtype=np.float32,
                ),
            ),
        ]
    )
    clf = LogisticRegression(
        class_weight="balanced",
        solver="liblinear",
        max_iter=1000,
        random_state=42,
    )
    return Pipeline([("features", features), ("clf", clf)])


def split_rows() -> tuple[list[dict], list[dict], list[dict]]:
    gold = load_jsonl(GOLD_PATH)
    emscad = load_jsonl(EMSCAD_PATH)
    holdout = [row for row in gold if is_holdout(row["id"])]
    train_gold = [row for row in gold if not is_holdout(row["id"])]
    if len(gold) != 500 or len(holdout) != 50 or len(train_gold) != 450:
        raise SystemExit(
            f"Gold split is {len(gold)} / holdout {len(holdout)} / train {len(train_gold)}, expected 500 / 50 / 450."
        )
    if len(emscad) != 1732:
        raise SystemExit(f"EMSCAD balanced file has {len(emscad)} rows, expected 1732.")
    leaked = [row["id"] for row in emscad if is_holdout(row["id"])]
    if leaked:
        raise SystemExit(f"Holdout ids in EMSCAD: {leaked[:5]}")
    return train_gold, emscad, holdout


def binary_counts(y_true: np.ndarray, y_hat: np.ndarray) -> dict:
    tp = int(np.sum((y_hat == 1) & (y_true == 1)))
    fp = int(np.sum((y_hat == 1) & (y_true == 0)))
    fn = int(np.sum((y_hat == 0) & (y_true == 1)))
    tn = int(np.sum((y_hat == 0) & (y_true == 0)))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {
        "precision_scam": round(precision, 4),
        "recall_scam": round(recall, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }


def main() -> None:
    train_gold, emscad, holdout = split_rows()
    train = train_gold + emscad
    texts = [row["text"] for row in train]
    labels = np.array([scam_bit(row["label"]) for row in train], dtype=np.int8)
    pipe = build_pipeline()
    pipe.fit(texts, labels)

    hold_text = [row["text"] for row in holdout]
    hold_y = np.array([scam_bit(row["label"]) for row in holdout], dtype=np.int8)
    hold_p = pipe.predict_proba(hold_text)[:, 1]
    metrics = binary_counts(hold_y, (hold_p >= 0.5).astype(np.int8))
    report = {
        "version": VERSION,
        "n_train": len(train),
        "n_train_gold": len(train_gold),
        "n_train_emscad": len(emscad),
        "n_holdout": len(holdout),
        "holdout": "as-ca-0001..as-ca-0050",
        "threshold": 0.5,
        "task": "scam vs every other label",
        **metrics,
        "note": "Holdout rows were not fit. This is the frozen 50, not a live-chat score.",
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, MODEL_PATH, compress=3)
    manifest = {
        "version": VERSION,
        "n_train": len(train),
        "train_ids": [row["id"] for row in train],
        "lift": 0.75,
        "features": "tfidf word 1-2 (max 40000) + char_wb 3-5 (max 40000)",
        "clf": "logistic regression, class_weight=balanced, liblinear",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest), encoding="utf-8")
    EVAL_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"wrote {MODEL_PATH} ({MODEL_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
