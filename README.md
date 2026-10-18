# Sema

A browser-based ASL fingerspelling coach. It uses your webcam and MediaPipe hand landmarks to teach the ASL alphabet.

**Preview: finds your hand; letter checking is being built.**

## What it does

- Finds one hand in your webcam picture and draws its 21 points.
- Records labelled hand points for training, on the Record page.
- Learn and Practice are placeholders until the lessons are built.

## Run locally

You need Node.js 20.19+ or 22.12+ (check with `node -v`).

```sh
npm install      # also copies MediaPipe's files into public/
npm run dev      # then open http://localhost:5173
npm test         # unit tests (Vitest)
npm run build    # production build into dist/
```

Use Chrome or Firefox. Hand tracking needs WebGL, which some privacy-focused browsers
(such as LibreWolf) don't give to pages.

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
- Onboarding page spec: docs/onboarding-pages.md (to be added)

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
