# Sema

A browser-based ASL fingerspelling coach. It will use your webcam and hand landmarks
to teach the ASL alphabet. Everything runs in your browser: no backend, no accounts,
and video never leaves your machine.

**Status: Phase 1 complete, deployed on Vercel.** The page shows your webcam (mirrored), tracks one hand with
[MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)
and draws its 21 landmarks on top. It shows whether a hand is found and which one,
the camera and detection frame rates, and the average detection time. Letter
recognition comes in later phases.

Live site: the link will be added here soon.

Development plan: [docs/project-plan.md](docs/project-plan.md)

Mirroring: only the display is mirrored; MediaPipe gets the camera's frames
un-mirrored, so its Left/Right label already names the hand the user raised (right
hand → "Right") and is used unchanged (checked by hand in Chrome, 2026-10-15).

## Run it

You need Node.js 20.19+ or 22.12+ (check with `node -v`).

```sh
npm install
npm run dev
```

Open http://localhost:5173 and click **Start camera**. The browser will ask for
camera permission. The hand model loads the first time the camera starts.

Use Chrome/Chromium or Firefox. Hand tracking needs WebGL, which some
privacy-focused browsers (such as LibreWolf) don't give to pages; the app says so
if that happens.

Other scripts: `npm run build` (production build into `dist/`), `npm run preview`
(serve that build), `npm run lint`, `npm test` (unit tests, Vitest) and
`npm run check-session -- <file>` (checks a recorded session file).

## MediaPipe files

MediaPipe runs as WebAssembly. The app serves its files itself instead of loading
them from a CDN:

- **WebAssembly** (`public/mediapipe/wasm/`, not in git): copied from
  `node_modules/@mediapipe/tasks-vision/wasm` by `npm run copy-mediapipe`, which
  also runs automatically after every `npm install`. These files must come from the
  same release as the installed `@mediapipe/tasks-vision` package, because the
  JavaScript and the WebAssembly call each other by internal names. Run the script
  again by hand if the folder is missing or after upgrading the package:

  ```sh
  npm run copy-mediapipe
  ```

- **Model** (`public/models/hand_landmarker.task`, in git): 7,819,105 bytes (7.5 MiB),
  float16 version 1 from
  `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`
  (the same file as `latest` on 2026-10-15), sha256
  `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`.

## Performance

Measured on 2026-10-15: Fedora KDE Plasma (Wayland), Ryzen 5 3600, GTX 1660 Super
(NVIDIA proprietary driver), 8 GB RAM.

Camera at 640 × 480. Measured with the built-in benchmark:

1. Start the camera and open **Developer settings** under the video.
2. Pick the delegate and wait until **Runs on** shows it.
3. Hold one hand in view, keep the tab in front and DevTools closed, and click
   **Run benchmark**. It waits 2 seconds to warm up, then measures every frame
   for 10 seconds.
4. Click **Copy row** and paste it over the matching row below.

A run doesn't count (no row is offered) if your hand was found in fewer than 90%
of frames, because detection does different work with and without a hand in view,
or if the tab was hidden, the camera stopped or the model reloaded during the run. Run each
combination twice; if the two medians differ by more than about 10%, close other
apps and run it again.

Detection times were steady across three runs: about 12 ms on GPU in both
browsers, and about 27 ms (Chrome) and 30–32 ms (Firefox) on CPU. GPU is the
default and has plenty of headroom in both browsers; on CPU, Chrome just keeps up
with 30 fps. Firefox's camera frame rate varied between sittings (30 fps, then
about 20 fps even on GPU), most likely because of the webcam's auto-exposure (see
below the table), not because of the browser or the delegate.

