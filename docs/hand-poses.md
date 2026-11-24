# The 3D hand's letter poses

Every picture of a hand has a **2D | 3D** switch in its upper left corner: Learn's letter card (2026-10-31) and the quiz's Peek (2026-11-02). It's one saved setting, so a click changes both. 2D is the drawing; 3D is a hand you
can turn, drawn by Sema's copy of [Eidos](https://github.com/lanixiligan/eidos)'s viewer, in the
pose of the letter. The poses are made in Eidos and saved in Eidos's format, so a file from
there works here unchanged.

## Where they are

`public/languages/asl/letters/`: `A.json` to `Z.json`, one pose per letter, and `index.json`,
the list of files in Eidos's layout (Sema doesn't read it; it's there so an Eidos export
unzips straight into the folder).

## Adding a letter

1. Make the pose in Eidos and save it under the letter's name (`H`).
2. Either **Download** it and put `H.json` in the folder (it replaces the placeholder), or
   **Export all** and unzip the zip into the folder.
3. Reload Learn, pick the letter, and switch to 3D.

## Available or not

A letter has a 3D hand when its file is a valid pose (Eidos's `normalizePose`, copied into
`src/hand-model/pose.js`). Until then its file is a placeholder:

```json
{
  "version": 1,
  "available": false
}
```

A letter is **unavailable** when its file has no pose yet: empty, `{}`, `{ "version": 1 }` or the
placeholder above, quietly. `"available": false` is Sema's only addition to the format, and only in
placeholders: Eidos's own files never have it, so a file from Eidos is available as soon as it's
in place. A full pose with `"available": false` added by hand stays hidden (a draft). A missing
file, or one with pose values that don't make a valid pose, is unavailable too, with the reason
in the browser console (`readLetterPose` in `letterPoses.js`, tested in `letterPoses.test.js`).

With 3D chosen, an unavailable letter's picture says "No 3D hand for A yet" and "Switch to 2D to see
its drawing" instead of showing the drawing (2026-11-02; before, it fell back to the drawing with a
line). The switch stays, so one click goes to 2D. The 3D choice is kept: the next letter that has a
pose is shown in 3D again.

## The format

Eidos's `docs/POSE_FORMAT.md` is the contract: angles in radians, a pose for a right hand (a left
hand mirrors it), `version` 1. Sema's copy of `pose.js` must stay identical to Eidos's.

## Letters that move (J and Z)

Since 2026-11-04 a pose can say where the whole hand is (`move`: side, up, forward, in hand
lengths) and how it moves (`motion`: the steps after the first, each `{ duration, pose }`), Eidos's
additions to the format. J and Z use both. Wherever the 3D hand is shown (Learn's card, the quiz's
Peek, Guess the letter, its compare hands, the large picture), a pose with `motion` plays on a loop
(`HandModelView.jsx`): the hand rests on the first step for 0.8 s, plays the movement (Eidos's
player: a smooth curve through the steps that never overshoots one, so no bounce, easing in at the start and out at the end), holds the last
step for 1.2 s, eases back to the first in 0.6 s, and starts again. With reduced motion it plays
once, then goes back to the first step: the movement is the letter, so it isn't left out. A progress
bar along the picture's bottom edge, like a video's (`.hand-motion-bar`, drawn by `HandModelView`
on every 3D J and Z), fills while the hand moves, stays full while it holds the last step, and is
empty again when the next play starts. There's no Replay button (Lanix had one removed the day it
was added): the loop replays it. The fit
measures every step, so the whole movement stays in the frame and the camera doesn't move while it
plays. The viewer keeps drawing only while the hand moves, so between plays it costs nothing.

## Guides (the Handshapes page)

Since 2026-11-14 a letter can have a step-by-step guide, shown on the Handshapes page
(`/handshapes`): the hand builds the letter one step at a time.

**Every guide starts the same way**, from the relaxed open hand: step 1's hand is
`guides/Relaxed.json` (a still Eidos pose) and its sentence is `guides/text/Relaxed.json` (a list
of one step: "Start with an open, relaxed hand, your palm facing forward."). Change either file and
every letter's first step changes.

After that, a letter's guide is two things, both in `public/languages/asl/guides/`:

- **The hand at every later step**, `B.json`: an ordinary Eidos pose with `motion`. **Each Eidos
  motion step is one guide step**, and the last is the finished letter. The file's own pose
  (before `motion`) isn't used: `Relaxed.json` takes its place, so make the movement in Eidos
  starting from `Relaxed.json` to see what the page will show. A step's `duration`
  is how long the hand takes to move there when the person presses Next step. The page never plays
  the movement in one go: it moves from step to step with the viewer's `setPose`.
