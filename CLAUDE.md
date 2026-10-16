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
- **Phase 2 (in progress):** recording, landmark normalization, classifier. The
  recorder (2.1) is built on the `phase-2-1-recorder` branch.
- **Phase 3.1 (being done early on `phase-2-1-recorder`):** the app shell, Welcome and
  setup, because the recorder became the app's main page after setup. Learn and
  Practice stay placeholders until 3.3–3.4 (`phase-3-preview`).
- Later: letter recognition (`src/recognition/`). Don't create that folder early.

## Stack and constraints

- React + Vite + plain JavaScript (`.jsx` / `.js`). No TypeScript.
- No UI framework, no CSS framework. Plain CSS in `src/styles.css`.
- No new dependencies without asking first. Approved so far: `@mediapipe/tasks-vision`,
  `vitest` (dev only).
- Serve every asset from the app itself, never from a CDN. Fonts are `.woff2` files in
  `public/fonts/` with their OFL licences, declared with `@font-face` in `styles.css`.
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
  app/          the shell: router, navigation, top bar and menu, phone notice,
                camera provider, settings store
  components/   parts used by more than one page folder (CameraStage, icons)
  pages/
    onboarding/ Welcome; the intro pages About Sema, How Sema works and How Sema
                handles your data (+ IntroLayout); Signing hand, Camera check (+ SetupBar)
    record/     the Record page and its parts
    learn/      the Learn placeholder
    practice/   the Practice placeholder
    dev/        the Phase 1 page at /dev (+ BenchmarkPanel)
  camera/       webcam logic: useCamera hook, error messages, video stats
  vision/       hand tracking: model loading, detection loop, drawing, handedness,
                normalization, the camera check's rules
  recorder/     recording logic: take rules, useRecording, session file and storage
  App.jsx       the shell: picks the page for the address
  main.jsx
  styles.css
```

## Routing

- One HTML file (`index.html`) serves every page. Don't add a second HTML file.
- Each page lives in a folder under `src/pages/`, with the parts only it uses. Page
  folders never import from each other: anything two page folders need goes in
  `src/components/`, and logic with no page stays in `src/recorder/`, `src/vision/`
  and `src/camera/`.
- `src/app/router.js` maps each path to a page (`PATHS`, `resolveRoute`); unknown
  paths redirect to `/`. `src/app/navigation.js` changes pages with the History API
  (`navigate`, `usePathname`); links between pages use `<Link>` from `src/app/Link.jsx`.
- `vercel.json` rewrites every path to `index.html`; Vercel serves real files first.
- `/dev` is the Phase 1 tracking page with the benchmark. It's not in the menu.
- Setup redirects live in `resolveRoute`: a new visitor opening Record, Learn or
  Practice goes to Welcome; a returning visitor opening `/` goes to Record; the camera
  check needs a signing hand first.

## Settings

- The signing hand and "setup done" are kept by `src/app/progressStore.js`
  (`localStorage` key `sema.progress`, with a version number). Pages never touch
  `localStorage` directly; `App.jsx` holds the settings and passes them down.
- The theme (Light / Dark / System, default System) is saved in the same store and chosen in
  the settings menu (`src/app/SettingsMenu.jsx`). `src/app/theme.js` sets `data-theme` on
  `<html>`; a small script in `index.html` sets it before the first paint. In `styles.css`,
  rules use colour roles (`--bg`, `--text`, `--accent`…), with a light set on `:root` and a
  dark set on `[data-theme='dark']` and `.on-dark`. Palette colours are used directly only
  where a colour never changes (the camera frame, hand drawings). The About Sema, How Sema
  works and data pages are `.on-dark`, so they're dark in every theme.
- The camera check's rules (signing hand found, whole hand with the wrist in view) are
  in `src/vision/handChecks.js`. Its error titles and texts come from the design and
  live in `cameraMessages.js` and `visionMessages.js`; `useCamera` returns an
  `errorKind` and `useHandLandmarker` an `errorName` so pages can pick them.

## Camera conventions

- Start the camera automatically when arriving on 2c and on Record's recording step.
  Navigating there and the browser's permission prompt are the consent. It stays off
  on Welcome, 2a, 2b and Record's consent/finished steps, and turns off whenever no
  camera view is on screen.
- `CameraProvider` (`src/app/`) does this: it owns the camera and the hand model for
  every page, starts the camera when a `CameraStage` appears, and stops it when the
  last one goes away. After an error or Stop it waits for a click. Pages never call
  `useCamera` or `useHandLandmarker` themselves, except `/dev`, which keeps its own
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
- Load the model when the camera first starts, never on page load. Keep it loaded
  across Stop/Start and across pages (it lives in `CameraProvider`). Close it on
  unmount.
- MediaPipe web needs WebGL2 even on the CPU delegate. `loadHandLandmarker` checks
  for WebGL2 first, then tries GPU and falls back to CPU. Each new landmarker runs
  one blank test frame, because some GPU failures only appear on the first frame.
- `runningMode: 'VIDEO'`, `numHands: 2` (since 2026-10-16; before, 1). With one, MediaPipe
  keeps tracking the first hand it finds and never sees the other, so the chosen hand went
  unseen whenever the other came first. `pickHand` (`src/vision/pickHand.js`) keeps one
  hand: the page's `wantedHand` if found, else the first. Only that hand is drawn and
  passed on. Benchmark numbers from before this change were measured with one hand, so
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
- Landmarks can go below 0 or above 1 when the hand is partly out of frame. The
  canvas clips them; no special handling needed.
- **Handedness rule** (checked by hand on 2026-10-15, Chrome, tasks-vision 1.1.1):
  for our un-mirrored frames, MediaPipe's label already names the hand actually
  raised (right hand → "Right"). `toPhysicalHand` in `src/vision/handedness.js`
  passes it through unchanged. If frames are ever mirrored before detection, swap
  it. Re-check after upgrading MediaPipe.
- Performance numbers come from the benchmark in Developer settings on `/dev`
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
- `npm test` runs Vitest; keep pure logic in small modules with tests next to them.
- Letters come from `public/languages/asl/letters.json`; `pilotOnly` letters are
  recorded in the pilot but excluded from 2.2's first training set.

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

The hand overlay (in `src/vision/drawHand.js`) uses Bright Sky bones, Cloud White
joints, and a dark outline `#0C1D30` under both so it shows over any background or
skin tone.
