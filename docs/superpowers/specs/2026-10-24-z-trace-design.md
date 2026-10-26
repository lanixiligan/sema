# Z tracing: a path-following check for Letter Z

## Intent and why

Letters J and Z move, so Phase 2's classifier (trained only on still photos)
can't check them, and the plan parked them for Phase 4 ("the remaining
letters"). Training a motion classifier would need its own recorded dataset of
people signing J and Z, which doesn't exist yet.

Z's motion is a drawn shape: the signer holds one handshape and traces a Z in
the air with the index fingertip. That means Sema doesn't need to recognize
the motion as a learned gesture at all — it can check it geometrically,
against a known path, the same way `letterShapes.js` checks a static
handshape against hand-picked rules instead of asking the model. No motion
training data, no "Z" class, no `src/recognition/` folder.

This covers Z only. J stays a moving, unavailable letter for now (still in
`MOVING_LETTERS`); its own motion (a hook-shaped path from a pinky-extended
handshape) is a later, separate decision.

## Goals

- Practice can check Z: pick Z in the guide, make the handshape, trace a Z
  shown on the camera view with the index fingertip, and get "That's Z!"
  the same way every other letter does.
- No new runtime dependency, no training step, no recorded dataset.
- The mechanism (path + handshape rule) is general enough that a later J
  design can reuse it, without building that now.

## Non-goals

- J. It stays parked.
- Scoring how well-formed the Z is beyond "close enough to the line, in
  order" — this isn't a handwriting grader.
- Hints for *why* a trace failed (letterShapes-style "fix" text). Losing the
  handshape or drifting off the path just restarts the trace; that's enough
  feedback for a first version.
- Anything for Learn (3.3). This is Practice-only, like the rest of Phase 2's
  checking.

## Anti-goals

- Don't make Z's check depend on the classifier or any trained model at all —
  the whole point is avoiding that.
- Don't let the Z path block or visually fight the hand skeleton overlay
  that's already drawn on the camera view.

## What's decided

From working through this with Lanix:

- **Handshape**: index finger extended, the other fingers curled, thumb
  across the palm — the shape in the reference photo (effectively the "D"/"1"
  shape). Checked the same way B's rules work: hand-picked thresholds on
  `normalizeHand`'s landmarks, in `letterShapes.js`'s `RULES` table, keyed by
  `Z`. The handshape must hold for the whole trace, not just the end.
- **The path**: fixed in the camera frame (not anchored to wherever the hand
  starts) — like a stencil in the air the person moves their hand to. A
  single, unchanging Z shape and position for every attempt.
- **Tracing rule**: the index fingertip must follow the path in order, from
  the start of the Z to the end, staying within a tolerance distance of the
  line the whole way — not just pass near each stroke in any order.
- **Progress feedback**: the path fills in (changes color) behind the
  fingertip as they trace it, the same spirit as Record's hold-fill bar, so
  there's live feedback instead of only a pass/fail at the end.
- **Failure handling**: drifting off the line, or losing the handshape,
  restarts the trace from the beginning (progress back to zero), the same
  "any slip resets it" feel as the 300 ms gap rule used elsewhere in Sema
  (the camera check's hold, `letterHold.js`'s `HAND_HOLD_MS`). No forgiveness
  for small drift — straying past the tolerance counts as off.
