"""Write apps/extension/brain.js from packages/brain/dist/brain_v1.joblib.

Run from the repo root with the repo venv:
    .venv/bin/python apps/extension/scripts/export-brain.py
The extension scorer in brain-core.js reproduces TfidfVectorizer + logistic
regression, so the popup can compute p_scam on the device with no network.
"""
import json
from pathlib import Path

import joblib

ROOT = Path(__file__).resolve().parents[3]
pipe = joblib.load(ROOT / "packages/brain/dist/brain_v1.joblib")
union = pipe.named_steps["features"]
clf = pipe.named_steps["clf"]
coef = clf.coef_[0]

out = {"version": "brain_v1", "lift": 0.75, "intercept": round(float(clf.intercept_[0]), 8)}
offset = 0
for name, vec in union.transformer_list:
    vocab = vec.vocabulary_
    idf = vec.idf_
    rows = [None] * len(vocab)
    for term, index in vocab.items():
        rows[index] = [term, round(float(idf[index]), 6), round(float(coef[offset + index]), 6)]
    out[name] = rows
    offset += len(vocab)

target = ROOT / "apps/extension/brain.js"
target.write_text(
    "globalThis.ApplySafeBrainData = " + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
print("wrote", target, target.stat().st_size, "bytes")
