# Guide

How to deploy Sema, run recording sessions, and set up MediaPipe and the webcam.

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

Sema is a single HTML file that picks its page from the address (`/record`, `/learn`, `/dev`,
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

The recorder collects labelled hand landmarks for training (milestone 2.1). It's the
app's Record page: `/record` on the live site, `http://localhost:5173/record` in
development. The file format is described in [docs/data-format.md](data-format.md).

**In person:** finish setup once on the laptop, then open Record. The participant
reads "Help improve Sema" and "What gets saved", enters their code (`p03`), ticks the
training box and clicks **Start recording**. The camera then starts by itself. Pick a
letter in the column on the left and the hand (Left | Right, on the video; it starts on
the signing hand), then press **Space** with the other hand: a 3-2-1 countdown, a wait
until that hand is whole in view, "Hold…" with a frame count, then the result beside the
video. Aim for 3 kept takes per letter and hand; the letter card says where to hold the
hand (centre of the frame, a little closer, off to one side). Each kept take has its own
delete button. At the end, click **Finish and download** (above the video); the last page names the file and offers **Start a new
session** for the next person.

**Remotely:** send the participant the `/record` link. They do the same on their own
computer and send you the downloaded file.

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
pilot-only letters have `"pilotOnly": true`. They're recorded in the pilot but left out
of the first training set. A letter can also have `"image": "reference/B.svg"`, a reference
picture inside `public/languages/asl/`; until then the recorder shows a placeholder.
Left-hand cells show the picture mirrored.

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
