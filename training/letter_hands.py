"""Makes the tests' fixture of real hands: one public hand per still letter.

Usage: python3 training/letter_hands.py data/extracted/<file>.json [...]
For each of the 24 still letters, takes the most typical hand in the cleaned
photos (the one nearest the letter's median shape), and saves it with what the
published model (public/models/asl-letters.json) answers for it, in
src/vision/landmarks/fixtures/letter-hands.json. The tests on both sides read
it: training/test_letter_hands.py (forward) and the browser's
networkModel.test.js (classify), so the two can't drift apart unnoticed.
Run it again after training a new model, and commit the result. Public photos
only (their credits are in docs/ATTRIBUTION.md): never give it a file from
data/raw/.
"""

import json
import sys
from pathlib import Path

import numpy as np

from dataset import STATIC_LETTERS, clean, load_inputs, photo_samples
from small import forward

ROOT = Path(__file__).parent.parent
FIXTURE = ROOT / "src" / "vision" / "landmarks" / "fixtures" / "letter-hands.json"
MODEL = ROOT / "public" / "models" / "asl-letters.json"
DECIMALS = 6


def typical_hand(samples):
    """The sample nearest the median of the samples' shapes."""
    shapes = np.array([s["landmarks"] for s in samples])
    distances = np.linalg.norm(shapes - np.median(shapes, axis=0), axis=1)
    return samples[int(distances.argmin())]


def main(paths):
    extracted, sessions = load_inputs(paths)
    if sessions:
        sys.exit("Only extracted files of public photos: recorded sessions are private.")
    photos, _ = clean(photo_samples(extracted))
    model = json.loads(MODEL.read_text())
    hands = []
    for letter in STATIC_LETTERS:
        sample = typical_hand([s for s in photos if s["letter"] == letter])
        percentages = forward(model, [sample["landmarks"]])[0]
        hands.append(
            {
                "letter": letter,
                "person": sample["person"],
                "image": sample["image"],
                "landmarks": sample["landmarks"],
                "model": {
                    "letter": model["letters"][int(percentages.argmax())],
                    "confidence": round(float(percentages.max()), DECIMALS),
                },
            }
        )
    fixture = {
        "about": "One public hand per still letter, for tests. Made by training/letter_hands.py.",
        "model": model["name"],
        "normalization": model["normalization"],
        "files": [data["file"] for data in extracted],
        "hands": hands,
    }
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(json.dumps(fixture, indent=1) + "\n")
    print(f"Saved {FIXTURE}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
