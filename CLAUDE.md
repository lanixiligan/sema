# Sema

A browser-based ASL fingerspelling coach. It will use the webcam and MediaPipe hand
landmarks to teach the ASL alphabet. Built by a student for their portfolio and to learn.

## Working with the author

- Explain what you are doing as you go, especially browser and React concepts.
- Keep code simple and readable rather than clever.
- Work one phase at a time. Do not start the next phase unless asked.
- The author tests by hand in Chrome. Their everyday browser, LibreWolf, gives pages
  no WebGL, so MediaPipe can't run there.

## Plan

The development plan is `docs/project-plan.md`.

- Read only the section for the current phase; don't build ahead.
- When a milestone's "Done when" list is fully ticked, update the Status table and
  tick the boxes in the same commit.
- Don't change decisions in the plan without asking Lanix first.

## Phases

- **Phase 0 (done):** a page that shows the webcam. Start/Stop, camera picker,
  real resolution and fps readouts, plain-language errors.
- **Phase 1 (done, deployed on Vercel):** hand tracking with MediaPipe Hand Landmarker in `src/vision/`:
  detection loop, mirrored skeleton overlay, hand found/lost with handedness,
  detection fps and time, GPU/CPU delegate with fallback.
- **Phase 2 (next, not started):** recording, landmark normalization, classifier.
- Later: letter recognition (`src/recognition/`), app screens (`src/screens/`).
  Don't create these folders early.

## Stack and constraints

- React + Vite + plain JavaScript (`.jsx` / `.js`). No TypeScript.
- No UI framework, no CSS framework. Plain CSS in `src/styles.css`.
- No new dependencies without asking first. Approved so far: `@mediapipe/tasks-vision`.
- Serve every asset from the app itself, never from a CDN.
- No backend, database or accounts. Everything runs in the browser.
- Node 20.19+ or 22.12+ (Vite requirement).
- `vite.config.js` allows `.app.github.dev` hosts so the dev server works in GitHub Codespaces.
- React `StrictMode` stays on. Code must survive its double mount in development.

## Commands

- `npm run dev`: dev server on http://localhost:5173
- `npm run build`: production build into `dist/`
- `npm run lint`: oxlint
- `npm run copy-mediapipe`: copy MediaPipe's wasm into `public/mediapipe/wasm/`
  (also runs on `postinstall`)

## Folder structure

```
src/
  camera/     webcam logic: useCamera hook, error messages, video stats
  vision/     hand tracking: model loading, detection loop, drawing, handedness
  recorder/   the recorder page (record.html): consent, takes, session file
  App.jsx
  main.jsx
  styles.css
```

## Camera conventions

- The camera starts only on a button click. Constraints: video only, ideal 640×480,
  `facingMode: 'user'`. Ideal values are requests; read `videoWidth`/`videoHeight`
  for the real size.
- Always stop every track (`track.stop()`) on Stop, on camera switch and on unmount.
  That is what turns the camera light off.
- Keep the stream in a ref, not state. Unmount cleanup must not rely on `videoRef`,
  because React has already cleared it by the time effect cleanups run.
- A `getUserMedia` call that resolves after Stop, a newer start or unmount must stop
  its stream immediately (`useCamera` uses a request counter for this).
- The video is mirrored with CSS `transform: scaleX(-1)`. Frame data is NOT mirrored.
  Any landmark overlay drawn on top must be mirrored the same way.
- User-facing error text lives in `src/camera/cameraMessages.js`.
- Camera fps comes from `requestVideoFrameCallback` metadata `presentedFrames`, not
  from counting callbacks: callbacks are merged when the main thread is busy.

## Vision conventions (MediaPipe)

- Assets: wasm is copied from `node_modules` by `npm run copy-mediapipe` and is
  gitignored. It must match the installed package version. The model
  `public/models/hand_landmarker.task` is committed (float16 v1, 7,819,105 bytes,
  sha256 `fbc2a300…7cde1`).
- Load the model when the camera first starts, never on page load. Keep it loaded
  across Stop/Start. Close it on unmount.