| Browser | Delegate | Run | Camera fps | Detection fps | Detection median (ms) | Detection p95 (ms) | Detection mean (ms) |
| ------- | -------- | --- | ---------- | ------------- | --------------------- | ------------------ | ------------------- |
| Chrome 155 | GPU | 1 | 30.0 | 30.0 | 11.6 | 13.3 | 11.6 |
| Chrome 155 | GPU | 2 | 30.0 | 30.0 | 11.8 | 12.8 | 11.8 |
| Chrome 155 | GPU | 3 | 30.0 | 30.0 | 11.7 | 12.9 | 11.7 |
| Chrome 155 | CPU | 1 | 30.0 | 29.8 | 27.1 | 35.0 | 28.3 |
| Chrome 155 | CPU | 2 | 30.0 | 30.0 | 26.9 | 28.6 | 27.2 |
| Chrome 155 | CPU | 3 | 30.0 | 30.0 | 27.0 | 28.2 | 27.2 |
| Firefox 157 | GPU | 1 | 30.0 | 30.0 | 10.0 | 13.0 | 10.4 |
| Firefox 157 | GPU | 2 | 19.6 | 19.6 | 10.0 | 16.0 | 10.6 |
| Firefox 157 | GPU | 3 | 19.5 | 19.5 | 9.0 | 12.0 | 9.2 |
| Firefox 157 | CPU | 1 | 22.7 | 22.5 | 32.0 | 37.0 | 32.9 |
| Firefox 157 | CPU | 2 | 19.6 | 19.6 | 30.0 | 32.0 | 29.7 |
| Firefox 157 | CPU | 3 | 19.6 | 19.6 | 30.0 | 31.1 | 29.9 |

Run 1 was measured in one sitting and runs 2–3 in a later one, all with the A4tech
FHD webcam. The webcam was in aperture-priority auto-exposure with
`exposure_dynamic_framerate` on, which lets it drop below 30 fps in dim light. For
steadier camera numbers, lock the frame rate before benchmarking (find your camera
with `v4l2-ctl --list-devices`, then run
`v4l2-ctl -d /dev/videoN -c exposure_dynamic_framerate=0`, and set it back to `1`
afterwards).

- **Camera fps** counts the frames the browser showed in the window
  (`presentedFrames`), so it stays accurate when detection is slow.
- **Detection fps** is detections per second over the same window.
- **Median** is the typical detection time, **p95** the time 95% of frames beat
  (it shows slow spikes), **mean** the average. Firefox rounds its clock more
  coarsely than Chrome; the benchmark shows the step, and when it's coarse the
  mean is the more precise number.

Detection runs at most once per camera frame, so detection fps can't be higher
than camera fps. It runs on the page's main thread, so it drops below camera fps
when one detection takes longer than one frame (33 ms at 30 fps).

## Deploy (Vercel)

Sema is a static site, deployed on Vercel from the GitHub repository. The Vite
preset works as is: Vercel runs `npm install` (whose `postinstall` copies the
MediaPipe WebAssembly into `public/`), then `npm run build`, and serves `dist/`
over HTTPS, which the camera requires. No base path is needed. Every push to
`main` deploys again.

`vercel.json` turns on `cleanUrls`, so the recorder (`record.html`) is served at
`/record`. A future single-page-app rewrite (Phase 3) must exclude `/record`.

## Recorded data

Landmark recordings collected for training go in `data/raw/`, which is gitignored: they
stay private and are backed up by Lanix, never committed to this public repository.
Participants choose separately whether their recordings may be used to train Sema
(required) and published in a public dataset (optional), and can ask Lanix to delete
their recordings at any time. What is public: the code, evaluation results, confusion
matrices and trained classifier weights.

## Recording sessions

The recorder collects labelled hand landmarks for training (milestone 2.1). It's a
separate page: `/record` on the live site, `http://localhost:5173/record.html` in
development. The file format is described in [docs/data-format.md](docs/data-format.md).

**In person:** open the page, let the participant read the consent text, enter their
code (`p03`) and tick the boxes. Start the camera, then for each letter and hand in the
table choose the cell and click **Record**: a 3-2-1 countdown, "Hold…" for 3.5 seconds,
then the result. Aim for 3 saved takes per cell; the hint under each take says where to
hold the hand (centre, closer, off to one side). **Undo last take** removes a mistake.
At the end, click **Download session file**.

**Remotely:** send the participant the `/record` link. They do the same on their own
computer and send you the downloaded file.

**What participants are told:** only the positions of 21 hand points are saved, no
video or photos; they're identified by a code, not their name; everything stays in
their browser until they download the file, and nothing is uploaded; Lanix keeps the
file private and uses it to train and test Sema; they can ask Lanix to delete their
recordings at any time. Training use is required; publication in a public dataset is a
separate, optional choice.

**Before keeping a file,** check it:

```sh
npm run check-session -- path/to/sema-asl-p03-2026-11-02a.json
```

