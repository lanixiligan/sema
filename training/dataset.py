"""Loading and cleaning the hand points that training uses.

Extracted files (docs/data-format.md, "Extracted files") hold the hand points
found in a public dataset's photos. clean() keeps the samples that are fit to
learn from and says why it dropped each of the others.
"""

import json
from collections import defaultdict
from pathlib import Path

import numpy as np

# The letters held still: A-Z except J and Z, which move (docs/project-plan.md).
STATIC_LETTERS = [c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if c not in "JZ"]

# Must match src/vision/landmarks/normalizeHand.js and the extract page.
KNOWN_NORMALIZATIONS = [1]
# Session file layouts this code reads (scripts/check-session.js lists the same).
KNOWN_FORMATS = [1]

# The app's whole-hand rule (isWholeHand in src/vision/landmarks/handChecks.js):
# every point at least this far inside the photo's edges, as a fraction.
EDGE_MARGIN = 0.02

# A sample is a broken detection when it's this many times further than usual
# from its signer's other photos of the same letter. Checked by eye on
# 2026-10-22: the two worst (H/P8_H_799 and 800, 100x) had the hand mostly out
# of the photo, and fail earlier rules anyway; in ASL-HG this rule then
# catches one sample (A/P2_A_173, 12x).
OUTLIER_FACTOR = 10
# Groups smaller than this have no reliable "usual".
MIN_GROUP = 5


def load_inputs(paths):
    """The files a training script was given, in any order, sorted by what they
    are: (extracted files, session files), each read and checked, with its file
    name added as `file` for the reports."""
    extracted, sessions = [], []
    for path in paths:
        with open(path) as f:
            data = json.load(f)
        data["file"] = Path(path).name
        if data.get("kind") == "extracted":
            extracted.append(check_extracted(path, data))
        else:
            sessions.append(check_session(path, data))
    return extracted, sessions


def photo_samples(extracted):
    """Every extracted file's samples, as one list. Signers can't clash across
    datasets: each `person` starts with its dataset's name."""
    return [s for data in extracted for s in data["samples"]]


def load_extracted(path):
    """One extracted file (header, misses, samples), after checking its kind."""
    with open(path) as f:
        return check_extracted(path, json.load(f))


def check_extracted(path, data):
    if data.get("kind") != "extracted":
        raise ValueError(f"{path} is not an extracted file")
    if data["normalization"] not in KNOWN_NORMALIZATIONS:
        raise ValueError(f"{path} has normalization {data['normalization']}, expected one of {KNOWN_NORMALIZATIONS}")
    if not data["complete"]:
        print(f"Note: {path} was stopped early ({data['photos']} photos).")
    return data


def load_session(path):
    """One recorded session file (docs/data-format.md), after checking its versions."""
    with open(path) as f:
        return check_session(path, json.load(f))


def check_session(path, data):
    if "kind" in data or data.get("format") not in KNOWN_FORMATS:
        raise ValueError(f"{path} is not a session file this code knows (format {data.get('format')})")
    if data["normalization"] not in KNOWN_NORMALIZATIONS:
        raise ValueError(f"{path} has normalization {data['normalization']}, expected one of {KNOWN_NORMALIZATIONS}")
    return data


def usable_frames(session):
    """A session's frames of a static letter where MediaPipe saw the hand that
    was asked for. The others would be flipped the wrong way
    (docs/data-format.md). Sessions from before 2026-10-23 can also hold
    "none" takes (a "no letter" class, since dropped): they're skipped."""
    return [s for s in session["samples"] if s["letter"] in STATIC_LETTERS and s["detected"] == s["hand"]]


def is_whole_hand(raw, margin=EDGE_MARGIN):
    """True if every point's x and y is inside the photo, `margin` from the edges.
    raw: the 63 numbers x, y, z of points 0-20, as MediaPipe gave them."""
    xs, ys = raw[0::3], raw[1::3]
    return all(margin <= v <= 1 - margin for v in xs + ys)


def first_problem(sample):
    """Why a sample can't be used on its own, or None if it can."""
    if sample["letter"] not in STATIC_LETTERS:
        return "not a static letter"
    if sample["handsFound"] != 1:
        # Each letter is one hand. In ASL-HG the "second hand" is mostly a
        # scrap of sleeve at the photo's edge.
        return "two hands"
    if sample["detected"] != "right":
        # The public datasets' signers used their right hand: a "left" is
        # MediaPipe's mistake (checked by eye in ASL-HG; in ASLYset 21 of
        # 4,570 samples), and the left-hand flip would then mirror
        # the hand into a shape nobody made.
        return "detected as a left hand"
    if not is_whole_hand(sample["raw"]):
        # Sema only judges whole hands, so it learns from whole hands. Here
        # it's mostly a wrist cut off at the bottom of the photo.
        return "hand not whole"
    return None


def clean(samples):
    """Returns (kept, dropped): the usable samples, and (sample, reason) for
    each of the others, in the order the samples came."""
    kept, dropped = [], []
    seen = set()
    for sample in samples:
        reason = first_problem(sample)
        if reason is None:
            # The same photo saved twice would count double.
            key = (sample["person"], sample["letter"], tuple(sample["landmarks"]))
            if key in seen:
                reason = "duplicate"
            seen.add(key)
        if reason is None:
            kept.append(sample)
        else:
            dropped.append((sample, reason))

    broken = broken_detections(kept)
    dropped += [(s, "broken detection") for i, s in enumerate(kept) if i in broken]
    kept = [s for i, s in enumerate(kept) if i not in broken]
    return kept, dropped


def broken_detections(samples):
    """Indexes of samples much further than usual (OUTLIER_FACTOR times) from
    their signer's other photos of the same letter."""
    groups = defaultdict(list)
    for i, s in enumerate(samples):
        groups[(s["person"], s["letter"])].append(i)

    broken = set()
    for indexes in groups.values():
        if len(indexes) < MIN_GROUP:
            continue
        shapes = np.array([samples[i]["landmarks"] for i in indexes])
        # The median shape and median distance, so the broken samples
        # themselves can't drag "usual" toward them.
        distances = np.linalg.norm(shapes - np.median(shapes, axis=0), axis=1)
        usual = np.median(distances)
        broken.update(i for i, d in zip(indexes, distances) if d > OUTLIER_FACTOR * usual)
    return broken