- MediaPipe web needs WebGL2 even on the CPU delegate. `loadHandLandmarker` checks
  for WebGL2 first, then tries GPU and falls back to CPU. Each new landmarker runs
  one blank test frame, because some GPU failures only appear on the first frame.
- `runningMode: 'VIDEO'`, `numHands: 1`. Call `detectForVideo` once per new video
  frame (`requestVideoFrameCallback`). Timestamps must strictly increase:
  `Math.max(performance.now(), last + 1)`.
- The detection loop reads the landmarker from a ref on every frame. Set the ref to
  null *before* calling `close()`, so a closed landmarker is never used.
- Hand loss: report "No hand" after 300 ms without a detection, and clear the
  overlay at the same moment.
- Overlay: the `<canvas>` shares every CSS rule with the `<video>` (including
  `scaleX(-1)`). Draw in un-mirrored video pixels: `x * videoWidth`,
  `y * videoHeight`. The canvas buffer is the video's real resolution ×
  `devicePixelRatio`. Draw with the Canvas 2D API, not DrawingUtils.
- Landmarks can go below 0 or above 1 when the hand is partly out of frame. The
  canvas clips them; no special handling needed.
- **Handedness rule** (checked by hand on 2026-10-15, Chrome, tasks-vision 1.1.1):
  for our un-mirrored frames, MediaPipe's label already names the hand actually
  raised (right hand → "Right"). `toPhysicalHand` in `src/vision/handedness.js`
  passes it through unchanged. If frames are ever mirrored before detection, swap
  it. Re-check after upgrading MediaPipe.
- Performance numbers come from the benchmark in Developer settings
  (`useBenchmark.js`, `benchmarkStats.js`, `BenchmarkPanel.jsx`): 2 s warm-up, 10 s
  window, camera fps from `presentedFrames`, detection median/p95/mean. A run is
  rejected if a hand was found in under 90% of frames, the tab was hidden, or the
  camera or model changed. The detection loop records into `measurementsRef` only
  while a run is recording.
- Expected console noise: MediaPipe prints `INFO: Created TensorFlow Lite XNNPACK
  delegate for CPU.` via `console.error`, plus some yellow warnings. They are not
  bugs.

## Recorder conventions

- Session files follow `docs/data-format.md`. Bump `format` when the layout changes and
  `normalization` when `src/vision/normalizeHand.js` changes; `scripts/check-session.js`
  lists the versions it accepts.
- The left-hand flip uses the detected hand, for now (an open decision in the plan).
- Take timing and the sampling interval are constants in `src/recorder/takeRules.js`;
  a take passes when `kept − mismatched ≥ 24`.
- `data/raw/` is gitignored and private; never commit recorded sessions.
- `vercel.json` (`cleanUrls`) serves the recorder at `/record`. JSON can't hold
  comments, so the warning lives here: any future single-page-app rewrite (Phase 3)
  must exclude `/record`.
- `npm test` runs Vitest; keep pure logic in small modules with tests next to them.
- Letters come from `public/languages/asl/letters.json`; `pilotOnly` letters are
  recorded in the pilot but excluded from 2.2's first training set.

## Visual design

Minimal and calm: lots of space, one obvious action, no decoration.
Colors are CSS variables in `src/styles.css`:

| Variable        | Hex       | Use                                              |
| --------------- | --------- | ------------------------------------------------ |
| `--deep-cobalt` | `#142C48` | Text; the dark frame around the video            |
| `--bright-sky`  | `#36A7D9` | Accents on dark surfaces only                    |
| `--deep-sky`    | `#1A75A3` | Buttons and links on light surfaces, white text  |
| `--cloud-white` | `#F5F7F8` | Page background                                  |
| `--amber`       | `#B45309` | Warning text on light backgrounds                |
| `--muted-text`  | `#52637A` | Secondary text                                   |

Never use Bright Sky for text on a light background: it fails contrast.

The hand overlay (in `src/vision/drawHand.js`) uses Bright Sky bones, Cloud White
joints, and a dark outline `#0C1D30` under both so it shows over any background or
skin tone.
