# Session file format

The recorder (`/dev/record`, milestone 2.1) saves one JSON file per session:
`sema-asl-<person>-<session>.json`. This is the reference for that file.
Design background: [recorder-design.md](archive/recorder-design.md).

**Privacy:** session files go in `data/raw/`, which is gitignored. They stay private
(backed up by Lanix) and are never committed to the public repository.

Check a file before keeping it: `npm run check-session -- <file>`.

## Example

```json
{
  "format": 1,
  "normalization": 1,
  "language": "asl",
  "person": "p03",
  "session": "2026-11-02a",
  "browser": "Chrome 155",
  "cameraFps": 30.0,
  "consent": { "train": true, "date": "2026-11-02" },
  "recordings": [
    {
      "recording": "p03-2026-11-02a-W-left-2",
      "letter": "W",
      "hand": "left",
      "take": 2,
      "status": "accepted",
      "reason": null,
      "kept": 29,
      "mismatched": 1,
      "droppedNoHand": 1,
      "cameraFps": 30.0
    }
  ],
  "samples": [
    {
      "person": "p03",
      "session": "2026-11-02a",
      "language": "asl",
      "letter": "W",
      "hand": "left",
      "detected": "left",
      "detectedScore": 0.97,
      "recording": "p03-2026-11-02a-W-left-2",
      "take": 2,
      "t": 400,
      "width": 640,
      "height": 480,
      "raw": [0.5123, 0.7012, -0.0001, "... 63 numbers"],
      "landmarks": [0, 0, 0, "... 63 numbers"]
    }
  ]
}
```

## Header

| Field | Meaning |
| --- | --- |
| `format` | Version of this layout. **Bump it whenever the layout changes.** |
| `normalization` | Version of the normalization that produced `landmarks`. **Bump it whenever `src/vision/landmarks/normalizeHand.js` changes.** |
| `language` | `"asl"` |
| `person`, `session` | The participant code (`p03`) and session ID (`2026-11-02a`). Session IDs can repeat across people. |
| `browser` | Browser and major version, e.g. `"Chrome 155"`. |
| `cameraFps` | Median of the recordings' `cameraFps`. |
| `consent.train` | Always `true`: "I agree that the hand-movement data I record may be used to improve Sema" must be ticked to record (before 2026-10-18 it read "My recordings may be used to train Sema"). |
| `consent.date` | The day consent was given. |

The header's `person`, `session` and `language` only label the file. **Each sample's
own `person`, `session` and `language` are authoritative.**

## Recordings

One entry per take, including rejected takes. Takes interrupted by the camera stopping,
the hand model reloading or the tab being hidden are not logged: they say nothing about
the hand or the letter.

| Field | Meaning |
| --- | --- |
| `recording` | `<person>-<session>-<letter>-<hand>-<take>`. Unique within a session and across `data/raw/`. |
| `letter` | `"A"`–`"Z"`. Sessions recorded before 2026-10-23 can also hold `"none"` (a "no letter" class, since dropped: Sema only checks the letter it asked for); training skips those takes. |
| `hand` | The hand the participant was asked to use: `"left"` or `"right"`. |
| `take` | Take number for this letter and hand: one more than the highest so far, counting rejected attempts. A deleted take leaves a gap; numbers are never reused within a session. |
| `status` | `"accepted"` or `"rejected"`. |
| `reason` | Why a take was rejected, e.g. `"18 of 30 frames matched: 8 had no hand, 4 had the other hand"`; `null` if accepted. |
| `kept` | Sampled frames with a hand (saved as samples if accepted). |
| `mismatched` | Of `kept`, frames where `detected` differs from `hand`. |
| `droppedNoHand` | Sampled frames with no hand. Never saved. |
| `cameraFps` | The camera's frame rate during the take (`presentedFrames`), or `null` if it couldn't be read. |

A take is sampled every 100 ms for 3 seconds (30 expected samples), starting 0.5 s after
the countdown. It is **accepted when `kept − mismatched ≥ 24`**. Rejected takes keep
their entry and counts but no samples.

## Samples

One per kept frame of an accepted take.

| Field | Meaning |
| --- | --- |
| `letter`, `hand` | The label (what was asked for). |
| `detected`, `detectedScore` | MediaPipe's handedness for this frame, converted to the physical hand (`src/vision/tracking/handedness.js`) and lowercased, and its confidence (0–1, 2 decimals). |
| `recording`, `take` | The recording this frame belongs to. **Never split one recording between training and testing.** |
| `t` | Milliseconds since capture started. |
| `width`, `height` | The video's real frame size. |
| `raw` | MediaPipe's 21 landmarks as returned: `x, y, z` for points 0–20, wrist first, 4 decimals. |
| `landmarks` | The 63 normalized numbers (below), 4 decimals. |

**Mismatched frames are saved** (`detected` ≠ `hand`), so the file shows how stable
MediaPipe's handedness is. **Training filters to `detected == hand`.**

## Coordinate conventions

