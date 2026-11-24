"""The published model against the fixture of real hands.
Run: python3 -m unittest discover training

src/vision/landmarks/fixtures/letter-hands.json holds one public hand per
still letter, with what the published model (public/models/asl-letters.json)
answers for it. The browser's copy is tested against the same file
(src/components/letter-check/networkModel.test.js), so if forward() here and
classify() there ever stop agreeing, or the model changes without the fixture,
one of the two tests fails. Remake the fixture after training a new model:
python3 training/letter_hands.py data/extracted/<asl-hg file>.json
"""

import json
import unittest
from pathlib import Path

import numpy as np

from dataset import STATIC_LETTERS
from small import forward

ROOT = Path(__file__).parent.parent
FIXTURE = ROOT / "src" / "vision" / "landmarks" / "fixtures" / "letter-hands.json"
MODEL = ROOT / "public" / "models" / "asl-letters.json"


class LetterHandsTest(unittest.TestCase):
    def setUp(self):
        self.hands = json.loads(FIXTURE.read_text())["hands"]
        self.model = json.loads(MODEL.read_text())

    def test_has_one_hand_of_63_numbers_per_still_letter(self):
        self.assertEqual([hand["letter"] for hand in self.hands], STATIC_LETTERS)
        self.assertTrue(all(len(hand["landmarks"]) == 63 for hand in self.hands))

    def test_published_model_gives_the_saved_answers(self):
        percentages = forward(self.model, [hand["landmarks"] for hand in self.hands])
        top = [self.model["letters"][i] for i in percentages.argmax(axis=1)]
        self.assertEqual(top, [hand["model"]["letter"] for hand in self.hands])
        expected = [hand["model"]["confidence"] for hand in self.hands]
        np.testing.assert_allclose(percentages.max(axis=1), expected, atol=1e-6)


if __name__ == "__main__":
    unittest.main()