It checks the format and normalization versions, that every frame has 63 numbers, the
consent, and that no recording ID is used twice (in the file or in `data/raw/`), then
prints the accepted and rejected takes per letter and hand. If it says OK, move the file
into `data/raw/` (private, gitignored).

**The letter list** is `public/languages/asl/letters.json`. Training letters are entries
like `{ "letter": "B", "instructions": "…" }` (instructions describe the right hand);
pilot-only letters have `"pilotOnly": true`. They're recorded in the pilot but left out
of the first training set.

## Console messages you can ignore

MediaPipe prints its own logs to the console. These are normal:

- `INFO: Created TensorFlow Lite XNNPACK delegate for CPU.` shows in red, but it is
  information, not an error (MediaPipe prints its logs as errors). It appears when
  the model starts on the CPU.
- Yellow warnings such as `Using NORM_RECT without IMAGE_DIMENSIONS…`,
  `Feedback manager requires a model with a single signature…` and
  `OpenGL error checking is disabled`.

## Check your webcam on Fedora

If the browser can't find your camera, check that Linux can see it first:

```sh
sudo dnf install v4l-utils
v4l2-ctl --list-devices
```

Each camera is listed with one or more `/dev/videoN` entries. It's normal for one
camera to have two (one for video, one for metadata). If your camera isn't listed,
the problem is the cable, USB port or driver, not the browser.

To see which resolutions and frame rates a camera supports:

```sh
v4l2-ctl -d /dev/video0 --list-formats-ext
```

## GitHub Codespaces

`vite.config.js` allows `*.app.github.dev` hosts, so the dev server works in a
codespace:

1. Run `npm install` and `npm run dev` in the codespace terminal.
2. Open the forwarded port 5173 from the **Ports** tab. The URL looks like
   `https://<name>-5173.app.github.dev`.

The camera you see is the one on the computer running your browser. The codespace
only serves the page and has no camera of its own. The forwarded URL is HTTPS, which
browsers require before they allow camera access.

## Project structure

```
record.html                     the recorder page (/record)
vercel.json                     cleanUrls, so the recorder is at /record
public/
  models/hand_landmarker.task   the hand model (in git)
  mediapipe/wasm/               MediaPipe WebAssembly (copied on npm install)
  languages/asl/letters.json    letters to record, with how to form each
scripts/
  copy-mediapipe.js             copies the WebAssembly files into public/
  check-session.js              checks a recorded session file
src/
  camera/
    useCamera.js                start/stop/switch the webcam, camera list, errors
    useVideoStats.js            real resolution and camera frames per second
    cameraMessages.js           plain-language camera error messages
    frameCounter.js             reads the browser's frame counter (camera fps)
  recorder/
    main.jsx                    the recorder page's entry point
    RecorderApp.jsx             consent, camera, grid, take panel, download
    ConsentForm.jsx             participant code, session ID, consent
    RecordingGrid.jsx           letter × hand table of saved takes
    TakePanel.jsx               instructions, Record, countdown, result
    useRecording.js             one take: countdown, settle, capture, result
    takeRules.js                take timing, sampling and the pass rule
    letters.js                  loads letters.json
    sessionFile.js              builds the session file
    sessionStore.js             autosave in the browser, download
  vision/
    normalizeHand.js            turns 21 landmarks into 63 shape numbers
    browserName.js              "Chrome 155", "Firefox 157"
    loadHandLandmarker.js       loads the model; GPU first, CPU fallback
    useHandLandmarker.js        creates, recreates and closes the landmarker
    useHandDetection.js         per-frame detection loop and readouts
    useBenchmark.js             runs the performance benchmark
    benchmarkStats.js           median, percentiles and the README table row
    BenchmarkPanel.jsx          the benchmark in Developer settings
    drawHand.js                 draws the skeleton on the canvas
    handedness.js               MediaPipe's Left/Right label -> the hand raised
    visionMessages.js           plain-language hand-tracking messages
  App.jsx                       the page
  main.jsx                      entry point
  styles.css                    all styles and color variables
docs/
  project-plan.md               the development plan and its status
  data-format.md                the recorded session file format
  recorder-design.md            the recorder's design (milestone 2.1)
  recorder-implementation-plan.md  how the recorder was built, task by task
CLAUDE.md                       project notes and conventions for Claude Code
```
