# Sema: Development Plan

Sema is a browser-only ASL fingerspelling coach (English A–Z). It's built in stages: a page that renders the webcam, then hand tracking, then letter recognition, then the learning app. Filipino Sign Language (FSL) comes only after the American version is finalized.

Owner: Lanix Iligan (CS student, portfolio project). Lanix is learning as they build: explain concepts as you go and keep code simple and readable rather than clever.

## Status

| Phase | Name | Status |
| --- | --- | --- |
| 0 | Render the webcam | Done |
| 1 | Hand tracking | Done (deployed on Vercel and tested on the live site) |
| 1.1 | Hand detection | Done |
| 1.2 | Overlay | Done (skeleton and left/right label checked by hand in Chrome) |
| 1.3 | Hand loss and performance | Done (benchmark results in the README) |
| 2 | Recognition | Not started |
| 3 | Integrate the designed screens | Not started |
| 4 | Expand the letters and finalize | Not started |
| 5 | Authentication (after finalization) | Parked |
| 6 | Filipino Sign Language (after finalization) | Parked |

## About the name

**Sema** (pronounced "SAY-mah") is from Ancient Greek *sēma*, "sign, mark, token", the root of *semiotics* and *semantics*. On its own the name says nothing about what the app does, so it always appears with the descriptor **"ASL fingerspelling coach"**.

