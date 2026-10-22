"""Step 4 of 2.2: the first classifier (k nearest neighbours), and how good it is.

Usage: python3 training/train.py data/extracted/<file>.json [...] data/raw/<session>.json [...]
Any number of extracted files (one per public dataset) and session files, in
any order. Trains on the cleaned public photos, tests it twice, and writes
training/reports/knn.md (numbers only, no hand points). It also saves the model
for the /try page in data/models/knn-asl.json (gitignored). The tests:
1. On people it has never seen: each public signer in turn, trained on the others.
2. On Lanix's recordings (the session files), trained on all the photos.
k and the "not sure" threshold are chosen from test 1 alone, so test 2 stays fair.
"""

import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path

import numpy as np

from dataset import STATIC_LETTERS, clean, load_inputs, photo_samples, usable_frames
from evaluate import mean_by_dataset, mean_share, mistakes, share_right, take_votes
from knn import NOT_SURE, Knn, leave_one_signer_out, save_model, with_threshold

REPORT = Path(__file__).parent / "reports" / "knn.md"
# The headline numbers, for the developer dashboard (src/pages/dev/DevDashboard.jsx).
SUMMARY = Path(__file__).parent / "reports" / "knn.json"
# The model for the /dev/try page (gitignored: it holds every training hand).
MODEL = Path(__file__).parent.parent / "data" / "models" / "knn-asl.json"
K_CHOICES = [1, 3, 5, 9, 15, 25]
# "Not sure" when a hand is further from its neighbours than this share of
# unseen people's real letters were.
THRESHOLD_PERCENTILE = 95
SWEEP = [80, 90, 95, 97.5, 99]
# The bar proposed for switching a letter on (plan for 2.2, section 3).
PASS_SHARE = 0.90
PAIR_LIMIT = 0.05
TAKES_NEEDED = 5


def main(paths):
    extracted, sessions = load_inputs(paths)
    photos, _ = clean(photo_samples(extracted))
    shapes = np.array([s["landmarks"] for s in photos])
    letters = [s["letter"] for s in photos]
    people = [s["person"] for s in photos]
    frames = [f for session in sessions for f in usable_frames(session)]

    lines = [
        "# k-NN classifier report",
        "",
        f"Trained on {names(extracted)} after cleaning: {len(photos):,} samples of the "
        f"24 static letters from {len(set(people))} signers. Tested on held-out signers and on "
        f"{names(sessions)} ({len(frames):,} frames). Made by `training/train.py`.",
        "",
        "## Choosing k",
        "",
        "Mean of the letters' accuracy, testing each signer in turn on a model trained on the others.",
        "",
        "| k | Accuracy |",
        "| --- | --- |",
    ]
    results = {}
    for k in K_CHOICES:
        predicted, distances = leave_one_signer_out(shapes, letters, people, k)
        results[k] = (mean_share(share_right(letters, predicted)), predicted, distances)
        lines.append(f"| {k} | {results[k][0]:.1%} |")
    k = max(K_CHOICES, key=lambda choice: results[choice][0])
    _, held_out, held_out_distances = results[k]
    threshold = np.percentile(held_out_distances, THRESHOLD_PERCENTILE)
    lines += ["", f"Chosen: **k = {k}**."]

    lines += held_out_section(letters, people, held_out)

    model = Knn(shapes, letters, k)
    MODEL.parent.mkdir(parents=True, exist_ok=True)
    save_model(MODEL, shapes, letters, k, threshold)
    own_letters, own_distances = model.predict([f["landmarks"] for f in frames])
    own_predicted = with_threshold(own_letters, own_distances, threshold)
    lines += threshold_section(held_out_distances, frames, own_distances, threshold)
    lines += own_section(frames, own_predicted, held_out, letters)

    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text("\n".join(lines) + "\n")
    numbers = summary(k, threshold, photos, letters, held_out, frames, own_predicted)
    SUMMARY.write_text(json.dumps(numbers, indent=2) + "\n")
    print("\n".join(lines))
    print(f"\nSaved {REPORT}, {SUMMARY} and {MODEL}")


