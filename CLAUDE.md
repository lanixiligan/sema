# Sema

A browser-based ASL fingerspelling coach. It will use the webcam and MediaPipe hand
landmarks to teach the ASL alphabet. Built by a student for their portfolio and to learn.

## Working with the author

- Explain what you are doing as you go, especially browser and React concepts.
- Terminology: say 'pages', not 'screens'.
- Keep code simple and readable rather than clever.
- Work one phase at a time. Do not start the next phase unless asked.
- The author tests by hand in Chrome. Their everyday browser, LibreWolf, gives pages
  no WebGL, so MediaPipe can't run there.

## Plan

The development plan is `docs/project-plan.md`.

- Update a phase's status line in docs/project-plan.md when it changes.
- Don't change decisions in the plan without asking Lanix first.

## Phases

- **Phase 0 (done):** a page that shows the webcam. Start/Stop, camera picker,
  real resolution and fps readouts, plain-language errors.
- **Phase 1 (done, deployed on Vercel):** hand tracking with MediaPipe Hand Landmarker in `src/vision/`:
  detection loop, mirrored skeleton overlay, hand found/lost with handedness,
  detection fps and time, GPU/CPU delegate with fallback.
- **Phase 2 (done 2026-10-23, merged into `main`):** recording, landmark
  normalization, classifier, for the 24 static letters (J and Z wait for Phase 4). The
  recorder (2.1, done 2026-10-18, merged into `main`); Lanix's first test session
  (2026-10-20, p00: the 8 letters, both hands). Training (2.2): `/dev/extract` turns public
  datasets' photos (ASL-HG, ASLYset) into hand points, `training/` cleans them
  (`training/reports/cleaning-<dataset>.md`) and tests a k-NN and two small models
  (`training/reports/knn.md`, `small.md`); logistic regression is the model in the browser.
  The live check (2.3) is Practice (`/practice`; Try, `/try`, until 2026-10-23): Sema only checks the letter the person picked,
  so there is no "none" class anywhere. The finger hints (2.4) moved to Phase 3. The model
  keeps improving during later phases, judged by the same held-out tests.
- **Phase 3.1 (done early, with the recorder):** the app shell, Welcome and setup,
  because the recorder was the app's main page after setup (since 2026-10-22 it's a
  developer tool, `/dev/record`, and setup leads to Practice, `/practice`, the classifier
  live: the main page for now). Practice is Try renamed (2026-10-23), its placeholder gone;
  Learn stays a placeholder until 3.3 (`phase-3-preview`). What the onboarding pages say and do:
  `docs/onboarding-pages.md` (update it when they change).
- **Phase 4 (started 2026-10-24, on `phase-3-preview`, before Learn 3.3):** the
  remaining letters. Z (2026-10-24) and J (2026-10-26) are done: traced on Practice instead
  of classified (see Routing).
- Later: letter recognition (`src/recognition/`). Don't create that folder early.

## Stack and constraints

- React + Vite + plain JavaScript (`.jsx` / `.js`). No TypeScript.
- No UI framework, no CSS framework. Plain CSS in `src/styles.css`.
- No new dependencies without asking first. Approved so far: `@mediapipe/tasks-vision`,
  `vitest` (dev only), and for offline training only (Python, `training/requirements.txt`)
  `numpy` and `scikit-learn`.
- Serve every asset from the app itself, never from a CDN. Fonts are `.woff2` files in
  `public/fonts/` with their OFL licences, declared with `@font-face` in `styles.css`.
- Logos are SVGs in `public/logos/`: `sema-mark-*` (the mark alone) and `sema-logo-*`
  (mark and "sema."). `-light` is for light backgrounds, `-dark` for dark ones. The tab
  icon is `sema-mark-light.svg`, linked from `index.html`. Pages show the logo with
  `src/components/Logo.jsx` (top bars, Welcome): both files are in the page and CSS shows
  the dark one under `[data-theme='dark']` or `.on-dark`.
- No backend, database or accounts. Everything runs in the browser.
- Node 22.12+ (Vite needs 20.19+ or 22.12+, Vitest 5 needs 22.12+). The README lists the
  versions in use; update its Versions table when a dependency changes.
