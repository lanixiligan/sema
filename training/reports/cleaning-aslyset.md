# Cleaning report

From `sema-extracted-aslyset-2026-10-22.json` (aslyset, normalization 1, run on GPU in Chrome 155). Made by `training/clean.py`; the rules are in `training/dataset.py`.

**Kept 4,513 samples** of the 24 static letters, one per photo.

## Per letter (photos)

| Letter | Photos | No hand | Two hands | Detected as a left hand | Hand not whole | Duplicate | Broken detection | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | 200 | 0 | 0 | 0 | 0 | 2 | 0 | 198 |
| B | 200 | 1 | 0 | 0 | 0 | 1 | 0 | 198 |
| C | 200 | 11 | 3 | 0 | 0 | 0 | 0 | 186 |
| D | 200 | 12 | 0 | 0 | 0 | 0 | 0 | 188 |
| E | 200 | 0 | 0 | 0 | 0 | 0 | 0 | 200 |
| F | 200 | 0 | 1 | 0 | 0 | 3 | 0 | 196 |
| G | 200 | 26 | 0 | 0 | 0 | 0 | 0 | 174 |
| H | 200 | 9 | 0 | 0 | 3 | 3 | 0 | 185 |
| I | 200 | 2 | 0 | 0 | 0 | 0 | 0 | 198 |
| K | 200 | 0 | 0 | 0 | 0 | 0 | 0 | 200 |
| L | 200 | 1 | 0 | 0 | 0 | 4 | 0 | 195 |
| M | 200 | 24 | 3 | 6 | 0 | 2 | 0 | 165 |
| N | 200 | 8 | 0 | 0 | 0 | 0 | 0 | 192 |
| O | 200 | 18 | 0 | 1 | 0 | 0 | 0 | 181 |
| P | 200 | 47 | 0 | 1 | 0 | 0 | 0 | 152 |
| Q | 200 | 25 | 1 | 4 | 1 | 0 | 0 | 169 |
| R | 200 | 15 | 0 | 1 | 0 | 0 | 0 | 184 |
| S | 200 | 3 | 0 | 0 | 0 | 0 | 0 | 197 |
| T | 200 | 1 | 0 | 0 | 0 | 3 | 0 | 196 |
| U | 200 | 15 | 0 | 2 | 0 | 0 | 0 | 183 |
| V | 200 | 6 | 0 | 0 | 0 | 0 | 0 | 194 |
| W | 200 | 2 | 0 | 0 | 0 | 0 | 0 | 198 |
| X | 200 | 13 | 2 | 0 | 0 | 0 | 0 | 185 |
| Y | 200 | 1 | 0 | 0 | 0 | 0 | 0 | 199 |

## Per signer

| Signer | Kept | Fewest for one letter |
| --- | --- | --- |
| aslyset-p01 | 1,152 | Q: 37 |
| aslyset-p02 | 1,062 | P: 27 |
| aslyset-p03 | 1,123 | M: 31 |
| aslyset-p04 | 1,176 | P: 37 |

Small groups come mostly from the whole-hand rule (a wrist cut off at the bottom of a signer's photos) or from no hand found. The other signers still train that letter, but a held-out signer's result for it rests on few photos.

## Broken detections

None.

## Worth knowing

- **Near copies:** a photo's nearest neighbour among its signer's photos of the same letter is typically 0.241 away, against a typical spread of 0.649. Each signer's photos are close variations of one pose, so training and testing must be split by signer, never by photo.

- **Look-alikes:** in 11 of 96 signer-letter groups, the signer's average shape is closer to another letter (as the other signers make it) than to its own. Kept, since they're mostly real look-alikes and real differences between people; the evaluation will show their effect. The strongest:
  - aslyset-p01 T looks like N (1.9× closer)
  - aslyset-p02 D looks like X (1.5× closer)
  - aslyset-p02 S looks like T (1.4× closer)
  - aslyset-p03 U looks like V (1.3× closer)
  - aslyset-p02 R looks like U (1.2× closer)
  - aslyset-p02 M looks like N (1.1× closer)
  - aslyset-p04 U looks like R (1.1× closer)
  - aslyset-p03 S looks like T (1.1× closer)
  - aslyset-p04 T looks like S (1.1× closer)
  - aslyset-p02 C looks like O (1.0× closer)
