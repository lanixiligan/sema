# How the letter model was trained

Sema's letter model reads a hand's shape and says which of the 24 still letters (A–Z
without J and Z) it looks like. On Learn it gives a second opinion under the finger
checklist; the finger rules decide the pass. This page follows it from the public photos
to the model in the browser and its result: **94.5% on people it wasn't trained on**, in a
14 KB file.

The code is in `training/` (`training/README.md` has the commands) and the numbers come
from its reports in `training/reports/`.

Contents:

- [1. The datasets](#1-the-datasets)
- [2. Photos to hand points](#2-photos-to-hand-points)
- [3. Normalizing a hand](#3-normalizing-a-hand)
- [4. Cleaning](#4-cleaning)
- [5. The test: one signer left out at a time](#5-the-test-one-signer-left-out-at-a-time)
- [6. Three models](#6-three-models)
- [7. Tuning the settings](#7-tuning-the-settings)
- [8. The results and the choice](#8-the-results-and-the-choice)
- [9. "Not sure"](#9-not-sure)
- [10. The final model and Lanix's recordings](#10-the-final-model-and-lanixs-recordings)
- [11. In the app](#11-in-the-app)
- [What the 94.5% means, and doesn't](#what-the-945-means-and-doesnt)

## 1. The datasets

Two public datasets from Mendeley Data, both CC BY 4.0 (credits in
[ATTRIBUTION.md](ATTRIBUTION.md)):

| Dataset | Signers | Photos used | What they're like |
| --- | --- | --- | --- |
| [ASL-HG](https://data.mendeley.com/datasets/j4y5w2c8w9/1) | 10 | 24,000 (1,000 per letter) | 300×300, 100 per signer per letter |
| [ASLYset](https://data.mendeley.com/datasets/xs6mvhx6rh/1) | 4 | 4,800 (200 per letter) | 416×416 webcam photos in an office |

Only the 24 still letters are used. J and Z move, so Learn has the person trace them
instead, with no model.

A dataset has to say **who signed each photo**, or it can train a model but never test it
fairly (section 5). That ruled out other candidates (American Hand Signs, SignAlphaSet,
Cabana's). And a dataset is only added if it raises the score of the signers already
there: with ASLYset, ASL-HG's own signers went from 91.8% to 94.7%.

## 2. Photos to hand points

The model never sees photos. A developer page, `/dev/extract`, runs every photo through
**the same MediaPipe Hand Landmarker the app uses** ([dev.md](dev.md#extract-hand-points)):

- The browser reads the photos from disk; they're never uploaded.
- MediaPipe runs in IMAGE mode, so each photo is detected on its own, with nothing carried
  over from the one before.
- Each hand found gives **21 points** (wrist, knuckles, fingertips), each with x, y and z.
- The points go through the recorder's own code (`frameFromDetection`), so photos, recordings
  and the live webcam are all processed the same way.

The output is one file per dataset in `data/extracted/` (gitignored), described in
[data-format.md](data-format.md#extracted-files-public-datasets).

## 3. Normalizing a hand

`src/vision/landmarks/normalizeHand.js` turns the 21 points into **63 numbers** that describe
only the hand's shape:

1. **Equal units:** pixels on both axes, so a wide picture doesn't stretch the hand.
2. **Wrist at the origin:** where the hand is in the picture doesn't matter.
3. **Scaled by palm length** (wrist to the base of the middle finger, which doesn't change
   when fingers curl): how big the hand looks, or how far it is from the camera, doesn't matter.
4. **Left hands flipped** to look like right hands, so one model covers both.
5. **No rotation, on purpose:** which way the hand points carries meaning. H and U are almost
   the same shape, one sideways and one upright.

## 4. Cleaning

`training/clean.py` applies the rules in `training/dataset.py` and writes a report per
dataset ([ASL-HG](../training/reports/cleaning-asl-hg.md),
[ASLYset](../training/reports/cleaning-aslyset.md)). A photo is dropped for:

| Rule | Why |
| --- | --- |
| No hand found | Nothing to learn from |
| Two hands found | Unclear which one is the letter |
| Detected as a left hand | The signers used their right hand, so it's a misdetection |
| Hand not whole (a point too near the photo's edge) | A cut-off hand gives wrong points; the same rule as the app's camera check |
| Duplicate | Would count twice |
| Broken detection (12× further than usual from the signer's other photos of the letter) | MediaPipe misread the hand; the worst were checked by eye |

**Kept: 22,950 from ASL-HG and 4,513 from ASLYset, 27,463 in all**, from 14 signers.

The cleaning also showed something that shaped the testing: **each signer's photos are near
copies of one pose.** In ASL-HG a photo's nearest neighbour from the same signer and letter
is typically 0.064 away, against a typical spread of 0.139. Tested on random photos, a model
would have seen almost the same picture in training, and its score would be falsely high.

## 5. The test: one signer left out at a time

Every result here comes from **leave-one-signer-out** testing. For each of the 14 signers:

1. Hide that signer.
2. Train a fresh model on the other 13.
3. Test it on the hidden signer's photos.

| Test round | Trained on | Tested on |
| --- | --- | --- |
| 1 | Signers 2–14 | Signer 1 |
| 2 | Signers 1, 3–14 | Signer 2 |
| … | … | … |
| 14 | Signers 1–13 | Signer 14 |

The score is the **mean of the 24 letters' accuracy** over all 14 rounds, so the easy letters
can't hide the hard ones. It estimates how the model does for someone it has never seen,
which is every visitor. These 14 models are only for testing; the model the app uses is
trained afterwards on everyone (section 10).

## 6. Three models

**k-NN (k nearest neighbours, `training/knn.py`).** Keeps every training hand; a new hand
gets the letter most of its k nearest neighbours have. Simple, but it has to ship all 27,463
hands: about 13 MB.

**Logistic regression and a small neural network (`training/small.py`).** Both learn a few
thousand numbers (weights) instead of keeping every hand:

- **Logistic regression:** each letter's score is a weighted sum of the 63 numbers, plus a
  bias. Softmax turns the 24 scores into percentages that add up to 100%; the top one is the
  guess, and its percentage is how sure the model is.
- **Neural network (MLP):** the same, with one hidden layer in between, so it can learn
  combinations of points that a single weighted sum can't separate.

Before both, each of the 63 numbers is rescaled to a mean of 0 and a spread of 1
(StandardScaler), which helps them train.

## 7. Tuning the settings

Each model has a setting for how closely it may fit the training hands: too closely, and it
learns the signers' quirks instead of the letters. Every value was judged with the same
leave-one-signer-out test ([small.md](../training/reports/small.md)):

| Model | Values tried | Best | Score |
| --- | --- | --- | --- |
| k-NN ([knn.md](../training/reports/knn.md)) | k = 1, 3, 5, 9, 15, 25 neighbours | k = 1 | 86.0% |
| Logistic regression | C = 0.01, 0.1, 1, 10 | C = 1 | 94.5% |
| Neural network | 32, 64 or 128 hidden units × alpha = 0.0001, 0.01, 0.1, 1 | 128 units, alpha 0.1 | 94.5% |

## 8. The results and the choice

| | k-NN | Logistic regression | Neural network |
| --- | --- | --- | --- |
| Mean on unseen signers | 86.0% | **94.5%** | 94.5% |
| ASL-HG signers | 85.3% | 94.7% | 94.7% |
| ASLYset signers | 89.8% | 93.5% | 93.3% |
| Letters at 90%+ | 12 of 24 | 18 of 24 | 19 of 24 |
| File size | about 13 MB | **14 KB** | 95 KB |

**Logistic regression was chosen.** It tied the neural network on unseen signers, is about
7 times smaller, and is a few lines of JavaScript to run on every frame. A linear model is
enough here because MediaPipe has already done the hard part: the model sorts 63 clean
numbers, not pixels.

Per signer, logistic regression scored between 85% and 100%. The hardest letters are the
closed-fist and look-alike ones, where fingers hide each other from the camera:

| Letter | N | T | U | R | X | S |
| --- | --- | --- | --- | --- | --- | --- |
| Logistic regression | 81.7% | 84.8% | 84.2% | 83.5% | 83.1% | 87.0% |

Its most common mistakes: R read as U (16%), N as M (9%), X as T (9%), U as K (9%). Every
model struggles with these letters, so more varied hands would help them more than a bigger
model.

## 9. "Not sure"

When the top percentage is low, the model says "not sure" instead of guessing. The
threshold is set from the unseen signers alone: **62.2%**, the level at which 95% of their
real letters still get through.

## 10. The final model and Lanix's recordings

With the method tested, the final model is trained on **all 14 signers** (27,463 samples)
and saved as `public/models/asl-letters.json`: 1,536 weights (63 numbers plus a bias, for
each of 24 letters), 14 KB. It holds only weights, no hand points. In the browser,
`src/components/letter-check/networkModel.js` runs the same maths as `forward()` in
`training/small.py` and must give the same answers.

As a last check it ran on **Lanix's own recordings** (`data/raw/`, private, never trained on):
8 letters (B, C, D, F, I, L, W, Y), both hands, 6 takes each, from a real webcam. It got every
frame right, with none "not sure". It's one person and 8 letters, so it's a check, not the
headline number.

## 11. In the app

On Learn, the **finger rules decide** whether a letter passes
(`src/vision/landmarks/letterShapes.js`). Under the checklist, the model gives a second
opinion ("Letter model sees B, 96% sure"), and after a pass it says whether it agreed over
the hold. It was deliberately not made a gate (pass only if the model agrees too), because
that would fail correct signs on its weakest letters. The quiz doesn't show it.

## What the 94.5% means, and doesn't

- **It means:** tested on people whose photos it wasn't trained on, the model named the right
  letter 94.5% of the time on average across the 24 letters.
- **It's not the model's confidence.** "96% sure" on Learn is the model's certainty about one
  frame; 94.5% is how often it was right in testing.
- **It's on photos, not live webcams.** The datasets are posed and well lit; a dim room or an
  odd angle can be harder.
- **It's slightly optimistic.** The same test picked the best setting (C = 1) and reports its
  score, which usually flatters it by a little.
- **It's 14 people.** That's 27,463 photos, but each person's photos are close variations of
  one pose. More signers is the main way to improve it.
