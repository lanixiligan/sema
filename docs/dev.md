# Developer pages

The tools for building Sema's letter recognition live under `/dev`, on the live site and
under `npm run dev`. They're not in the menu, and they sit behind an access code.

| Address | What it's for |
| --- | --- |
| `/dev` | The dashboard: a card per tool and the latest classifier results |
| `/dev/tracking` | Camera and hand-tracking readouts, and the speed benchmark |
| `/dev/record` | The recorder: takes of each letter as hand points, for the test set |
| `/dev/extract` | Turns a public dataset's photos into hand points for training |

Contents:

- [Access code](#access-code): setting it, opening the tools, what it does and doesn't protect
- [The dashboard](#the-dashboard)
- [Tracking and benchmark](#tracking-and-benchmark): checking a computer, running the
  benchmark, and the results
- [Record](#record)
- [Extract hand points](#extract-hand-points)
- [Learn (the classifier)](#learn-the-classifier): a main page, `/learn`, with developer parts
  under `npm run dev`
- [Where the code is](#where-the-code-is): and how to add a tool

## Access code

**Set it** (once, and again whenever you want to change it):

1. Pick a passphrase of at least 12 characters. A few unrelated words work well. Keep it
   somewhere safe, such as a password manager.
2. Run `npm run dev-code -- "your passphrase"`. This saves only the passphrase's SHA-256
   fingerprint, in `src/pages/dev/dev-code.json`, never the passphrase itself.
3. Under `npm run dev` the new code works straight away. For the live site, commit
   `dev-code.json` and push to `main`, which deploys.

Until a code is set, `/dev` says so and opens nothing. A new code locks every browser out
until the new one is entered.

**Open the tools:** go to `/dev`, enter the passphrase and click **Unlock**. This browser
remembers it (as `devAccess` in `progressStore.js`). **Lock** on the dashboard, or Delete
Sema's data in the settings menu, forgets it. On someone else's computer, click **Lock**
when you're done.

**What it protects:** it's a keep-out sign, not a lock. Sema has no server, so the code is
checked in the browser, and someone who reads the JavaScript can get past it. That's fine,
because nothing secret is behind it: it keeps visitors out of tools that turn the camera on
without Sema's onboarding, and that would look broken to them. Never put anything private
behind it. The fingerprint ships in the app, so a short code could be found by trying every
possibility; that's why `npm run dev-code` asks for at least 12 characters.

## The dashboard

`/dev` has a card for each tool, then (under `npm run dev` only) a **Letter model** switch,
Small model or k-NN, which says which classifier Learn and the quiz run (it only gives Learn's
"Right now" guess: the finger conditions decide). The choice is saved in this browser; the live
site has one model, so it has no switch. Then the latest training results, twice: the small
model's, the one on Learn and the live site (`training/reports/small.json`, which
`python3 training/train_small.py …` writes), then the k-NN's for comparison
(`training/reports/knn.json`, from `python3 training/train.py …`; see `training/README.md`).
Each gives the accuracy on people the classifier has never seen, per letter, and on the recorded
test set, and names its full report; the live site shows the versions last committed. Letters
below the bar (90%, `PASS_SHARE` in `training/train.py`: once the bar for switching a letter on,
before every letter could be picked) are amber, and percentages are rounded down, so a letter
only shows 90% if it really reached it.

## Tracking and benchmark

`/dev/tracking` is the Phase 1 page: camera readouts, the hand model's GPU or CPU choice,
and the speed benchmark. It keeps its own camera instead of the app's shared one, so it
starts only with its **Start camera** button.

**On a computer Sema hasn't been used on,** open it first, click **Start camera** and check
**Detection** with a hand in view: 15 fps or more is plenty. Much lower means hand tracking
is too slow there, and Record won't keep takes.

### Running the benchmark

The camera runs at 640 × 480.

1. Open `/dev/tracking`, click **Start camera** and open **Developer settings** under the
   video.
2. Pick the delegate and wait until **Runs on** shows it.
3. Hold one hand in view, keep the tab in front and DevTools closed, and click
   **Run benchmark**. It waits 2 seconds to warm up, then measures every frame for 10
   seconds.
4. Click **Copy row** and paste it over the matching row in [the results](#results).

A run doesn't count (no row is offered) if your hand was found in fewer than 90% of frames,
because detection does different work with and without a hand in view, or if the tab was
hidden, the camera stopped or the model reloaded during the run. Run each combination twice;
if the two medians differ by more than about 10%, close other apps and run it again.

- **Camera fps** counts the frames the browser showed in the window (`presentedFrames`), so
  it stays accurate when detection is slow.
- **Detection fps** is detections per second over the same window.
- **Median** is the typical detection time, **p95** the time 95% of frames beat (it shows
  slow spikes), **mean** the average. Firefox rounds its clock more coarsely than Chrome; the
  benchmark shows the step, and when it's coarse the mean is the more precise number.

Detection runs at most once per camera frame, so detection fps can't be higher than camera
fps. It runs on the page's main thread, so it drops below camera fps when one detection takes
longer than one frame (33 ms at 30 fps).

### Results

**Measured with MediaPipe looking for one hand.** Since 2026-10-16 it looks for two
(`numHands: 2`), so these numbers aren't comparable to today's app: run the benchmark again
before relying on them.

Measured on 2026-10-15: Fedora KDE Plasma (Wayland), Ryzen 5 3600, GTX 1660 Super (NVIDIA
proprietary driver), 8 GB RAM.

Detection times were steady across three runs: about 12 ms on GPU in both browsers, and about
27 ms (Chrome) and 30–32 ms (Firefox) on CPU. GPU is the default and has plenty of headroom in
both browsers; on CPU, Chrome just keeps up with 30 fps. Firefox's camera frame rate varied
between sittings (30 fps, then about 20 fps even on GPU), most likely because of the webcam's
auto-exposure (see below the table), not because of the browser or the delegate.

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

Run 1 was measured in one sitting and runs 2–3 in a later one, all with the A4tech FHD
webcam. The webcam was in aperture-priority auto-exposure with `exposure_dynamic_framerate`
on, which lets it drop below 30 fps in dim light. For steadier camera numbers, lock the frame
rate before benchmarking (find your camera with `v4l2-ctl --list-devices`, then run
`v4l2-ctl -d /dev/videoN -c exposure_dynamic_framerate=0`, and set it back to `1`
afterwards).

## Record

`/dev/record` is the recorder (2.1): the participant's code and consent, then takes of each
letter with each hand, and a session file to download ([data-format.md](data-format.md)).
How to run a session is in [guide.md](guide.md#recording-sessions). Until 2026-10-22 it was
the app's main page, at `/record`, where setup led; it moved here once the classifier was
trained, since recordings are now only the test set. It uses the app's shared camera, like
the camera check, and needs no setup. Its top bar has no gear: Delete Sema's data (the gear
on Learn, Quiz and About) also removes a session saved in this browser.

## Extract hand points

`/dev/extract` runs every photo of a public dataset through Sema's own hand model and
normalization, and downloads the hand points as one file for training. The photos never
leave the computer: the browser reads them from disk. The file's layout is in
[data-format.md](data-format.md#extracted-files-public-datasets).

It reads two datasets so far, each in its own folder in `data/public/` (gitignored; the
folder's name tells the page which dataset it is):

| Dataset | Download | Unpack into | Photos it finds |
| --- | --- | --- | --- |
| ASL-HG | `ASL_Raw_Images.zip` (the raw photos, not the processed ones) from [Mendeley Data](https://data.mendeley.com/datasets/j4y5w2c8w9/1) | `data/public/asl-hg/`, the letter folders directly inside | 36,000 |
| ASLYset | `ASLYset.rar` from [Mendeley Data](https://data.mendeley.com/datasets/xs6mvhx6rh/1) (unpack with `unar -o data/public/aslyset ASLYset.rar`) | `data/public/aslyset/`, with `images/` and `labels/` inside | 4,800 (FN, SP and the label files are skipped) |

To extract one:

1. Download and unpack it as above. Keep the archive's own layout: the page reads the
   folder and file names.
2. In Chrome, open `/dev/extract`, click **Choose folder** and pick the dataset's folder in
   `data/public`. Check the photo count against the table. Chrome asks to "upload" the
   files; they only go to this page.
3. Click **Start**. **Runs on** should say GPU. Keep the tab in front and stay on the page:
   Chrome slows down background tabs, and leaving the page stops the run. **Stop** offers
   what's done so far.
4. When it says Done, click **Download**, and move the file into `data/extracted/`
   (gitignored).

Then clean and train with `training/` (`training/README.md`).

How it works: the page makes the hand model the app's way (`loadHandLandmarker`: two hands,
GPU or CPU) and switches it to IMAGE mode, so each photo is detected on its own, with nothing
carried over from the photo before (VIDEO mode, the app's, follows a hand from frame to
frame). Each hand found goes through the recorder's own `frameFromDetection`, so the
normalization is exactly the one recordings get.

## Learn (the classifier)

Learn (`/learn`) is a main page, the one returning visitors start on, not a developer tool:
the classifier page was `/dev/try` until 2026-10-22, then Try (`/try`), renamed Practice
(`/practice`) on 2026-10-23 and merged into Learn on 2026-10-27; `/try` and `/practice`
redirect to `/learn`. The quiz checks each letter the same way (`useLetterCheck` in
`src/components/letter-check/`). Learn's developer part only shows under `npm run dev`, at the
bottom of the right column: the "Right now" line, the model's guess for the signing hand (the
letter and how sure, or "not sure"); which model runs is chosen on the dashboard (see "The
dashboard").

It has Record's three columns. On the left, the letter guide: all 26 letters' drawings (facing
the signing hand), as a list or a grid, as buttons that pick the letter; Learn starts at A. In
the middle, the camera in the shared camera panel: a short status, and a line that fills over
the hold; then "That's B!" over the picture with Next letter and Try again. Its controls have
Record's Left | Right switch, which here changes the saved signing hand (Right by default; the
drawings face it). Since 2026-10-23 only the signing hand counts: the status says "Show B with
your right hand", the other hand gets no points drawn, and it can't make the letter (before,
either hand could). On the right, the letter's card with its drawing large, and its finger
checklist, ticked live.

The hold counts while the signing hand meets the letter's finger conditions
(`src/vision/landmarks/letterShapes.js`, every letter since 2026-10-27): each is scored 0 to 1
from the hand's measurements (`handMeasures.js`), and the letter is made when the overall score
is high enough and no other still letter fits clearly better (`matchLetter` in
`letterMatch.js`). Hold it for 1.5 seconds; a gap over 300 ms restarts it
(`src/components/letter-check/letterHold.js`, with tests). The model doesn't decide (since
2026-10-27; before, the hold needed its sure guess, and only B had shape rules on top):
`showsLetter` in `letterHold.js` says how to make it agree again. Like training, it only judges
a whole hand (every point, wrist included, in view).

J and Z move, so they're traced instead of held. J (since 2026-10-26; before, darkened and
unchecked) starts as I: held for 1 s (the panel's line fills), then a curvy J appears with
point 1 on the pinky tip, as tall as the hand from wrist to pinky tip, to trace with the pinky
to point 2 in I's handshape; a slip over 0.8 s removes it, back to the I
(`src/vision/landmarks/jTrace.js`). Z (since 2026-10-24) is a Z drawn under the hand, to
follow with the index fingertip from point 1, in order, to point 2 at its end, while the hand
keeps Z's handshape (`src/vision/landmarks/zTrace.js`, the rules in `letterShapes.js`); the
panel's line fills as it's traced, and a slip over 0.8 s starts it over.

- **Small model** (the default; step 5 of 2.2): `public/models/asl-letters.json`, which
  `training/train_small.py` writes: the better of logistic regression and a small neural
  network on people it has never seen (`training/reports/small.md`). It holds only weights,
  14 KB, so it's committed and works on the live site too. Learn's "Right now" line shows the
  top letter's percentage. It's trained on ASL-HG and ASLYset (both CC BY 4.0), credited in
  `docs/ATTRIBUTION.md` and the README; keep those credits while the model ships.
- **k-NN** (step 4): `data/models/knn-asl.json`, which `training/train.py` writes (gitignored:
  11 MB, and it holds every training hand). So the dashboard's switch offers it only under
  `npm run dev`. Practice had that switch itself until 2026-10-23.

Each JavaScript copy must give the same answers as its Python: `networkModel.js` as
`forward()` in `training/small.py`, `knnModel.js` as `training/knn.py`. Checked on 2026-10-22
on all 1,620 recorded frames, for both: the same letter and the same "sure or not" for every
one (the small model's percentages within 2e-15). Check again after changing either side.

## Where the code is

```
src/pages/dev/
  DevArea.jsx       the access check, then the page asked for (App.jsx loads it lazily, so
                    visitors who never open /dev never download the tools)
  DevGate.jsx       the access code form
  DevDashboard.jsx  /dev
  DevTopBar.jsx     "Developer tools / <tool>" in the top bar
  devAccess.js      hashing and checking the code; dev-code.json holds the fingerprint
  tracking/         /dev/tracking (+ BenchmarkPanel)
  extract/          /dev/extract
  record/           /dev/record (the Record page and its parts)
scripts/dev-code.js npm run dev-code
```

To add a tool:

1. Add its path under `/dev/` to `PATHS` in `src/app/routing/router.js`, and its name to
   `DEV_PAGES` in `src/app/App.jsx`.
2. Put the page in a folder under `src/pages/dev/`, with `<DevTopBar title="…" />` as its
   top bar, and add a `case` for it in `DevArea.jsx`.
3. Add a card to `TOOLS` in `DevDashboard.jsx`, a row to the table at the top of this file,
   and a section here.
