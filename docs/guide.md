# Guide

How to deploy Sema, run recording sessions, and set up MediaPipe and the webcam. The
developer pages at `/dev` (their access code, the tools, the benchmark) are in
[dev.md](dev.md).

Contents:

- [MediaPipe files](#mediapipe-files): where the WebAssembly files and the hand model come from
- [Deploy (Vercel)](#deploy-vercel): how the site is built and served on Vercel
- [Recorded data](#recorded-data): where recordings go and what stays private
- [Recording sessions](#recording-sessions): running a session in person or remotely, checking files
- [Check your webcam on Fedora](#check-your-webcam-on-fedora): when the browser can't find the camera
- [GitHub Codespaces](#github-codespaces): running the dev server in a codespace

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

## Deploy (Vercel)

Sema is a static site, deployed on Vercel from the GitHub repository. The Vite
preset works as is: Vercel runs `npm install` (whose `postinstall` copies the
MediaPipe WebAssembly into `public/`), then `npm run build`, and serves `dist/`
over HTTPS, which the camera requires. No base path is needed. Every push to
`main` deploys again.

Sema is a single HTML file that picks its page from the address (`/learn`, `/dev`, `/dev/record`,
…). `vercel.json` rewrites every path to `index.html`, so opening or refreshing any of
them loads the app, which then shows the right page. Vercel serves real files first,
so the model, MediaPipe's files, the fonts and `letters.json` load as usual.
`npm run dev` and `npm run preview` do the same locally.

## Recorded data

Landmark recordings collected for training go in `data/raw/`, which is gitignored: they
stay private and are backed up by Lanix, never committed to this public repository.
Participants consent to their recordings being used to train Sema (required to
record); publishing a dataset is out of scope. Participants can ask Lanix to delete
theirs at any time. What is public: the code, evaluation results, confusion
matrices and trained classifier weights.

## Recording sessions

The recorder collects labelled hand landmarks for training (milestone 2.1). It's a
developer tool, Record: `/dev/record` on the live site, `http://localhost:5173/dev/record`
in development, behind the developer access code ([dev.md](dev.md#access-code)). It
needs no setup. The file format is described in [docs/data-format.md](data-format.md).

**In person:** open `/dev/record` on the laptop (enter the access code if it asks). The participant
reads "Help improve Sema" and "What gets saved", enters their code (`p03`), ticks the
consent box and clicks **Start recording**. The camera then starts by itself. Pick a
letter in the column on the left and the hand (Left | Right, on the video; it starts on
the signing hand), then press **Space** with the other hand, or click **Record take**
under the video: a 3-2-1 countdown, a wait until that hand is whole in view, "Hold…"
with a frame count, then the result under the letter's steps. Aim for 3 kept takes per
letter and hand, holding the hand somewhere a little different each time (centre of the
frame, closer, off to one side). Hover a kept take's circle in the letter list to delete
it. At the end, click **Finish and download** (at the bottom of the right column); the
last page names the file and offers **Start a new session** for the next person.

**On a computer Sema hasn't been used on,** open `/dev/tracking` first, click **Start
camera** and check the Detection fps with a hand in view: 15 or more is plenty. Much lower
means hand tracking is too slow there, and takes won't be kept. It asks for the developer
access code ([dev.md](dev.md#access-code)); on someone else's computer, open `/dev` and click
**Lock** afterwards so their browser forgets it.

**Remotely:** send the participant the `/dev/record` link and the access code. They do
the same on their own computer and send you the downloaded file. The code opens every
developer tool, which is harmless (nothing private is behind it), but you can change it
afterwards with `npm run dev-code`.

**What participants are told:** only the positions of 21 hand points are saved, no
video or photos; they're identified by a code, not their name; everything stays in
their browser until they download the file, and nothing is uploaded; Lanix keeps the
file private and uses it to train and test Sema; they can ask Lanix to delete their
recordings at any time.

**Before keeping a file,** check it:

```sh
npm run check-session -- path/to/sema-asl-p03-2026-11-02a.json
```

It checks the format and normalization versions, that every frame has 63 numbers, the
consent, and that no recording ID is used twice (in the file or in `data/raw/`), then
prints the accepted and rejected takes per letter and hand. If it says OK, move the file
into `data/raw/` (private, gitignored).

**The letter list** is `public/languages/asl/letters.json`. Training letters are entries
like `{ "letter": "B", "instructions": ["Flat hand", "…"] }` (short steps, shown as bullets
under the letter card, describing the right hand);
pilot-only letters have `"pilotOnly": true`. They're recorded in the pilot. (They were
to be left out of the first training set; since 2026-10-22 training uses all 24 static
letters from public photos, see `docs/project-plan.md`.) Each letter has `"image": "images/asl/b.svg"`, its reference
drawing (a path inside `public/`; the drawings' source is in `docs/ATTRIBUTION.md`). The
letter card shows it on white. The drawings show a left hand, so the card mirrors them for
right-hand takes; without one it shows a placeholder.

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
