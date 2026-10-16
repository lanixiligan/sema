# Benchmarks

Measured on 2026-10-15: Fedora KDE Plasma (Wayland), Ryzen 5 3600, GTX 1660 Super
(NVIDIA proprietary driver), 8 GB RAM.

Camera at 640 × 480. Measured with the built-in benchmark:

1. Open http://localhost:5173/dev (or `/dev` on the live site), click **Start camera**
   and open **Developer settings** under the video.
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
