"""Tests for small.py. Run: python3 -m unittest discover training"""

import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from knn import NOT_SURE
from small import forward, leave_one_signer_out, make_logistic, make_mlp, save_model, to_network, with_threshold

# Three letters in clusters on a plane: A near (0, 0), B near (5, 0), C near (0, 5).
rng = np.random.default_rng(0)
CENTRES = {"A": (0, 0), "B": (5, 0), "C": (0, 5)}
SHAPES = np.array([centre + rng.normal(0, 1, 2) for centre in CENTRES.values() for _ in range(30)])
LETTERS = [letter for letter in CENTRES for _ in range(30)]


class NetworkTest(unittest.TestCase):
    def test_logistic_regression_saved_as_numbers_gives_scikit_learns_percentages(self):
        model = make_logistic(c=1.0).fit(SHAPES, LETTERS)
        expected = model.predict_proba(SHAPES)
        np.testing.assert_allclose(forward(to_network(model), SHAPES), expected, atol=1e-3)

    def test_mlp_saved_as_numbers_gives_scikit_learns_percentages(self):
        model = make_mlp(hidden=8, alpha=1e-4).fit(SHAPES, LETTERS)
        expected = model.predict_proba(SHAPES)
        np.testing.assert_allclose(forward(to_network(model), SHAPES), expected, atol=1e-3)

    def test_letters_come_in_the_order_of_the_percentages(self):
        network = to_network(make_logistic(c=1.0).fit(SHAPES, LETTERS))
        self.assertEqual(network["letters"], ["A", "B", "C"])
        self.assertEqual(network["letters"][forward(network, [[5, 0]])[0].argmax()], "B")

    def test_low_confidence_is_not_sure(self):
        self.assertEqual(with_threshold(["A", "B"], [0.9, 0.4], threshold=0.5), ["A", NOT_SURE])


class RecordingModel:
    """Stands in for a model: remembers what it was trained on, and answers
    every letter it saw with the same percentage."""

    trained_on = []

    def fit(self, shapes, letters):
        RecordingModel.trained_on.append([tuple(s) for s in shapes])
        self.classes_ = np.array(sorted(set(letters)))
        return self

    def predict_proba(self, shapes):
        return np.full((len(shapes), len(self.classes_)), 1 / len(self.classes_))


class LeaveOneSignerOutTest(unittest.TestCase):
    def test_never_trains_on_the_held_out_signer(self):
        shapes = [[1.0], [2.0], [3.0], [4.0]]
        people = ["p1", "p1", "p2", "p2"]
        RecordingModel.trained_on = []
        leave_one_signer_out(RecordingModel, shapes, ["A", "B", "A", "B"], people)
        self.assertEqual(RecordingModel.trained_on, [[(3.0,), (4.0,)], [(1.0,), (2.0,)]])

    def test_gives_each_sample_its_letter_and_top_percentage(self):
        shapes = SHAPES.tolist()
        people = ["p1" if i % 2 else "p2" for i in range(len(shapes))]
        letters, confidences = leave_one_signer_out(lambda: make_logistic(c=1.0), shapes, LETTERS, people)
        self.assertEqual(len(letters), len(shapes))
        self.assertGreater(np.mean([t == p for t, p in zip(LETTERS, letters)]), 0.9)
        self.assertTrue(all(1 / 3 <= c <= 1 for c in confidences))


class SaveModelTest(unittest.TestCase):
    def test_saves_what_the_browser_needs(self):
        model = make_mlp(hidden=4, alpha=1e-4).fit(SHAPES, LETTERS)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "model.json"
            save_model(path, model, "small neural network", threshold=0.56789)
            saved = json.loads(path.read_text())
        self.assertEqual(saved["kind"], "network")
        self.assertEqual(saved["name"], "small neural network")
        self.assertEqual(saved["normalization"], 1)
        self.assertEqual(saved["letters"], ["A", "B", "C"])
        self.assertEqual(saved["threshold"], 0.5679)
        self.assertEqual(len(saved["mean"]), 2)
        self.assertEqual(len(saved["scale"]), 2)
        # Each layer's weights: one row per output, as long as its input.
        self.assertEqual([np.shape(layer["weights"]) for layer in saved["layers"]], [(4, 2), (3, 4)])
        self.assertEqual([len(layer["biases"]) for layer in saved["layers"]], [4, 3])
        # What's saved still gives scikit-learn's answers.
        np.testing.assert_allclose(forward(saved, SHAPES), model.predict_proba(SHAPES), atol=1e-3)


if __name__ == "__main__":
    unittest.main()
