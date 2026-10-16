# Recorder design (milestone 2.1)

Status: **approved by Lanix on 2026-10-15**, after agreeing it section by section.
**Revised 2026-10-15:** the recorder is no longer a separate page. It's the app's main page
after setup, at `/record` inside the app, so the Phase 3.1 shell, Welcome and setup pages
are built early on this branch. The changed sections are marked "(revised)".
Plan reference: [project-plan.md](../project-plan.md), Phase 2, milestone 2.1, and Phase 3.1
for the shell. Implementation plan: [recorder-implementation-plan.md](recorder-implementation-plan.md).

## Goal

A recorder page that collects labelled hand-landmark samples for training the letter
classifier (2.2). People pick a letter and a hand, sign it for a few seconds, and download
one JSON file per session. Only landmark coordinates are stored, never video or images.

It must work both when Lanix runs a session in person and when someone records alone
from the live site and sends the file to Lanix.

**2.1 is done when** (from the plan): about 8 letters plus "no letter" have been recorded
from at least 5 people, with both hands.

## Prerequisites and sequencing

Phase 1 is done (deployed on Vercel). Lanix will check Left/Right in Firefox separately;
that check is not a prerequisite.

Implementation starts only when both of these hold:

1. Lanix has filled in the training letters in `public/languages/asl/letters.json` (the
   first ~8 letters are an open decision in the plan).
2. Lanix has approved the implementation plan written from this spec.

Milestones after that:

| Milestone | What | Status change in the plan |
| --- | --- | --- |
| M1 Build | Recorder page, normalization, checker, tests, docs | none |
| M2 Pilot | Lanix records a full session: every letter in `letters.json` (training letters and the pilot-only letters A, S, M, N, T) plus "none", both hands, 3 takes each; the file passes the checker. The pilot-only letters measure how stable the handedness label is, through `mismatched` | 2.1 → In progress |
| M3 Collect | Sessions from at least 5 people, both hands, all passing the checker, in `data/raw/` | 2.1 → Done |

## Decisions

| Topic | Decision |
| --- | --- |
| Who records | Both: Lanix in person, and people alone on the live site |
| Where it lives (revised) | The Record page at `/record`, inside the single-page app, after setup (Welcome → How Sema works → Signing hand → Camera check). Returning visitors open on it. Code in `src/recorder/` |
| Hand to record (revised) | A Left/Right toggle on Record, starting on the signing hand chosen in setup. Switching it doesn't change the setting |
| Camera (revised) | The app's shared camera and hand model (`CameraProvider`), so the camera chosen in setup carries over and the model doesn't reload |
| Data kept | Raw MediaPipe landmarks and normalized landmarks |
| Hand label | The person picks Left or Right; MediaPipe's detected hand is stored too |
| Mismatched frames | Saved (with `detected` ≠ `hand`); training filters to `detected == hand`; they count against the take's quality check |
| Frames with no hand | Not saved; counted per recording |
| Sampling | One sample per 100 ms (a named constant), chosen by time |
| Tests | Vitest (dev dependency, approved) |
| Pilot-only letters | A, S, M, N, T, marked `"pilotOnly": true` in `letters.json`: recorded in the pilot to measure handedness stability, excluded from 2.2's first training set |
| Data policy | `data/raw/` is gitignored and kept private (Lanix backs it up); never committed to the public repository |
| Consent (revised) | One choice: may be used to train Sema (required to record), stored as `consent.train`. Publishing a dataset is out of scope (Lanix, 2026-10-16) |

## 1. User flow (revised)

Before Record, a new visitor goes through the app's setup:

- Welcome
- How Sema works
- Signing hand
- Camera check

Returning visitors open straight on Record. The pages and their exact text and states are
in Lanix's design files (`docs/design/`, local-only). The steps below start when Record
opens.

