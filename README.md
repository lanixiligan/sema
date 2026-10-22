<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logos/sema-logo-dark.svg">
    <img src="public/logos/sema-logo-light.svg" alt="sema." width="320">
  </picture>
</p>

<p align="center">
  A browser-based ASL fingerspelling coach.<br>
  It uses your webcam and MediaPipe hand landmarks to teach the ASL alphabet.
</p>

<p align="center">
  <strong>Preview:</strong> finds your hands; letter checking is being built.
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#security">Security</a> ·
  <a href="#docs">Docs</a> ·
  <a href="LICENSE">MIT License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-Claude-D97757?logo=claude&logoColor=white" alt="Made with Claude">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-1A75A3" alt="License: MIT"></a>
  <br>
  <img src="https://img.shields.io/badge/Node.js-22.12%2B-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js 22.12+">
  <img src="https://img.shields.io/badge/React-19.3.1-20232A?logo=react&logoColor=61DAFB" alt="React 19.3.1">
  <img src="https://img.shields.io/badge/Vite-8.3.4-646CFF?logo=vite&logoColor=white" alt="Vite 8.3.4">
  <img src="https://img.shields.io/badge/MediaPipe_tasks--vision-1.1.1-0097A7" alt="MediaPipe tasks-vision 1.1.1">
  <img src="https://img.shields.io/badge/Vitest-5.0.4-6E9F18?logo=vitest&logoColor=white" alt="Vitest 5.0.4">
  <img src="https://img.shields.io/badge/oxlint-1.88.0-142C48" alt="oxlint 1.88.0">
</p>

---

## What it does

- Finds your hands in the webcam picture and draws their 21 points.
- Try (`/try`): pick a letter, make it in front of the webcam, and hold it for 3 seconds while
  Sema checks the handshape. It covers the 24 letters that don't move; J and Z come later.
- Records labelled hand points for testing, on the Record page (a developer tool, `/dev/record`).
- Learn and Practice are placeholders until the lessons are built.

## Quick start

> [`main`](https://github.com/lanixiligan/sema/tree/main) is the stable branch and is what's
> deployed. Each phase is built on its own `phase-*` branch first, then merged into `main`.

```sh
git clone https://github.com/lanixiligan/sema.git
cd sema
npm install
npm run dev
```

Then open http://localhost:5173. `npm install` also copies MediaPipe's files into `public/`.

You need Node.js 22.12 or newer (check with `node -v`). Vite alone runs on 20.19+, but the
tests (Vitest 5) need 22.12+, so 22.12 is the minimum for everything. Sema is developed on
Node 22.23.1 with npm 10.9.8.

Other commands:

```sh
npm test         # unit tests (Vitest)
npm run build    # production build into dist/
npm run lint     # lint (oxlint)
```

Use Chrome or Firefox. Hand tracking needs WebGL, which some privacy-focused browsers
(such as LibreWolf) don't give to pages.

## Versions

The versions Sema is built and tested with (exact versions are pinned in `package-lock.json`).
The badges at the top repeat the main ones, so update them together with this table:

| What | Version | Notes |
| --- | --- | --- |
| Node.js | 22.12+ (developed on 22.23.1) | Vite needs 20.19+ or 22.12+; Vitest needs 22.12+ |
| npm | 10.9.8 | Comes with Node |
| Vite | 8.3.4 | Dev server and build |
| @vitejs/plugin-react | 6.1.2 | |
| React and React DOM | 19.3.1 | |
| @mediapipe/tasks-vision | 1.1.1 | Its wasm files are copied from this package on install, so they always match |
| Hand Landmarker model | float16, version 1 | `public/models/hand_landmarker.task`, 7,819,105 bytes |
| Vitest | 5.0.4 | Unit tests |
| oxlint | 1.88.0 | Lint |
| Browser | Chrome (current) | Needs WebGL2 for hand tracking |
| Python | 3.14.8 | Training only (`training/`), offline; never in the app |
| numpy | 2.5.3 | Training only |
| scikit-learn | 1.9.1 | Training only |

The left/right hand rule was checked by hand with tasks-vision 1.1.1; check it again after
upgrading MediaPipe (see CLAUDE.md).

## Security

Everything runs in your browser: no backend, no accounts, and video never leaves your machine.

- **The camera is yours to switch on.** The browser only asks for the camera after you press
  Turn camera on (or Start recording, on the Record page). Sema turns it off when you switch to another tab, and after a minute with no
  hand in view.
- **Your data stays in this browser.** Sema saves your settings (signing hand, theme, setup
  done) and a recording in progress in this browser's `localStorage`. Nothing is uploaded.
- **Delete it any time.** Open the settings menu (the gear in the top bar) and choose
  **Delete Sema's data**. After you confirm, everything Sema saved is removed and Sema starts
  over at Welcome. Session files you've downloaded are normal files in your Downloads folder,
  so delete those yourself.
- **Recordings are never committed.** Recorded hand points for training stay private in
  `data/raw/` (gitignored).

## Docs

- [Development plan](docs/project-plan.md)
- [What's next](docs/NEXT.md)
- [Benchmarks](docs/benchmarks.md)
- [Session file format](docs/data-format.md)
- [Guide](docs/guide.md): deploy, recording sessions, MediaPipe files, webcam, Codespaces
- [Image attribution](docs/ATTRIBUTION.md): where the ASL hand drawings come from, and their licence
- [Onboarding pages](docs/onboarding-pages.md): what each page before Record says and does

## Tech

React, Vite, plain JavaScript and CSS, with MediaPipe Hand Landmarker running in the browser. Hosted on Vercel.

## Credits

- [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)
  (`@mediapipe/tasks-vision`, Apache-2.0) finds the hand points.
- Fonts: Plus Jakarta Sans, JetBrains Mono and a subset of Noto Sans Mono, under the SIL Open
  Font License 1.1. The licences are in `public/fonts/`.
- ASL hand drawings: at this stage, Sema uses the SVG hand drawings (A to Z) from the
  Wikimedia Commons category [ASL letters](https://commons.wikimedia.org/wiki/Category:ASL_letters),
  by [WPClipart](http://www.wpclipart.com/), in the public domain. They're in
  `public/images/asl/`; [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md) lists each file's source
  and licence.
- Letter model: `public/models/asl-letters.json` is trained on hand points taken from the
  photos of [ASL-HG: American Sign Language Hand Gesture Image Dataset](https://data.mendeley.com/datasets/j4y5w2c8w9/1)
  by Md. Famidul Islam Pranto, Md. Rifatul Islam, Md. Ali Akbor, Nabonita Ghosh, Md. Rahatun
  Alam, Sudipto Chaki and Md Masudul Islam (Mendeley Data, 2025,
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), and of
  [ASLYset](https://data.mendeley.com/datasets/xs6mvhx6rh/1) by Miguel Rivera (Mendeley Data,
  2019, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Sema doesn't include the
  photos; [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md) says what was changed.

## License

Sema's own code is under the [MIT License](LICENSE). The fonts, MediaPipe, the ASL hand
drawings and the ASL-HG and ASLYset datasets keep their own licences, listed under Credits.
