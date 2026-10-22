# k-NN classifier report

Trained on `sema-extracted-asl-hg-2026-10-22.json`, `sema-extracted-aslyset-2026-10-22.json` after cleaning: 27,463 samples of the 24 static letters from 14 signers. Tested on held-out signers and on `sema-asl-p00-2026-10-20a.json` (1,440 frames). Made by `training/train.py`.

## Choosing k

Mean of the letters' accuracy, testing each signer in turn on a model trained on the others.

| k | Accuracy |
| --- | --- |
| 1 | 86.0% |
| 3 | 85.5% |
| 5 | 85.3% |
| 9 | 84.8% |
| 15 | 85.2% |
| 25 | 84.8% |

Chosen: **k = 1**.

## People it has never seen (the public photos)

Mean accuracy **86.0%**. 12 of 24 letters reach 90%: A, B, F, G, H, I, K, L, P, Q, W, Y.

Per dataset (its signers held out in turn): asl-hg 85.3%, aslyset 89.8%.

| Letter | Right | Most often taken for |
| --- | --- | --- |
| A | 94.5% | T (5%) |
| B | 100.0% | — |
| C | 83.1% | O (16%) |
| D | 75.0% | X (23%) |
| E | 76.4% | S (14%) |
| F | 99.9% | C (<1%) |
| G | 97.4% | H (2%) |
| H | 98.6% | G (1%) |
| I | 99.9% | Y (<1%) |
| K | 99.0% | R (1%) |
| L | 99.8% | D (<1%) |
| M | 73.0% | N (15%) |
| N | 52.6% | T (22%) |
| O | 81.2% | C (18%) |
| P | 98.7% | Q (1%) |
| Q | 90.9% | G (8%) |
| R | 61.4% | U (33%) |
| S | 64.9% | T (18%) |
| T | 82.5% | S (13%) |
| U | 66.6% | R (17%) |
| V | 86.5% | K (10%) |
| W | 100.0% | — |
| X | 83.0% | T (9%) |
| Y | 100.0% | — |

Per held-out signer: asl-hg-p01 78%, asl-hg-p02 90%, asl-hg-p03 76%, asl-hg-p04 96%, asl-hg-p05 87%, asl-hg-p06 82%, asl-hg-p07 87%, asl-hg-p08 75%, asl-hg-p09 90%, asl-hg-p10 90%, aslyset-p01 93%, aslyset-p02 91%, aslyset-p03 88%, aslyset-p04 88%.

Most common mistakes: R as U 33%, N as T 22%, D as X 23%, N as M 20%, O as C 18%, S as T 18%, U as R 17%, C as O 16%, E as S 14%, M as N 15%.

## "Not sure"

A hand is "not sure" when its neighbours are further than a threshold. The threshold is set from the held-out signers alone: 95% of their real letters are closer than **1.037**. How other thresholds would trade off:

| Unseen people's letters kept | Threshold | Lanix's letters called "not sure" |
| --- | --- | --- |
| 80% | 0.729 | 24% |
| 90% | 0.880 | 8% |
| 95% | 1.037 | 0% |
| 97.5% | 1.189 | 0% |
| 99% | 1.362 | 0% |

## Lanix's recordings

Trained on all the photos, with the threshold above. Frames: right / "not sure" / wrong letter. Takes: how many takes most of whose frames were right.

| Letter | Left hand | Right hand | Takes right | Most often taken for |
| --- | --- | --- | --- | --- |
| B | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| C | 99% / 1% / 0% | 100% / 0% / 0% | 6 of 6 | not sure (1) |
| D | 80% / 0% / 20% | 100% / 0% / 0% | 5 of 6 | X (18) |
| F | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| I | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| L | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| W | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |
| Y | 100% / 0% / 0% | 100% / 0% / 0% | 6 of 6 | — |

## Against the proposed bar

The bar proposed for switching a letter on (not yet agreed), for the letters Lanix recorded:

- Every letter right on at least 90% of frames, each hand: fails: D left.
- No letter mistaken for another on more than 5% of frames: fails: D left as X 20%.
- At least 5 of 6 takes right for every letter: passes.
