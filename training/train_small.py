"""Step 5 of 2.2: two small models, side by side with step 4's k-NN.

Usage: python3 training/train_small.py data/extracted/<file>.json [...] data/raw/<session>.json [...]
The same files as train.py, in any order. Tries logistic regression and a small
neural network (small.py) on the cleaned public photos, tests them the way
train.py tests the k-NN, and writes training/reports/small.md (numbers only, no
hand points) next to the k-NN's numbers from training/reports/knn.json, so run
train.py first, with the same files. The tests:
1. On people it has never seen: each public signer in turn, trained on the others.
2. On Lanix's recordings (the session files), trained on all the photos.
The settings and the "not sure" threshold come from test 1 alone, so test 2
stays fair. Both models are saved in data/models/ (gitignored), and the one that
does better in test 1 is copied to public/models/asl-letters.json for the
/try page: it holds weights, not training hands, so it can go on the live site.
"""

import json
import shutil
import sys
from collections import Counter
from pathlib import Path

import numpy as np

from dataset import STATIC_LETTERS, clean, load_inputs, photo_samples, usable_frames
from evaluate import mean_by_dataset, mean_share, mistakes, share_right
from small import forward, leave_one_signer_out, make_logistic, make_mlp, save_model, with_threshold
from train import PASS_SHARE, SWEEP, THRESHOLD_PERCENTILE, names, own_section, share, summary

TRAINING = Path(__file__).parent
REPORT = TRAINING / "reports" / "small.md"
# The headline numbers of the model the browser gets, for the developer dashboard.
SUMMARY = TRAINING / "reports" / "small.json"
KNN_SUMMARY = TRAINING / "reports" / "knn.json"
MODELS = TRAINING.parent / "data" / "models"
PUBLISHED = TRAINING.parent / "public" / "models" / "asl-letters.json"

# The settings tried for each model, every one tested on each held-out signer.
CANDIDATES = {
    "logistic regression": [(f"C = {c}", lambda c=c: make_logistic(c)) for c in [0.01, 0.1, 1, 10]],
    "neural network": [
        (f"{hidden} hidden units, alpha = {alpha}", lambda hidden=hidden, alpha=alpha: make_mlp(hidden, alpha))
        for hidden in [32, 64, 128]
        for alpha in [1e-4, 1e-2, 0.1, 1]
    ],
}
FILES = {"logistic regression": "logistic-asl.json", "neural network": "mlp-asl.json"}


def main(paths):
    extracted, sessions = load_inputs(paths)
    photos, _ = clean(photo_samples(extracted))
    shapes = np.array([s["landmarks"] for s in photos])
    letters = [s["letter"] for s in photos]
    people = [s["person"] for s in photos]
    frames = [f for session in sessions for f in usable_frames(session)]
    knn = json.loads(KNN_SUMMARY.read_text())

    lines = [
        "# Small models report",
        "",
        f"Logistic regression and a small neural network, trained on {names(extracted)} after "
        f"cleaning: {len(photos):,} samples of the 24 static letters from {len(set(people))} signers. Tested "
        f"on held-out signers and on {names(sessions)} ({len(frames):,} frames), next to the k-NN from "
        f"`reports/knn.json` ({knn['date']}). Made by `training/train_small.py`.",
        "",
        "## Choosing the settings",
        "",
        "Mean of the letters' accuracy, testing each signer in turn on a model trained on the others.",
        "",
        "| Model | Setting | Accuracy |",
        "| --- | --- | --- |",
    ]
    models = {}
    for name, candidates in CANDIDATES.items():
        tried = []
        for setting, make in candidates:
            held_out, confidences = leave_one_signer_out(make, shapes, letters, people)
            accuracy = mean_share(share_right(letters, held_out))
            print(f"{name}, {setting}: {accuracy:.1%}", file=sys.stderr)
            lines.append(f"| {name} | {setting} | {accuracy:.1%} |")
            tried.append({"setting": setting, "make": make, "held_out": held_out, "confidences": confidences, "accuracy": accuracy})
        # On a tie, max keeps the first: the smaller, simpler setting.
        models[name] = max(tried, key=lambda t: t["accuracy"])
    lines += ["", "Chosen: " + "; ".join(f"{name}, **{m['setting']}**" for name, m in models.items()) + "."]

    # Each model trained on all the photos and saved, then run on the
    # recordings from the saved file, exactly as the browser will run it.
    MODELS.mkdir(parents=True, exist_ok=True)
    for name, m in models.items():
        m["threshold"] = np.percentile(m["confidences"], 100 - THRESHOLD_PERCENTILE)
        m["path"] = MODELS / FILES[name]
        save_model(m["path"], m["make"]().fit(shapes, letters), f"{name}, {m['setting']}", m["threshold"])
        saved = json.loads(m["path"].read_text())
        percentages = forward(saved, [f["landmarks"] for f in frames])
        m["own_confidences"] = percentages.max(axis=1)
        top = [saved["letters"][i] for i in percentages.argmax(axis=1)]
        m["own"] = with_threshold(top, m["own_confidences"], m["threshold"])
        m["weights"] = sum(np.size(layer["weights"]) + len(layer["biases"]) for layer in saved["layers"])

    best = max(models, key=lambda name: models[name]["accuracy"])
    chosen = models[best]
    PUBLISHED.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(chosen["path"], PUBLISHED)

    lines += held_out_section(knn, models, letters, people)
    lines += recordings_section(knn, models, frames)
    lines += published_section(best, chosen)
    lines += threshold_section(chosen)
    lines += own_section(frames, chosen["own"], chosen["held_out"], letters)

    REPORT.write_text("\n".join(lines) + "\n")
    numbers = summary(None, chosen["threshold"], photos, letters, chosen["held_out"], frames, chosen["own"])
    numbers["datasets"] = [data["file"] for data in extracted]
    del numbers["k"]
    numbers.update(classifier=best, setting=chosen["setting"], report="training/reports/small.md")
    SUMMARY.write_text(json.dumps(numbers, indent=2) + "\n")
    print("\n".join(lines))
    saved = ", ".join(str(m["path"]) for m in models.values())
    print(f"\nSaved {REPORT}, {SUMMARY}, {saved} and {PUBLISHED}")