- `vite.config.js` allows `.app.github.dev` hosts so the dev server works in GitHub Codespaces.
- React `StrictMode` stays on. Code must survive its double mount in development.

## Commands

- `npm run dev`: dev server on http://localhost:5173
- `npm run build`: production build into `dist/`
- `npm run lint`: oxlint
- `npm run copy-mediapipe`: copy MediaPipe's wasm into `public/mediapipe/wasm/`
  (also runs on `postinstall`)
- `npm run dev-code -- "a long passphrase"`: set the developer pages' access code
- `python3 -m unittest discover training`: the training code's tests
- `python3 training/clean.py data/extracted/<file>.json`: clean one dataset's extracted hand
  points and write `training/reports/cleaning-<dataset>.md`
- `python3 training/train.py data/extracted/<file>.json [...] data/raw/<session>.json [...]`:
  train the k-NN classifier on every extracted file given (any order; each file is sorted by
  its content), test it, and write `training/reports/knn.md`
- `python3 training/train_small.py` with the same files: train
  the small models (after train.py), test them next to the k-NN, write
  `training/reports/small.md`, and save the better one as `public/models/asl-letters.json`

## Folder structure

```
src/
  main.jsx          the entry point index.html loads
  styles.css        all the CSS
  app/              the shell
    App.jsx         picks the page for the address, holds the settings
    routing/        router, navigation, Link
    layout/         TopBar, MenuBar, PhoneNotice
    settings/       progressStore, settings context, theme, ThemeToggle, SettingsMenu
    shared-camera/  CameraProvider, sharedCamera, useIdleCameraOff
  components/       parts used by more than one page folder
    camera-view/    CameraPanel (the dark frame with the status header), CameraView and
                    its parts: CameraStage, CameraControls, CameraOff, IdleNotice,
                    StageProblem
    icons/          icons.jsx and the larger LineIcons.jsx
    placeholder/    PlaceholderPage and mixLetters (Learn's art)
    Logo.jsx
    LetterGuide.jsx how to form a letter, its steps from letters.json (Record, Practice)
    AslDrawing.jsx  a letter's drawing (public/images/asl/, a left hand), facing a given
                    hand; DRAWN_HAND (Record's reference picture, Practice's card and guide)
  pages/
    onboarding/     Welcome; Camera check; StepNav (used by intro/ and the camera check)
      intro/        About Sema, How Sema works, How Sema handles your data, and their
                    parts (IntroLayout, AboutPreview, HandSketch, useStaggeredReveal…)
    learn/          the Learn placeholder
    practice/       Practice (/practice; Try until 2026-10-23), the main page for now:
                    pick a letter in the guide (GuidePanel), hold it 3 s (letterHold),
                    and the models' JS copies (networkModel, knnModel)
    dev/            the developer tools behind an access code: DevArea (the gate, then
                    the page), DevGate, DevDashboard (/dev), DevTopBar, devAccess
      tracking/     the Phase 1 page at /dev/tracking (+ BenchmarkPanel)
      extract/      /dev/extract: dataset photos → hand points
      record/       /dev/record: the recorder (the Record page) and its parts
  camera/           webcam logic: useCamera hook, error messages, video stats, idle rules
  vision/           hand tracking
    model/          loading the hand model, WebGL and browser checks, error messages
    tracking/       the detection loop, picking a hand, handedness, smoothing and
                    drawing the hand
    landmarks/      math on the hand points: normalization, the camera check's rules,
                    letters' shape rules (letterShapes)
    benchmark/      the /dev/tracking benchmark's hook and statistics
  recorder/         recording logic: take rules, useRecording, session file and storage
```

Outside `src/`, `training/` holds the offline Python for 2.2 (`training/README.md`).

## Routing

- One HTML file (`index.html`) serves every page. Don't add a second HTML file.
- Each page lives in a folder under `src/pages/`, with the parts only it uses. Page
  folders never import from each other: anything two page folders need goes in
  `src/components/`, and logic with no page stays in `src/recorder/`, `src/vision/`
  and `src/camera/`.
- `src/app/routing/router.js` maps each path to a page (`PATHS`, `resolveRoute`); unknown
  paths redirect to `/`. `src/app/routing/navigation.js` changes pages with the History API
  (`navigate`, `usePathname`); links between pages use `<Link>` from `src/app/routing/Link.jsx`.