- **`raw` is in the un-mirrored camera frame.** The page mirrors only the display, with
  CSS. `x` is a fraction of the frame width and `y` of the height (0 to 1; slightly
  outside when part of the hand is out of frame). `z` is depth relative to the wrist, on
  roughly the same scale as `x`.
- **`landmarks` are flipped for left hands using the detected hand, for now.** Which hand
  drives the flip (the detected hand, or the user's setting) is an open decision in the
  plan. On the frames training uses (`detected == hand`) both choices give the same
  numbers.

## Normalization (version 1)

`src/vision/landmarks/normalizeHand.js`, applied per frame:

1. **Equal units:** `x × width`, `y × height`, `z × width` (pixels on both axes).
2. **Wrist to origin:** subtract point 0 from every point.
3. **Scale by palm length:** divide by the 3D distance from point 0 (wrist) to point 9
   (base of the middle finger). Whether `z` belongs in this distance is an experiment
   for milestone 2.2, since `z` is the noisiest coordinate.
4. **Flip left hands:** negate every `x` when the hand (detected, for now) is left.
5. **No rotation**, deliberately: orientation carries meaning (H and U share a handshape;
   H points sideways).

Frames whose palm length is about zero are treated as having no hand.

## Extracted files (public datasets)

`/dev/extract` (a developer tool, behind the access code) runs a public dataset's photos through the same
hand model and normalization as the recorder, and saves one file:
`sema-extracted-<dataset>-<date>.json`. Keep it in `data/extracted/` (gitignored). How to run
it: [dev.md](dev.md#extract-hand-points).

Each dataset lives in its own folder in `data/public/` (gitignored), and the folder's name
is the dataset's name (`DATASETS` in `src/pages/dev/extract/extractFile.js`). A model trained
on one must credit its authors.

- **ASL-HG**, `data/public/asl-hg/` (Mendeley Data, CC BY 4.0,
  [doi:10.17632/j4y5w2c8w9.1](https://data.mendeley.com/datasets/j4y5w2c8w9/1)): 36,000
  photos, 300×300, of 10 signers, in one folder per label (A–Z, 0–9), 100 photos per signer
  and label, named `P<signer>_<label>_<number>.jpg`.
- **ASLYset**, `data/public/aslyset/` (Mendeley Data, CC BY 4.0,
  [doi:10.17632/xs6mvhx6rh.1](https://data.mendeley.com/datasets/xs6mvhx6rh/1)): 5,200
  photos, 416×416 PNG, of 4 signers, webcam pictures in an office. `images/User<n>/<label>/`
  holds 50 photos per signer and label, named `User<n>_<LABEL>_<number>.png`. The labels are
  the 24 static letters, in lowercase folders, and two other signs, FN and SP, which are
  skipped. `labels/` holds YOLO boxes, not photos.

None of Sema's code reads the photos outside `/dev/extract`.

How the points are made: the app's own `loadHandLandmarker` (2 hands, GPU or CPU), switched
to IMAGE mode with `setOptions({ runningMode: 'IMAGE' })` so each photo is detected on its
own, with nothing carried over from the photo before. Each hand found then goes through the
recorder's `frameFromDetection` (handedness, the left-hand flip, `normalizeHand`) and is
rounded like a session file.

### Header

| Field | Meaning |
| --- | --- |
| `kind` | `"extracted"`. Session files have no `kind`. |
| `format` | Version of this layout, numbered separately from session files. |
| `normalization`, `language` | As in a session file. |
| `dataset` | The dataset's folder name: `"asl-hg"` or `"aslyset"`. |
| `browser`, `delegate` | Where it ran: `"Chrome 155"`, and `"GPU"` or `"CPU"` (they can give slightly different points). |
| `date` | The day it ran. |
| `photos` | Photos read. |
| `complete` | `false` if the run was stopped before the last photo. |
| `misses` | `{ image, reason }` for each photo with no sample: `"no hand"` or `"unreadable"`. |

### Samples

Laid out like a session file's samples, with these differences:

| Field | Meaning |
| --- | --- |
| `person` | The dataset and signer, from the file name: `P10_B_1000.jpg` gives `asl-hg-p10` and `User3_N_30.png` gives `aslyset-p03`, so they never clash with each other or with Sema's own codes. **Split training and testing by `person`, never by photo:** one signer's photos of a letter are nearly alike. |
| `letter` | The photo's label: `"A"`–`"Z"`, or a digit `"0"`–`"9"`. Digits 6 and 9 have the same handshapes as W and F. |
| `image` | The photo, as `<folder>/<file name>`, the folder being the label's (`B/P10_B_1000.jpg`, `n/User3_N_30.png`). |
| `handsFound` | Hands in the photo. With two, each hand is its own sample; cleaning decides what to keep. |

There is no `hand`, `session`, `recording`, `take` or `t`: the photos don't say which hand
was used, and they aren't takes. `detected` and `detectedScore` mean the same as in a
session file.
