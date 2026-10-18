# Sema

A browser-based ASL fingerspelling coach. It uses your webcam and MediaPipe hand landmarks to teach the ASL alphabet.

**Preview: finds your hand; letter checking is being built.**

## What it does

- Finds your hands in the webcam picture and draws their 21 points.
- Records labelled hand points for training, on the Record page.
- Learn and Practice are placeholders until the lessons are built.

## Run locally

You need Node.js 22.12 or newer (check with `node -v`). Vite alone runs on 20.19+, but the
tests (Vitest 5) need 22.12+, so 22.12 is the minimum for everything. Sema is developed on
Node 22.23.1 with npm 10.9.8.

```sh
npm install      # also copies MediaPipe's files into public/
npm run dev      # then open http://localhost:5173
npm test         # unit tests (Vitest)
npm run build    # production build into dist/
```

Use Chrome or Firefox. Hand tracking needs WebGL, which some privacy-focused browsers
(such as LibreWolf) don't give to pages.

## Versions

The versions Sema is built and tested with (exact versions are pinned in `package-lock.json`):

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

The left/right hand rule was checked by hand with tasks-vision 1.1.1; check it again after
upgrading MediaPipe (see CLAUDE.md).

## Privacy

Everything runs in your browser: no backend, no accounts, and video never leaves your machine.
Recorded hand points stay private in `data/raw/` (gitignored) and are never committed.

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

## License

Sema's own code is under the [MIT License](LICENSE). The fonts, MediaPipe and the ASL hand
drawings keep their own licences, listed under Credits.