1. **Consent, as Record's first step.** The page explains, in plain words (draft text in section 7):
   what is saved (positions of 21 hand points, no video or photos), that people are
   identified by a code like `p03`, that the file is downloaded to their own computer and
   then sent to Lanix, that nothing is uploaded, and that they can ask Lanix to delete
   their recordings at any time. The person enters their code and ticks "My recordings
   may be used to train Sema" (required). Recording stays disabled until the code is
   entered and the box is ticked.
2. **Session ID.** Filled in automatically as today's date plus a letter (`2026-11-02a`),
   using the next unused letter in this browser for that day. It can be edited. Session
   IDs may repeat across people; recording IDs include the person, so they don't.
3. **Camera.** The app's shared camera (the one chosen in setup), with the same mirrored
   video and skeleton overlay, reusing `src/camera/` and `src/vision/`. It starts by
   itself when the recording step opens (getting there, plus the browser's permission
   prompt, is the consent), and is off on the consent and finished steps and whenever no
   camera view is on screen.
4. **Hand and letters.** A Left/Right toggle picks the hand to record. It starts on the
   signing hand from setup. The letters for that hand show as one row of tiles: the
   training letters in `letters.json`, then "None" (no letter), then the pilot-only
   letters, marked as pilot. Each tile shows accepted takes against the target (`1/3`).
   Choosing a tile shows the letter card: how to form it, a link to Lifeprint's
   fingerspelling page, and a position hint per take (1: centre, 2: closer, 3: off to one
   side). For "None": relax the hand, half-form shapes, move around. Extra takes beyond 3
   are allowed. The exact layout and wording come from the Record design.
5. **A take** (section 5): Record → 3-2-1 countdown → "Hold…" → result. The result shows
   the counts and either "Saved" or the reason it was rejected.
6. **Undo last take** removes the most recent take (accepted or rejected) from the session.
7. **Export.** Downloading ("Finish and download" in the design) saves `sema-asl-<person>-<session>.json`. In person,
   Lanix checks it (section 8) and puts it in `data/raw/`; remote participants send it to
   Lanix.

## 2. Data format

One JSON file per session. Format version 1, normalization version 1.

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