- `vercel.json` rewrites every path to `index.html`; Vercel serves real files first.
- The developer tools live under `/dev`, on the live site too, behind an access code, and
  aren't in the menu. Everything about them (the code, each tool, the benchmark results) is
  in `docs/dev.md`; keep it up to date when a tool changes (2026-10-22; before, `/dev` was the tracking page, with no code).
  `/dev` is a dashboard: a card per tool and the latest training results
  (`training/reports/small.json`, then `knn.json` to compare). The tools: `/dev/tracking` (the Phase 1 page with the
  benchmark), `/dev/extract` (a public dataset's photos through Sema's hand model and
  normalization, `docs/data-format.md` "Extracted files"), and `/dev/record` (the recorder; until
  2026-10-22 it was the main page, at `/record`).
- The access code is a keep-out sign, not a lock (no server): only its SHA-256 fingerprint
  ships, in `src/pages/dev/dev-code.json`, set with `npm run dev-code -- "passphrase"` (12+
  characters). The browser remembers it as `devAccess` in `progressStore.js`; Delete Sema's
  data or Lock forgets it, and a new code locks every browser out. `App.jsx` loads
  `DevArea.jsx` with `lazy()`, so visitors who never open `/dev` never download the tools.
- Practice (`/practice`, the main page for now) was Try (`/try`, which now redirects to
  `/practice`) until 2026-10-23, and before 2026-10-22 the developer tool `/dev/try`.
  Record's three columns: the letter guide on the left, the camera (with the Left | Right
  switch in its controls, which changes the saved signing hand, Right by default, so the
  drawings face it; since 2026-10-23 only that hand is drawn and judged, and the status says
  "Show B with your right hand") in the middle, and the letter's card on the right: its
  drawing large, its steps, and a "Right now" line for the signing hand. Pick a letter in the guide (B at
  first), make it, and
  hold it for 3 s (`LETTER_HOLD_MS` in `src/pages/practice/letterHold.js`). The hold counts while
  the signing hand's whole-hand guess is that letter and sure, and the hand passes the letter's shape
  rules (`src/vision/landmarks/letterShapes.js`, 2026-10-23: only B so far, fingers together
  and thumb across the palm, since the model called an open hand B); a gap over 300 ms
  restarts it. Then
  "That's B!" with Try again; the next letter is picked by hand. The guide shows all 26:
  a dot marks the 8 tested on Lanix's recordings. J and Z move, so they skip the model
  (`TRACED_LETTERS`; before 2026-10-26 J was darkened and couldn't be checked). J: hold I
  (J's shape rules, `letterShapes.js`) for 1 s, the panel's line filling, then a curvy J
  appears with point 1 on the pinky tip, as tall as the hand (wrist to pinky tip, so its
  size follows the hand and its distance from the camera; the tolerance scales with it),
  moved inside the frame near its edge, and the pinky traces it to point 2 like Z's line;
  a slip over 0.8 s removes the J and it starts over from the I
  (`src/vision/landmarks/jTrace.js`). Z (2026-10-24):
  a Z is drawn on its own canvas under the hand drawing (`CameraView`'s `underlay`), and the
  signing hand traces it with the index fingertip from the dot, in order, within a tolerance,
  and passes on reaching point 2 along the line, while passing Z's shape rules (index up, others curled, thumb across); a slip over 0.8 s
  restarts it, and the panel's line fills as it's traced (`src/vision/landmarks/zTrace.js`,
  `src/pages/practice/drawTrace.js`; design in
  `docs/superpowers/specs/2026-10-24-z-trace-design.md`). Practice runs
  the small model (step 5 of 2.2): `public/models/asl-letters.json`, committed (weights only,
  a few KB), so it works on the live site; its JS copy (`src/pages/practice/networkModel.js`) must give the same answers as
  `forward()` in `training/small.py`. The k-NN (step 4): `data/models/knn-asl.json`
  (gitignored, 11 MB), chosen with a switch on the `/dev` dashboard (2026-10-23; before, on
  Practice itself), only under `npm run dev`: the choice is `devModel` in the settings store
  (`DEV_MODELS`), Practice takes it as the `model` prop and under `npm run dev` names the
  model in a line; `knnModel.js` must match `training/knn.py`. The live site always runs
  the small model.
  The small model is trained on ASL-HG and, since 2026-10-23, ASLYset (both CC BY 4.0): keep
  their credits in `docs/ATTRIBUTION.md` and the README, and add one for any dataset added.
- Setup redirects live in `resolveRoute`: a new visitor opening Learn or Practice goes
  to Welcome; a returning visitor opening `/` goes to Practice. Finishing setup opens Practice. The developer pages, Record
  included, don't need setup.

## Settings

- The signing hand and "setup done" are kept by `src/app/settings/progressStore.js`
  (`localStorage` key `sema.progress`, with a version number). Pages never touch
  `localStorage` directly; `App.jsx` holds the settings and passes them down. The same
  store keeps `devAccess`, the fingerprint of the developer pages' access code once entered.
- The theme (Light / Dark / System, default System) is saved in the same store and chosen with
  the icon toggle at the right of every page's top bar (`src/app/settings/ThemeToggle.jsx`, in
  `TopBar`). The settings menu (`src/app/settings/SettingsMenu.jsx`, a gear with no text, last in the
  bar on the main pages) holds only Delete Sema's data: after a confirm it removes every `sema.*`
  localStorage key (`clearSavedData` in `progressStore.js`) and App starts over as a new
  visitor on Welcome, without a reload. The theme and the delete reach the top bar through
  `SettingsContext` (`src/app/settings/settings.js`). `src/app/settings/theme.js` sets `data-theme` on
  `<html>`; a small script in `index.html` sets it before the first paint. In `styles.css`,
  rules use colour roles (`--bg`, `--text`, `--accent`…), with a light set on `:root` and a
  dark set on `[data-theme='dark']` and `.on-dark`. Palette colours are used directly only
  where a colour never changes (the camera frame, hand drawings). Every page follows the
  theme; `.on-dark` is only for parts that sit on the dark camera frame (the camera menu).
- The onboarding pages (the three intro pages and the camera check) move on with quiet
  Previous / Next text from `StepNav.jsx`, in a row along the bottom that is the same on
  every one of them, so Next never moves and is there from the start. There is no Skip
  intro. Welcome keeps its Get started button.
- Setup is one page, the camera check, and it doesn't ask for the signing hand. It draws
  every hand it finds and passes once both hands are up and whole (wrist in view) at the
  same time for 3 s (`BOTH_HANDS_HOLD_MS`); a gap over 300 ms restarts the count. With two
  hands, left and right come from position (the person's right hand is on the un-mirrored
  frame's left), because MediaPipe's label can flip while a hand turns; one hand alone
  goes by its label, so one hand can never pass. A gap over 300 ms, even with the camera
  off, always starts the 3 s again. The page shows three numbered steps (enable the camera,
  show both hands, hold still), a checklist ticked off from the real camera and detection
  state, and a camera panel: a header (a short status, centred, with a line along its
  bottom edge that fills over the 3 s), then the 4:3 video with only the camera controls
  on it. The steps column (420px) and the panel (620px) are the same height: the steps
  stretch so the last ends level with the panel's bottom. Next stays closed until
  the check passes. Finishing setup keeps a saved signing hand
  or sets Right; the camera controls' hand toggle switches it. The rules (`seeHands`,
  `steadySeen`, `updateHold`, `holdSecondsLeft`) are in `src/vision/landmarks/handChecks.js`. Its error titles and texts come from the design and
  live in `cameraMessages.js` and `visionMessages.js`; `useCamera` returns an
  `errorKind` and `useHandLandmarker` an `errorName` so pages can pick them.

## Camera conventions

- The camera check never starts the camera by itself: it opens with "Camera is off" and a
  Turn camera on button, and the browser only asks for the camera after that click
  (`CameraStage autoStart={false}`). Record's recording step starts it on arrival, since the
  person just pressed Start recording. Practice waits for a click too, so landing on Sema never
  turns the camera on. It stays off on Welcome, the intro pages and
  Record's consent/finished steps, and turns off whenever no camera view is on screen.
- `CameraProvider` (`src/app/shared-camera/`) does this: it owns the camera and the hand model for
  every page, starts the camera when a `CameraStage` with `autoStart` (the default)
  appears, and stops it when the last one goes away. After an error or Stop it waits for a click. Switching to another
  tab (the page hidden) stops it too, with `stopReason: 'hidden'`, and it never comes back
  by itself. No hand in view for a minute stops it as well (`stopReason: 'idle'`): after
  10 s without a hand a notice appears and counts down the rest of the minute
  (`src/camera/idleRules.js`, `src/app/shared-camera/useIdleCameraOff.js`, `IdleNotice`); any hand resets
  the count.
- Every camera page (camera check, Practice, Record) uses one component, `CameraView`
  (`src/components/camera-view/`): the frame, the problem panel (texts `CAMERA_VIEW_*` in
  `cameraMessages.js` and `visionMessages.js`), `CameraOff` with a Turn camera on button,
  the idle timeout, and `CameraControls` (on/off, the camera list; the page passes options
  or `false`). The page keeps its own hand detection and passes its overlays as children,
  shown while the camera is live.
- Every camera page, `/dev/tracking` included, puts its camera in one panel,
  `CameraPanel` (2026-10-23; before, each page copied the markup and its header looked
  different): a dark frame in every theme, a header with the page's short status (24px,
  white, or `tone` 'ok' accent / 'warn' amber), and a line along the header's bottom edge
  that fills over a hold (`hold`) or to a share (`fill`, Record's take). The look lives
  only in the shared `.camera-panel*` rules in `styles.css`.
  Pages never call
  `useCamera` or `useHandLandmarker` themselves, except `/dev/tracking`, which keeps its own
  camera and its Start camera button.
- Constraints: video only, ideal 640×480, `facingMode: 'user'`. Ideal values are
  requests; read `videoWidth`/`videoHeight` for the real size.
- Always stop every track (`track.stop()`) on Stop, on camera switch and on unmount.
  That is what turns the camera light off.
- Keep the stream in a ref, not state. Unmount cleanup must not rely on `videoRef`,
  because React has already cleared it by the time effect cleanups run.
- A page's `<video>` gets the running stream through `attachVideo`, a callback ref,
  so the picture carries over when one camera view replaces another.
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
- Load the model when a camera view first appears (or the camera first starts), never on
  page load, so Welcome and the intro pages download nothing. Until it's ready, Turn camera
  on says "Loading hand model…" and waits, and so does the controls' camera button. Keep it loaded
  across Stop/Start and across pages (it lives in `CameraProvider`). Close it on
  unmount.
- MediaPipe web needs WebGL2 even on the CPU delegate. `loadHandLandmarker` checks
  for WebGL2 first, then tries GPU and falls back to CPU. Each new landmarker runs
  one blank test frame, because some GPU failures only appear on the first frame.
  When WebGL is drawn in software (SwiftShader, llvmpipe…: hardware acceleration off, no
  graphics drivers), it goes straight to CPU (`isSoftwareRenderer` in
  `src/vision/model/graphics.js`): measured 2026-10-18 in headless Chrome without a graphics
  card, GPU ran at 2 fps and CPU at 15 fps, and below ~4 fps the camera check can't pass.
- `runningMode: 'VIDEO'`, `numHands: 2` (since 2026-10-16; before, 1). With one, MediaPipe
  keeps tracking the first hand it finds and never sees the other, so the chosen hand went
  unseen whenever the other came first. `pickHand` (`src/vision/tracking/pickHand.js`) keeps one
  hand: the page's `wantedHand` if found, else the first. Only that hand is drawn and
  passed on (the camera check passes `drawAllHands` to draw both; its listener also
  gets every hand as `hands`). Benchmark numbers from before this change were measured with one hand, so
  they aren't comparable; re-run the benchmark before relying on them.
- Call `detectForVideo` once per new video
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
- Smoothing (2026-10-22): the drawn points go through a One Euro filter
  (`src/vision/tracking/smoothHands.js`), because the points shook, most on closed
  handshapes, and Hand Landmarker has no smoothing option. Only the drawing is
  smoothed: the listener (recorder, camera check, Practice) still gets raw points.
  Each hand keeps its own filters, matched by wrist position, and starts fresh after
  300 ms unseen. `MIN_CUTOFF` and `BETA` are tuned by eye in Chrome.
- Landmarks can go below 0 or above 1 when the hand is partly out of frame. The
  canvas clips them; no special handling needed.
- **Handedness rule** (checked by hand on 2026-10-15, Chrome, tasks-vision 1.1.1):
  for our un-mirrored frames, MediaPipe's label already names the hand actually
  raised (right hand → "Right"). `toPhysicalHand` in `src/vision/tracking/handedness.js`
  passes it through unchanged. If frames are ever mirrored before detection, swap
  it. Re-check after upgrading MediaPipe.
- Performance numbers come from the benchmark in Developer settings on `/dev/tracking`
  (results in `docs/dev.md`)
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
  `normalization` when `src/vision/landmarks/normalizeHand.js` changes; `scripts/check-session.js`
  lists the versions it accepts.
- The left-hand flip uses the detected hand, for now (an open decision in the plan).
- Take timing and the sampling interval are constants in `src/recorder/takeRules.js`;
  a take passes when `kept − mismatched ≥ 24`.
- `data/raw/` is gitignored and private; never commit recorded sessions. Downloaded
  datasets (`data/public/`, a folder each: `asl-hg/`, `aslyset/`) and extracted files
  (`data/extracted/`) are gitignored too.
- `npm test` runs Vitest; keep pure logic in small modules with tests next to them.
- Letters come from `public/languages/asl/letters.json`. `pilotOnly` letters were to be
  left out of 2.2's first training set; since 2026-10-22 training uses all 24 static
  letters from the public photos, and Lanix's recordings are the test (`docs/project-plan.md`).

## Design reference

- The built pages are the design now. `docs/design/` (Lanix's exports from the design
  canvas) is no longer used and isn't in the project. New pages follow the existing
  pages' palette, type, spacing and shell; Lanix reviews the result and asks for
  tweaks.
- Take screenshots of a page (headless Chrome) and check them before calling a page
  done.

## Visual design

Minimal and calm: lots of space, one obvious action, no decoration.
Fonts: Plus Jakarta Sans (text, weights 400–800) and JetBrains Mono 500 (codes and
counts). JetBrains Mono lacks "ῆ", so `--font-mono` starts with a 3 KB subset of Noto
Sans Mono holding only σ ῆ μ α (loaded only where they appear). Colors are CSS variables in `src/styles.css`, with the designs' exact values:

| Variable           | Hex       | Use                                              |
| ------------------ | --------- | ------------------------------------------------ |
| `--deep-cobalt`    | `#142C48` | Text; dark surfaces such as the video frame      |
| `--bright-sky`     | `#36A7D9` | Accents on dark surfaces only                    |
| `--deep-sky`       | `#1A75A3` | Buttons and links on light surfaces, white text  |
| `--cloud-white`    | `#F5F7F8` | Page background                                  |
| `--white`          | `#FFFFFF` | Cards and the menu bar                           |
| `--ice-tint`       | `#E3F4FA` | The Preview pill, soft highlights                |
| `--line`           | `#E1E7ED` | Borders and dividers on light surfaces           |
| `--line-strong`    | `#C3CED9` | Input and letter-tile borders                    |
| `--disabled`       | `#D3DCE5` | Disabled buttons                                 |
| `--chip`           | `#EEF2F5` | The small "preview" pills in the menu            |
| `--segment`        | `#E7EDF2` | Track behind a Left/Right toggle                 |
| `--amber`          | `#B45309` | Warning text and marks on light backgrounds      |
| `--amber-on-dark`  | `#E8A23A` | Warnings on dark surfaces                        |
| `--amber-tint`     | `#FDF1E3` | Background of a warning note                     |
| `--amber-ink`      | `#7A3A06` | Text on `--amber-tint`                           |
| `--error-red`      | `#B42318` | Destructive actions and errors                   |
| `--muted-text`     | `#52637A` | Secondary text on light surfaces                 |
| `--muted-on-dark`  | `#A9BCD0` | Secondary text on dark surfaces                  |
| `--hand-outline`   | `#0C1D30` | Dark outline under hand drawings                 |
| `--progress-track` | `#2A4A70` | Empty part of a progress bar on dark surfaces    |

Never use Bright Sky for text on a light background: it fails contrast.

The hand overlay (in `src/vision/tracking/drawHand.js`) uses Bright Sky bones, Cloud White
joints, and a dark outline `#0C1D30` under both so it shows over any background or
skin tone.