- **The words**, `text/B.json`, written by hand: a file per letter in the `text/` folder, one
  entry per motion step, in the same order (the shared first step isn't repeated here). For now
  (2026-11-14, while the guides are remade in Eidos) the counts needn't match: the motion decides
  how many steps there are, a step with no entry shows a "No instructions yet" sign (2026-11-24)
  beside its number, and entries past the last step are left out.

```json
[
  { "say": "Straighten {index}, {middle}, {ring} and {pinky}, and press them together.", "checks": ["{index} straight", "…"] },
  { "say": "Fold {thumb} across your palm.", "checks": ["{thumb} folded across the palm"] }
]
```

`say` is the step's sentence. A finger's name in braces gets its number badge, as in Learn's
checklist, and that finger's number is lit on the 3D hand during the step. `checks` are the finger
conditions the step completes: the exact texts from `src/vision/landmarks/letterShapes.js`, shown
under the step as green chips.

**Every letter has a guide** (2026-11-14): the page shows all 26, and every letter has a guide
file. A letter whose movement isn't made yet has a **still guide**: a copy of its finished pose
from `letters/` with no `motion` (J and Z were copied without their movement). The page shows it
as the finished letter alone, with a "No instructions yet" sign and "A step-by-step guide for G is
coming soon", no step list, no
Relaxed start and no Back; Try D with your camera and Next letter are still there.

`text/index.json` lists the letters that have a text file (`["A", "B", "L", "V", "X"]`). The
browser can't list a folder's files, so the page reads this list to know which letters to fetch a
text file for; a letter not in it has no sentences (its steps after the first show the "No
instructions yet" sign). Learn's "How to
make B, step by step" link is shown only for the letters in it. To give a letter its real guide:

1. In Eidos, open `guides/Relaxed.json` and make the movement from it: a step per finger or group of fingers
   (one thing per step is easiest to follow), ending on the letter's own pose (copy it from
   `letters/B.json`). Save it as `guides/B.json`, over the still copy.
2. Write `guides/text/B.json`, one entry per motion step, and add `"B"` to `guides/text/index.json`.
3. Run `npm test`. The tests (`src/hand-model/letterGuides.test.js`) fail when the two files have
   different numbers of steps (the text against the `motion`; off for now, see above), when the `checks` together aren't exactly the letter's finger
   conditions, each once (so a changed rule in `letterShapes.js` fails here until the guide is
   updated), when a sentence names something that isn't a finger, when the last step isn't the
   letter's pose in `letters/` (also off for now: `it.skip`), or when `text/index.json` and the files in `text/` don't list the
   same letters.

The first five guides (A, B, L, V, X, 2026-11-14) are **drafts worked out by a script**, not made
in Eidos: each step is the relaxed hand with some fingers taken from the letter's finished pose.
They're there so the page can be tried; replace them with ones made in Eidos. D, E, F, I, K, M,
N, T and Y have movements made in Eidos (2026-11-24) but no words yet. J and Z have no
guide yet (their last step would be the letter's own movement).

The frame is fitted once for the whole guide (`fitTo` on the viewer's `setPose`, Sema's addition
to `hand.js`), so the camera doesn't move between steps.

## The code

`src/hand-model/`:

- `pose.js`: Eidos's pose format, unchanged.
- `hand.js`: Eidos's 3D viewer (`createHand`), changed for Sema: it draws only while something
  moves (a drag, a new letter, a resize) and stops once the hand has settled, so a still hand
  costs no battery and leaves the graphics card to hand tracking; with reduced motion, poses jump
  into place and a flick doesn't spin on; no scroll-to-zoom; `spinBy` for the arrow keys; and a fit
  (2026-11-02): for the pose the hand is moving to it measures how far the joints reach, then centres the
  hand in the frame and moves it back from the camera when it's too big (`FIT_FILL`, `FIT_MARGIN`,
  `measureSteps`, `applyFit`), so a hand with fingers stretched up isn't cut off; small poses keep the usual distance.
  Since 2026-11-04 it also has Eidos's `move` (`handMove`) and movement player (`playMotion`), with
  the fit measuring every step.
- `models/hand-right.glb`: the WebXR generic hand (MIT, © Amazon), with its licence.
- `letterPoses.js`: fetches a letter's file once per visit, in 2D too (it's tiny), and decides
  whether it's available (`readLetterPose`, `useLetterPose`), so Learn can grey out 3D. It doesn't
  load three.js.
- `letterGuides.js`: the Handshapes page's guides: fetches `guides/text/index.json` and the shared
  start (`Relaxed.json` and `text/Relaxed.json`), then a letter's guide file and its `text/` file, and pairs each motion step with its text (`readGuide`, `useGuideLetters`,
  `useLetterGuide`). It doesn't load three.js either.
- `HandModelView.jsx`: the React wrapper. Learn loads it with `lazy()`, so three.js is only
  downloaded by someone who picks 3D for a letter that has a pose.

To update the viewer from Eidos, copy the new `hand.js` and redo the changes listed at its top.
