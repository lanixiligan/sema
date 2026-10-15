# Sema

A browser-based ASL fingerspelling coach. It will use your webcam and hand landmarks
to teach the ASL alphabet. Everything runs in your browser: no backend, no accounts,
and video never leaves your machine.

**Status: Phase 0.** The page shows your webcam (mirrored), lets you start, stop and
switch cameras, shows the real resolution and frame rate, and explains camera
problems in plain language. Hand detection comes in later phases.

## Run it

You need Node.js 20.19+ or 22.12+ (check with `node -v`).

```sh
npm install
npm run dev
```

Open http://localhost:5173 and click **Start camera**. The browser will ask for
camera permission.

Other scripts: `npm run build` (production build into `dist/`), `npm run preview`
(serve that build), `npm run lint`.

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
src/
  camera/
    useCamera.js        start/stop/switch the webcam, camera list, errors
    useVideoStats.js    real resolution and frames per second
    cameraMessages.js   plain-language error messages
  App.jsx               the page
  main.jsx              entry point
  styles.css            all styles and color variables
```