def summary(k, threshold, photos, letters, held_out, frames, own_predicted):
    """The headline numbers as plain data, rounded, for the dashboard."""
    held_out_by_letter = share_right(letters, held_out)
    true = [f["letter"] for f in frames]
    takes = take_votes([f["recording"] for f in frames], own_predicted)
    take_letter = {f["recording"]: f["letter"] for f in frames}
    recorded = {}
    for letter in sorted(set(true)):
        entry = {}
        for hand in ("left", "right"):
            answers = [p for f, p in zip(frames, own_predicted) if f["letter"] == letter and f["hand"] == hand]
            entry[hand] = round(sum(p == letter for p in answers) / len(answers), 3)
        letter_takes = [r for r in takes if take_letter[r] == letter]
        entry["takesRight"] = sum(takes[r] == letter for r in letter_takes)
        entry["takes"] = len(letter_takes)
        recorded[letter] = entry
    return {
        "date": date.today().isoformat(),
        "classifier": "k nearest neighbours",
        "k": k,
        "threshold": round(float(threshold), 3),
        "trainingHands": len(photos),
        "signers": len({s["person"] for s in photos}),
        "passShare": PASS_SHARE,
        "heldOut": {
            "mean": round(mean_share(held_out_by_letter), 3),
            "byDataset": {
                name: round(mean, 3)
                for name, mean in mean_by_dataset(letters, held_out, [s["person"] for s in photos]).items()
            },
            "letters": {letter: round(share(held_out_by_letter[letter]), 3) for letter in STATIC_LETTERS},
        },
        "recordings": {
            "frames": len(frames),
            "letters": recorded,
        },
    }


def held_out_section(letters, people, predicted):
    by_letter = share_right(letters, predicted)
    taken_for = first_mistake_per_letter(letters, predicted)
    passing = [letter for letter in STATIC_LETTERS if share(by_letter[letter]) >= PASS_SHARE]
    lines = [
        "",
        "## People it has never seen (the public photos)",
        "",
        f"Mean accuracy **{mean_share(by_letter):.1%}**. {len(passing)} of 24 letters reach "
        f"{PASS_SHARE:.0%}: {', '.join(passing)}.",
        "",
        by_dataset_line(letters, predicted, people),
        "",
        "| Letter | Right | Most often taken for |",
        "| --- | --- | --- |",
    ]
    for letter in STATIC_LETTERS:
        lines.append(f"| {letter} | {share(by_letter[letter]):.1%} | {taken_for.get(letter, '—')} |")
    right_by_signer = Counter(p for p, t, guess in zip(people, letters, predicted) if t == guess)
    total_by_signer = Counter(people)
    lines += [
        "",
        "Per held-out signer: "
        + ", ".join(f"{p} {right_by_signer[p] / total_by_signer[p]:.0%}" for p in sorted(total_by_signer))
        + ".",
        "",
        "Most common mistakes: " + ", ".join(f"{t} as {p} {s:.0%}" for t, p, _, s in mistakes(letters, predicted)[:10]) + ".",
    ]
    return lines


def by_dataset_line(letters, predicted, people):
    """Each dataset's held-out signers alone, so adding a dataset can be judged
    on the signers that were there before it."""
    means = mean_by_dataset(letters, predicted, people)
    return "Per dataset (its signers held out in turn): " + ", ".join(f"{n} {m:.1%}" for n, m in means.items()) + "."


def names(files):
    """The files' names, `quoted`, for a report's first line."""
    return ", ".join(f"`{data['file']}`" for data in files)


