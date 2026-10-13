"""ApplySafe brain_v1: TF–IDF + logistic helper.

The model reports p_scam. It is not the judge. mix_verdict lifts an unclear
rules result to risky when p_scam is at least 0.75, and leaves every other
rules verdict unchanged.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np

VERSION = "brain_v1"
LIFT = 0.75
ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "packages" / "brain" / "dist" / "brain_v1.joblib"
MANIFEST_PATH = ROOT / "packages" / "brain" / "dist" / "brain_v1.json"
GOLD_PATH = ROOT / "data" / "gold" / "applysafe-ca.jsonl"
EMSCAD_PATH = ROOT / "data" / "public" / "emscad" / "emscad-balanced.jsonl"


def is_holdout(row_id: str) -> bool:
    if not str(row_id).startswith("as-ca-"):
        return False
    number = int(str(row_id).removeprefix("as-ca-"))
    return 1 <= number <= 50


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            rows.append(json.loads(line))
    return rows


def scam_bit(label: str) -> int:
    return 1 if label == "scam" else 0


@lru_cache(maxsize=1)
def load():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing {MODEL_PATH}. Run packages/brain/train.py first.")
    return joblib.load(MODEL_PATH)


def predict(text: str) -> dict:
    pipe = load()
    proba = float(pipe.predict_proba([text])[0, 1])
    return {
        "p_scam": round(proba, 6),
        "label": "scam" if proba >= 0.5 else "not_scam",
        "version": VERSION,
        "top_ngrams": top_ngrams(pipe, text),
    }


def mix_verdict(rules_verdict: str, p_scam: float) -> str:
    if rules_verdict == "unclear" and p_scam >= LIFT:
        return "risky"
    return rules_verdict


def top_ngrams(pipe, text: str, k: int = 5) -> list[dict]:
    features = pipe.named_steps["features"]
    coef = pipe.named_steps["clf"].coef_[0]
    row = features.transform([text]).getrow(0)
    if row.nnz == 0:
        return []
    contribution = row.data * coef[row.indices]
    names = features.get_feature_names_out()
    order = np.argsort(contribution)[::-1]
    picked = []
    for index in order:
        weight = float(contribution[index])
        if weight <= 0 or len(picked) >= k:
            break
        gram = str(names[row.indices[index]]).split("__", 1)[-1]
        picked.append({"gram": gram, "weight": round(weight, 6)})
    return picked
