"""Cleans an extracted file and reports what was kept and why the rest went.

Usage: python3 training/clean.py data/extracted/sema-extracted-asl-hg-2026-10-22.json
Prints the report and saves it as training/reports/cleaning-<dataset>.md
(counts and the dataset's public file names only, so it can be committed), one
per dataset. Training calls clean() itself; this script only shows what
cleaning does.
"""

import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

from dataset import STATIC_LETTERS, clean, load_extracted

REPORTS = Path(__file__).parent / "reports"
REASONS = ["two hands", "detected as a left hand", "hand not whole", "duplicate", "broken detection"]


def main(path):
    data = load_extracted(path)
    kept, dropped = clean(data["samples"])
    lines = report(Path(path).name, data, kept, dropped)
    report_path = REPORTS / f"cleaning-{data['dataset']}.md"
    REPORTS.mkdir(exist_ok=True)
    report_path.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"\nSaved {report_path}")


def report(name, data, kept, dropped):
    # Photos, not samples: a two-hand photo has two samples but is one photo.
    photos_by_reason = defaultdict(set)
    for sample, reason in dropped:
        photos_by_reason[(sample["letter"], reason)].add(sample["image"])
    # The letter's folder, upper-cased: ASLYset's folders are lowercase.
    no_hand = Counter(m["image"].split("/")[0].upper() for m in data["misses"])
    kept_by_letter = Counter(s["letter"] for s in kept)
    with_hand = defaultdict(set)
    for s in data["samples"]:
        with_hand[s["letter"]].add(s["image"])

    lines = [
        "# Cleaning report",
        "",
        f"From `{name}` ({data['dataset']}, normalization {data['normalization']}, "
        f"run on {data['delegate']} in {data['browser']}). Made by `training/clean.py`; "
        "the rules are in `training/dataset.py`.",
        "",
        f"**Kept {len(kept):,} samples** of the 24 static letters, one per photo.",
        "",
        "## Per letter (photos)",
        "",
        "| Letter | Photos | No hand | " + " | ".join(r.capitalize() for r in REASONS) + " | Kept |",
        "| --- " * (len(REASONS) + 4) + "|",
    ]
    for letter in STATIC_LETTERS:
        counts = [len(photos_by_reason[(letter, r)]) for r in REASONS]
        total = no_hand[letter] + len(with_hand[letter])
        # Every photo is either missed, dropped for one reason, or kept.
        assert no_hand[letter] + sum(counts) + kept_by_letter[letter] == total, letter
        lines.append(f"| {letter} | {total} | {no_hand[letter]} | " + " | ".join(map(str, counts)) + f" | {kept_by_letter[letter]} |")

    by_signer = Counter(s["person"] for s in kept)
    lines += ["", "## Per signer", "", "| Signer | Kept | Fewest for one letter |", "| --- | --- | --- |"]
    for person in sorted(by_signer):
        per_letter = Counter(s["letter"] for s in kept if s["person"] == person)
        fewest = min(STATIC_LETTERS, key=lambda letter: per_letter[letter])
        lines.append(f"| {person} | {by_signer[person]:,} | {fewest}: {per_letter[fewest]} |")

    lines += [
        "",
        "Small groups come mostly from the whole-hand rule (a wrist cut off at the bottom of "
        "a signer's photos) or from no hand found. The other signers still train that letter, "
        "but a held-out signer's result for it rests on few photos.",
        "",
        "## Broken detections",
        "",
    ]
    lines += [f"- `{s['image']}`" for s, r in dropped if r == "broken detection"] or ["None."]

    lines += ["", "## Worth knowing", ""] + near_copies(kept) + [""] + look_alike_groups(kept)
    return lines


def near_copies(kept):
    """How alike one signer's photos of a letter are."""
    nearest, spread = [], []
    for indexes in groups(kept).values():
        shapes = np.array([kept[i]["landmarks"] for i in indexes])
        if len(shapes) < 2:
            continue
        d = np.linalg.norm(shapes[:, None] - shapes[None], axis=2)
        np.fill_diagonal(d, np.inf)
        nearest.extend(d.min(axis=1))
        spread.append(np.median(np.linalg.norm(shapes - shapes.mean(axis=0), axis=1)))
    return [
        f"- **Near copies:** a photo's nearest neighbour among its signer's photos of the same "
        f"letter is typically {np.median(nearest):.3f} away, against a typical spread of "
        f"{np.median(spread):.3f}. Each signer's photos are close variations of one pose, so "
        "training and testing must be split by signer, never by photo."
    ]


def look_alike_groups(kept):
    """Signers whose photos of a letter sit closer to another letter (as the
    other signers make it) than to the letter itself. Kept: they're mostly real
    look-alikes and real differences between people."""
    shapes = np.array([s["landmarks"] for s in kept])
    letters = np.array([s["letter"] for s in kept])
    people = np.array([s["person"] for s in kept])
    found = []
    for person in sorted(set(people)):
        others = {l: shapes[(people != person) & (letters == l)].mean(axis=0) for l in STATIC_LETTERS}
        for letter in STATIC_LETTERS:
            mine = shapes[(people == person) & (letters == letter)]
            if len(mine) == 0:
                continue
            centre = mine.mean(axis=0)
            nearest = min(STATIC_LETTERS, key=lambda l: np.linalg.norm(centre - others[l]))
            if nearest != letter:
                own, other = np.linalg.norm(centre - others[letter]), np.linalg.norm(centre - others[nearest])
                found.append((own / other, person, letter, nearest))
    found.sort(reverse=True)
    lines = [
        f"- **Look-alikes:** in {len(found)} of {len(set(people)) * len(STATIC_LETTERS)} signer-letter "
        "groups, the signer's average shape is closer to another letter (as the other signers "
        "make it) than to its own. Kept, since they're mostly real look-alikes and real "
        "differences between people; the evaluation will show their effect. The strongest:"
    ]
    lines += [f"  - {p} {l} looks like {n} ({ratio:.1f}× closer)" for ratio, p, l, n in found[:10]]
    return lines


def groups(samples):
    by_group = defaultdict(list)
    for i, s in enumerate(samples):
        by_group[(s["person"], s["letter"])].append(i)
    return by_group


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