def held_out_section(knn, models, letters, people):
    names = list(models)
    by_model = {name: share_right(letters, models[name]["held_out"]) for name in names}
    lines = [
        "",
        "## People it has never seen (the public photos)",
        "",
        "| Letter | k-NN | " + " | ".join(name.capitalize() for name in names) + " |",
        "| --- | --- |" + " --- |" * len(names),
    ]
    for letter in STATIC_LETTERS:
        cells = [knn["heldOut"]["letters"][letter]] + [share(by_model[name][letter]) for name in names]
        lines.append(f"| {letter} | " + " | ".join(f"{c:.1%}" for c in cells) + " |")
    means = [knn["heldOut"]["mean"]] + [mean_share(by_model[name]) for name in names]
    passing = [sum(s >= PASS_SHARE for s in knn["heldOut"]["letters"].values())]
    passing += [sum(share(by_model[name][letter]) >= PASS_SHARE for letter in STATIC_LETTERS) for name in names]
    lines += [
        "| **Mean** | " + " | ".join(f"**{m:.1%}**" for m in means) + " |",
    ]
    # Each dataset's signers alone, so adding a dataset can be judged on the
    # signers that were there before it.
    by_dataset = {name: mean_by_dataset(letters, models[name]["held_out"], people) for name in names}
    for dataset in by_dataset[names[0]]:
        knn_mean = knn["heldOut"].get("byDataset", {}).get(dataset)
        cells = [f"{knn_mean:.1%}" if knn_mean is not None else "—"]
        cells += [f"{by_dataset[name][dataset]:.1%}" for name in names]
        lines.append(f"| Mean, {dataset} signers | " + " | ".join(cells) + " |")
    lines.append(f"| Letters at {PASS_SHARE:.0%}+ | " + " | ".join(f"{p} of 24" for p in passing) + " |")
    for name in names:
        predicted = models[name]["held_out"]
        right = Counter(p for p, t, guess in zip(people, letters, predicted) if t == guess)
        total = Counter(people)
        top_mistakes = mistakes(letters, predicted)[:6]
        lines += [
            "",
            f"{name.capitalize()}, per held-out signer: "
            + ", ".join(f"{p} {right[p] / total[p]:.0%}" for p in sorted(total))
            + ". Most common mistakes: "
            + ", ".join(f"{t} as {p} {s:.0%}" for t, p, _, s in top_mistakes)
            + ".",
        ]
    return lines


def recordings_section(knn, models, frames):
    names = list(models)
    true = [f["letter"] for f in frames]
    lines = [
        "",
        "## Lanix's recordings, side by side",
        "",
        "Each model trained on all the photos, with its own \"not sure\" threshold. Share of frames right, "
        "left hand / right hand.",
        "",
        "| Letter | k-NN | " + " | ".join(name.capitalize() for name in names) + " |",
        "| --- | --- |" + " --- |" * len(names),
    ]

    def right(predicted, letter, hand):
        answers = [p for f, p in zip(frames, predicted) if f["letter"] == letter and f["hand"] == hand]
        return sum(p == letter for p in answers) / len(answers)

    for letter in sorted(set(true)):
        recorded = knn["recordings"]["letters"].get(letter)
        cells = [f"{recorded['left']:.0%} / {recorded['right']:.0%}" if recorded else "—"]
        cells += [f"{right(models[n]['own'], letter, 'left'):.0%} / {right(models[n]['own'], letter, 'right'):.0%}" for n in names]
        lines.append(f"| {letter} | " + " | ".join(cells) + " |")
    return lines


def published_section(name, m):
    size = m["path"].stat().st_size
    return [
        "",
        "## The model for the browser",
        "",
        f"The better of the two on people it has never seen: **{name}** ({m['setting']}), {m['weights']:,} "
        f"weights, {size / 1024:.0f} KB, saved as `public/models/asl-letters.json` (the k-NN's file is 11 MB). "
        "The rest of this report is about this model.",
    ]


def threshold_section(m):
    own = m["own_confidences"]
    lines = [
        "",
        '## "Not sure"',
        "",
        "A hand is \"not sure\" when its top percentage is under a threshold. The threshold is set from the "
        f"held-out signers alone: {THRESHOLD_PERCENTILE}% of their real letters get at least "
        f"**{m['threshold']:.1%}**. How other thresholds would trade off:",
        "",
        "| Unseen people's letters kept | Threshold | Lanix's letters called \"not sure\" |",
        "| --- | --- | --- |",
    ]
    for percentile in SWEEP:
        t = np.percentile(m["confidences"], 100 - percentile)
        lines.append(f"| {percentile}% | {t:.1%} | {np.mean(own < t):.0%} |")
    return lines


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1:])