def threshold_section(held_out_distances, frames, own_distances, threshold):
    lines = [
        "",
        '## "Not sure"',
        "",
        "A hand is \"not sure\" when its neighbours are further than a threshold. The threshold is set "
        f"from the held-out signers alone: {THRESHOLD_PERCENTILE}% of their real letters are closer "
        f"than **{threshold:.3f}**. How other thresholds would trade off:",
        "",
        "| Unseen people's letters kept | Threshold | Lanix's letters called \"not sure\" |",
        "| --- | --- | --- |",
    ]
    for percentile in SWEEP:
        t = np.percentile(held_out_distances, percentile)
        lines.append(f"| {percentile}% | {t:.3f} | {np.mean(own_distances > t):.0%} |")
    return lines


def own_section(frames, predicted, held_out, letters):
    true = [f["letter"] for f in frames]
    takes = take_votes([f["recording"] for f in frames], predicted)
    take_letter = {f["recording"]: f["letter"] for f in frames}
    lines = [
        "",
        "## Lanix's recordings",
        "",
        f"Trained on all the photos, with the threshold above. Frames: right / \"not sure\" / "
        f"wrong letter. Takes: how many takes most of whose frames were right.",
        "",
        "| Letter | Left hand | Right hand | Takes right | Most often taken for |",
        "| --- | --- | --- | --- | --- |",
    ]
    tested = sorted(set(true))
    for letter in tested:
        cells = []
        for hand in ("left", "right"):
            answers = [p for f, p in zip(frames, predicted) if f["letter"] == letter and f["hand"] == hand]
            cells.append(outcome(letter, answers))
        letter_takes = [r for r in takes if take_letter[r] == letter]
        right_takes = sum(takes[r] == letter for r in letter_takes)
        wrong = Counter(p for t, p in zip(true, predicted) if t == letter and p != letter)
        lines.append(f"| {letter} | {cells[0]} | {cells[1]} | {right_takes} of {len(letter_takes)} | {top(wrong)} |")

    lines += bar_section(frames, predicted, takes, take_letter, tested)
    return lines


def bar_section(frames, predicted, takes, take_letter, tested):
    """The recorded letters against the proposed bar."""
    failing_frames, failing_pairs, failing_takes = [], [], []
    for letter in tested:
        for hand in ("left", "right"):
            answers = [p for f, p in zip(frames, predicted) if f["letter"] == letter and f["hand"] == hand]
            if np.mean([p == letter for p in answers]) < PASS_SHARE:
                failing_frames.append(f"{letter} {hand}")
            for other, n in Counter(p for p in answers if p not in (letter, NOT_SURE)).items():
                if n / len(answers) > PAIR_LIMIT:
                    failing_pairs.append(f"{letter} {hand} as {other} {n / len(answers):.0%}")
        if sum(takes[r] == letter for r in takes if take_letter[r] == letter) < TAKES_NEEDED:
            failing_takes.append(letter)

    def verdict(failures):
        return "passes" if not failures else "fails: " + ", ".join(failures)

    return [
        "",
        "## Against the proposed bar",
        "",
        "The bar proposed for switching a letter on (not yet agreed), for the letters Lanix recorded:",
        "",
        f"- Every letter right on at least {PASS_SHARE:.0%} of frames, each hand: {verdict(failing_frames)}.",
        f"- No letter mistaken for another on more than {PAIR_LIMIT:.0%} of frames: {verdict(failing_pairs)}.",
        f"- At least {TAKES_NEEDED} of 6 takes right for every letter: {verdict(failing_takes)}.",
    ]


def outcome(letter, answers):
    n = len(answers)
    right = sum(p == letter for p in answers)
    unsure = sum(p == NOT_SURE for p in answers)
    return f"{right / n:.0%} / {unsure / n:.0%} / {(n - right - unsure) / n:.0%}"


def first_mistake_per_letter(true, predicted):
    found = {}
    for t, p, _, s in mistakes(true, predicted):
        found.setdefault(t, f"{p} ({s:.0%})" if s >= 0.005 else f"{p} (<1%)")
    return found


def top(counter, n=1):
    return ", ".join(f"{label} ({count})" for label, count in counter.most_common(n)) or "—"


def share(right_total):
    right, total = right_total
    return right / total


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1:])
