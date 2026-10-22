# Cleaning report

From `sema-extracted-asl-hg-2026-10-22.json` (asl-hg, normalization 1, run on GPU in Chrome 155). Made by `training/clean.py`; the rules are in `training/dataset.py`.

**Kept 22,950 samples** of the 24 static letters, one per photo.

## Per letter (photos)

| Letter | Photos | No hand | Two hands | Detected as a left hand | Hand not whole | Duplicate | Broken detection | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | 1000 | 0 | 0 | 0 | 0 | 14 | 1 | 985 |
| B | 1000 | 0 | 0 | 0 | 95 | 10 | 0 | 895 |
| C | 1000 | 5 | 44 | 26 | 0 | 14 | 0 | 911 |
| D | 1000 | 0 | 0 | 0 | 130 | 8 | 0 | 862 |
| E | 1000 | 0 | 0 | 0 | 0 | 12 | 0 | 988 |
| F | 1000 | 0 | 0 | 0 | 55 | 0 | 0 | 945 |
| G | 1000 | 2 | 0 | 0 | 0 | 15 | 0 | 983 |
| H | 1000 | 104 | 0 | 1 | 1 | 3 | 0 | 891 |
| I | 1000 | 0 | 0 | 1 | 0 | 8 | 0 | 991 |
| K | 1000 | 0 | 0 | 0 | 0 | 19 | 0 | 981 |
| L | 1000 | 8 | 0 | 0 | 0 | 23 | 0 | 969 |
| M | 1000 | 35 | 0 | 0 | 0 | 6 | 0 | 959 |
| N | 1000 | 0 | 0 | 0 | 0 | 21 | 0 | 979 |
| O | 1000 | 0 | 0 | 0 | 0 | 5 | 0 | 995 |
| P | 1000 | 101 | 0 | 0 | 0 | 4 | 0 | 895 |
| Q | 1000 | 52 | 0 | 2 | 0 | 10 | 0 | 936 |
| R | 1000 | 21 | 0 | 0 | 0 | 16 | 0 | 963 |
| S | 1000 | 0 | 0 | 0 | 0 | 2 | 0 | 998 |
| T | 1000 | 0 | 0 | 0 | 0 | 4 | 0 | 996 |
| U | 1000 | 0 | 0 | 0 | 56 | 4 | 0 | 940 |
| V | 1000 | 0 | 0 | 0 | 31 | 6 | 0 | 963 |
| W | 1000 | 0 | 0 | 0 | 0 | 4 | 0 | 996 |
| X | 1000 | 29 | 4 | 7 | 0 | 13 | 0 | 947 |
| Y | 1000 | 0 | 0 | 0 | 0 | 18 | 0 | 982 |

## Per signer

| Signer | Kept | Fewest for one letter |
| --- | --- | --- |
| asl-hg-p01 | 2,358 | M: 65 |
| asl-hg-p02 | 2,261 | P: 52 |
| asl-hg-p03 | 2,331 | F: 64 |
| asl-hg-p04 | 2,360 | G: 90 |
| asl-hg-p05 | 2,354 | F: 81 |
| asl-hg-p06 | 2,387 | D: 88 |
| asl-hg-p07 | 2,315 | P: 71 |
| asl-hg-p08 | 2,188 | D: 28 |
| asl-hg-p09 | 2,184 | B: 5 |
| asl-hg-p10 | 2,212 | H: 24 |

Small groups come mostly from the whole-hand rule (a wrist cut off at the bottom of a signer's photos) or from no hand found. The other signers still train that letter, but a held-out signer's result for it rests on few photos.

## Broken detections

- `A/P2_A_173.jpg`

## Worth knowing

- **Near copies:** a photo's nearest neighbour among its signer's photos of the same letter is typically 0.064 away, against a typical spread of 0.139. Each signer's photos are close variations of one pose, so training and testing must be split by signer, never by photo.

- **Look-alikes:** in 57 of 240 signer-letter groups, the signer's average shape is closer to another letter (as the other signers make it) than to its own. Kept, since they're mostly real look-alikes and real differences between people; the evaluation will show their effect. The strongest:
  - asl-hg-p05 X looks like T (2.5× closer)
  - asl-hg-p10 X looks like G (1.8× closer)
  - asl-hg-p02 X looks like S (1.7× closer)
  - asl-hg-p06 A looks like T (1.7× closer)
  - asl-hg-p08 R looks like U (1.6× closer)
  - asl-hg-p01 Q looks like G (1.6× closer)
  - asl-hg-p06 N looks like T (1.6× closer)
  - asl-hg-p01 A looks like T (1.5× closer)
  - asl-hg-p04 M looks like E (1.5× closer)
  - asl-hg-p01 T looks like X (1.5× closer)