**Header fields.** `format` is bumped whenever this layout changes. `normalization` is
bumped whenever the normalization (section 3) changes. `browser` is the browser name and
major version. `cameraFps` is the median of the recordings' `cameraFps`. `consent.train`
(always `true`, since it's required to record) records the consent checkbox;
`consent.date` is the day it was ticked. The header's `person`, `session` and `language` only label
the file: **each sample's own `person`, `session` and `language` are authoritative.**

**Recordings.** One entry per take, including rejected ones. `status` is `"accepted"` or
`"rejected"`; `reason` explains a rejection and is `null` otherwise. Counts describe the
take's sampled frames:

- `kept`: frames with a hand. Saved as samples if the take is accepted.
- `mismatched`: of `kept`, frames where `detected` differs from `hand`.
- `droppedNoHand`: frames where no hand was found. Never saved.
- `cameraFps`: the camera's frame rate measured over the take (`presentedFrames`).

Samples of rejected takes are not saved; their entry in `recordings` keeps the counts, so
the evidence about mismatches and hard letters is not lost.

**Samples.** One per kept frame of an accepted take.

- `letter`: `"A"`–`"Z"`, or `"none"` for the "no letter" class.
- `hand`: the hand the person was asked to use, `"left"` or `"right"`. This is the label.
- `detected`, `detectedScore`: MediaPipe's handedness for the frame, converted to the
  physical hand with `toPhysicalHand` (`src/vision/handedness.js`) and lowercased like
  `hand`, and its confidence (0–1, 2 decimals).
- `recording`: `<person>-<session>-<letter>-<hand>-<take>`. Never split one recording
  between training and testing.
- `t`: milliseconds since capture started.
- `width`, `height`: the video's real frame size for this frame.
- `raw`: MediaPipe's 21 landmarks as returned, `x, y, z` for points 0–20 (wrist first),
  4 decimals. **In the un-mirrored camera frame**: the page mirrors only the display, with
  CSS. `x` is a fraction of the width, `y` of the height, `z` is depth relative to the
  wrist on roughly the same scale as `x`.
- `landmarks`: the 63 numbers from `normalizeHand` (section 3), 4 decimals. Left hands are
  flipped to look like right hands, **using the detected hand, for now**: which hand
  drives the flip is an open decision in the plan. Training filters to
  `detected == hand`, and on those frames both choices give the same numbers.

## 3. Normalization

`src/vision/normalizeHand.js`, a pure function:
`normalizeHand(raw, { width, height, hand }) → 63 numbers`. It exports
`NORMALIZATION_VERSION = 1`, which is written to the file.

1. **Equal units.** Multiply `x` by `width`, `y` by `height` and `z` by `width` (MediaPipe
   gives `z` on roughly the scale of `x`). Without this, a hand on a 640×480 camera looks a
   third wider than it is.
2. **Wrist to origin.** Subtract point 0 from every point.
3. **Scale by palm length.** Divide by the 3D distance from point 0 (wrist) to point 9
   (base of the middle finger), which doesn't change when fingers curl. Using `z` here is a
   **2.2 experiment** (with vs. without `z`), because `z` is the noisiest coordinate. If
   the palm length is near zero, the frame is treated as having no hand.
4. **Flip left hands.** If the hand used for flipping is left, negate every `x`. For now
   that is the detected hand (see section 2); the code comment says "detected, for now".
5. **No rotation**, deliberately: orientation carries meaning (H and U share a handshape;
   H points sideways).

The live classifier in 2.3 will call the same function.

## 4. Components (revised)

**New**

- `src/pages/record/RecordPage.jsx`: the Record page: consent, camera, hand toggle, letter
  tiles, take result, export. It's one of the app's pages, opened at `/record`. The
  shell around it (router, shared camera, menu, setup pages) is specified in the
  implementation plan's tasks 6–9 and the project plan's Phase 3.1.
- `src/recorder/useRecording.js`: one take as a state machine
  (idle → countdown → settling → capturing → review).
- `src/recorder/takeRules.js`: pure functions and constants: the sampler and the quality
  rule (section 5).
- `src/recorder/sessionStore.js`: builds the session file, autosaves it in the browser,
  restores it, downloads it, deletes it.
- `src/vision/normalizeHand.js`: section 3.
- `src/vision/browserName.js`: `browserName()`, moved out of `useBenchmark.js` so the
  benchmark and the recorder report browsers the same way.
- `public/languages/asl/letters.json`: a list of letter entries, starting with only the
  pilot-only letters:

  ```json
  {
    "language": "asl",
    "letters": [
      { "letter": "A", "pilotOnly": true },
      { "letter": "S", "pilotOnly": true },
      { "letter": "M", "pilotOnly": true },
      { "letter": "N", "pilotOnly": true },
      { "letter": "T", "pilotOnly": true }
    ]
  }
  ```

  Lanix adds the training letters as `{ "letter": "B" }` entries. Until there is at least
  one, the page says "No training letters configured yet".
- `scripts/check-session.js`: section 8.

**Changed**

- `vercel.json`: rewrites every path to `index.html`, so refreshing `/record` (or any
  page) loads the app. Vercel serves real files first, so the model and `letters.json`
  are unaffected.
- `src/vision/useHandDetection.js`: an optional listener that receives each detection
  result (landmarks, handedness, video size, time). The `/dev` page doesn't use it.
- `src/vision/useBenchmark.js`: imports `browserName` from its new file.
- `package.json`: Vitest as a dev dependency; scripts `test` and `check-session`.
- `.gitignore`: `data/raw/` (added together with this spec's data policy).

**Moved:** the Phase 1 tracking page (camera readouts, delegate picker, benchmark) moves
from `/` to an unlisted `/dev` page, unchanged, because `/` becomes Welcome.

**Routing note (revised).** There is one HTML file. The app's own router
(`src/app/router.js`) maps `/record` and the other paths to pages. The earlier rule
("a future single-page-app rewrite must exclude `/record`") no longer applies.

## 5. Take rules

Constants in `src/recorder/takeRules.js`:

| Constant | Value |
| --- | --- |
| `COUNTDOWN_MS` | 3000 |
| `SETTLE_MS` | 500 (after the countdown, before capture, so the hand can finish forming the shape) |
| `CAPTURE_MS` | 3000 |
| `SAMPLE_INTERVAL_MS` | 100 (J and Z may need faster sampling in Phase 4) |
| `MIN_MATCHED_SHARE` | 0.8 |

- The page shows "Hold…" from the start of settling to the end of capture.
- **Sampler:** during capture, the first detection result at or after each
  `SAMPLE_INTERVAL_MS` step is sampled. Sampling by time keeps ~30 samples per take even
  if the camera slows down (for example to 20 fps).
- **Quality rule:** expected samples = `CAPTURE_MS / SAMPLE_INTERVAL_MS` (30). A take
  **passes when `kept − mismatched ≥ 24`** (`MIN_MATCHED_SHARE × expected`). Otherwise it
  is rejected with a reason built from the counts, for example "18 of 30 frames matched:
  8 had no hand, 4 had the other hand".
- A take is discarded, with a message, if during it the camera stops, the tab is hidden or
  the hand model reloads. Discarded takes are not added to `recordings`: they say nothing
  about the hand or the letter.

## 6. Session storage and failures

- **Autosave.** After every take, the session is saved in `localStorage`
  (`sema.recorder.session`). Reads and writes are wrapped in try/catch. If saving fails
  (storage unavailable or full), recording continues with a warning: "Progress isn't being
  saved here; download the file before closing."
- **Restore.** On opening Record (after a reload, or coming back from another page), a
  saved session is offered back: "Continue session
  p03 · 2026-11-02a (12 takes)". Starting a new session requires downloading or deleting
  the old one first.
- **Leaving.** If there are takes that haven't been downloaded, closing the tab triggers
  the browser's "Leave site?" warning.
- **Delete this session** clears it from the browser.
- **Record is disabled** until the code is valid (`p` followed by at least two digits),
  "May be used to train Sema" is ticked, the camera is live, the model is ready and a cell is chosen.
- Camera and model errors use the existing plain-language messages.

## 7. Consent and privacy

Consent text:

> Sema is a student project that teaches ASL fingerspelling. This page records the
> positions of 21 points on your hand while you sign letters. It does not save video or
> photos. Your recordings are labelled with a code (like p03), never your name.
>
> Everything stays in this browser until you download the file at the end; nothing is
> uploaded. You then send the file to Lanix, who keeps it private and uses it to train and
> test Sema's letter recognition. Ask Lanix to delete your recordings at any time. You can
> stop whenever you like, and "Delete this session" removes what's stored in this browser.
>
> - [ ] My recordings may be used to train Sema. *(required)*

(Revised 2026-10-16: the page uses the Record design's wording for this step, which says
the same things: "Help train Sema", a "What gets saved" list (21 points about ten times
a second, no video or photos; the code, letter, hand and browser name; nothing uploaded,
the file is sent to Lanix), the training box marked (required), and "You can ask Lanix
to delete your recordings at any time." The design's optional publishing box is left
out: publishing is out of scope.)

**Data policy.** Recorded sessions live in `data/raw/`, which is gitignored: they are kept
private and backed up by Lanix, never committed to the public repository. Publishing a
dataset is out of scope. What stays public: the code, evaluation results, confusion matrices and
trained weights.

**No `noindex` (revised).** Record is the app's main page, so search engines may list the
site as usual.

**Consistency with "How Sema works" (revised).** Setup step 2a must not contradict the
consent text. Its second point read "Nothing is uploaded or recorded", which clashed
with a Record page that saves hand points. Lanix changed it on 2026-10-15 to: "Hand
detection runs in your browser. Your video is never uploaded or recorded." 2a's "Sema
doesn't know who you are" stays true: recordings carry a code (`p03`), never a name, and
the code is matched to a person only in Lanix's own notes. The consent text above agrees
with the rest of 2a (nothing uploaded, everything kept in this browser until
downloaded).

## 8. Session checker

`scripts/check-session.js`, run as `npm run check-session -- <file.json>` before a file
goes into `data/raw/`. It exits with an error if any check fails.

Checks:

1. `format` and `normalization` are known versions (1 and 1).
2. Every sample's `raw` and `landmarks` have exactly 63 numbers.
3. `consent.train` is `true` and `consent.date` is a date.
4. No recording ID appears twice within the file, or in any other file in `data/raw/`
   (the file itself is skipped if it is already there).
5. Every sample's `recording` has an entry in `recordings` with status `accepted`, and
   every accepted entry's `kept` matches its number of samples.

It prints a table of takes per letter × hand: accepted and rejected.

The validation logic is an exported function, so Vitest can test it; the command-line part
only reads files and prints.

## 9. Testing

**Vitest** (`npm test`):

- `normalizeHand`: the wrist ends at (0, 0, 0); palm length becomes 1; moving or scaling
  the same hand doesn't change the output; the same hand at 640×480 and 1280×720 gives
  the same output; a flipped left hand matches the mirrored right hand; flipping twice
  gives the original.
- Quality rule: 24 of 30 matched passes, 23 fails; reasons and counts are right;
  mismatched and no-hand frames are counted separately.
- Sampler: one sample per interval by time; a 20 fps camera still gives ~30; nothing is
  sampled during settling.
- Session file: recording IDs (`p03-2026-11-02a-W-left-2`); rejected takes appear in
  `recordings` without samples; header and consent fields (`train`, `date`)
  are filled in.
- Checker: each check fails on a file built to break it.

**End to end** (headless Chrome with a fake camera, run by Claude Code):

- A hand-only video gives an accepted take; the downloaded file passes the checker.
- A hand-then-empty video gives a rejected take with no-hand counts.
- A mirrored copy of the hand photo should make MediaPipe detect the other hand, giving a
  mismatch rejection (to confirm in practice).
- Refreshing offers the session back; Delete clears it.
- (revised) `npm run build` produces one HTML file. `/record` loads directly and after a
  refresh in `vite preview`, and a new visitor opening `/record` is sent to Welcome.
- (revised) Leaving Record through the menu mid-take discards the take, and leaves no
  camera stream running.

**By Lanix** (Chrome, real webcam): real left and right hands, the consent text, the
"Leave site?" warning, and the downloaded file. Then the pilot (M2).

## 10. Docs

- `docs/data-format.md`: section 2 as a reference, including the coordinate conventions,
  "flip by detected hand, for now", the z experiment, and the version-bump rules.
- README: a "Recording sessions" section: running a session in person and remotely, what
  participants are told, where files go (`data/raw/`, private), and the checker.
- `CLAUDE.md`: recorder conventions, routing (one HTML file, `src/app/router.js`) and the
  shared camera (revised).
- `docs/project-plan.md`: the Status table as in the milestones above.

## Out of scope

- Choosing the first ~8 letters (Lanix's open decision; `letters.json` starts with only
  the pilot-only letters).
- Training and evaluation (2.2), the live classifier (2.3), finger hints (2.4).
- MediaPipe `worldLandmarks`.
- (revised) Lessons, the alphabet home and practice (Phase 3.3–3.4, on `phase-3-preview`):
  Learn and Practice are placeholders on this branch. The top-bar hand menu, Reset
  progress and per-letter progress (rest of 3.2).

## Open questions carried forward

- Which hand drives the left-hand flip (open decision in the plan).
- Whether `z` belongs in the palm-length scale (2.2 experiment).
- The first ~8 letters (open decision in the plan).