The project is built on one distinction: a sign has a form and something it stands for. The software only ever works with form (it checks whether 21 hand points match a letter's shape); the learner brings the meaning. Two framing rules for any user-facing text:

- **Never say the software understands signs.** It matches shapes.
- **At the alphabet stage, a sign stands for a letter, not a meaning.** Describe the app as teaching representation, not meaning.

**Tagline:** Sema, from the Greek for "sign", is a fingerspelling coach built on one distinction: seeing a hand's shape is not the same as knowing what it signs.

## 1. Decisions and constraints

These are settled. Changing one changes the sections that depend on it, so ask before changing any.

| Decision | What it means for the build |
| --- | --- |
| ASL fingerspelling, English A–Z | References, data and feedback follow American Sign Language (ASL). Label the app "ASL fingerspelling", never just "sign language" |
| Staged letters | About 8 easy static letters first, then the remaining static letters, then the look-alike fist letters (A, M, N, S, T), then J and Z (which involve movement) |
| FSL later | Added only after the American version is finalized (section 11). Every recorded sample stores its language from day one |
| Desktop first | Layouts target a laptop or desktop browser; phone layouts aren't a goal yet |
| Browser only | No backend, database or accounts until Phase 5. Video never leaves the device |
| Both hands | Fingerspelling uses the signer's dominant hand. Setup asks which hand the user signs with (changeable later). Left-hand landmarks are flipped to look like a right hand before classifying |
| Privacy page, not terms or a cookie banner | Sema stores only `localStorage` data needed for the app to work (signing hand, progress) and has no analytics or tracking, so no cookie banner. A plain "How Sema handles your camera" note covers privacy |
| Minimal UI | Calm, lots of space, one obvious action per screen, no decoration. Minimal without becoming unclear |
| Stack | React + Vite + plain JavaScript. No TypeScript, UI framework or CSS framework. No new dependencies without asking Lanix |

**Developer machine:** Fedora KDE Plasma on Wayland, Ryzen 5 3600, GTX 1660 Super (NVIDIA driver in use, WebGL hardware-accelerated in Chromium), 8 GB RAM. Memory is the real constraint: keep processes light, prefer scripts to notebooks, and don't run heavy jobs alongside the dev server. Lanix sometimes works from GitHub Codespaces (`server.allowedHosts: ['.app.github.dev']` is set in `vite.config.js`); the browser, camera and hand detection always run on the local computer.

## 2. Tech stack

Everything the user touches runs in the browser in JavaScript. Python appears only offline on Lanix's machine, to train and evaluate the classifier.

| Layer | Choice | Runs where | Phase |
| --- | --- | --- | --- |
| Build tool | Vite (React template; needs Node 20.19+ or 22.12+) | Dev machine | 0 |
| UI | React + plain JavaScript | Browser | 0 |
| Styling | Plain CSS (or CSS modules), palette as CSS variables | Browser | 0 |
| Camera | `navigator.mediaDevices.getUserMedia` into a `<video>` | Browser | 0 |
| Drawing | `<canvas>` over the video, mirrored to match it | Browser | 1 |
| Hand landmarks | MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`), WebAssembly files and the `hand_landmarker.task` model self-hosted in `public/`; VIDEO mode, 1 hand, GPU delegate with CPU fallback | Browser | 1 |
| Classifier at runtime | Own small model, about 30 lines of JS reading weights from a JSON file; no ML library in the app | Browser | 2 |
| Training | Python + NumPy + scikit-learn (+ matplotlib for charts), plain scripts in a venv | Dev machine, offline | 2 |
| Storage | `localStorage`, accessed only through a `progressStore` module | Browser | 3 |
| Hosting | Vercel (static, HTTPS); GitHub Pages and Netlify were the alternatives | Web | 1 (first deploy) |

**Deliberately left out:** a backend, database and accounts (until Phase 5); TensorFlow.js; the Python `mediapipe` package; any image-based model.

## 3. Architecture

The browser does every live step, from camera to feedback. The only thing that crosses from offline training into the app is one JSON file of classifier weights.

**Runtime pipeline (browser, every frame):**

```text
webcam (getUserMedia, ~640×480)
  → <video> (mirrored with CSS)
  → MediaPipe Hand Landmarker (VIDEO mode, 1 hand)
  → 21 landmarks + handedness (left/right)
  → normalize: wrist to origin, scale by hand size, flip left hands
  → classifier (weights JSON from public/languages/asl/)
  → smoothing: accept a letter only when most of the last few frames agree;
    "not sure" below a confidence threshold
  → per-finger check against the target letter → one hint
  → lesson / practice UI  ↔  progressStore → localStorage
```

**Offline model-building loop:**

```text
recorder page (browser) → landmark JSON files in data/raw/
  → training/ Python scripts: train, evaluate (leave one person out), confusion matrix
  → exported weights JSON → copied into public/languages/asl/
```

The recorder page runs in the browser but belongs to the model-building loop: it captures normalized landmarks and exports them for Python.

## 4. Data sources

Own landmark recordings from several people are the primary data. Public datasets are optional extras and never the test set.

| Source | Use it for | Limits |
| --- | --- | --- |
| [ASL University fingerspelling pages (Lifeprint)](https://www.lifeprint.com/asl101/fingerspelling/) | Learning each handshape, writing step-by-step instructions | Copyrighted images: link to them or take own reference photos; don't copy them into the app |
| Own recordings (recorder, milestone 2.1) | Training and testing the classifier | Needs at least 5 people, both hands, varied light and distance |
| "No letter" recordings | Teaching the classifier to say "not sure" for relaxed hands, half-formed shapes, random poses | Without them the app accepts wrong signs |
| [Kaggle ASL Alphabet dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet) | Optional extra training data after extracting landmarks | About 87,000 images, 29 classes, reportedly a single signer. Check the license first |
| A fluent ASL signer | Reviewing reference photos, instructions and hints | Needs finding |
| FSL references (later) | The Filipino language pack | Not chosen yet; needs a verified source and a fluent reviewer |

If the Kaggle images are used, extract landmarks in the browser with the same Hand Landmarker in IMAGE mode (not the Python package), so they match what the live app sees. Do it in batches.

**One sample** (landmarks only, never video):

```json
{
  "person": "p03",
  "session": "2026-11-02a",
  "language": "asl",
  "letter": "W",
  "hand": "left",
  "landmarks": [0.0, 0.0, 0.0, "... 63 numbers, wrist first"]
}
```

Use codes like `p03`, not names. Tell participants what is stored (hand point coordinates, a code, no video) and ask before recording. Starting target, to revise after 2.2: per person, per letter, per hand, about 3 short recordings of a few seconds in different positions.

## 5. Roadmap

```text
Phase 0  Render the webcam ............ done
   gate
Phase 1  Hand tracking ................ done
   gate
Phase 2  Recognition (8 letters + "no letter")
   gate  ← the most important: if easy letters fail on unseen people, fix the data before any UI
Phase 3  Integrate the designed screens
   gate
Phase 4  Expand the letters and finalize
   gate → American version FINALIZED (section 11)

After finalization (independent, order flexible):
Phase 5  Authentication (optional, guest-first)
Phase 6  Filipino Sign Language
```

Pass each gate by ticking that phase's "Done when" list before moving on.

## 6. Phase 0: render the webcam (done)

One React page shows the live webcam, lets the user start, stop and switch cameras, and explains every failure in plain words. No MediaPipe, canvas or ML.

**What was built:** camera logic in a custom hook (`src/camera/useCamera.js`), messages in `src/camera/cameraMessages.js`; camera starts on a button click (video only, ideal 640×480, `facingMode: 'user'`); every track stopped on Stop, camera switch and unmount (StrictMode-safe); video mirrored with CSS `scaleX(-1)` with a "Mirrored" label (any landmark overlay must be mirrored the same way); camera picker via `enumerateDevices`, refreshed on `devicechange`; real resolution and fps readouts (fps via `requestVideoFrameCallback` with a fallback).

**Error handling:**

| Error | What happened | Message |
| --- | --- | --- |
| `NotAllowedError` | User or browser blocked the camera | "Camera access is blocked. Allow it from the icon in the address bar." |
| `NotFoundError` | No camera matches | "No camera found. Check it is plugged in." |
| `NotReadableError` (Firefox `AbortError` treated the same) | Hardware, system or another app is holding it | "Your camera is busy or unavailable. Close other apps using it and try again." |
| `OverconstrainedError` | No camera meets an exact requirement | Retry automatically with `{ video: true }` |
| Insecure context (`navigator.mediaDevices` missing or `window.isSecureContext` false) | Opened over plain HTTP | "Open the app over HTTPS or localhost." |
| Track `ended` event | Camera unplugged or taken | "The camera stopped. It may have been unplugged or taken by another app." |
| Anything else | | Generic message plus the error name |

**Done when:**

- [x] Live, mirrored webcam shows on localhost in Firefox and Chromium
- [x] Start, Stop and camera switching work, and the camera light goes off on Stop
- [x] Real resolution and fps are shown
- [x] Denying permission, and using the camera in another app, each show the right message
- [x] README explains how to run it, the Fedora webcam check (`sudo dnf install v4l-utils`, then `v4l2-ctl --list-devices`), and the Codespaces note

(All passed on Lanix's real webcam in both browsers.)

## 7. Phases 1 to 6: milestones

Each milestone ends in something demonstrable. Do them in order; each tests an assumption the next depends on.

### Phase 1: hand tracking

| # | Build | Concepts to explain | Done when |
| --- | --- | --- | --- |
| 1.1 | Install `@mediapipe/tasks-vision`; serve its WebAssembly files and the hand model from `public/`; run the landmarker in VIDEO mode on each frame, one hand, GPU delegate with CPU fallback | WebAssembly, model loading, running modes | A "hand found" indicator toggles correctly; detection time in ms is on screen |
| 1.2 | Draw the 21 points and the bones on a `<canvas>` over the video, mirrored to match it; show the left/right label | Normalized coordinates (0–1) to pixels, mirroring | The skeleton sits on the hand; each hand shows the right label (mirroring can swap it, so test early and write down the rule) |
| 1.3 | Wait about a third of a second before declaring "no hand"; handle hands at the frame edge; compare GPU and CPU in both browsers | Debouncing, measuring performance | No flicker when the hand leaves and returns; a table of frame rates per browser and delegate is in the README |

Deploy once at the end of Phase 1 to prove the camera works over HTTPS on a real host (GitHub Pages needs `base` set to the repo name; Netlify/Vercel don't).

### Phase 2: recognition (Python enters here, in 2.2)

| # | Build | Concepts to explain | Done when |
| --- | --- | --- | --- |
| 2.1 | Recorder page: pick a letter, countdown, capture a few seconds of landmarks, normalize (wrist to origin, scale by hand size, flip left hands), save with person, session, language and hand; export JSON. Include a "no letter" class | Normalization, labeling, consent | About 8 letters plus "no letter", from at least 5 people, both hands |
| 2.2 | Python script: load the JSON, train logistic regression and a small neural net, evaluate leaving one person out at a time, plot a confusion matrix, export weights to JSON | Overfitting, held-out evaluation, confusion matrices | Accuracy on unseen people is known, and which letters get confused. **Gate:** if easy letters fail here, fix the data before building any UI |
| 2.3 | Classifier in JS reading the weights; accept a letter only when most of the last few frames agree; show "not sure" below a confidence threshold | Inference, smoothing, thresholds | Held letters are recognized live; a relaxed hand shows no letter |
| 2.4 | Per-finger check: each finger extended or curled and where the thumb sits, compared with a written target per letter; show only the most important fix | Joint angles from landmarks | A wrong shape gives the right hint for all 8 letters, checked by Lanix and ideally a signer |

### Phase 3: integrate the designed screens

Turn the designed screens into working React pages with Phase 2's recognition plugged in. The visual reference is the "Sema Desktop UI" design canvas on claude.ai; it's private to Lanix, so Lanix will provide the screens (exports or screenshots) when Phase 3 starts. Don't guess designs before then.

| # | Build | Concepts to explain | Done when |
| --- | --- | --- | --- |
| 3.1 | App shell and page sequence: routes for Welcome, the three setup steps (hand, camera, data), Lesson, Alphabet and Practice; the top bar; the palette as CSS variables; self-hosted fonts; the camera kept at app level (a React provider) so it stays on between screens | Routing, React context and providers, design tokens | Every designed screen is reachable in the planned order, and refreshing keeps you on the same screen |
| 3.2 | Signing hand and progress: the hand question, the top-bar hand menu, Reset progress, and a `progressStore` module (load and save over `localStorage`; per-letter status and last-changed time; a version number) so Phase 5 can add accounts without touching screens. Returning users skip Welcome and setup | Persistence, designing a data shape | Progress and hand setting survive a reload; Reset clears them; no screen touches `localStorage` directly |
| 3.3 | Lesson screen: reference photo and steps, live recognition (2.3), the single hint (2.4), hold to confirm, Next letter. Camera problems appear inside the camera area; first-time camera checks live in setup step 2b | Composing earlier phases into one product | A new user finishes 8 lessons without help |
| 3.4 | Alphabet home and Practice: the letter grid and its states, the Continue strip, Practice unlocked after 3 mastered letters with an empty state before that | Empty states, unlock rules | All screens work end to end |
| 3.5 | Privacy and polish: "How Sema handles your camera" including the local-storage sentence; keyboard use, contrast and screen-reader labels; a final comparison against the design | Accessibility basics | Every screen works by keyboard and passes the contrast checks |

**Page sequence:**

```text
Open Sema
 ├─ setup not done → 1 Welcome
 │                    → 2a Setup: signing hand (Left / Right)
 │                    → 2b Setup: camera (preview, light/distance/hand checks, camera picker)
 │                    → 2c Setup: your data (what stays on the device)
 │                    → 3 Lesson (first letter)
 └─ setup done     → 4 Alphabet home

3 Lesson   trying → hint → try again
           success → Next letter (3)  or  Back to alphabet (4)
4 Alphabet Continue strip or pick a letter → 3
           Practice (unlocked after 3 mastered) → 5
5 Practice locked: "Continue learning" → 3
           unlocked: random letters, 10 rounds → End → 4
```

Not separate pages: the "Right hand" pill in the top bar opens a small menu (switch Left/Right, Reset progress); camera problems (blocked, busy, unplugged) appear inside the camera area; Welcome has an expandable "How Sema handles your camera" note. Each setup step has Back and Continue and a "Step N of 3" indicator. The lesson design's "First time" camera-check state is superseded by step 2b.

**The signing-hand question (3.2):**

- Ask "Which hand do you sign with?", not "Are you left-handed?"; some people sign with the other hand.
- The answer controls: reference photos mirrored for left-hand signers, instructions saying "your left/right hand", and which hand the app expects.
- Which hand drives the left-hand flip before classifying (the detected hand or this setting) is an open decision; see section 11.
- If the detected hand differs from the setting, show a short note ("You're signing with your right hand. Switch your setting?") instead of marking the attempt wrong.
- Changing it in the top-bar hand menu updates reference photos immediately and keeps progress.

**Data step copy (2c), as designed:** "Your video never leaves this device" (hand detection runs in the browser; nothing uploaded or recorded); "No account, no analytics, no tracking"; "Progress is saved in this browser only" (signing hand and letters in local storage; Reset progress or clearing site data removes them); footnote: like any website, the host may keep standard technical logs such as IP addresses.

### Phase 4: expand the letters and finalize

| # | Build | Concepts to explain | Done when |
| --- | --- | --- | --- |
| 4.1 | The remaining static letters, then the fist letters (A, M, N, S, T) with thumb-position rules; re-run 2.2's evaluation after each group | Iterating on data | Every added letter has a measured result, including the weak ones |
| 4.2 | J and Z: track the fingertip path over about a second and compare with a target path | Sequences, motion over time | J and Z are recognized, or honestly marked lower confidence |
| 4.3 | Test with at least 5 people not in the data; deploy; README with results and limits | Honest reporting | The American version is **finalized** (section 11) |

### Phase 5: authentication (after finalization, parked)

Optional, guest-first sign-in so progress and settings follow a user across browsers and devices. Sema stays fully usable without an account. Sign-in and account-menu designs exist in the canvas's "Parked" row.

| # | Build | Done when |
| --- | --- | --- |
| 5.1 | Choose the backend (leaning Supabase, which uses PostgreSQL; Firebase is the alternative) and set up Google sign-in | Sign in and sign out work |
| 5.2 | A cloud version of `progressStore`; screens unchanged | Progress saved while signed in appears in a second browser |
| 5.3 | Merge on sign-in: upload guest progress, keep the better result per letter; skip the hand question when saved settings exist | Guest progress is never lost by signing in |
| 5.4 | Access rules (Supabase row level security or Firestore rules): each user reads and writes only their own data | A second test account can't read the first's data |
| 5.5 | "Delete my account and data"; update privacy text; check the Philippines' Data Privacy Act of 2012 | Deleting an account removes everything stored for it |

### Phase 6: Filipino Sign Language (after finalization, parked)

Verify an FSL alphabet source and find a fluent reviewer, record FSL samples (the `language` field already supports it), train a separate model, then add a language selector. Don't assume FSL shares ASL handshapes; check letter by letter. Phases 5 and 6 are independent.

## 8. Project structure and workflow

```text
sema/
  public/
    favicon.svg        browser tab icon
    models/            hand_landmarker.task, the hand landmarker model (in git)
    mediapipe/wasm/    MediaPipe WebAssembly files (copied by npm run copy-mediapipe, not in git)
    languages/asl/     letters.json, reference photos, classifier weights (not created yet)
  scripts/
    copy-mediapipe.js  copies the WebAssembly files from node_modules into public/mediapipe/wasm/
  src/
    camera/            webcam start/stop, device picker, error messages, video stats (Phase 0)
    vision/            landmarker setup, detection loop, drawing, handedness (Phase 1);
                       normalization and hand flip planned here, not built yet
    recognition/       classifier, smoothing, finger checks (Phase 2, not created yet)
    screens/           welcome, setup, lesson, alphabet, practice (Phase 3, not created yet)
    App.jsx            the page
    main.jsx           entry point
    styles.css         all styles and color variables
  training/            Python scripts: train, evaluate, export weights (not created yet)
  data/raw/            exported landmark JSON, one file per session (gitignored, private; not created yet)
  docs/                project-plan.md; later evaluation results, confusion matrices
  README.md
  CLAUDE.md
```

Differs from the original plan: the MediaPipe WebAssembly files live in `public/mediapipe/wasm/` (copied from `node_modules` by `scripts/copy-mediapipe.js` on every `npm install`, and kept out of git) instead of sharing `public/models/` with the model.

Create each folder only in the phase that needs it.

**Language as data.** Everything ASL-specific lives under `public/languages/asl/`. Adding FSL means adding `public/languages/fsl/`, not changing code.

**Git habits:** one branch per milestone (e.g. `phase-1-tracking`), merged when its "Done when" list is ticked; small commits that say what changed. Recorded landmark JSON stays private: `data/raw/` is gitignored and backed up by Lanix; video is never stored. The code, evaluation results, confusion matrices and trained weights stay public.

## 9. Look

Minimal and calm. Palette as CSS variables:

| Token | Hex | Use |
| --- | --- | --- |
| Deep Cobalt | `#142C48` | Text; dark surfaces (video frame) |
| Bright Sky | `#36A7D9` | Accents on dark surfaces only. Never text, borders or focus rings on light surfaces (2.54:1 on Cloud, fails contrast) |
| Deep Sky | `#1A75A3` | Buttons, links, accents on light surfaces (white text on it is 5.1:1) |
| Ice Blue | `#B8E8F5`, tint `#E3F4FA` | Selected and soft backgrounds |
| Cloud White | `#F5F7F8` | Page background |
| Muted text | `#52637A` (light), `#A9BCD0` (on dark) | Secondary text |
| Amber | `#B45309` (light), `#E8A23A` (on dark); tint `#FDF1E3` with text `#7A3A06` | Warnings, "try again" states |
| Error red | `#B42318` | Destructive actions, errors |

Never carry meaning by colour alone (e.g. missed practice rounds are hollow amber bars, not just a different hue). Font in the designs: Plus Jakarta Sans (self-host in Phase 3).

## 10. Testing and evaluation

Only numbers measured on people who weren't in the training data count; report them with how many people and samples they came from.

| What | How | When |
| --- | --- | --- |
| Camera behavior | Manually trigger each Phase 0 error in Firefox and Chromium | Phase 0 |
| Frame rate and detection time | On-screen readouts, recorded in the README per browser and delegate | Phase 1 |
| Landmark math | Vitest unit tests for normalization and the left-hand flip | Phase 2 |
| Accuracy per letter | Leave-one-person-out evaluation and a confusion matrix | 2.2, and after each letter group in 4.1 |
| False accepts | Relaxed hands, half-formed shapes and wrong letters must not be accepted | 2.3 onward |
| Left hands | Report accuracy separately for left and right hands | 2.2 onward |
| Hint quality | Lanix and, ideally, a fluent signer check each hint | 2.4 |
| Usability | Watch 5 new users without helping; note where they get stuck | 3.3 and 4.3 |

Never split frames from the same recording between training and testing; never quote accuracy from a public dataset's own test split; always say "X% on N unseen people".

## 11. Risks and open decisions

**Risks:**

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Low frame rate | Low (NVIDIA driver and WebGL confirmed) | 640×480, one hand, GPU with CPU fallback, compare browsers |
| Mirroring swaps the left/right label | High at first | Test each hand in 1.2 and write down the rule |
| Poor accuracy on unseen people | High | Record from 5+ people early; the gate after 2.2 |
| Look-alike fist letters stall progress | High | Leave them until 4.1 and add thumb rules |
| J and Z harder than expected | Medium | Allow "lower confidence" labels rather than blocking finalization |
| Not enough people to record | Medium | Ask classmates early; short sessions; both hands from each person |
| Unreviewed references teach mistakes | Medium | Reputable source; a fluent reviewer before 4.3 |
| 8 GB RAM gets tight | Medium | Close heavy apps while testing; scripts over notebooks; batch heavy jobs |

**Open decisions (Lanix decides; don't resolve these in code):**

| Decision | Options | Decide by |
| --- | --- | --- |
| Swap setup steps 2b and 2c | Data step before the camera permission prompt, or keep camera first | Before 3.1 |
| What "Next letter" picks | Teaching order, or next unmastered letter | 3.3 |
| Practice unlock threshold | 3 mastered letters is a starting guess | 3.4 |
| First 8 letters | Decided: B, C, D, F, I, L, W, Y; to be revisited after 2.2's confusion matrix | Done (2.1) |
| Use the Kaggle images | Own recordings only, or plus extracted Kaggle landmarks | 2.2, after seeing results without it |
| Hosting | Decided: Vercel | Done (end of Phase 1) |
| Left-hand flip source | The detected hand, or the user's signing-hand setting (then the detected hand only drives the "Switch your setting?" note). Leaning toward the setting | After 1.2's handedness check and the recorder's mismatch counts (2.1) |
| What "finalized" means | All 26 working, or all 26 included with some marked lower confidence (leaning second) | 4.1 |

**Definition of finalized (American version):** lessons, practice and progress work end to end; tested on at least 5 people not in the data, with results and failures written up; deployed with a README that states its limits.

## Sources

- [Vite: Getting Started](https://vite.dev/guide/) — Node requirement, scaffold command
- [MDN: getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — error names, secure-context rule
- [MediaPipe Hand Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js) — npm package, 21 landmarks, handedness, video mode
- [ASL University: Fingerspelling (Lifeprint)](https://www.lifeprint.com/asl101/fingerspelling/) — handshape reference
- [Kaggle ASL Alphabet dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)