- **The finish** (added after Lanix's first test): the Z has two numbered
  points, 1 where it starts (a dot) and 2 where it ends (a ring). The trace
  passes when the fingertip, still following the line, comes within the
  tolerance of point 2, even a little short of the line's very end.
- **On success**: same as any other letter — "That's Z!" with Try again, same
  place in `PracticePage.jsx` that `passed` already renders.

## Current shape of the code this touches

- `src/pages/practice/letterHold.js`: `MOVING_LETTERS = ['J', 'Z']` currently
  makes Z pickable but uncheckable (`moving` short-circuits all judging in
  `PracticePage.jsx`, and shows "Z isn't available yet"). Z needs to leave
  this list (or the moving-letter branch needs a Z-shaped carve-out) while J
  stays.
- `src/pages/practice/PracticePage.jsx`: holds `target`, `round`, `passed`,
  and runs the classify-and-hold listener in a `useEffect` keyed on
  `[kind, loaded, target, round, moving, drawnHand]`. For Z, this effect's
  body needs a different path: no `kind.classify`, no `letterHold`'s
  timed-hold state — instead the new path-tracing check, but it still needs
  to end by calling `setPassed(true)` so the rest of the page (the done
  banner, the status line, `CameraPanel`'s `hold` fill) keeps working the way
  it already does for every other letter.
- `src/vision/landmarks/letterShapes.js`: `shapeFix` and `RULES` are
  letter-keyed already; adding `Z`'s handshape rule here fits the existing
  shape.
- The hand overlay canvas (`canvasRef` in `PracticePage.jsx`, drawn by
  `useHandDetection` via `drawHand.js`) is fully owned by
  `useHandDetection`: each frame it clears the canvas and redraws just the
  hand skeleton. There's no hook today for a second thing to draw on that
  same canvas without changing `useHandDetection`/`drawHand.js`.
- `src/components/camera-view/CameraView.jsx` already layers page-supplied
  `children` over the video/canvas stage (that's how the "Z isn't available"
  and "That's B!" banners work today), and the Vision conventions say any
  overlay must share the video's `scaleX(-1)` mirroring and be drawn in
  un-mirrored video pixel coordinates (`x * videoWidth`, `y * videoHeight`),
  same as the hand skeleton.

## Technical decisions

A builder-check read this doc cold against the real files and flagged the
items below as gaps rather than genuine open questions — things answerable
from the codebase that the doc should just state. None of them turned out to
need Lanix's input, so they're settled here instead of left loose.

- **Where the Z path is drawn.** A second `<canvas>`, sized and mirrored
  exactly like the existing hand-overlay canvas (same CSS rules as the video,
  including `scaleX(-1)`), passed in through a new `underlay` slot on
  `CameraView`/`CameraStage`, which places it between the video and the hand
  canvas (as built: `children` would have put it over the hand drawing). This keeps `useHandDetection`/
  `drawHand.js` untouched — they keep owning the hand skeleton exactly as
  now — and the new canvas owns the Z path and its fill progress
  independently. (A single shared canvas was the alternative; rejected
  because it would mean threading a second draw callback through
  `useHandDetection`, which no other overlay does today.)

- **Coordinate space.** The path's points, the fingertip position used to
  check them, and the tolerance are all in the same frame-normalized 0–1
  space MediaPipe's raw landmarks already use (`landmark.x`/`.y`, the space
  `drawHand.js` multiplies by `videoWidth`/`videoHeight` to draw) — *not*
  `normalizeHand`'s wrist-relative, palm-length-scaled space that
  `letterShapes.js` and the classifier use. The path is fixed in the camera
  frame, not relative to the hand, so it has to live in frame space. The
  fingertip reading is landmark 8 (`INDEX_TIP`, already named in
  `letterShapes.js`) from the **raw**, unsmoothed landmarks the detection
  listener receives — the same raw points `letterHold.js` and
  `letterShapes.js` already judge letters on (per the Vision conventions,
  only the drawn skeleton is smoothed). As built, distances are measured in
  frame heights (x multiplied by width / height), so the tolerance is the
  same sideways as up and down on a 4:3 frame.

- **The path's geometry**, in that frame-normalized space, centered in the
  frame and sized to trace comfortably without leaving it: a four-point
  polyline — top-right → top-left → bottom-right → bottom-left — which is
  the standard order a Z is actually drawn in (top bar left-to-right,
  diagonal down to the bottom-left, bottom bar left-to-right). Concretely,
  as built `(0.62, 0.24) → (0.38, 0.24) → (0.62, 0.52) → (0.38, 0.52)` (24%
  of frame width, 28% of its height, high enough that the wrist stays in view
  on the bottom stroke; first built at 30% × 35%, made smaller after Lanix's
  first test) — to tune by eye in Chrome, the way `letterHold`
  and `letterShapes` were tuned.

- **Tolerance**: as built `0.09` frame heights (about 43 pixels of a
  480-pixel frame; first `0.07`, raised after Lanix's first test), also the
  distance from the start dot that starts the trace — tuned by eye the way `MAX_SPREAD` and
  `MAX_THUMB_REACH` were — loose enough for a real fingertip's wobble, tight
  enough that drawing a different shape nearby doesn't pass.

- **Hand mirroring**: the path flips horizontally for the right hand and not
  for the left. First built the other way round (the left hand got the
  flipped Z, following the `AslDrawing` convention); swapped after Lanix's
  test.

- **Control flow in `PracticePage.jsx`**: Z's trace runs in its own
  `useEffect`, separate from the existing classify-and-hold effect, each
  guarded so only one ever sets `listenerRef.current` for a given target:
  the classify effect's guard becomes "not moving and not Z", and the new
  trace effect's guard is "target is Z". J (and anything else moving in the
  future) still falls through to today's "isn't available yet" banner,
  untouched. This keeps the existing effect's shape and dependency array
  intact instead of growing a branch inside it.

- **Unlocking Z in the guide**: `MOVING_LETTERS` in `letterHold.js` keeps its
  current meaning — "picked to preview, but Sema can't check it" — and
  shrinks to `['J']`. Z becomes a normal pickable, checkable letter from
  `GuidePanel.jsx`'s point of view; no `moving` styling or copy applies to
  it anymore, the same as the 24 static letters.

- **The handshape rule's exact thresholds** for `Z` in `letterShapes.js`:
  index extended (tip far from the palm along the finger's own direction,
  roughly straight), the other three fingers curled (tips close to their
  palm), thumb across — picked by measuring, the way B's rules were tuned
  by eye in Chrome against real and training-photo hands, deciding by eye
  whether a straightened-but-not-fully-extended index should pass. `Z`'s
  `RULES` entry can still carry `fix` text per rule, same shape as `B`'s, for
  consistency with the module's pattern — but the trace UI never surfaces
  it (per the Non-goals above): losing the handshape mid-trace is a silent
  reset, not a shown hint. Nothing about `shapeFix` needs to change for
  this; the trace effect just doesn't read `.fix` the way `showsLetter` does.

- **A new pure-logic module**, `zTrace.js` under `src/vision/landmarks/`
  (it's math on hand points, like the rest of that folder): the path's
  points, the in-order progress state machine (how far along the path the
  fingertip has reached, and the distance check), and the reset-on-drift
  rule. Needs tests next to it, as the project convention is
  (`letterHold.test.js` is the model to follow: pure functions, fed
  synthetic landmark/time sequences).

- **Fill color**: the untraced guide line in a dim, translucent stroke (e.g.
  `--muted-on-dark` or `--cloud-white` at reduced opacity) so it reads as a
  guide, not a tracked object; the traced portion in `--bright-sky`, which
  already carries an "on track" meaning elsewhere (the camera panel's `tone:
  'ok'` accent). It's visually distinct from the hand skeleton because the
  skeleton moves with the hand on every frame and the path is a fixed
  stencil underneath it, not because the colors differ.

- Update `docs/project-plan.md`'s Phase 4 line and the "J and Z... come last"
  decision once this ships, per the project's convention of updating the
  plan's status when it changes.
