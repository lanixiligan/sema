"""Tests for dataset.py. Run: python3 -m unittest discover training"""

import unittest

import json
import tempfile
from pathlib import Path

from dataset import (
    STATIC_LETTERS,
    clean,
    is_whole_hand,
    load_extracted,
    load_inputs,
    load_session,
    photo_samples,
    usable_frames,
)

# 21 points well inside the photo, as MediaPipe's x, y, z fractions.
INSIDE = [v for i in range(21) for v in (0.3 + i * 0.01, 0.7 - i * 0.01, 0.0)]


def sample(letter="B", person="asl-hg-p01", shape=0.0, **changes):
    """A sample like an extracted file's. `shape` moves the landmarks, so
    samples with different shapes aren't duplicates."""
    s = {
        "person": person,
        "letter": letter,
        "detected": "right",
        "detectedScore": 0.99,
        "image": f"{letter}/P1_{letter}_1.jpg",
        "handsFound": 1,
        "raw": list(INSIDE),
        "landmarks": [shape + i * 0.01 for i in range(63)],
    }
    s.update(changes)
    return s


def reasons(dropped):
    return [reason for _, reason in dropped]


class StaticLettersTest(unittest.TestCase):
    def test_24_letters_without_j_and_z(self):
        self.assertEqual(len(STATIC_LETTERS), 24)
        self.assertNotIn("J", STATIC_LETTERS)
        self.assertNotIn("Z", STATIC_LETTERS)


class WholeHandTest(unittest.TestCase):
    def test_points_inside_the_margin_are_whole(self):
        self.assertTrue(is_whole_hand(INSIDE))

    def test_a_wrist_below_the_photo_is_not_whole(self):
        raw = list(INSIDE)
        raw[1] = 1.05  # the wrist's y
        self.assertFalse(is_whole_hand(raw))

    def test_a_point_inside_the_photo_but_within_the_margin_is_not_whole(self):
        raw = list(INSIDE)
        raw[0] = 0.01  # the wrist's x, closer to the edge than 2%
        self.assertFalse(is_whole_hand(raw))


class CleanTest(unittest.TestCase):
    def test_keeps_a_good_sample(self):
        kept, dropped = clean([sample()])
        self.assertEqual(len(kept), 1)
        self.assertEqual(dropped, [])

    def test_drops_digits_and_moving_letters(self):
        kept, dropped = clean([sample(letter="6"), sample(letter="J"), sample(letter="Z")])
        self.assertEqual(kept, [])
        self.assertEqual(reasons(dropped), ["not a static letter"] * 3)

    def test_drops_photos_with_two_hands(self):
        _, dropped = clean([sample(handsFound=2), sample(handsFound=2, shape=1)])
        self.assertEqual(reasons(dropped), ["two hands"] * 2)

    def test_drops_left_detections(self):
        _, dropped = clean([sample(detected="left")])
        self.assertEqual(reasons(dropped), ["detected as a left hand"])

    def test_drops_hands_that_are_not_whole(self):
        raw = list(INSIDE)
        raw[1] = 1.05
        _, dropped = clean([sample(raw=raw)])
        self.assertEqual(reasons(dropped), ["hand not whole"])

    def test_keeps_the_first_of_two_identical_samples(self):
        kept, dropped = clean([sample(image="B/P1_B_1.jpg"), sample(image="B/P1_B_2.jpg")])
        self.assertEqual([s["image"] for s in kept], ["B/P1_B_1.jpg"])
        self.assertEqual(reasons(dropped), ["duplicate"])

    def test_the_same_shape_from_another_signer_is_not_a_duplicate(self):
        kept, _ = clean([sample(person="asl-hg-p01"), sample(person="asl-hg-p02")])
        self.assertEqual(len(kept), 2)

    def test_drops_a_sample_far_from_its_signers_other_photos_of_the_letter(self):
        group = [sample(shape=k * 0.01) for k in range(10)]
        broken = sample(shape=50.0, image="B/P1_B_99.jpg")
        kept, dropped = clean(group + [broken])
        self.assertEqual(len(kept), 10)
        self.assertEqual([(s["image"], r) for s, r in dropped], [("B/P1_B_99.jpg", "broken detection")])

    def test_small_groups_are_not_checked_for_broken_detections(self):
        kept, _ = clean([sample(shape=0), sample(shape=0.01), sample(shape=50)])
        self.assertEqual(len(kept), 3)


class LoadTest(unittest.TestCase):
    def write(self, content, name="file.json"):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        path = Path(folder.name) / name
        path.write_text(json.dumps(content))
        return path

    def test_reads_a_session_file(self):
        session = {"format": 1, "normalization": 1, "samples": []}
        self.assertEqual(load_session(self.write(session)), session)

    def test_refuses_an_extracted_file_as_a_session(self):
        with self.assertRaises(ValueError):
            load_session(self.write({"kind": "extracted", "format": 1, "normalization": 1}))

    def test_refuses_an_unknown_normalization(self):
        with self.assertRaises(ValueError):
            load_session(self.write({"format": 1, "normalization": 2, "samples": []}))
        with self.assertRaises(ValueError):
            load_extracted(self.write({"kind": "extracted", "normalization": 2, "complete": True}))

    def test_refuses_a_session_as_an_extracted_file(self):
        with self.assertRaises(ValueError):
            load_extracted(self.write({"format": 1, "normalization": 1, "samples": []}))

    def test_sorts_inputs_into_extracted_and_session_files_in_any_order(self):
        session = {"format": 1, "normalization": 1, "samples": []}
        first = {"kind": "extracted", "normalization": 1, "complete": True, "samples": [{"person": "asl-hg-p01"}]}
        second = {"kind": "extracted", "normalization": 1, "complete": True, "samples": [{"person": "aslyset-p01"}]}
        extracted, sessions = load_inputs([self.write(first, "a.json"), self.write(session), self.write(second, "b.json")])
        self.assertEqual([data["file"] for data in extracted], ["a.json", "b.json"])
        self.assertEqual([data["file"] for data in sessions], ["file.json"])
        self.assertEqual(photo_samples(extracted), [{"person": "asl-hg-p01"}, {"person": "aslyset-p01"}])

    def test_usable_frames_are_the_ones_with_the_asked_for_hand(self):
        right = {"letter": "B", "hand": "left", "detected": "left"}
        session = {"samples": [right, {"letter": "B", "hand": "left", "detected": "right"}]}
        self.assertEqual(usable_frames(session), [right])

    def test_usable_frames_skip_old_none_takes(self):
        letter = {"letter": "B", "hand": "left", "detected": "left"}
        session = {"samples": [letter, {"letter": "none", "hand": "left", "detected": "left"}]}
        self.assertEqual(usable_frames(session), [letter])


if __name__ == "__main__":
    unittest.main()
