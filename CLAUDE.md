# Sema

A browser-based ASL fingerspelling coach. It will use the webcam and MediaPipe hand
landmarks to teach the ASL alphabet. Built by a student for their portfolio and to learn.

## Working with the author

- Explain what you are doing as you go, especially browser and React concepts.
- Keep code simple and readable rather than clever.
- Work one phase at a time. Do not start the next phase unless asked.

## Phases

- **Phase 0 (current):** a page that shows the webcam. Start/Stop, camera picker,
  real resolution and fps readouts, plain-language errors. No hand detection,
  no MediaPipe, no canvas, no ML.
- Later phases: hand landmarks (`src/vision/`), letter recognition
  (`src/recognition/`), app screens (`src/screens/`). Don't create these folders early.

## Stack and constraints

- React + Vite + plain JavaScript (`.jsx` / `.js`). No TypeScript.
- No UI framework, no CSS framework. Plain CSS in `src/styles.css`.
- No new dependencies without asking first.
- No backend, database or accounts. Everything runs in the browser.
- Node 20.19+ or 22.12+ (Vite requirement).
- `vite.config.js` allows `.app.github.dev` hosts so the dev server works in GitHub Codespaces.
- React `StrictMode` stays on. Code must survive its double mount in development.

## Commands

- `npm run dev`: dev server on http://localhost:5173
- `npm run build`: production build into `dist/`
- `npm run lint`: oxlint

## Folder structure

```
src/
  camera/     webcam logic: useCamera hook, error messages, video stats
  App.jsx
  main.jsx
  styles.css
```

## Camera conventions

- The camera starts only on a button click. Constraints: video only, ideal 640×480,
  `facingMode: 'user'`. Ideal values are requests; read `videoWidth`/`videoHeight`
  for the real size.
- Always stop every track (`track.stop()`) on Stop, on camera switch and on unmount.
  That is what turns the camera light off.
- Keep the stream in a ref, not state. Unmount cleanup must not rely on `videoRef`,
  because React has already cleared it by the time effect cleanups run.
- A `getUserMedia` call that resolves after Stop, a newer start or unmount must stop
  its stream immediately (`useCamera` uses a request counter for this).
- The video is mirrored with CSS `transform: scaleX(-1)`. Frame data is NOT mirrored.
  Any landmark overlay drawn on top must be mirrored the same way.
- User-facing error text lives in `src/camera/cameraMessages.js`.

## Visual design

Minimal and calm: lots of space, one obvious action, no decoration.
Colors are CSS variables in `src/styles.css`:

| Variable        | Hex       | Use                                              |
| --------------- | --------- | ------------------------------------------------ |
| `--deep-cobalt` | `#142C48` | Text; the dark frame around the video            |
| `--bright-sky`  | `#36A7D9` | Accents on dark surfaces only                    |
| `--deep-sky`    | `#1A75A3` | Buttons and links on light surfaces, white text  |
| `--cloud-white` | `#F5F7F8` | Page background                                  |
| `--amber`       | `#B45309` | Warning text on light backgrounds                |
| `--muted-text`  | `#52637A` | Secondary text                                   |

Never use Bright Sky for text on a light background: it fails contrast.
