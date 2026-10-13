import json
import unittest

from brain import MANIFEST_PATH, VERSION, is_holdout, mix_verdict, predict


class MixTests(unittest.TestCase):
    def test_unclear_lifts_to_risky_at_the_threshold(self):
        self.assertEqual(mix_verdict("unclear", 0.75), "risky")
        self.assertEqual(mix_verdict("unclear", 0.9), "risky")

    def test_unclear_below_the_threshold_stays_unclear(self):
        self.assertEqual(mix_verdict("unclear", 0.749), "unclear")

    def test_other_verdicts_stay_put(self):
        self.assertEqual(mix_verdict("scam", 0.01), "scam")
        self.assertEqual(mix_verdict("risky", 0.1), "risky")
        self.assertEqual(mix_verdict("looks_ok", 0.99), "looks_ok")


class ModelTests(unittest.TestCase):
    def test_holdout_ids_were_not_fit(self):
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        leaked = [row_id for row_id in manifest["train_ids"] if is_holdout(row_id)]
        self.assertEqual(leaked, [])
        self.assertEqual(manifest["n_train"], 2182)
        self.assertEqual(manifest["version"], VERSION)

    def test_predict_shape_and_a_sin_phrase(self):
        result = predict("send SIN on Telegram")
        self.assertEqual(result["version"], VERSION)
        self.assertGreaterEqual(result["p_scam"], 0.5)
        self.assertLessEqual(result["p_scam"], 1.0)
        self.assertEqual(result["label"], "scam")
        self.assertLessEqual(len(result["top_ngrams"]), 5)
        self.assertGreater(len(result["top_ngrams"]), 0)

    def test_empty_text_returns_a_probability(self):
        result = predict("")
        self.assertGreaterEqual(result["p_scam"], 0.0)
        self.assertLessEqual(result["p_scam"], 1.0)
        self.assertEqual(result["top_ngrams"], [])


if __name__ == "__main__":
    unittest.main()
