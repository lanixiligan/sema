# Small models report

Logistic regression and a small neural network, trained on `sema-extracted-asl-hg-2026-10-22.json`, `sema-extracted-aslyset-2026-10-22.json` after cleaning: 27,463 samples of the 24 static letters from 14 signers. Tested on held-out signers and on `sema-asl-p00-2026-10-20a.json` (1,440 frames), next to the k-NN from `reports/knn.json` (2026-10-23). Made by `training/train_small.py`.

## Choosing the settings

Mean of the letters' accuracy, testing each signer in turn on a model trained on the others.

| Model | Setting | Accuracy |
| --- | --- | --- |
| logistic regression | C = 0.01 | 90.0% |
| logistic regression | C = 0.1 | 93.3% |
| logistic regression | C = 1 | 94.5% |
| logistic regression | C = 10 | 93.8% |
| neural network | 32 hidden units, alpha = 0.0001 | 93.1% |
| neural network | 32 hidden units, alpha = 0.01 | 92.8% |
| neural network | 32 hidden units, alpha = 0.1 | 93.9% |
| neural network | 32 hidden units, alpha = 1 | 92.3% |
| neural network | 64 hidden units, alpha = 0.0001 | 93.1% |
| neural network | 64 hidden units, alpha = 0.01 | 93.3% |
| neural network | 64 hidden units, alpha = 0.1 | 93.4% |
| neural network | 64 hidden units, alpha = 1 | 92.5% |
| neural network | 128 hidden units, alpha = 0.0001 | 93.9% |
| neural network | 128 hidden units, alpha = 0.01 | 93.6% |
| neural network | 128 hidden units, alpha = 0.1 | 94.5% |
| neural network | 128 hidden units, alpha = 1 | 92.5% |

Chosen: logistic regression, **C = 1**; neural network, **128 hidden units, alpha = 0.1**.

## People it has never seen (the public photos)

| Letter | k-NN | Logistic regression | Neural network |
| --- | --- | --- | --- |
| A | 94.5% | 100.0% | 95.4% |
| B | 100.0% | 99.9% | 100.0% |
| C | 83.1% | 97.0% | 98.3% |
| D | 75.0% | 95.3% | 91.2% |
| E | 76.4% | 97.7% | 98.1% |
| F | 99.9% | 99.4% | 99.7% |
| G | 97.4% | 97.9% | 96.3% |
| H | 98.6% | 99.0% | 99.0% |
| I | 99.9% | 99.8% | 99.8% |
| K | 99.0% | 99.8% | 99.7% |
| L | 99.8% | 99.7% | 99.9% |
| M | 73.0% | 99.2% | 90.9% |
| N | 52.6% | 81.7% | 76.7% |
| O | 81.2% | 99.1% | 98.8% |
| P | 98.7% | 95.7% | 96.9% |
| Q | 90.9% | 93.3% | 97.4% |
| R | 61.4% | 83.5% | 90.3% |
| S | 64.9% | 87.0% | 84.9% |
| T | 82.5% | 84.8% | 84.3% |
| U | 66.6% | 84.2% | 86.8% |
| V | 86.5% | 91.4% | 93.3% |
| W | 100.0% | 99.9% | 100.0% |
| X | 83.0% | 83.1% | 89.3% |
| Y | 100.0% | 99.8% | 99.6% |
| **Mean** | **86.0%** | **94.5%** | **94.5%** |
| Mean, asl-hg signers | 85.3% | 94.7% | 94.7% |
| Mean, aslyset signers | 89.8% | 93.5% | 93.3% |
| Letters at 90%+ | 12 of 24 | 18 of 24 | 19 of 24 |

Logistic regression, per held-out signer: asl-hg-p01 85%, asl-hg-p02 99%, asl-hg-p03 89%, asl-hg-p04 100%, asl-hg-p05 95%, asl-hg-p06 95%, asl-hg-p07 98%, asl-hg-p08 93%, asl-hg-p09 96%, asl-hg-p10 96%, aslyset-p01 97%, aslyset-p02 96%, aslyset-p03 93%, aslyset-p04 89%. Most common mistakes: R as U 16%, N as M 9%, X as T 9%, N as T 8%, U as K 9%, V as K 7%.

Neural network, per held-out signer: asl-hg-p01 92%, asl-hg-p02 100%, asl-hg-p03 89%, asl-hg-p04 97%, asl-hg-p05 91%, asl-hg-p06 95%, asl-hg-p07 99%, asl-hg-p08 100%, asl-hg-p09 94%, asl-hg-p10 92%, aslyset-p01 97%, aslyset-p02 96%, aslyset-p03 94%, aslyset-p04 88%. Most common mistakes: N as M 13%, T as S 11%, U as R 10%, R as U 9%, X as T 9%, N as T 9%.

## Lanix's recordings, side by side

Each model trained on all the photos, with its own "not sure" threshold. Share of frames right, left hand / right hand.

| Letter | k-NN | Logistic regression | Neural network |
| --- | --- | --- | --- |
| B | 100% / 100% | 100% / 100% | 100% / 100% |
| C | 99% / 100% | 100% / 100% | 100% / 100% |
| D | 80% / 100% | 100% / 100% | 100% / 100% |
| F | 100% / 100% | 100% / 100% | 100% / 100% |
| I | 100% / 100% | 100% / 100% | 100% / 100% |
| L | 100% / 100% | 100% / 100% | 100% / 100% |
| W | 100% / 100% | 100% / 100% | 100% / 100% |
| Y | 100% / 100% | 100% / 100% | 100% / 100% |

## The model for the browser

The better of the two on people it has never seen: **logistic regression** (C = 1), 1,536 weights, 14 KB, saved as `public/models/asl-letters.json` (the k-NN's file is 11 MB). The rest of this report is about this model.

## "Not sure"

A hand is "not sure" when its top percentage is under a threshold. The threshold is set from the held-out signers alone: 95% of their real letters get at least **62.2%**. How other thresholds would trade off:

| Unseen people's letters kept | Threshold | Lanix's letters called "not sure" |
| --- | --- | --- |
| 80% | 91.2% | 1% |
| 90% | 75.6% | 0% |
| 95% | 62.2% | 0% |
| 97.5% | 53.9% | 0% |
| 99% | 48.4% | 0% |

## Lanix's recordings

Trained on all the photos, with the threshold above. Frames: right / "not sure" / wrong letter. Takes: how many takes most of whose frames were right.

| Letter | Left hand | Right hand | Takes right | Most often taken for |
| --- | --- | --- | --- | --- |
| B | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| C | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| D | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| F | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| I | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| L | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| W | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| Y | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |

## Against the proposed bar

The bar proposed for switching a letter on (not yet agreed), for the letters Lanix recorded:

- Every letter right on at least 90% of frames, each hand: passes.
- No letter mistaken for another on more than 5% of frames: passes.
- At least 5 of 6 takes right for every letter: passes.
