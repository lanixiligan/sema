# Sema

A browser-based ASL fingerspelling coach. It will use your webcam and hand landmarks
to teach the ASL alphabet. Everything runs in your browser: no backend, no accounts,
and video never leaves your machine.

**Status: Phase 1.** The page shows your webcam (mirrored), tracks one hand with
[MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)
and draws its 21 landmarks on top. It shows whether a hand is found and which one,
the camera and detection frame rates, and the average detection time. Letter
recognition comes in later phases.

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
(serve that build), `npm run lint`.

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

GPU is the default and has plenty of headroom in both browsers; on CPU, Chrome
just keeps up and Firefox drops to about 22 fps.

| Browser | Delegate | Camera fps | Detection fps | Detection median (ms) | Detection p95 (ms) | Detection mean (ms) |
| ------- | -------- | ---------- | ------------- | --------------------- | ------------------ | ------------------- |
| Chrome 155 | GPU | 30.0 | 30.0 | 11.6 | 13.3 | 11.6 |
| Chrome 155 | CPU | 30.0 | 29.8 | 27.1 | 35.0 | 28.3 |
| Firefox 157 | GPU | 30.0 | 30.0 | 10.0 | 13.0 | 10.4 |
| Firefox 157 | CPU | 22.7 | 22.5 | 32.0 | 37.0 | 32.9 |

Each row is a single benchmark run. The second runs haven't been done yet.

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
public/
  models/hand_landmarker.task   the hand model (in git)
  mediapipe/wasm/               MediaPipe WebAssembly (copied on npm install)
scripts/
  copy-mediapipe.js             copies the WebAssembly files into public/
src/
  camera/
    useCamera.js                start/stop/switch the webcam, camera list, errors
    useVideoStats.js            real resolution and camera frames per second
    cameraMessages.js           plain-language camera error messages
  vision/
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
CLAUDE.md                       project notes and conventions for Claude Code
```
