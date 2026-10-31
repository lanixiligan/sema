# The 3D hand's letter poses

Learn's letter card has a **2D | 3D** switch (2026-10-31). 2D is the drawing; 3D is a hand you
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

On Learn, an unavailable letter's 3D button is greyed out ("No 3D hand for A yet" on hover and for
screen readers) and the drawing shows. The 3D choice is kept: the next letter that has a pose is
shown in 3D again, and with 3D chosen a line under the drawing says why it isn't 3D.

## The format

Eidos's `docs/POSE_FORMAT.md` is the contract: angles in radians, a pose for a right hand (a left
hand mirrors it), `version` 1. Sema's copy of `pose.js` must stay identical to Eidos's.

## The code

`src/hand-model/`:

- `pose.js`: Eidos's pose format, unchanged.
- `hand.js`: Eidos's 3D viewer (`createHand`), changed for Sema: it draws only while something
  moves (a drag, a new letter, a resize) and stops once the hand has settled, so a still hand
  costs no battery and leaves the graphics card to hand tracking; with reduced motion, poses jump
  into place and a flick doesn't spin on; no scroll-to-zoom; `spinBy` for the arrow keys.
- `models/hand-right.glb`: the WebXR generic hand (MIT, © Amazon), with its licence.
- `letterPoses.js`: fetches a letter's file once per visit, in 2D too (it's tiny), and decides
  whether it's available (`readLetterPose`, `useLetterPose`), so Learn can grey out 3D. It doesn't
  load three.js.
- `HandModelView.jsx`: the React wrapper. Learn loads it with `lazy()`, so three.js is only
  downloaded by someone who picks 3D for a letter that has a pose.

To update the viewer from Eidos, copy the new `hand.js` and redo the changes listed at its top.
