"""Tests for knn.py and evaluate.py. Run: python3 -m unittest discover training"""

import json
import tempfile
import unittest
from pathlib import Path

from evaluate import mean_by_dataset, mean_share, mistakes, share_right, take_votes
from knn import NOT_SURE, Knn, leave_one_signer_out, save_model, vote, with_threshold

# Two letters far apart on a line: A near 0, B near 10.
SHAPES = [[0.0], [0.1], [0.2], [10.0], [10.1], [10.2]]
LETTERS = ["A", "A", "A", "B", "B", "B"]


class KnnTest(unittest.TestCase):
    def test_takes_the_letter_of_the_nearest_hands(self):
        letters, _ = Knn(SHAPES, LETTERS, k=3).predict([[0.05], [9.9]])
        self.assertEqual(letters, ["A", "B"])

    def test_distance_is_the_average_to_the_k_neighbours(self):
        _, distances = Knn(SHAPES, LETTERS, k=2).predict([[0.0]])
        self.assertAlmostEqual(distances[0], (0.0 + 0.1) / 2)

    def test_a_tie_goes_to_the_nearest_neighbours_letter(self):
        self.assertEqual(vote(["B", "A", "A", "B"]), "B")

    def test_far_hands_are_not_sure(self):
        self.assertEqual(with_threshold(["A", "B"], [0.5, 3.0], threshold=1.0), ["A", NOT_SURE])


class SaveModelTest(unittest.TestCase):
    def test_saves_flat_shapes_and_letter_indexes(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "model.json"
            save_model(path, [[0.12346, 1.0], [2.0, 3.0]], ["B", "A"], k=1, threshold=0.56789)
            model = json.loads(path.read_text())
        self.assertEqual(model["kind"], "knn")
        self.assertEqual(model["letters"], ["A", "B"])
        self.assertEqual(model["labels"], [1, 0])
        self.assertEqual(model["shapes"], [0.1235, 1.0, 2.0, 3.0])
        self.assertEqual(model["threshold"], 0.5679)


class LeaveOneSignerOutTest(unittest.TestCase):
    def test_never_uses_the_held_out_signers_own_samples(self):
        # Each signer's A is unique to them, so if a signer's own samples
        # were used, their A would be found at distance 0.
        shapes = [[0.0], [10.0], [1.0], [11.0]]
        letters = ["A", "B", "A", "B"]
        people = ["p1", "p1", "p2", "p2"]
        predicted, distances = leave_one_signer_out(shapes, letters, people, k=1)
        self.assertEqual(predicted, ["A", "B", "A", "B"])
        self.assertTrue(all(d == 1.0 for d in distances))


class EvaluateTest(unittest.TestCase):
    def test_share_right_per_letter(self):
        result = share_right(["A", "A", "B"], ["A", "B", "B"])
        self.assertEqual(result, {"A": (1, 2), "B": (1, 1)})
        self.assertEqual(mean_share(result), 0.75)

    def test_mean_per_dataset_counts_each_datasets_signers_alone(self):
        true = ["A", "A", "B", "A", "B"]
        predicted = ["A", "B", "B", "A", "A"]
        people = ["asl-hg-p01", "asl-hg-p01", "asl-hg-p02", "aslyset-p01", "aslyset-p01"]
        self.assertEqual(mean_by_dataset(true, predicted, people), {"asl-hg": 0.75, "aslyset": 0.5})

    def test_mistakes_most_common_first(self):
        result = mistakes(["A", "A", "A", "B"], ["B", "B", "A", "A"])
        self.assertEqual(result, [("A", "B", 2, 2 / 3), ("B", "A", 1, 1.0)])

    def test_a_take_gets_the_answer_most_of_its_frames_got(self):
        result = take_votes(["t1", "t1", "t1", "t2"], ["A", "B", "A", NOT_SURE])
        self.assertEqual(result, {"t1": "A", "t2": NOT_SURE})


if __name__ == "__main__":
    unittest.main()
