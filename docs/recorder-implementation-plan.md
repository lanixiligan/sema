# Recorder (milestone 2.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect labelled hand-landmark sessions for training (milestone 2.1, build part M1), with the recorder as the app's main page after a short setup. Because of that, the Phase 3.1 shell, Welcome and setup pages are built early, on this branch.

**Architecture:** One Vite page with one React root. A small hand-written router (the browser's History API) picks a page from the address: Welcome, three setup steps, Record, Learn and Practice placeholders, and an unlisted `/dev` page (the Phase 1 tracking page with its benchmark). A `CameraProvider` at the top of the app owns the camera and the hand model, so moving between pages doesn't close the camera or reload the model. The recorder's pure logic (tasks 1–5) is unchanged; its UI becomes the Record page inside the shell. Vercel rewrites every path to `index.html`.

**Tech Stack:** React 19, Vite 8 (Rolldown), plain JavaScript, `@mediapipe/tasks-vision` 1.1.1, Vitest 5 (dev only), Node 22.

**Spec:** [docs/recorder-design.md](recorder-design.md) for the recorder; [docs/project-plan.md](project-plan.md), Phase 3.1–3.2, for the shell and setup. Page designs are in `docs/design/` (local-only, see below).

**Revised 2026-10-15.** The first version of this plan built the recorder as a second page (`record.html`). Its tasks 6–9 (page shell and consent, takes and grid, docs, end-to-end check) were built on this branch in commits `0adff55..9e6618c`. Tasks 6–10 below replace them: they move that code into the app instead of starting over.

## Steps

| Step | What | Tasks | Status |
| --- | --- | --- | --- |
| 1 | Recorder logic | 1–5 | Done (`2355af5..4098323`), unchanged |
| 2 | App shell: routing, palette tokens, fonts, camera provider, menu, Preview pill, phone notice | 6 | |
| 3 | Welcome and setup: camera checks, error states, other-hand state, signing-hand storage | 7 | |
| 4 | Record page inside the shell | 8 | |
| 5 | Learn and Practice placeholders | 9 | |
| — | Whole-branch check and review | 10 | |

Tasks 6–9 are Phase 3 work done early. Their commit messages say so, and why:

| Task | Proposed commit message |
| --- | --- |
| 6 | `feat(shell): add app shell and menu (Phase 3.1, done early: the recorder now lives inside the app after setup)` |
| 7 | `feat(setup): add Welcome and the setup steps (Phase 3.1–3.2, done early: setup now leads into the recorder)` |
| 8 | `feat(record): move the recorder into the app shell (Phase 3.1, done early: Record is the main page after setup)` |
| 9 | `feat(preview): add Learn and Practice placeholders (Phase 3, done early: the menu links to them before 3.3–3.4)` |

## Before you start

- **Approval:** don't start a task until Lanix has approved this plan.
- **Git (Lanix's rules):**
  - Never commit, push or merge unless Lanix explicitly says so.
  - After each task, stop and show what changed (`git status --short` plus a summary), how to test it, and the proposed commit message. Then wait.
  - `docs/design/` must never be committed or pushed. It's gitignored. Before every proposed commit, run `git status --short` and `git diff --cached --name-only`, and confirm nothing under `docs/design/` is listed.
- **Designs:** UI steps take their layout from `docs/design/`.
  - Read `docs/design/README.md` first.
  - The page's `.dc.html` file gives the exact text, colours, spacing and list of states. The PNG shows the overall look.
  - If the two disagree, ask Lanix. Don't guess layouts.
  - The folder is local-only and may not exist on another machine.
  - The `.dc.html` files arrived on 2026-10-15. Their names differ from the PNGs': `Welcome` (1), `SetupData` (2a), `Setup` (2b), `SetupCamera` (2c), `Record` (3), `Unsupported` (the phone notice). `Learn.dc.html` and `Practice.dc.html` are for `phase-3-preview`; don't build them here.
- **Explain as you go** (CLAUDE.md): Lanix is learning. Say what each piece does and why, especially browser and React concepts.

## Folder layout (reorganized 2026-10-15, after Task 7)

- `src/app/`: the shell (router, navigation, `Link`, menu, Preview pill, phone notice, camera provider, settings store).
- `src/components/`: anything used by more than one page folder (`CameraStage`, `icons.jsx`).
- `src/pages/onboarding/`, `record/`, `learn/`, `practice/`, `dev/`: one folder per part of the app, with the parts only it uses. **Page folders never import from each other.**
- `src/recorder/`, `src/vision/`, `src/camera/`: logic with no page (take rules, `useRecording`, session file and storage, letters, normalization, hand checks, camera hooks).
- Tasks 6 and 7 were built before the reorganization. Their steps below use the new paths and names: `RecorderApp` became `RecordPage`, `HowItWorksPage` became `HowSemaWorksPage`, and the router key `howItWorks` became `howSemaWorks` (the address is still `/setup/how-it-works`). `BenchmarkPanel.jsx` moved from `src/vision/` to `src/pages/dev/`.

## Global Constraints

- **Stack:**
  - React + Vite + plain JavaScript (`.js` / `.jsx`). No TypeScript, no UI framework, no CSS framework.
  - No router library: routing is `src/app/router.js` plus `src/app/navigation.js`.
  - New dependencies need Lanix's approval. Approved so far: `@mediapipe/tasks-vision`, `vitest` (dev).
- **Assets:** serve every asset from the app itself, never from a CDN. Fonts are files in `public/fonts/`, with no Google Fonts link.
- **React:** `StrictMode` stays on, and code must survive its double mount in development.
- **Checks:** `npm test`, `npm run lint` (oxlint, no warnings) and `npm run build` must all pass.
- **Pages and routing:**
  - One Vite entry (`index.html`). No `record.html`, no `noindex`.
  - `vercel.json` rewrites every path to `/index.html`. Vercel serves real files first, so `/models/`, `/mediapipe/` and `/languages/` are unaffected.
- **Storage:** pages never touch `localStorage` directly.
  - Settings go through `src/app/progressStore.js` (key `sema.progress`).
  - Recorder sessions go through `src/recorder/sessionStore.js` (key `sema.recorder.session`).
- **Camera:**
  - The camera and the hand model live in `CameraProvider`. Pages don't call `useCamera` or `useHandLandmarker` themselves.
  - The exception is the unlisted `/dev` page, which keeps its own so its delegate picker and benchmark work as before.
  - The camera starts by itself on arriving at 2c and at Record's recording step (getting there, plus the browser's permission prompt, is the consent). It's off on Welcome, 2a, 2b and Record's consent and finished steps, and off whenever no camera view is on screen.
- **Colours:** use only CSS variables from `src/styles.css`. Never use Bright Sky (`--bright-sky`) for text, borders or focus rings on light surfaces.
- **Copy rules** (project plan):
  - Never say Sema understands signs: it matches shapes.
  - Say "ASL fingerspelling", never just "sign language".
- **Recorder (unchanged from the first version):**
  - Format version `1`, normalization version `1`.
  - Take rules: `COUNTDOWN_MS = 3000`, `SETTLE_MS = 500`, `CAPTURE_MS = 3000`, `SAMPLE_INTERVAL_MS = 100`, `MIN_MATCHED_SHARE = 0.8`. A take passes when `kept − mismatched ≥ 24`.
  - Recording ID: `<person>-<session>-<letter>-<hand>-<take>`.
  - The left-hand flip uses the **detected hand, for now**.
  - `data/raw/` is private and gitignored.
  - Consent text is exactly the spec's section 7.

## Review Focus

Tasks 1–5 already have tests for their five risks:

- a session too big for `localStorage`
- a corrupt or old saved session
- a slow camera
- undo, then record again
- participant codes typed as `P03`

These five remain for the new tasks, most likely first. Each has a test in the task that owns the code.

1. **Opening a deep link or refreshing** (`/record`, `/setup/camera`) on Vercel or in `vite preview`. The same page should load, and a new visitor should be sent to Welcome. Tests: router unit tests (Tasks 6 and 7), and a refresh check on `vite preview` (Tasks 6 and 10).
2. **Leaving a camera page while the camera is starting or live** (the menu, Back, the browser's Back button). The light must go off, and no stream may be left running. Test: Task 6's check, which navigates away during "starting" and while live, then counts live tracks.
3. **A corrupt or old `sema.progress`** (invalid JSON, another version, `setupDone` without a hand, storage blocked). The visitor is treated as new, with no crash. Test: Task 7's `progressStore` tests.
4. **The other hand on the camera check** (signing hand Right, MediaPipe sees Left). This shows the other-hand state, not a pass. Test: Task 7's `handChecks` tests.
5. **Leaving Record mid-take through the menu.** The take is discarded, not logged, and the session survives. Coming back offers it again. Test: Task 8's check.

## File map

Done in tasks 1–5 (unchanged):

- `package.json`
- `src/vision/normalizeHand.js`, `src/camera/frameCounter.js`
- `src/recorder/takeRules.js`, `sessionFile.js`, `sessionStore.js`
- `scripts/check-session.js`
- `src/vision/useHandDetection.js` (listener), `src/vision/browserName.js`, `src/vision/useBenchmark.js`

All of these have tests.

Already on the branch from the first version's tasks 6–8, and reworked below:

- `src/pages/record/RecordPage.jsx`, `ConsentForm.jsx`, `RecordingGrid.jsx`, `TakePanel.jsx`, `TakeOverlay.jsx` (moved there in the reorganization)
- `src/recorder/useRecording.js`, `letters.js`
- `public/languages/asl/letters.json`
- `docs/data-format.md`, README and CLAUDE.md sections

| File | Task | Status | Responsibility |
| --- | --- | --- | --- |
| `.gitignore` | (docs commit) | modify | `docs/design/` (Lanix's local design reference) |
| `record.html`, `src/recorder/main.jsx` | 6 | delete | Replaced by the `/record` route |
| `vite.config.js` | 6 | modify | Back to one entry |
| `vercel.json` | 6 | modify | Rewrite every path to `/index.html` |
| `src/app/router.js` (+ `.test.js`) | 6, 7 | create | Path → page, and redirects |
| `src/app/navigation.js`, `src/app/Link.jsx` | 6 | create | `usePathname`, `navigate` (History API); `<Link>` |
| `src/camera/useCamera.js` | 6 | modify | `attachVideo` callback ref, so a new page's `<video>` picks up the running stream |
| `src/app/sharedCamera.js`, `src/app/CameraProvider.jsx` | 6 | create | The context and `useSharedCamera()`; the provider owning camera and hand model, stopping the camera when no view is on screen |
| `src/components/CameraStage.jsx` | 6 | create | The camera view (video, overlay canvas, children), registered with the provider |
| `src/app/MenuBar.jsx`, `PreviewPill.jsx`, `PhoneNotice.jsx` | 6 | create | Menu (Record, Learn, Preview, Practice, Preview), the Preview pill, the phone notice |
| `src/App.jsx` | 6, 7 | rewrite | The shell: picks the page; holds settings (Task 7) |
| `src/pages/dev/DevPage.jsx` | 6 | create | The old `App.jsx` page, moved to `/dev` unchanged |
| `src/pages/NotBuiltYet.jsx` | 6 | create, then replaced | Stand-in for pages of later tasks; replaced in the reorganization by one stand-in each in `learn/` and `practice/` |
| `src/components/icons.jsx` | 7 | create | Line icons used by more than one page folder |
| `src/pages/dev/BenchmarkPanel.jsx` | reorganization | move from `src/vision/` | The benchmark's panel, used only by `/dev` |
| `public/fonts/*` | 6 | create | Plus Jakarta Sans and JetBrains Mono (`.woff2`) with their OFL licences |
| `src/styles.css` | 6–9 | modify | Tokens, fonts, shell and page styles |
| `src/app/progressStore.js` (+ `.test.js`) | 7 | create | Signing hand and "setup done" in `localStorage` |
| `src/vision/handChecks.js` (+ `.test.js`) | 7 | create | The camera step's two checks |
| `src/pages/onboarding/SetupBar.jsx` | 7 | create | "Sema · Preview" and "Step N of 3" |
| `src/pages/onboarding/WelcomePage.jsx`, `HowSemaWorksPage.jsx`, `SigningHandPage.jsx`, `CameraCheckPage.jsx` | 7 | create | Pages 1, 2a, 2b, 2c |
| `src/pages/record/RecordPage.jsx` | 8 | modify (moved and renamed from `src/recorder/RecorderApp.jsx` in the reorganization) | Page 3 |
| `src/pages/record/HandToggle.jsx`, `TakeResult.jsx` | 8 | create | Hand toggle; last take's result card |
| `src/pages/record/RecordingGrid.jsx`, `TakePanel.jsx`, `TakeOverlay.jsx`, `ConsentForm.jsx`; `src/recorder/useRecording.js` | 8 | modify | The new Record layout |
| `src/pages/learn/LearnPage.jsx`, `src/pages/practice/PracticePage.jsx` | 9 | replace the stand-ins | Preview placeholders |
| `README.md`, `CLAUDE.md`, `docs/project-plan.md`, `docs/data-format.md` | 6–9 | modify | Docs travel with the code that makes them true |

## Shared: end-to-end harness (scratch, never committed)

Tasks 6–10 check the running app in headless Chrome with a fake camera, in the session's scratchpad (`$SP`). This is the harness from the first version's Task 9.

- **Fake camera videos:** make two y4m files from MediaPipe's `victory.jpg` with `make_video.py`:
  - `hand-only.y4m`: a hand in every frame
  - `hand-mixed.y4m`: a hand for 0.5 s, then empty for 2.5 s, looping
- **Chrome:** `google-chrome --headless=new --remote-debugging-port=<port> --user-data-dir=$SP/e2e/chromeN --no-first-run --use-fake-device-for-media-stream --use-file-for-fake-video-capture=<y4m> --use-fake-ui-for-media-stream about:blank`
- **Driver:** a Node script over the Chrome DevTools Protocol (`Target.createTarget`, `Runtime.evaluate`, `Page.navigate`, `Browser.setDownloadBehavior`), with helpers `evaluate`, `waitFor`, `click(label)` and `type(name, value)`.
- **Live tracks:** before navigating, inject a wrapper with `Page.addScriptToEvaluateOnNewDocument`. It wraps `navigator.mediaDevices.getUserMedia`, so every stream the page opens lands in `window.__streams`. Then count `window.__streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === 'live').length`. This sees streams no `<video>` shows, and it keeps test code out of the app.
- **Cleanup:** kill Chrome and Vite by PID, never with `pkill -f` and the scratchpad path (that matches the shell itself).

---

## Step 1: recorder logic (done, unchanged)

Tasks 1–5 are kept as written and built (`2355af5..4098323`). Their "Report" steps predate Lanix's current git rules (above), which apply from Task 6 on.

### Task 1: Vitest and hand normalization

**Files:**
- Modify: `package.json`
- Create: `src/vision/normalizeHand.js`
- Test: `src/vision/normalizeHand.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizeHand(raw, { width, height, hand }) → number[63] | null` where `raw` is 21 `{ x, y, z }` objects (MediaPipe `NormalizedLandmark`) and `hand` is `'left'` or `'right'`; `NORMALIZATION_VERSION = 1`.

- [x] **Step 1: Install Vitest and add the test script**

Run: `npm install --save-dev vitest@^5.0.4`
Then in `package.json` `"scripts"`, add `"test": "vitest run"`.
Expected: `npm ls vitest` shows `vitest@5.x`; no peer-dependency errors (Vitest 5 supports Vite `^8.0.0`).

- [x] **Step 2: Write the failing tests**

Create `src/vision/normalizeHand.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { NORMALIZATION_VERSION, normalizeHand } from './normalizeHand.js'

// A made-up but hand-like set of 21 points in pixels (x, y, z), wrist first.
function pixelHand() {
  return Array.from({ length: 21 }, (_, i) => ({
    x: 320 + ((i % 5) - 2) * 15,
    y: 400 - i * 8,
    z: ((i % 3) - 1) * 5,
  }))
}

// MediaPipe-style landmarks: x and y as fractions of the frame, z on x's scale.
function toRaw(points, width, height) {
  return points.map((p) => ({ x: p.x / width, y: p.y / height, z: p.z / width }))
}

function expectClose(actual, expected) {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 9))
}

const at640 = { width: 640, height: 480 }

describe('normalizeHand', () => {
  it('returns 63 numbers', () => {
    expect(normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' })).toHaveLength(63)
  })

  it('puts the wrist at the origin', () => {
    const out = normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' })
    expectClose(out.slice(0, 3), [0, 0, 0])
  })

  it('makes the palm length (wrist to point 9) equal to 1', () => {
    const out = normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' })
    const [x, y, z] = out.slice(27, 30)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9)
  })

  it('gives the same output when the hand moves in the frame', () => {
    const moved = pixelHand().map((p) => ({ x: p.x + 50, y: p.y - 30, z: p.z }))
    expectClose(
      normalizeHand(toRaw(moved, 640, 480), { ...at640, hand: 'right' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('gives the same output when the hand looks bigger', () => {
    const wrist = pixelHand()[0]
    const bigger = pixelHand().map((p) => ({
      x: wrist.x + (p.x - wrist.x) * 1.7,
      y: wrist.y + (p.y - wrist.y) * 1.7,
      z: p.z * 1.7,
    }))
    expectClose(
      normalizeHand(toRaw(bigger, 640, 480), { ...at640, hand: 'right' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('gives the same output for the same hand at 640×480 and 1280×720', () => {
    // The same hand, twice as many pixels across, in a 16:9 frame.
    const hd = pixelHand().map((p) => ({ x: p.x * 2, y: p.y * 2 - 150, z: p.z * 2 }))
    expectClose(
      normalizeHand(toRaw(hd, 1280, 720), { width: 1280, height: 720, hand: 'right' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('makes a left hand match the mirrored right hand', () => {
    const mirrored = pixelHand().map((p) => ({ x: 640 - p.x, y: p.y, z: p.z }))
    expectClose(
      normalizeHand(toRaw(mirrored, 640, 480), { ...at640, hand: 'left' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('flipping twice gives the original: left output negated in x equals right output', () => {
    const raw = toRaw(pixelHand(), 640, 480)
    const left = normalizeHand(raw, { ...at640, hand: 'left' })
    const right = normalizeHand(raw, { ...at640, hand: 'right' })
    const unflipped = left.map((v, i) => (i % 3 === 0 ? -v : v))
    expectClose(unflipped, right)
  })

  it('returns null when the palm length is about zero', () => {
    const flat = pixelHand().map(() => ({ x: 320, y: 400, z: 0 }))
    expect(normalizeHand(toRaw(flat, 640, 480), { ...at640, hand: 'right' })).toBeNull()
  })

  it('exports normalization version 1', () => {
    expect(NORMALIZATION_VERSION).toBe(1)
  })
})
```

- [x] **Step 3: Run the tests to see them fail**

Run: `npm test -- src/vision/normalizeHand.test.js`
Expected: FAIL, "Failed to resolve import ./normalizeHand.js" (or similar: the module doesn't exist).

- [x] **Step 4: Implement**

Create `src/vision/normalizeHand.js`:

```js
// Turns MediaPipe's 21 hand landmarks into 63 numbers that describe only the
// hand's shape: the same handshape gives the same numbers wherever it is in
// the picture, however big it looks, and whichever hand made it.
// See docs/data-format.md. Bump NORMALIZATION_VERSION whenever this changes:
// session files record which version produced their landmarks.
export const NORMALIZATION_VERSION = 1

const WRIST = 0
const MIDDLE_FINGER_BASE = 9
// A palm shorter than this (in pixels) means the landmarks are unusable.
const MIN_PALM_LENGTH = 1e-6

// raw: 21 { x, y, z } points as MediaPipe returns them, in the un-mirrored
// camera frame (x and y are fractions of the width and height; z is depth on
// roughly the same scale as x). hand: 'left' or 'right'.
// Returns 63 numbers (x, y, z for points 0–20, wrist first), or null.
export function normalizeHand(raw, { width, height, hand }) {
  // 1. Equal units: pixels on both axes, so a 640×480 frame doesn't stretch
  //    the hand sideways. MediaPipe gives z on roughly x's scale.
  const points = raw.map((p) => ({ x: p.x * width, y: p.y * height, z: p.z * width }))

  // 2. Wrist to origin.
  const wrist = points[WRIST]
  const moved = points.map((p) => ({ x: p.x - wrist.x, y: p.y - wrist.y, z: p.z - wrist.z }))

  // 3. Scale by palm length: wrist to the base of the middle finger, which
  //    doesn't change when fingers curl. Whether z belongs in this distance is
  //    an experiment for milestone 2.2 (z is the noisiest coordinate).
  const base = moved[MIDDLE_FINGER_BASE]
  const palm = Math.hypot(base.x, base.y, base.z)
  if (!(palm > MIN_PALM_LENGTH)) return null

  // 4. Flip left hands so they look like right hands. Which hand decides the
  //    flip uses the detected hand, for now: it's an open decision in the plan.
  // 5. No rotation, deliberately: orientation carries meaning (H vs U).
  const flip = hand === 'left' ? -1 : 1
  return moved.flatMap((p) => [(flip * p.x) / palm, p.y / palm, p.z / palm])
}
```

- [x] **Step 5: Run the tests to see them pass**

Run: `npm test -- src/vision/normalizeHand.test.js`
Expected: PASS, 10 tests.

- [x] **Step 6: Report**

Run `npm run lint` (no warnings) and `git status --short`. Explain to Lanix what normalization does and what each test proves. Suggested commit message: `Add hand normalization and Vitest`. Do not commit unless Lanix asks.

---

### Task 2: Frame counter and take rules

**Files:**
- Create: `src/camera/frameCounter.js`, `src/camera/frameCounter.test.js`
- Create: `src/recorder/takeRules.js`, `src/recorder/takeRules.test.js`

**Interfaces:**
- Consumes: `normalizeHand`, `NORMALIZATION_VERSION` (Task 1); `toPhysicalHand(label)` from `src/vision/handedness.js` (exists; returns `'Left'`/`'Right'`).
- Produces:
  - `nextFrameCount(video, timeoutMs = 1000) → Promise<{ time, frames } | null>`
  - `fpsBetween(start, end) → number | null`
  - Constants `COUNTDOWN_MS`, `SETTLE_MS`, `CAPTURE_MS`, `SAMPLE_INTERVAL_MS`, `MIN_MATCHED_SHARE`, `EXPECTED_SAMPLES` (30), `MIN_MATCHED` (24), `TAKES_TARGET` (3), `POSITION_HINTS`, `LIFEPRINT_URL`
  - `takePhase(elapsedMs) → 'countdown' | 'settling' | 'capturing' | 'done'`
  - `sampleSlot(t, lastSlot, intervalMs?, captureMs?) → number | null`
  - `frameFromDetection(detection, t) → Frame`, where `detection = { landmarks, handedness, width, height, time }` and `Frame` is `{ hasHand: false, t }` or `{ hasHand: true, t, detected, detectedScore, width, height, raw: number[63], landmarks: number[63] }`
  - `tallyTake(frames, hand) → { kept, mismatched, droppedNoHand }`
  - `judgeTake(counts, expected?) → { status: 'accepted' | 'rejected', reason: string | null }`

- [x] **Step 1: Write the failing tests**

Create `src/camera/frameCounter.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { fpsBetween } from './frameCounter.js'

describe('fpsBetween', () => {
  it('divides frames shown by the time between two readings', () => {
    expect(fpsBetween({ time: 1000, frames: 100 }, { time: 4000, frames: 190 })).toBeCloseTo(30, 9)
  })

  it('returns null when a reading is missing or time did not move', () => {
    expect(fpsBetween(null, { time: 4000, frames: 190 })).toBeNull()
    expect(fpsBetween({ time: 1000, frames: 100 }, null)).toBeNull()
    expect(fpsBetween({ time: 1000, frames: 100 }, { time: 1000, frames: 100 })).toBeNull()
  })
})
```

Create `src/recorder/takeRules.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_MS,
  COUNTDOWN_MS,
  EXPECTED_SAMPLES,
  MIN_MATCHED,
  SETTLE_MS,
  frameFromDetection,
  judgeTake,
  sampleSlot,
  takePhase,
  tallyTake,
} from './takeRules.js'

// Detection times (ms since capture started) for a camera at `fps`, starting
// during the settle period, and the samples the sampler would take.
function sampleTimes(fps, { stallFrom, stallTo } = {}) {
  const taken = []
  let lastSlot = -1
  for (let t = -SETTLE_MS; t < CAPTURE_MS + 200; t += 1000 / fps) {
    if (stallFrom !== undefined && t >= stallFrom && t < stallTo) continue
    const slot = sampleSlot(t, lastSlot)
    if (slot === null) continue
    lastSlot = slot
    taken.push(t)
  }
  return taken
}

function pointsAt(width, height) {
  return Array.from({ length: 21 }, (_, i) => ({
    x: (320 + ((i % 5) - 2) * 15) / width,
    y: (400 - i * 8) / height,
    z: ((i % 3) - 1) * 5 / width,
  }))
}

describe('constants', () => {
  it('expects 30 samples and needs 24 to pass', () => {
    expect(EXPECTED_SAMPLES).toBe(30)
    expect(MIN_MATCHED).toBe(24)
  })
})

describe('takePhase', () => {
  it('moves through countdown, settling, capturing and done', () => {
    expect(takePhase(0)).toBe('countdown')
    expect(takePhase(COUNTDOWN_MS - 1)).toBe('countdown')
    expect(takePhase(COUNTDOWN_MS)).toBe('settling')
    expect(takePhase(COUNTDOWN_MS + SETTLE_MS)).toBe('capturing')
    expect(takePhase(COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS - 1)).toBe('capturing')
    expect(takePhase(COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS)).toBe('done')
  })
})

describe('sampleSlot', () => {
  it('takes 30 samples from a 30 fps camera', () => {
    expect(sampleTimes(30)).toHaveLength(30)
  })

  it('still takes 30 samples from a camera slowed to 20 fps', () => {
    expect(sampleTimes(20)).toHaveLength(30)
  })

  it('takes only the frames that exist from a 7 fps camera', () => {
    expect(sampleTimes(7)).toHaveLength(21)
  })

  it('samples nothing during settling or after capture', () => {
    expect(sampleSlot(-1, -1)).toBeNull()
    expect(sampleSlot(CAPTURE_MS, -1)).toBeNull()
  })

  it('does not bunch samples after a stall', () => {
    const times = sampleTimes(30, { stallFrom: 100, stallTo: 600 })
    const gaps = times.slice(1).map((t, i) => t - times[i])
    expect(Math.min(...gaps)).toBeGreaterThan(60)
  })
})

describe('frameFromDetection', () => {
  const detection = {
    landmarks: pointsAt(640, 480),
    handedness: { categoryName: 'Left', score: 0.93 },
    width: 640,
    height: 480,
    time: 0,
  }

  it('records the detected hand in lowercase, with raw and normalized landmarks', () => {
    const frame = frameFromDetection(detection, 400)
    expect(frame).toMatchObject({ hasHand: true, t: 400, detected: 'left', detectedScore: 0.93, width: 640, height: 480 })
    expect(frame.raw).toHaveLength(63)
    expect(frame.landmarks).toHaveLength(63)
  })

  it('marks a frame without a hand', () => {
    expect(frameFromDetection({ ...detection, landmarks: null, handedness: null }, 100)).toEqual({ hasHand: false, t: 100 })
  })

  it('treats unusable landmarks as no hand', () => {
    const flat = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    expect(frameFromDetection({ ...detection, landmarks: flat }, 100)).toEqual({ hasHand: false, t: 100 })
  })
})

describe('tallyTake', () => {
  it('counts kept, mismatched and no-hand frames separately', () => {
    const frames = [
      { hasHand: true, detected: 'left' },
      { hasHand: true, detected: 'right' },
      { hasHand: false },
      { hasHand: true, detected: 'left' },
    ]
    expect(tallyTake(frames, 'left')).toEqual({ kept: 3, mismatched: 1, droppedNoHand: 1 })
  })
})

describe('judgeTake', () => {
  it('accepts at exactly 24 matched', () => {
    expect(judgeTake({ kept: 30, mismatched: 6, droppedNoHand: 0 })).toEqual({ status: 'accepted', reason: null })
  })

  it('rejects at 23 matched and says why', () => {
    expect(judgeTake({ kept: 30, mismatched: 7, droppedNoHand: 0 })).toEqual({
      status: 'rejected',
      reason: '23 of 30 frames matched: 7 had the other hand detected',
    })
  })

  it('reports no-hand and mismatched frames together', () => {
    expect(judgeTake({ kept: 22, mismatched: 4, droppedNoHand: 8 }).reason).toBe(
      '18 of 30 frames matched: 8 had no hand, 4 had the other hand detected',
    )
  })

  it('says frames never arrived when the camera was too slow', () => {
    expect(judgeTake({ kept: 21, mismatched: 0, droppedNoHand: 0 }).reason).toBe(
      '21 of 30 frames matched: 9 never arrived (the camera may be slow)',
    )
  })
})
```

- [x] **Step 2: Run the tests to see them fail**

Run: `npm test -- src/camera/frameCounter.test.js src/recorder/takeRules.test.js`
Expected: FAIL, modules not found.

- [x] **Step 3: Implement**

Create `src/camera/frameCounter.js`:

```js
// Resolves on the next video frame with the time and the browser's running
// total of frames shown (presentedFrames), or null if no frame arrives within
// timeoutMs (the video stopped, or the browser lacks requestVideoFrameCallback).
export function nextFrameCount(video, timeoutMs = 1000) {
  return new Promise((resolve) => {
    if (!('requestVideoFrameCallback' in video)) {
      resolve(null)
      return
    }
    const timeout = setTimeout(() => resolve(null), timeoutMs)
    video.requestVideoFrameCallback((now, metadata) => {
      clearTimeout(timeout)
      resolve({ time: now, frames: metadata.presentedFrames })
    })
  })
}

// Frames per second between two readings from nextFrameCount.
export function fpsBetween(start, end) {
  if (!start || !end || end.time <= start.time) return null
  return ((end.frames - start.frames) * 1000) / (end.time - start.time)
}
```

Create `src/recorder/takeRules.js`:

```js
import { normalizeHand } from '../vision/normalizeHand.js'
import { toPhysicalHand } from '../vision/handedness.js'

// One take: a countdown, a short pause so the hand can finish forming the
// shape, then the capture window.
export const COUNTDOWN_MS = 3000
export const SETTLE_MS = 500
export const CAPTURE_MS = 3000
// One sample per this many milliseconds of capture. J and Z may need faster
// sampling in Phase 4.
export const SAMPLE_INTERVAL_MS = 100
export const EXPECTED_SAMPLES = Math.round(CAPTURE_MS / SAMPLE_INTERVAL_MS)
// A take passes when kept − mismatched ≥ MIN_MATCHED (24 of 30).
export const MIN_MATCHED_SHARE = 0.8
export const MIN_MATCHED = Math.round(MIN_MATCHED_SHARE * EXPECTED_SAMPLES)

export const TAKES_TARGET = 3
export const POSITION_HINTS = ['Centre of the picture', 'Closer to the camera', 'Off to one side']
export const LIFEPRINT_URL = 'https://www.lifeprint.com/asl101/fingerspelling/'

export function takePhase(elapsedMs) {
  if (elapsedMs < COUNTDOWN_MS) return 'countdown'
  if (elapsedMs < COUNTDOWN_MS + SETTLE_MS) return 'settling'
  if (elapsedMs < COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS) return 'capturing'
  return 'done'
}

// Sampling by time: the capture window is cut into slots of intervalMs, and
// the first detection in each slot becomes a sample. Returns that slot's
// index, or null if this detection shouldn't be sampled (outside the window,
// or its slot already has a sample). A slow camera just fills fewer slots;
// after a stall, samples don't bunch up.
export function sampleSlot(t, lastSlot, intervalMs = SAMPLE_INTERVAL_MS, captureMs = CAPTURE_MS) {
  if (t < 0 || t >= captureMs) return null
  const slot = Math.floor(t / intervalMs)
  return slot > lastSlot ? slot : null
}

// Turns one detection (from useHandDetection's listener) into a frame.
// t: milliseconds since capture started.
export function frameFromDetection({ landmarks, handedness, width, height }, t) {
  if (!landmarks || !handedness) return { hasHand: false, t }
  const detected = toPhysicalHand(handedness.categoryName).toLowerCase()
  // Flip by the detected hand, for now (an open decision in the plan).
  const normalized = normalizeHand(landmarks, { width, height, hand: detected })
  if (!normalized) return { hasHand: false, t }
  return {
    hasHand: true,
    t,
    detected,
    detectedScore: handedness.score,
    width,
    height,
    raw: landmarks.flatMap((p) => [p.x, p.y, p.z]),
    landmarks: normalized,
  }
}

export function tallyTake(frames, hand) {
  const withHand = frames.filter((f) => f.hasHand)
  return {
    kept: withHand.length,
    mismatched: withHand.filter((f) => f.detected !== hand).length,
    droppedNoHand: frames.length - withHand.length,
  }
}

export function judgeTake({ kept, mismatched, droppedNoHand }, expected = EXPECTED_SAMPLES) {
  const matched = kept - mismatched
  if (matched >= MIN_MATCHED) return { status: 'accepted', reason: null }

  const parts = []
  if (droppedNoHand > 0) parts.push(`${droppedNoHand} had no hand`)
  if (mismatched > 0) parts.push(`${mismatched} had the other hand detected`)
  const missing = expected - kept - droppedNoHand
  if (missing > 0) parts.push(`${missing} never arrived (the camera may be slow)`)
  const reason = `${matched} of ${expected} frames matched` + (parts.length ? `: ${parts.join(', ')}` : '')
  return { status: 'rejected', reason }
}
```

- [x] **Step 4: Run the tests to see them pass**

Run: `npm test -- src/camera/frameCounter.test.js src/recorder/takeRules.test.js`
Expected: PASS (2 + 15 tests).

- [x] **Step 5: Report**

`npm run lint`, `git status --short`. Explain sampling by time and the pass rule. Suggested commit message: `Add take rules and frame counter for the recorder`.

---

### Task 3: Session file and browser storage

**Files:**
- Create: `src/recorder/sessionFile.js`, `src/recorder/sessionFile.test.js`
- Create: `src/recorder/sessionStore.js`, `src/recorder/sessionStore.test.js`

**Interfaces:**
- Consumes: `NORMALIZATION_VERSION` (Task 1); `Frame` shape from Task 2.
- Produces (`sessionFile.js`):
  - `FORMAT_VERSION = 1`, `LANGUAGE = 'asl'`
  - `normalizePersonCode(text) → string`, `isValidPersonCode(code) → boolean`
  - `nextSessionId(date, usedIds) → string`
  - `makeRecordingId({ person, session, letter, hand, take }) → string`
  - `newSession({ person, session, consent: { train, publish }, date, browser }) → Session`
  - `attemptCount(session, letter, hand) → number`, `acceptedCount(session, letter, hand) → number`
  - `addTake(session, { letter, hand, counts, status, reason, cameraFps, frames }) → Session`
  - `undoLastTake(session) → Session`
  - `sessionFileName(session) → string`
- Produces (`sessionStore.js`): `saveSession(session) → boolean`, `loadSession() → Session | null`, `clearSession()`, `loadUsedSessionIds() → string[]`, `rememberSessionId(id)`, `downloadSession(session)`.

- [x] **Step 1: Write the failing tests**

Create `src/recorder/sessionFile.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  acceptedCount,
  addTake,
  attemptCount,
  isValidPersonCode,
  makeRecordingId,
  newSession,
  nextSessionId,
  normalizePersonCode,
  sessionFileName,
  undoLastTake,
} from './sessionFile.js'

function frame(detected = 'left', t = 0) {
  return {
    hasHand: true,
    t,
    detected,
    detectedScore: 0.98765,
    width: 640,
    height: 480,
    raw: Array(63).fill(0.123456),
    landmarks: Array(63).fill(-0.987654),
  }
}

function session() {
  return newSession({
    person: 'p03',
    session: '2026-11-02a',
    consent: { train: true, publish: false },
    date: '2026-11-02',
    browser: 'Chrome 155',
  })
}

function take(overrides = {}) {
  return {
    letter: 'W',
    hand: 'left',
    counts: { kept: 2, mismatched: 1, droppedNoHand: 1 },
    status: 'accepted',
    reason: null,
    cameraFps: 29.96,
    frames: [frame('left', 0), frame('right', 100), { hasHand: false, t: 200 }],
    ...overrides,
  }
}

describe('person codes', () => {
  it('accepts P03 with spaces as p03', () => {
    const code = normalizePersonCode('  P03 ')
    expect(code).toBe('p03')
    expect(isValidPersonCode(code)).toBe(true)
  })

  it('needs p and at least two digits', () => {
    expect(isValidPersonCode('p003')).toBe(true)
    expect(isValidPersonCode('p3')).toBe(false)
    expect(isValidPersonCode('x03')).toBe(false)
    expect(isValidPersonCode('')).toBe(false)
  })
})

describe('nextSessionId', () => {
  it('uses the first unused letter for the day', () => {
    expect(nextSessionId('2026-11-02', [])).toBe('2026-11-02a')
    expect(nextSessionId('2026-11-02', ['2026-11-02a', '2026-11-02b', '2026-11-01c'])).toBe('2026-11-02c')
  })
})

describe('makeRecordingId', () => {
  it('starts with the person', () => {
    expect(makeRecordingId({ person: 'p03', session: '2026-11-02a', letter: 'W', hand: 'left', take: 2 })).toBe(
      'p03-2026-11-02a-W-left-2',
    )
    expect(makeRecordingId({ person: 'p03', session: '2026-11-02a', letter: 'none', hand: 'right', take: 1 })).toBe(
      'p03-2026-11-02a-none-right-1',
    )
  })
})

describe('newSession', () => {
  it('fills in the header', () => {
    expect(session()).toEqual({
      format: 1,
      normalization: 1,
      language: 'asl',
      person: 'p03',
      session: '2026-11-02a',
      browser: 'Chrome 155',
      cameraFps: null,
      consent: { train: true, publish: false, date: '2026-11-02' },
      recordings: [],
      samples: [],
    })
  })
})

describe('addTake', () => {
  it('adds an accepted take: an entry plus one sample per frame with a hand', () => {
    const s = addTake(session(), take())
    expect(s.recordings).toEqual([
      {
        recording: 'p03-2026-11-02a-W-left-1',
        letter: 'W',
        hand: 'left',
        take: 1,
        status: 'accepted',
        reason: null,
        kept: 2,
        mismatched: 1,
        droppedNoHand: 1,
        cameraFps: 30,
      },
    ])
    expect(s.samples).toHaveLength(2)
    expect(s.samples[1]).toMatchObject({
      person: 'p03',
      session: '2026-11-02a',
      language: 'asl',
      letter: 'W',
      hand: 'left',
      detected: 'right',
      detectedScore: 0.99,
      recording: 'p03-2026-11-02a-W-left-1',
      take: 1,
      t: 100,
      width: 640,
      height: 480,
    })
    expect(s.samples[0].raw[0]).toBe(0.1235)
    expect(s.samples[0].landmarks[0]).toBe(-0.9877)
  })

  it('adds a rejected take as an entry without samples', () => {
    const s = addTake(session(), take({ status: 'rejected', reason: '18 of 30 frames matched' }))
    expect(s.recordings[0]).toMatchObject({ status: 'rejected', reason: '18 of 30 frames matched' })
    expect(s.samples).toHaveLength(0)
  })

  it('numbers takes by attempt, counting rejected ones, so IDs stay unique', () => {
    let s = addTake(session(), take({ status: 'rejected', reason: 'x' }))
    s = addTake(s, take())
    expect(s.recordings.map((r) => r.recording)).toEqual(['p03-2026-11-02a-W-left-1', 'p03-2026-11-02a-W-left-2'])
    expect(attemptCount(s, 'W', 'left')).toBe(2)
    expect(acceptedCount(s, 'W', 'left')).toBe(1)
    expect(acceptedCount(s, 'W', 'right')).toBe(0)
  })

  it('sets the session camera fps to the median of its takes', () => {
    let s = addTake(session(), take({ cameraFps: 30 }))
    s = addTake(s, take({ cameraFps: 20 }))
    s = addTake(s, take({ cameraFps: 29.6 }))
    expect(s.cameraFps).toBe(29.6)
  })

  it('does not change the session it was given', () => {
    const before = session()
    addTake(before, take())
    expect(before.recordings).toHaveLength(0)
  })
})

describe('undoLastTake', () => {
  it('removes the last entry and its samples, and the next take reuses its number', () => {
    let s = addTake(session(), take())
    s = addTake(s, take())
    s = undoLastTake(s)
    expect(s.recordings).toHaveLength(1)
    expect(s.samples.every((x) => x.recording === 'p03-2026-11-02a-W-left-1')).toBe(true)
    s = addTake(s, take())
    const ids = s.recordings.map((r) => r.recording)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('does nothing on an empty session', () => {
    expect(undoLastTake(session()).recordings).toEqual([])
  })
})

describe('sessionFileName', () => {
  it('names the file after the person and session', () => {
    expect(sessionFileName(session())).toBe('sema-asl-p03-2026-11-02a.json')
  })
})
```

Create `src/recorder/sessionStore.test.js`:

```js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newSession } from './sessionFile.js'
import { clearSession, loadSession, loadUsedSessionIds, rememberSessionId, saveSession } from './sessionStore.js'

function fakeStorage({ failWrites = false } = {}) {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      if (failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      data.set(key, String(value))
    },
    removeItem: (key) => data.delete(key),
  }
}

const session = newSession({
  person: 'p03',
  session: '2026-11-02a',
  consent: { train: true, publish: false },
  date: '2026-11-02',
  browser: 'Chrome 155',
})

afterEach(() => vi.unstubAllGlobals())

describe('sessionStore', () => {
  it('saves and loads a session', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(saveSession(session)).toBe(true)
    expect(loadSession()).toEqual(session)
  })

  it('returns false when the browser refuses to save (storage full)', () => {
    vi.stubGlobal('localStorage', fakeStorage({ failWrites: true }))
    expect(saveSession(session)).toBe(false)
  })

  it('ignores a saved session that is not valid JSON', () => {
    const storage = fakeStorage()
    storage.setItem('sema.recorder.session', '{not json')
    vi.stubGlobal('localStorage', storage)
    expect(loadSession()).toBeNull()
  })

  it('ignores a saved session from another format version', () => {
    const storage = fakeStorage()
    storage.setItem('sema.recorder.session', JSON.stringify({ ...session, format: 99 }))
    vi.stubGlobal('localStorage', storage)
    expect(loadSession()).toBeNull()
  })

  it('returns null when storage itself is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(loadSession()).toBeNull()
    expect(saveSession(session)).toBe(false)
  })

  it('clears the saved session', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    saveSession(session)
    clearSession()
    expect(loadSession()).toBeNull()
  })

  it('remembers used session IDs', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(loadUsedSessionIds()).toEqual([])
    rememberSessionId('2026-11-02a')
    rememberSessionId('2026-11-02a')
    rememberSessionId('2026-11-02b')
    expect(loadUsedSessionIds()).toEqual(['2026-11-02a', '2026-11-02b'])
  })
})
```

- [x] **Step 2: Run the tests to see them fail**

Run: `npm test -- src/recorder/sessionFile.test.js src/recorder/sessionStore.test.js`
Expected: FAIL, modules not found.

- [x] **Step 3: Implement**

Create `src/recorder/sessionFile.js`:

```js
import { NORMALIZATION_VERSION } from '../vision/normalizeHand.js'

// Builds the session file described in docs/data-format.md. Everything here
// returns new objects; nothing is changed in place.
export const FORMAT_VERSION = 1
export const LANGUAGE = 'asl'

const round = (value, decimals) => Math.round(value * 10 ** decimals) / 10 ** decimals

export function normalizePersonCode(text) {
  return text.trim().toLowerCase()
}

// "p" followed by at least two digits, like p03.
export function isValidPersonCode(code) {
  return /^p\d{2,}$/.test(code)
}

// Today's date plus the first letter not yet used in this browser that day.
export function nextSessionId(date, usedIds) {
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    const id = `${date}${letter}`
    if (!usedIds.includes(id)) return id
  }
  return `${date}z`
}

export function makeRecordingId({ person, session, letter, hand, take }) {
  return `${person}-${session}-${letter}-${hand}-${take}`
}

export function newSession({ person, session, consent, date, browser }) {
  return {
    format: FORMAT_VERSION,
    normalization: NORMALIZATION_VERSION,
    language: LANGUAGE,
    person,
    session,
    browser,
    cameraFps: null,
    consent: { train: consent.train, publish: consent.publish, date },
    recordings: [],
    samples: [],
  }
}

function takesFor(session, letter, hand) {
  return session.recordings.filter((r) => r.letter === letter && r.hand === hand)
}

// All attempts, accepted or rejected: take numbers count attempts so that
// every recording ID in a session is unique.
export function attemptCount(session, letter, hand) {
  return takesFor(session, letter, hand).length
}

export function acceptedCount(session, letter, hand) {
  return takesFor(session, letter, hand).filter((r) => r.status === 'accepted').length
}

function median(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// take: { letter, hand, counts: { kept, mismatched, droppedNoHand }, status,
// reason, cameraFps, frames } where frames come from takeRules.frameFromDetection.
export function addTake(session, take) {
  const number = attemptCount(session, take.letter, take.hand) + 1
  const recording = makeRecordingId({
    person: session.person,
    session: session.session,
    letter: take.letter,
    hand: take.hand,
    take: number,
  })
  const entry = {
    recording,
    letter: take.letter,
    hand: take.hand,
    take: number,
    status: take.status,
    reason: take.reason,
    kept: take.counts.kept,
    mismatched: take.counts.mismatched,
    droppedNoHand: take.counts.droppedNoHand,
    cameraFps: take.cameraFps === null ? null : round(take.cameraFps, 1),
  }
  // Only accepted takes keep their frames. Mismatched frames are kept too;
  // training filters to detected === hand.
  const samples =
    take.status === 'accepted'
      ? take.frames
          .filter((f) => f.hasHand)
          .map((f) => ({
            person: session.person,
            session: session.session,
            language: session.language,
            letter: take.letter,
            hand: take.hand,
            detected: f.detected,
            detectedScore: round(f.detectedScore, 2),
            recording,
            take: number,
            t: f.t,
            width: f.width,
            height: f.height,
            raw: f.raw.map((v) => round(v, 4)),
            landmarks: f.landmarks.map((v) => round(v, 4)),
          }))
      : []
  const recordings = [...session.recordings, entry]
  return {
    ...session,
    cameraFps: median(recordings.map((r) => r.cameraFps).filter((v) => v !== null)),
    recordings,
    samples: [...session.samples, ...samples],
  }
}

export function undoLastTake(session) {
  const last = session.recordings.at(-1)
  if (!last) return session
  const recordings = session.recordings.slice(0, -1)
  return {
    ...session,
    cameraFps: median(recordings.map((r) => r.cameraFps).filter((v) => v !== null)),
    recordings,
    samples: session.samples.filter((s) => s.recording !== last.recording),
  }
}

export function sessionFileName(session) {
  return `sema-${session.language}-${session.person}-${session.session}.json`
}
```

Create `src/recorder/sessionStore.js`:

```js
import { FORMAT_VERSION, sessionFileName } from './sessionFile.js'

// The session in progress is autosaved in this browser so a refresh doesn't
// lose it. Storage can be missing (private windows, blocked site data) or
// full, so every access is wrapped in try/catch and fails softly.
const SESSION_KEY = 'sema.recorder.session'
const USED_IDS_KEY = 'sema.recorder.sessionIds'

// Returns false if the browser refused to save (storage unavailable or full).
export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}

// The saved session, or null if there is none or it can't be used.
export function loadSession() {
  try {
    const text = localStorage.getItem(SESSION_KEY)
    if (!text) return null
    const session = JSON.parse(text)
    const usable =
      session?.format === FORMAT_VERSION &&
      Array.isArray(session.recordings) &&
      Array.isArray(session.samples)
    return usable ? session : null
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

export function loadUsedSessionIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(USED_IDS_KEY) ?? '[]')
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function rememberSessionId(id) {
  const ids = loadUsedSessionIds()
  if (ids.includes(id)) return
  try {
    localStorage.setItem(USED_IDS_KEY, JSON.stringify([...ids, id]))
  } catch {
    // Not remembering only affects the next suggested session ID.
  }
}

// Saves the session as a JSON file in the browser's downloads.
export function downloadSession(session) {
  const blob = new Blob([JSON.stringify(session)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = sessionFileName(session)
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
```

- [x] **Step 4: Run the tests to see them pass**

Run: `npm test -- src/recorder/sessionFile.test.js src/recorder/sessionStore.test.js`
Expected: PASS (13 + 7 tests).

- [x] **Step 5: Report**

`npm run lint`, `git status --short`. Explain why take numbers count attempts and why storage fails softly. Suggested commit message: `Add the recorder's session file and browser storage`.

---

### Task 4: Session checker

**Files:**
- Create: `scripts/check-session.js`, `scripts/check-session.test.js`
- Modify: `package.json` (script `check-session`)

**Interfaces:**
- Consumes: `newSession`, `addTake` (Task 3) in tests only.
- Produces: `KNOWN_FORMATS`, `KNOWN_NORMALIZATIONS`, `checkSession(file, otherRecordingIds = new Set()) → { errors: string[], table: Array<{ letter, hand, accepted, rejected }> }`, `formatTable(table) → string`; CLI `npm run check-session -- <file>`.

- [x] **Step 1: Write the failing tests**

Create `scripts/check-session.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { addTake, newSession } from '../src/recorder/sessionFile.js'
import { checkSession, formatTable } from './check-session.js'

function frame(t) {
  return {
    hasHand: true,
    t,
    detected: 'left',
    detectedScore: 0.97,
    width: 640,
    height: 480,
    raw: Array(63).fill(0.5),
    landmarks: Array(63).fill(0.1),
  }
}

function validFile() {
  let s = newSession({
    person: 'p03',
    session: '2026-11-02a',
    consent: { train: true, publish: false },
    date: '2026-11-02',
    browser: 'Chrome 155',
  })
  const frames = Array.from({ length: 30 }, (_, i) => frame(i * 100))
  s = addTake(s, {
    letter: 'W', hand: 'left', counts: { kept: 30, mismatched: 0, droppedNoHand: 0 },
    status: 'accepted', reason: null, cameraFps: 30, frames,
  })
  s = addTake(s, {
    letter: 'W', hand: 'right', counts: { kept: 10, mismatched: 0, droppedNoHand: 20 },
    status: 'rejected', reason: '10 of 30 frames matched: 20 had no hand', cameraFps: 30, frames: [],
  })
  return s
}

function broken(change) {
  const file = structuredClone(validFile())
  change(file)
  return checkSession(file).errors
}

describe('checkSession', () => {
  it('passes a valid file', () => {
    expect(checkSession(validFile()).errors).toEqual([])
  })

  it('counts accepted and rejected takes per letter and hand', () => {
    expect(checkSession(validFile()).table).toEqual([
      { letter: 'W', hand: 'left', accepted: 1, rejected: 0 },
      { letter: 'W', hand: 'right', accepted: 0, rejected: 1 },
    ])
    expect(formatTable(checkSession(validFile()).table)).toContain('W')
  })

  it('rejects unknown format and normalization versions', () => {
    expect(broken((f) => { f.format = 2 })).toContain('Unknown format version: 2')
    expect(broken((f) => { f.normalization = 3 })).toContain('Unknown normalization version: 3')
  })

  it('needs 63 numbers in raw and landmarks', () => {
    expect(broken((f) => { f.samples[0].landmarks.pop() })[0]).toMatch(/Sample 0: landmarks must be 63 numbers/)
    expect(broken((f) => { f.samples[1].raw[5] = null })[0]).toMatch(/Sample 1: raw must be 63 numbers/)
  })

  it('needs consent to train, a publish answer and a date', () => {
    expect(broken((f) => { f.consent.train = false })).toContain('consent.train must be true')
    expect(broken((f) => { delete f.consent.publish })).toContain('consent.publish must be true or false')
    expect(broken((f) => { f.consent.date = 'today' })).toContain('consent.date must be a date like 2026-11-02')
  })

  it('finds a recording ID used twice in the file or already in data/raw/', () => {
    expect(broken((f) => { f.recordings[1].recording = f.recordings[0].recording })).toContain(
      'Recording p03-2026-11-02a-W-left-1 appears twice in this file',
    )
    const errors = checkSession(validFile(), new Set(['p03-2026-11-02a-W-left-1'])).errors
    expect(errors).toContain('Recording p03-2026-11-02a-W-left-1 is already in another file in data/raw/')
  })

  it('needs every sample to belong to an accepted recording, with matching counts', () => {
    expect(broken((f) => { f.samples[0].recording = 'p03-2026-11-02a-W-right-1' })[0]).toMatch(
      /Sample 0: recording p03-2026-11-02a-W-right-1 has no accepted entry/,
    )
    expect(broken((f) => { f.recordings[0].kept = 29 })).toContain(
      'Recording p03-2026-11-02a-W-left-1 says kept 29 but has 30 samples',
    )
  })
})
```

- [x] **Step 2: Run the tests to see them fail**

Run: `npm test -- scripts/check-session.test.js`
Expected: FAIL, module not found.

- [x] **Step 3: Implement**

Create `scripts/check-session.js`:

```js
// Checks a recorded session file before it goes into data/raw/.
// Usage: npm run check-session -- path/to/sema-asl-p03-2026-11-02a.json
// Exits with code 1 if anything is wrong. See docs/data-format.md.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const KNOWN_FORMATS = [1]
export const KNOWN_NORMALIZATIONS = [1]

const isNumbers63 = (value) => Array.isArray(value) && value.length === 63 && value.every(Number.isFinite)

export function checkSession(file, otherRecordingIds = new Set()) {
  const errors = []
  if (!KNOWN_FORMATS.includes(file.format)) errors.push(`Unknown format version: ${file.format}`)
  if (!KNOWN_NORMALIZATIONS.includes(file.normalization)) {
    errors.push(`Unknown normalization version: ${file.normalization}`)
  }

  const consent = file.consent ?? {}
  if (consent.train !== true) errors.push('consent.train must be true')
  if (typeof consent.publish !== 'boolean') errors.push('consent.publish must be true or false')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(consent.date ?? '')) errors.push('consent.date must be a date like 2026-11-02')

  const recordings = file.recordings ?? []
  const samples = file.samples ?? []

  const seen = new Set()
  for (const r of recordings) {
    if (seen.has(r.recording)) errors.push(`Recording ${r.recording} appears twice in this file`)
    seen.add(r.recording)
    if (otherRecordingIds.has(r.recording)) {
      errors.push(`Recording ${r.recording} is already in another file in data/raw/`)
    }
  }

  const byId = new Map(recordings.map((r) => [r.recording, r]))
  const samplesPerRecording = new Map()
  samples.forEach((s, i) => {
    if (!isNumbers63(s.raw)) errors.push(`Sample ${i}: raw must be 63 numbers`)
    if (!isNumbers63(s.landmarks)) errors.push(`Sample ${i}: landmarks must be 63 numbers`)
    if (byId.get(s.recording)?.status !== 'accepted') {
      errors.push(`Sample ${i}: recording ${s.recording} has no accepted entry in recordings`)
    }
    samplesPerRecording.set(s.recording, (samplesPerRecording.get(s.recording) ?? 0) + 1)
  })

  for (const r of recordings) {
    const count = samplesPerRecording.get(r.recording) ?? 0
    if (r.status === 'accepted' && r.kept !== count) {
      errors.push(`Recording ${r.recording} says kept ${r.kept} but has ${count} samples`)
    }
  }

  return { errors, table: takeTable(recordings) }
}

function takeTable(recordings) {
  const rows = new Map()
  for (const r of recordings) {
    const key = `${r.letter}|${r.hand}`
    const row = rows.get(key) ?? { letter: r.letter, hand: r.hand, accepted: 0, rejected: 0 }
    if (r.status === 'accepted') row.accepted += 1
    else row.rejected += 1
    rows.set(key, row)
  }
  return [...rows.values()].sort((a, b) => a.letter.localeCompare(b.letter) || a.hand.localeCompare(b.hand))
}

export function formatTable(table) {
  const lines = ['Letter  Hand   Accepted  Rejected']
  for (const row of table) {
    lines.push(`${row.letter.padEnd(8)}${row.hand.padEnd(7)}${String(row.accepted).padStart(8)}${String(row.rejected).padStart(10)}`)
  }
  return lines.join('\n')
}

function recordingIdsInDataRaw(skipPath) {
  const ids = new Set()
  const dir = resolve('data/raw')
  if (!existsSync(dir)) return ids
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (!name.endsWith('.json') || full === skipPath) continue
    for (const r of JSON.parse(readFileSync(full, 'utf8')).recordings ?? []) ids.add(r.recording)
  }
  return ids
}

function main(path) {
  if (!path) {
    console.error('Usage: npm run check-session -- <session file>')
    process.exit(2)
  }
  let file
  try {
    file = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    console.error(`Can't read ${path} as JSON: ${error.message}`)
    process.exit(1)
  }
  const { errors, table } = checkSession(file, recordingIdsInDataRaw(resolve(path)))
  console.log(formatTable(table))
  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):`)
    for (const error of errors.slice(0, 20)) console.error(`- ${error}`)
    if (errors.length > 20) console.error(`- …and ${errors.length - 20} more`)
    process.exit(1)
  }
  console.log('\nOK: this file can go into data/raw/')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2])
}
```

In `package.json` `"scripts"`, add `"check-session": "node scripts/check-session.js"`.

- [x] **Step 4: Run the tests to see them pass**

Run: `npm test -- scripts/check-session.test.js`
Expected: PASS, 7 tests.
Then run: `npm run check-session` with no file.
Expected: exits with the usage message (code 2).

- [x] **Step 5: Report**

`npm run lint`, `git status --short`. Suggested commit message: `Add the session checker`.

---

### Task 5: Detection listener and shared browser name

**Files:**
- Modify: `src/vision/useHandDetection.js`
- Create: `src/vision/browserName.js`
- Modify: `src/vision/useBenchmark.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useHandDetection({ videoRef, canvasRef, landmarkerRef, measurementsRef?, listenerRef?, isRunning })`; while `listenerRef.current` is a function, it is called after every detection with `{ landmarks: NormalizedLandmark[] | null, handedness: { categoryName, score } | null, width, height, time }` (`time` is the `performance.now()` value when that detection started). `browserName() → string` from `src/vision/browserName.js`.

- [x] **Step 1: Make both refs optional and call the listener**

In `src/vision/useHandDetection.js`:

1. Add `listenerRef,` to the destructured parameters, after `measurementsRef,`.
2. Replace the comment above the function's parameter list, the lines starting `// While a benchmark is recording`, with:

```js
// Optional hooks for other tools: while a benchmark is recording,
// measurementsRef.current is an array that every frame's detection time is
// appended to; while the recorder is taking, listenerRef.current is a
// function called with every detection.
```

3. Replace the line `measurementsRef.current?.push({ ms: detectionMs, hand: Boolean(landmarks) })` with:

```js
      measurementsRef?.current?.push({ ms: detectionMs, hand: Boolean(landmarks) })
      listenerRef?.current?.({
        landmarks: landmarks ?? null,
        handedness: result.handedness[0]?.[0] ?? null,
        width: video.videoWidth,
        height: video.videoHeight,
        time: now,
      })
```

4. Change the effect's dependency list to `[videoRef, canvasRef, landmarkerRef, measurementsRef, listenerRef, isRunning]`.

- [x] **Step 2: Move browserName**

Create `src/vision/browserName.js` with the `browserName` function moved verbatim from `src/vision/useBenchmark.js`, exported:

```js
// "Chrome 155", "Firefox 157": the browser and its major version, used to
// label benchmark rows and recorded sessions.
export function browserName() {
  const brands = navigator.userAgentData?.brands ?? []
  const chrome =
    brands.find((b) => b.brand === 'Google Chrome') ||
    brands.find((b) => b.brand === 'Chromium')
  if (chrome) {
    return `${chrome.brand === 'Google Chrome' ? 'Chrome' : 'Chromium'} ${chrome.version}`
  }
  const firefox = navigator.userAgent.match(/Firefox\/(\d+)/)
  return firefox ? `Firefox ${firefox[1]}` : 'Other browser'
}
```

In `src/vision/useBenchmark.js`, delete the `browserName` function and add `import { browserName } from './browserName.js'` after the existing imports.

- [x] **Step 3: Verify nothing changed for the main page**

Run: `npm run lint` (no warnings), `npm test` (all pass), `npm run build` (passes).
Then run `npm run dev`, open `http://localhost:5173` in Chrome, start the camera, check that the skeleton, readouts and Developer settings → Run benchmark still work.

- [x] **Step 4: Report**

`git status --short`. Suggested commit message: `Let other tools listen to hand detection; share browserName`.

---

## Steps 2–5: the app around the recorder

### Task 6 (step 2): App shell — routing, camera provider, menu, tokens

Phase 3.1, done early. After this task, the recorder opens at `/record` inside the app, with the menu, and the Phase 1 page moves to `/dev`. Welcome and setup are still stand-ins, so there are no setup redirects yet.

**Files:**

- **Create:**
  - `src/app/router.js`, `src/app/router.test.js`
  - `src/app/navigation.js`, `src/app/Link.jsx`
  - `src/app/sharedCamera.js`, `src/app/CameraProvider.jsx`, `src/components/CameraStage.jsx`
  - `src/app/MenuBar.jsx`, `src/app/PreviewPill.jsx`, `src/app/PhoneNotice.jsx`
  - `src/pages/dev/DevPage.jsx`, `src/pages/NotBuiltYet.jsx`
  - `public/fonts/PlusJakartaSans-Variable.woff2`, `JetBrainsMono-Medium.woff2`, `OFL-PlusJakartaSans.txt`, `OFL-JetBrainsMono.txt`
- **Modify:**
  - `src/App.jsx`, `src/camera/useCamera.js`, `src/pages/record/RecordPage.jsx`
  - `src/styles.css`, `vite.config.js`, `vercel.json`
  - `README.md`, `CLAUDE.md`
- **Delete:** `record.html`, `src/recorder/main.jsx`

**Design source:**

- `docs/design/Record.dc.html`: the menu bar, the Preview pills and the palette.
- `docs/design/Unsupported.dc.html`: the phone notice, shown below about 900px wide.

**Interfaces:**

- **Consumes:**
  - `useCamera()`, extended here with `attachVideo`
  - `useHandLandmarker(isLive, delegate)` and `useHandDetection({ videoRef, canvasRef, landmarkerRef, listenerRef, isRunning })` (existing)
- **Produces:**
  - `PATHS`: `{ welcome, howSemaWorks, signingHand, cameraCheck, record, learn, practice, dev }` → paths
  - `resolveRoute(pathname) → { page } | { redirect }`. Task 7 adds a second parameter.
  - `navigate(path, { replace })`, `usePathname() → string`, `<Link to>`
  - `useSharedCamera() → { videoRef, attachVideo, status, error, cameras, deviceId, start, stop, switchCamera, handModel, registerView }`
  - `<CameraStage canvasRef className? children>`
  - `<MenuBar active children>`: `active` is `'record' | 'learn' | 'practice' | null`; `children` sit on the bar's right
  - `<PreviewPill>`, `<PhoneNotice>`

- [ ] **Step 1: Write the failing router test**

Create `src/app/router.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { PATHS, resolveRoute } from './router.js'

describe('resolveRoute', () => {
  it('finds the page for each path', () => {
    for (const [page, path] of Object.entries(PATHS)) {
      expect(resolveRoute(path)).toEqual({ page })
    }
  })

  it('ignores a trailing slash', () => {
    expect(resolveRoute('/record/')).toEqual({ page: 'record' })
  })

  it('sends unknown paths to Welcome', () => {
    expect(resolveRoute('/nope')).toEqual({ redirect: '/' })
    expect(resolveRoute('/record.html')).toEqual({ redirect: '/' })
  })
})
```

- [ ] **Step 2: Run it**

Run: `npm test -- src/app/router.test.js`
Expected: FAIL, `Failed to resolve import "./router.js"`.

- [ ] **Step 3: Write the router**

Create `src/app/router.js`:

```js
// The app's pages and the address of each. A small router of our own: with
// a handful of fixed paths, the browser's History API is all we need, so no
// router library. navigation.js is the part that talks to the browser.
export const PATHS = {
  welcome: '/',
  howSemaWorks: '/setup/how-it-works',
  signingHand: '/setup/hand',
  cameraCheck: '/setup/camera',
  record: '/record',
  learn: '/learn',
  practice: '/practice',
  dev: '/dev',
}

// Which page a path shows, as { page: 'record' }, or { redirect: '/' } to
// send the person somewhere else. A trailing slash is ignored.
export function resolveRoute(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = Object.keys(PATHS).find((name) => PATHS[name] === path)
  if (!page) return { redirect: PATHS.welcome }
  return { page }
}
```

- [ ] **Step 4: Run it**

Run: `npm test -- src/app/router.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Navigation and links**

Create `src/app/navigation.js`:

```js
import { useEffect, useState } from 'react'

// Changing pages without reloading the page:
// - navigate(path) changes the address with history.pushState (a new history
//   entry, so Back works) or history.replaceState (no new entry, for redirects);
// - the browser fires 'popstate' when the person presses Back or Forward;
// - pushState itself fires nothing, so navigate() sends an event of our own.
const NAVIGATE_EVENT = 'sema:navigate'

export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname) return
  if (replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  window.scrollTo(0, 0) // a new page starts at the top
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

// The current path. The component re-renders whenever it changes.
export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(NAVIGATE_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])
  return pathname
}
```

Create `src/app/Link.jsx`:

```jsx
import { navigate } from './navigation.js'

// A normal link (<a href>) that changes pages without reloading the page.
// Ctrl-, Cmd-, Shift- and middle-clicks are left to the browser, so "open in a
// new tab" still works.
export default function Link({ to, ...props }) {
  function handleClick(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={handleClick} {...props} />
}
```

- [ ] **Step 6: Let a new `<video>` pick up the running stream**

In `src/camera/useCamera.js`, change the React import to `import { useCallback, useEffect, useRef, useState } from 'react'`. Then add this after `requestIdRef`:

```js
  // A callback ref for the <video> on screen. React calls it with the element
  // when a page shows its video, and with null when that page goes away.
  // Giving a new element the running stream lets the picture carry on from one
  // page to the next. useCallback keeps it the same function between
  // renders, so React doesn't detach and re-attach it every time.
  const attachVideo = useCallback((video) => {
    videoRef.current = video
    if (video && video.srcObject !== streamRef.current) video.srcObject = streamRef.current
  }, [])
```

In `startCamera`, replace `videoRef.current.srcObject = stream` with:

```js
    // The page's video may not be on screen yet; attachVideo hands it the
    // stream when it is.
    if (videoRef.current) videoRef.current.srcObject = stream
```

Add `attachVideo,` to the returned object, after `videoRef,`.

- [ ] **Step 7: The shared camera**

Create `src/app/sharedCamera.js`:

```js
import { createContext, useContext } from 'react'

// The shared camera and hand model, filled in by CameraProvider. This is its
// own file because a component file should export only components (so React's
// Fast Refresh can reload it while you edit).
export const CameraContext = createContext(null)

export function useSharedCamera() {
  return useContext(CameraContext)
}
```

Create `src/app/CameraProvider.jsx`:

```jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCamera } from '../camera/useCamera.js'
import { useHandLandmarker } from '../vision/useHandLandmarker.js'
import { CameraContext } from './sharedCamera.js'

// The camera and the hand model, shared by every page through React context.
// They live here, at the top of the app, so changing pages doesn't close the
// camera or reload the hand model. Pages read them with useSharedCamera().
export default function CameraProvider({ children }) {
  const camera = useCamera()
  const handModel = useHandLandmarker(camera.status === 'live', 'GPU')

  // How many camera views (CameraStage) are on screen. The camera is on while
  // there is one: arriving on a page with a camera view starts it (getting
  // there, plus the browser's permission prompt, is the person's consent), and
  // when the last view goes away it stops, so the light is never on without a
  // picture. When one page's view replaces another's, React applies both
  // changes in one update, so the count never touches 0 and the camera stays on.
  const [views, setViews] = useState(0)
  const registerView = useCallback(() => {
    setViews((n) => n + 1)
    return () => setViews((n) => n - 1)
  }, [])

  // Start only when views appear (0 → 1), not on every render while they're
  // there: after an error or a Stop, the camera waits for a button click.
  const hadViews = useRef(false)
  const { status, start, stop } = camera
  useEffect(() => {
    const hasViews = views > 0
    if (hasViews && !hadViews.current && status === 'idle') start()
    if (!hasViews && status !== 'idle') stop()
    hadViews.current = hasViews
  }, [views, status, start, stop])

  return (
    <CameraContext.Provider value={{ ...camera, handModel, registerView }}>{children}</CameraContext.Provider>
  )
}
```

Create `src/components/CameraStage.jsx`:

```jsx
import { useEffect } from 'react'
import { useSharedCamera } from '../app/sharedCamera.js'

// The camera view: the shared camera's video, the hand overlay canvas, and
// whatever the page puts on top (children). While it's on screen the camera
// is on (see CameraProvider). The video and the canvas share one CSS rule that
// mirrors them (.video and .overlay in styles.css).
export default function CameraStage({ canvasRef, className = 'stage', children }) {
  const { attachVideo, registerView } = useSharedCamera()
  useEffect(() => registerView(), [registerView])
  return (
    <div className={className}>
      <video ref={attachVideo} className="video" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="overlay" />
      {children}
    </div>
  )
}
```

- [ ] **Step 8: Menu bar, Preview pill, phone notice**

Build these from `Record.dc.html` (menu bar) and `Unsupported.dc.html` (phone notice). If a `.dc.html` and its PNG disagree, ask Lanix.

- **`MenuBar({ active, children })`** renders:
  - `<header>` with "Sema" and `<PreviewPill />`
  - `<nav aria-label="Main">` with three `<Link>`s: Record (`PATHS.record`), Learn (`PATHS.learn`) with a Preview pill, and Practice (`PATHS.practice`) with a Preview pill
  - the link for `active` gets `aria-current="page"`, so the underline is styled from `[aria-current='page']` rather than a separate class
  - `children` in a right-hand slot (Record puts its session status there in Task 8)
- **`PreviewPill({ inMenu })`**: "Preview" beside the name (`--ice-tint`, 12px), and a smaller grey "preview" in the menu (`--chip`, 11px), both as designed.
- **`PhoneNotice({ onContinue })`**: the design's full screen, with "Sema is made for computers, for now", **Copy link** (copies the address; the label becomes "Link copied") and **Continue on this phone** (shows the app). `App` shows it instead of the app when the page is under 900px wide **when the page opens**: a phone doesn't change size, and a computer whose window is made narrow later shouldn't lose its page mid-take. Because it replaces the app rather than covering it, nothing behind it (such as the camera) starts.

- [ ] **Step 9: Palette tokens and fonts**

- **Tokens:** add the tokens the designs use to `:root` in `src/styles.css`, with names and values from the `.dc.html` files. The project plan's section 9 lists the expected ones: Ice Blue `#B8E8F5` with tint `#E3F4FA`, muted text on dark `#A9BCD0`, amber tint `#FDF1E3` with text `#7A3A06`, and error red `#B42318`. Keep the existing variable names, and add a comment per token saying where it may be used.
- **Fonts (approved 2026-10-15):**
  - Self-host the design's fonts as `.woff2` files in `public/fonts/`, with their licence (`OFL.txt`) beside them, and declare them with `@font-face` (`font-display: swap`) in `src/styles.css`.
  - Plus Jakarta Sans comes from its official repository, plus the monospace font the `.dc.html` names. The PNGs use a monospace for "σῆμα · a sign", "18 / 30 frames" and "p03 · 2026-11-02a".
  - Check that the monospace covers Greek, for "σῆμα".
  - These are asset files, not npm packages, so they don't add a dependency.
  - Built: `PlusJakartaSans-Variable.woff2` (61 KB, converted from the official 2.7.1 variable TTF; one file for weights 200–800) and `JetBrainsMono-Medium.woff2` (94 KB, the official 2.304 webfont), with `OFL-PlusJakartaSans.txt` and `OFL-JetBrainsMono.txt`. Neither licence has a Reserved Font Name, so converting the format is allowed.
  - Greek: JetBrains Mono has σ, μ and α but not "ῆ" (U+1FC6, Greek Extended). Plus Jakarta Sans has no Greek. In "σῆμα", the ῆ falls back to the system monospace font (Noto Sans Mono on Lanix's Fedora). Lanix decides what to do about it before Task 7's Welcome page.

- [ ] **Step 10: The shell, `/dev` and stand-ins**

Move the current page to `/dev` unchanged: create `src/pages/dev/DevPage.jsx` with the body of today's `src/App.jsx`. Rename the component to `DevPage`, fix the import paths (`../camera/…`, `../vision/…`), and make the top bar read `Sema · developer page`. It keeps its own `useCamera` and `useHandLandmarker`, so its delegate picker and benchmark work as before.

Create `src/pages/NotBuiltYet.jsx` (later replaced, in the folder reorganization, by one stand-in each in `src/pages/learn/` and `src/pages/practice/`, so page folders don't share files):

```jsx
import MenuBar from '../app/MenuBar.jsx'

// A stand-in for pages that later tasks build (Welcome and setup in Task 7,
// Learn and Practice in Task 9). Deleted in Task 9.
export default function NotBuiltYet({ name }) {
  return (
    <>
      <MenuBar active={name} />
      <main className="page">
        <p>The {name} page isn't built yet.</p>
      </main>
    </>
  )
}
```

Replace `src/App.jsx`:

```jsx
import { useEffect, useState } from 'react'
import CameraProvider from './app/CameraProvider.jsx'
import PhoneNotice from './app/PhoneNotice.jsx'
import { navigate, usePathname } from './app/navigation.js'
import { resolveRoute } from './app/router.js'
import RecordPage from './pages/record/RecordPage.jsx'
import DevPage from './pages/DevPage.jsx'
import NotBuiltYet from './pages/NotBuiltYet.jsx' // later: LearnPage and PracticePage stand-ins

// Pages narrower than this get the phone notice (from the design).
const SMALL_SCREEN = '(max-width: 899px)'

// The app shell: reads the address, picks the page, and wraps every page
// in the shared camera. Changing pages never reloads the page.
export default function App() {
  const pathname = usePathname()
  const route = resolveRoute(pathname)
  // Checked once, when the page opens: a phone doesn't change size, and a
  // computer whose window is made narrow later shouldn't lose its page.
  const [showPhoneNotice, setShowPhoneNotice] = useState(() => window.matchMedia(SMALL_SCREEN).matches)

  // An address with no page of its own is replaced rather than added to the
  // history, so Back doesn't land on it again.
  useEffect(() => {
    if (route.redirect) navigate(route.redirect, { replace: true })
  }, [route.redirect])

  // The notice replaces the app rather than covering it, so nothing behind it
  // (such as the camera) starts.
  if (showPhoneNotice) return <PhoneNotice onContinue={() => setShowPhoneNotice(false)} />

  return <CameraProvider>{route.page && <Page name={route.page} />}</CameraProvider>
}

function Page({ name }) {
  switch (name) {
    case 'record':
      return <RecordPage />
    case 'dev':
      return <DevPage />
    default:
      return <NotBuiltYet name={name} />
  }
}
```

- [ ] **Step 11: The recorder uses the shared camera**

In `src/pages/record/RecordPage.jsx`:

- Replace the `useCamera()` and `useHandLandmarker(isLive, 'GPU')` lines with `const { videoRef, status, error, start, stop, handModel } = useSharedCamera()`.
- Replace `<header className="top-bar">…</header>` with `<MenuBar active="record">`. Put the existing session bar inside it, as children.
- Replace the `.stage` div's `<video>` and `<canvas>` with `<CameraStage canvasRef={canvasRef}>`, keeping `stage-message` and `TakeOverlay` as children.

Leave everything else as is; the new Record layout is Task 8.

- [ ] **Step 12: One HTML file, and the Vercel rewrite**

- Delete `record.html` and `src/recorder/main.jsx`.
- In `vite.config.js`, remove the `build` block and the `fileURLToPath` import.
- Replace `vercel.json` with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Vercel serves real files before applying rewrites, so the model, MediaPipe's files and `letters.json` still load. `vite` and `vite preview` already serve `index.html` for unknown paths.

- [ ] **Step 13: Docs**

- **README:**
  - "Deploy (Vercel)": `vercel.json` rewrites every path to `index.html`, so refreshing any page loads the app, which shows the right page. Real files are served first. Remove the `cleanUrls` and "must exclude `/record`" lines.
  - "Recording sessions": the address is `/record` in development too (no `.html`).
  - Benchmark: it's on `/dev`, under Developer settings.
  - Project structure: remove `record.html` and `src/recorder/main.jsx`; add `src/app/` and `src/pages/`.
- **CLAUDE.md:**
  - Phases: Phase 2 is in progress (the recorder is on `phase-2-1-recorder`); Phase 3.1 is being done early there.
  - Folder structure: add `app/` (router, navigation, shared camera, menu) and `pages/`; remove "don't create `src/pages/` early".
  - Replace the `/record` routing warning with a routing section:
    - routes are in `src/app/router.js`
    - `vercel.json` rewrites every path to `index.html`
    - don't add a second HTML page
  - Camera conventions:
    - the camera and hand model live in `CameraProvider`
    - pages show the camera through `CameraStage`
    - the camera stops when no `CameraStage` is on screen
    - `/dev` keeps its own camera

- [ ] **Step 14: Verify**

Run: `npm test && npm run lint && npm run build && ls dist/*.html`
Expected: all tests pass, no lint warnings, the build passes, and only `dist/index.html` is listed.

Check with the shared harness, on `npx vite --port 5199` and again on `npx vite preview --port 5198` after the build:

- `/record`, `/record/` and `/dev` load their pages directly, including after `Page.reload`.
- `/nope` and `/record.html` end at `/`, and the redirect adds no history entry (a new tab opened on `about:blank` has `history.length === 2` afterwards, not 3).
- Clicking Learn in the menu changes the address without a reload: `window.__marker = 1` set before the click is still there after it. Back returns to `/record`.
- A `click` event dispatched on a menu link with `ctrlKey: true` is not `defaultPrevented`.
- The recorder still works end to end with `hand-only.y4m`: consent, Start camera, "Hand found", one accepted take, Download, and `npm run check-session` OK.
- The camera starts by itself when the session view opens (1 live track, one `getUserMedia` call even in StrictMode); there's none on the consent step.
- Light off: leaving Record through the menu → 0 live tracks; coming back to the session offer → still 0; Stop camera → 0, and it stays off. Click Start camera and then Learn straight away, while it's still starting → 0 live tracks after 3 s.
- Phone notice: at 390 × 844 the notice shows with nothing behind it; Continue on this phone shows the app.
- Headless Chrome only: hide WebGL float textures with `Page.addScriptToEvaluateOnNewDocument`, so MediaPipe falls back to its CPU delegate. Its GPU delegate runs in slow software emulation there, and takes fail with "never arrived".
- `/dev`: Start camera → "Hand found"; Developer settings shows the benchmark.
- No console errors apart from MediaPipe's known noise.

- [ ] **Step 15: Report and stop**

- Run `git status --short` and `git diff --cached --name-only`, and confirm nothing under `docs/design/` is listed.
- Summarize the change, and give Lanix the Chrome checks:
  - open `/record` and refresh
  - use the menu and the Back button
  - Stop the camera by leaving Record, and check the light goes off
  - `/dev` and its benchmark still work
- Proposed commit message: `feat(shell): add app shell and menu (Phase 3.1, done early: the recorder now lives inside the app after setup)`
- Wait for Lanix's go-ahead.

---

### Task 7 (step 3): Welcome and setup

Phase 3.1, and the signing-hand part of 3.2, done early. After this task:

- a new visitor goes Welcome → How Sema works → Signing hand → Camera check → Record
- a returning visitor opens on Record

**Files:**

- **Create:**
  - `src/app/progressStore.js`, `src/app/progressStore.test.js`
  - `src/vision/handChecks.js`, `src/vision/handChecks.test.js`
  - `src/pages/onboarding/SetupBar.jsx`
  - `src/pages/onboarding/WelcomePage.jsx`, `src/pages/onboarding/HowSemaWorksPage.jsx`, `src/pages/onboarding/SigningHandPage.jsx`, `src/pages/onboarding/CameraCheckPage.jsx`
- **Modify:** `src/app/router.js`, `src/app/router.test.js`, `src/App.jsx`, `src/styles.css`, `README.md`, `CLAUDE.md`, `docs/project-plan.md`

**Design source** (in `docs/design/`):

| Page | File |
| --- | --- |
| Welcome | `Welcome.dc.html` |
| How Sema works | `SetupData.dc.html` |
| Signing hand | `Setup.dc.html` |
| Camera check | `SetupCamera.dc.html` (states: working, other hand, blocked, busy, no camera, stopped, no WebGL) |

Before writing each page's JSX, list its states in the ledger: default, selected, disabled Continue, camera starting, checks pending or passed, other hand, each error.

**Interfaces:**

- **Consumes** (from Task 6): `PATHS`, `navigate`, `Link`, `useSharedCamera`, `CameraStage`, `PreviewPill`; plus `useHandDetection` and `toPhysicalHand` (existing).
- **Produces:**
  - `loadProgress() → { version: 1, signingHand: 'left' | 'right' | null, setupDone: boolean }`, `saveProgress(progress) → boolean`, `NEW_VISITOR`, `PROGRESS_VERSION`
  - `resolveRoute(pathname, { signingHand, setupDone }) → { page } | { redirect }`
  - `checkHand(detection, signingHand) → { hand: 'none' | 'match' | 'other', wholeHand: boolean }`, `EDGE_MARGIN`
  - `<SetupBar step>`: `step` is 1, 2 or 3

- [ ] **Step 1: Write the failing settings test**

Create `src/app/progressStore.test.js`:

```js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NEW_VISITOR, PROGRESS_VERSION, loadProgress, saveProgress } from './progressStore.js'

function fakeStorage(initial = {}, { failWrites = false } = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      if (failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      data.set(key, String(value))
    },
  }
}
const saved = (value) => ({ 'sema.progress': JSON.stringify(value) })

afterEach(() => vi.unstubAllGlobals())

describe('progressStore', () => {
  it('starts as a new visitor', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('saves and loads the signing hand and setup', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    const progress = { version: PROGRESS_VERSION, signingHand: 'left', setupDone: true }
    expect(saveProgress(progress)).toBe(true)
    expect(loadProgress()).toEqual(progress)
  })

  it('treats unreadable JSON as a new visitor', () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'sema.progress': '{not json' }))
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('treats another version as a new visitor', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: 99, signingHand: 'left', setupDone: true })))
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('ignores an unknown hand, and setup marked done without a hand', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'both', setupDone: true })))
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('treats blocked storage as a new visitor', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('reports a refused save', () => {
    vi.stubGlobal('localStorage', fakeStorage({}, { failWrites: true }))
    expect(saveProgress({ version: PROGRESS_VERSION, signingHand: 'right', setupDone: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Run it**

Run: `npm test -- src/app/progressStore.test.js`
Expected: FAIL, `Failed to resolve import "./progressStore.js"`.

- [ ] **Step 3: Write the settings store**

Create `src/app/progressStore.js`:

```js
// Sema's settings, kept in this browser's localStorage so they survive a
// reload: the signing hand and whether setup is done. Pages never touch
// localStorage themselves; they go through this module, so per-letter
// progress (3.2) or accounts (Phase 5) can be added in one place.
const KEY = 'sema.progress'
const HANDS = ['left', 'right']

export const PROGRESS_VERSION = 1
export const NEW_VISITOR = { version: PROGRESS_VERSION, signingHand: null, setupDone: false }

// The saved settings, or NEW_VISITOR if there are none, they can't be read,
// or they're from another version. localStorage itself can throw (site data
// blocked), hence the try.
export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.version !== PROGRESS_VERSION) return NEW_VISITOR
    const signingHand = HANDS.includes(saved.signingHand) ? saved.signingHand : null
    // Setup can't be done without a signing hand.
    return { version: PROGRESS_VERSION, signingHand, setupDone: saved.setupDone === true && signingHand !== null }
  } catch {
    return NEW_VISITOR
  }
}

// Saves the settings. Returns false if the browser refused (storage full or
// blocked): the app keeps working, it just won't remember after a reload.
export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run it**

Run: `npm test -- src/app/progressStore.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the failing setup-route tests**

Replace `src/app/router.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { PATHS, resolveRoute } from './router.js'

const newVisitor = { signingHand: null, setupDone: false }
const choseHand = { signingHand: 'left', setupDone: false }
const returning = { signingHand: 'right', setupDone: true }

describe('resolveRoute', () => {
  it('opens every page but Welcome for a returning visitor', () => {
    for (const [page, path] of Object.entries(PATHS)) {
      if (page !== 'welcome') expect(resolveRoute(path, returning)).toEqual({ page })
    }
  })

  it('sends a returning visitor from Welcome to Record', () => {
    expect(resolveRoute('/', returning)).toEqual({ redirect: '/record' })
  })

  it('sends a new visitor from Record, Learn and Practice to Welcome', () => {
    for (const path of ['/record', '/learn', '/practice']) {
      expect(resolveRoute(path, newVisitor)).toEqual({ redirect: '/' })
    }
  })

  it('lets a new visitor open Welcome, the first setup steps and /dev', () => {
    for (const page of ['welcome', 'howSemaWorks', 'signingHand', 'dev']) {
      expect(resolveRoute(PATHS[page], newVisitor)).toEqual({ page })
    }
  })

  it('asks for the signing hand before the camera check', () => {
    expect(resolveRoute('/setup/camera', newVisitor)).toEqual({ redirect: '/setup/hand' })
    expect(resolveRoute('/setup/camera', choseHand)).toEqual({ page: 'cameraCheck' })
  })

  it('ignores a trailing slash', () => {
    expect(resolveRoute('/record/', returning)).toEqual({ page: 'record' })
  })

  it('sends unknown paths to Welcome', () => {
    expect(resolveRoute('/nope', newVisitor)).toEqual({ redirect: '/' })
    expect(resolveRoute('/record.html', returning)).toEqual({ redirect: '/' })
  })
})
```

Run: `npm test -- src/app/router.test.js`
Expected: FAIL. Three tests fail: "sends a returning visitor from Welcome to Record", "sends a new visitor from Record, Learn and Practice to Welcome", and "asks for the signing hand before the camera check".

- [ ] **Step 6: Add the setup rules**

In `src/app/router.js`, replace `resolveRoute` with:

```js
// Pages that need setup finished first.
const NEEDS_SETUP = ['record', 'learn', 'practice']

// Which page a path shows, as { page: 'record' }, or { redirect: '/' } to
// send the person somewhere else. `progress` is the saved settings
// (progressStore): a new visitor goes through setup first, and a returning one
// skips Welcome. A trailing slash is ignored.
export function resolveRoute(pathname, { signingHand, setupDone }) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = Object.keys(PATHS).find((name) => PATHS[name] === path)
  if (!page) return { redirect: PATHS.welcome }
  if (page === 'welcome' && setupDone) return { redirect: PATHS.record }
  if (NEEDS_SETUP.includes(page) && !setupDone) return { redirect: PATHS.welcome }
  if (page === 'cameraCheck' && !signingHand) return { redirect: PATHS.signingHand }
  return { page }
}
```

Run: `npm test -- src/app/router.test.js`
Expected: PASS (7 tests).

- [ ] **Step 7: Write the failing camera-check test**

Create `src/vision/handChecks.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { EDGE_MARGIN, checkHand } from './handChecks.js'

// 21 points spread over the middle of the frame.
const centred = Array.from({ length: 21 }, (_, i) => ({ x: 0.3 + i * 0.01, y: 0.3 + i * 0.01, z: 0 }))
const detection = (label, landmarks = centred) => ({ landmarks, handedness: { categoryName: label, score: 0.97 } })
const moved = (index, point) => centred.map((p, i) => (i === index ? { ...p, ...point } : p))

describe('checkHand', () => {
  it('finds no hand when there is none', () => {
    expect(checkHand({ landmarks: null, handedness: null }, 'right')).toEqual({ hand: 'none', wholeHand: false })
  })

  it('matches the signing hand', () => {
    expect(checkHand(detection('Right'), 'right')).toEqual({ hand: 'match', wholeHand: true })
    expect(checkHand(detection('Left'), 'left')).toEqual({ hand: 'match', wholeHand: true })
  })

  it('notices the other hand', () => {
    expect(checkHand(detection('Left'), 'right').hand).toBe('other')
  })

  it('needs the wrist inside the frame', () => {
    expect(checkHand(detection('Right', moved(0, { y: 1 - EDGE_MARGIN / 2 })), 'right').wholeHand).toBe(false)
  })

  it('needs every fingertip inside the frame', () => {
    expect(checkHand(detection('Right', moved(8, { x: -0.01 })), 'right').wholeHand).toBe(false)
  })
})
```

Run: `npm test -- src/vision/handChecks.test.js`
Expected: FAIL, `Failed to resolve import "./handChecks.js"`.

- [ ] **Step 8: Write the checks**

Create `src/vision/handChecks.js`:

```js
import { toPhysicalHand } from './handedness.js'

// How far inside the frame's edges every hand point must be for "whole hand in
// view", as a fraction of the frame (0.02 = 2%).
export const EDGE_MARGIN = 0.02

// The camera step's two checks for one detection result (the object
// useHandDetection gives its listener).
// hand: 'none' (no hand), 'match' (the signing hand) or 'other' (the other one).
// wholeHand: every point, wrist included, is inside the frame.
export function checkHand(detection, signingHand) {
  if (!detection?.landmarks || !detection.handedness) return { hand: 'none', wholeHand: false }
  const detected = toPhysicalHand(detection.handedness.categoryName).toLowerCase()
  const inside = (value) => value >= EDGE_MARGIN && value <= 1 - EDGE_MARGIN
  return {
    hand: detected === signingHand ? 'match' : 'other',
    wholeHand: detection.landmarks.every((point) => inside(point.x) && inside(point.y)),
  }
}
```

Run: `npm test -- src/vision/handChecks.test.js`
Expected: PASS (5 tests).

- [ ] **Step 9: The shell keeps the settings**

In `src/App.jsx`:

```jsx
  const [progress, setProgress] = useState(loadProgress)
  // Settings changes are saved straight away. If the browser refuses, the app
  // carries on; the settings just won't survive a reload.
  function updateProgress(changes) {
    const next = { ...progress, ...changes }
    setProgress(next)
    saveProgress(next)
  }
  const route = resolveRoute(pathname, progress)
```

Then add these pages to the `Page` switch, passing what each needs:

- `welcome` → `<WelcomePage />`
- `howSemaWorks` → `<HowSemaWorksPage />`
- `signingHand` → `<SigningHandPage signingHand onChoose={(hand) => updateProgress({ signingHand: hand })} />`
- `cameraCheck` → `<CameraCheckPage signingHand onSwitchHand onDone />`
  - `onDone` calls `updateProgress({ setupDone: true })`, then `navigate(PATHS.record)`
  - `onSwitchHand` exists only if the other-hand state offers a switch
- `record` → `<RecordPage signingHand={progress.signingHand} />`

The setting and the navigation happen in one click, so React applies them in one render. The router never sees one without the other.

- [ ] **Step 10: The pages**

Build each from its `.dc.html`, in order, checking each in the browser before the next.

- **`SetupBar({ step })`:** "Sema" plus `<PreviewPill />` on the left; "Step N of 3" and three segments on the right. The segments are decoration for the text, so give them `aria-hidden`.
- **`WelcomePage`:**
  - **Left panel:** the hand illustration, "σῆμα · a sign" and the tagline. If the `.dc.html` contains the illustration as SVG, use that; otherwise ask Lanix rather than draw one.
  - **Right panel:** name, pill, descriptor, heading, the "No account…" line, the "still being built" note, and **Get started** (a `<Link>` to `PATHS.howSemaWorks`, styled as the primary button).
  - **"How Sema handles your camera":** a `<details>` with the design's text.
- **`HowSemaWorksPage`** (Step 1 of 3): the four points and the footnote.
  - **Back** → `PATHS.welcome`; **Continue** → `PATHS.signingHand`.
  - The second point's text is "Hand detection runs in your browser. Your video is never uploaded or recorded." (decided 2026-10-15; the `.dc.html` already says so).
- **`SigningHandPage`** (Step 2 of 3): Left and Right are two toggle buttons with `aria-pressed`, in a `role="group"`, as in the design. A new visitor starts on Right (the design's default).
  - **Starting choice:** the saved hand. What a new visitor starts with comes from the `.dc.html` states.
  - **Continue:** calls `onChoose(hand)`, then `navigate(PATHS.cameraCheck)`. It's disabled until a hand is chosen, if the design says so.
  - **Back:** → `PATHS.howSemaWorks`.
- **`CameraCheckPage`** (Step 3 of 3):
  - **Camera:** `useSharedCamera()` provides it; `<CameraStage>` shows the view; `useHandDetection` runs with a `listenerRef` whose function calls `checkHand(detection, signingHand)`. Only call `setState` when the result changes, so it doesn't re-render 30 times a second.
  - **Steady checks:** keep the last result until `useHandDetection` reports the hand lost (its 300 ms rule).
  - **Status strip:** the two checks, the signing hand found and the whole hand in view, with the design's wording; it says "Right hand" or "Left hand" from the setting.
  - **Camera picker:** the provider's `cameras`, `deviceId` and `switchCamera`.
  - **Starting the camera:** it starts by itself when the page opens (`CameraStage` + `CameraProvider`, Task 6). After an error, offer a button to try again.
  - **States to cover**, with text from the `.dc.html`, or else the existing messages:
    - starting
    - checks pending
    - checks passed
    - the other hand
    - camera blocked, busy, not found, insecure page, or unplugged (`cameraMessages.js`)
    - hand tracking failed, including no WebGL (`visionMessages.js`)
  - **Continue:** `onDone()`. As designed, it's open unless the camera or hand tracking failed; the checks are guidance ("When both checks turn blue, you're ready").
  - **Back:** → `PATHS.signingHand`.

- [ ] **Step 11: Docs**

- **README:** the first-run flow (Welcome → How Sema works → Signing hand → Camera check → Record). Returning visitors open on Record. Clearing site data starts setup again.
- **CLAUDE.md:**
  - settings live in `src/app/progressStore.js`; pages never touch `localStorage`
  - the setup redirects live in `router.js`
  - the camera check's rules live in `src/vision/handChecks.js`
- **`docs/project-plan.md`:** set the 3.1 row's status. Leave the 3.2 hand menu, Reset progress and per-letter progress as not started.

- [ ] **Step 12: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all pass, no warnings.

Check with the shared harness (fresh Chrome profile, `hand-only.y4m`):

- `/` shows Welcome. Get started → `/setup/how-it-works` ("Step 1 of 3") → Continue → `/setup/hand` ("Step 2 of 3").
- Choosing a hand and pressing Continue goes to `/setup/camera` ("Step 3 of 3"). Each step's Back returns to the one before, and the hand choice is kept.
- The camera check with the hand that MediaPipe detects in the video: both checks pass. With the other hand chosen: the other-hand state shows.
- Continue → `/record`, and `localStorage['sema.progress']` is `{"version":1,"signingHand":…,"setupDone":true}`.
- Reload at `/` → `/record`. With a fresh profile: `/record` → `/`, and `/setup/camera` → `/setup/hand`.
- **Camera blocked:** a Chrome started without `--use-fake-ui-for-media-stream` plus `Browser.setPermission({ permission: { name: 'videoCapture' }, setting: 'denied' })` shows the blocked message in the camera area.
- **No WebGL:** `Page.addScriptToEvaluateOnNewDocument` wrapping `HTMLCanvasElement.prototype.getContext` to return `null` for `'webgl2'` shows the WebGL message.
- Back from the camera check → 0 live tracks.

- [ ] **Step 13: Report and stop**

- Run `git status --short` and `git diff --cached --name-only`, and confirm nothing under `docs/design/` is listed.
- Summarize the change and give Lanix the Chrome checks:
  - the setup flow with a real left and right hand
  - the other-hand state
  - a blocked camera (site settings)
  - reload on each step
  - a returning visit
- Proposed commit message: `feat(setup): add Welcome and the setup steps (Phase 3.1–3.2, done early: setup now leads into the recorder)`
- Wait.


**Built (2026-10-15), with these rulings:**

- **Extra files:** `src/components/icons.jsx` (icons shared by several pages); `cameraErrorKind` in `cameraMessages.js` with `cameraMessages.test.js`. `useCamera` returns `errorKind` and `useHandLandmarker` returns `errorName`, so the camera check can show the design's text per problem. The camera check's titles and texts live in `cameraMessages.js` and `visionMessages.js`.
- **Greek subset (Lanix's decision):** `public/fonts/NotoSansMono-Greek-Medium.woff2` (3,180 bytes, Noto Sans Mono 2.014 Medium, only σ ῆ μ α) with `OFL-NotoSansMono.txt`. It's first in `--font-mono`, with a `unicode-range`, so it's only downloaded where those letters appear.
- **"Sign with my left hand instead"** switches the setting on the spot and stays on the camera check. The design links back to step 2, but the button's words promise the switch itself.
- **Wording the design doesn't show (for Lanix to confirm):** the hand check before any hand appears ("Waiting for your right hand"); the whole-hand check once it passes ("Whole hand in view"); the title for camera errors the design doesn't list, such as an insecure page ("The camera didn't start", followed by the existing message); and the title for hand-tracking failures other than no WebGL ("Hand tracking couldn't start", followed by the existing message).
- **Camera picker:** before permission it shows the design's "Default webcam"; a long camera name is cut off with "…" instead of widening the column.
- **Checks:** 44 headless checks pass on `vite` and `vite preview`. The fake camera's photo shows the whole hand, so the "wrist out of frame" warning is covered by `handChecks.test.js` but not in the browser.
---

### Task 8 (step 4): Record page inside the shell

Phase 3.1, done early. This is the recorder's new layout from the design. The take logic, session file and storage stay as they are.

**Files:**

- **Already moved:** `src/recorder/RecorderApp.jsx` → `src/pages/record/RecordPage.jsx` (`git mv` in the reorganization, so the history follows)
- **Create:** `src/pages/record/HandToggle.jsx`, `src/pages/record/TakeResult.jsx`
- **Modify:**
  - page parts: `src/pages/record/RecordingGrid.jsx`, `TakePanel.jsx`, `TakeOverlay.jsx`, `ConsentForm.jsx`
  - logic: `src/recorder/useRecording.js`, `takeRules.js`, `takeRules.test.js`
  - shell and styles: `src/App.jsx`, `src/styles.css`
  - docs: `README.md`, `docs/data-format.md` (only if the reason wording changes)

**Design source:** `docs/design/Record.dc.html` (states: consent, recording, finished).

**Ask Lanix before building** (the design and the approved spec disagree):

- **Consent: decided (Lanix, 2026-10-16).** Training only, as in commit `b7c39ee`; the design's "published in a public dataset" box is out of scope. The page uses the design's consent wording otherwise.
- File name: decided (2026-10-15). Keep the spec's `sema-asl-p03-2026-11-02a.json`; the design's shorter name is outdated.

- **States:** list them in the ledger first: consent, saved session offered, camera off, countdown, hold, saving, accepted, not kept, discarded, storage failed, letters failed to load, all done.
- **Consent page:** if the design has no consent or saved-session state, ask Lanix whether to keep the current forms restyled with the new tokens.

**Interfaces:**

- **Consumes:**
  - `useSharedCamera`, `CameraStage`, `MenuBar` (Task 6)
  - `signingHand` from `App` (Task 7)
  - `useRecording`, `sessionFile`, `sessionStore`, `letters` (existing)
- **Produces:**
  - `RecordPage({ signingHand })`
  - `HandToggle({ hand, onChange, disabled })`
  - `RecordingGrid({ training, pilot, session, hand, selected, onSelect, disabled })`
  - `captureProgress(elapsedMs) → number between 0 and 1`
  - `useRecording` returns `kept` (frames with a hand so far) during capture

- [ ] **Step 1: Write the failing capture-progress test**

Add to `src/recorder/takeRules.test.js`:

```js
describe('captureProgress', () => {
  it('is 0 before capture, 1 after, and in between during it', () => {
    expect(captureProgress(0)).toBe(0)
    expect(captureProgress(COUNTDOWN_MS + SETTLE_MS)).toBe(0)
    expect(captureProgress(COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS / 2)).toBe(0.5)
    expect(captureProgress(COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS * 2)).toBe(1)
  })
})
```

Add `captureProgress` to that file's import from `./takeRules.js`, and import `COUNTDOWN_MS`, `SETTLE_MS` and `CAPTURE_MS` if they aren't imported already.

Run: `npm test -- src/recorder/takeRules.test.js`
Expected: FAIL, `captureProgress is not a function`.

- [ ] **Step 2: Write it**

Add to `src/recorder/takeRules.js`:

```js
// How far through capture a take is, from 0 to 1, for the progress bar under
// the video. 0 during the countdown and settle; 1 once capture is over.
export function captureProgress(elapsed) {
  const intoCapture = elapsed - COUNTDOWN_MS - SETTLE_MS
  return Math.min(1, Math.max(0, intoCapture / CAPTURE_MS))
}
```

Run: `npm test -- src/recorder/takeRules.test.js`
Expected: PASS.

- [ ] **Step 3: Live counts from the take**

In `useRecording.js`'s `tick`, add `kept: take.frames.length` and `progress: captureProgress(elapsed)` to the `setState` call. The overlay's "18 / 30 frames" uses `kept` and `EXPECTED_SAMPLES`.

The `.dc.html` decides whether the number is frames with a hand (`kept`) or matched frames (`kept` minus the other hand). If it's matched, also count `mismatched` per frame in `onDetection` using `frameFromDetection`'s `detected`. Record the choice as a ledger ruling.

- [ ] **Step 4: Wording from the design**

Compare the recorder's texts with the `.dc.html`:

- the position hints (`POSITION_HINTS`: today "Closer to the camera"; the PNG says "a little closer")
- the rejection reason (today "4 had the other hand detected"; the PNG says "4 had the other hand")
- "Take N of 3"

Where the design's text is different:

- **Position hints:** change the constant and the tests that quote it.
- **Rejection reason:** it's also saved in the session file's `reason`. Change `judgeTake` and its test, plus the example in `docs/data-format.md` and in the spec's §5. Nothing reads `reason` back (`check-session` doesn't), so the format version stays 1.

- [ ] **Step 5: The Record page**

The page is already at `src/pages/record/RecordPage.jsx` (moved and renamed in the folder reorganization). Build the layout from the `.dc.html`:

- **Menu bar, right side:** the session (`p03 · 2026-11-02a`) and its save state ("Saved in this browser · 14 takes"). When saving failed, show the warning instead.
- **Stage** (`<CameraStage>`):
  - the countdown and "Hold…" (`TakeOverlay`)
  - "18 / 30 frames"
  - the capture progress bar (`recording.progress`)
  - the camera-off and starting messages
- **Under the stage:** "Only hand points are saved. No video."
- **Side column:**
  - **`HandToggle`** (Left / Right, as a radio group). It starts on `signingHand`. Switching it doesn't change the setting: the recorder collects both hands.
  - **The letter card** (`TakePanel`).
  - **`TakeResult`**: the last take's result, saved or not kept with its reason. This moves off the video.
  - **Record take** and **Undo last take**.
- **Bottom:**
  - `RecordingGrid` for the chosen hand: "Right hand · takes kept", one tile per class (training letters, None, then pilot letters marked as pilot)
  - the legend
  - the pilot note
  - **Finish and download**
- **Choosing a tile:** sets `cell = { letter, hand }`. Switching hands keeps the letter. Which tile starts selected, and whether the page moves on after the third kept take, come from the design's states.
- **Kept as they are:** the consent step first, the saved-session offer, Delete, Start a new session, the "Leave site?" warning, and Delete/Download disabled mid-take. The `.dc.html` places them.

- [ ] **Step 6: Docs**

- **README "Recording sessions":**
  - People open Sema, finish setup, and land on Record.
  - In person: Lanix sets up the laptop once; each participant consents on Record.
  - Remotely: send the site's address.
  - The hand toggle starts on the signing hand.
- **`docs/data-format.md`:** only if step 4 changed the reason wording.

- [ ] **Step 7: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all pass, no warnings.

Check with the shared harness, setup done first through `localStorage` (`sema.progress` = `{"version":1,"signingHand":"right","setupDone":true}`):

- `/record` shows consent. With a code and the box ticked, the session view opens with the hand toggle on Right.
- **`hand-only.y4m`:** on the hand MediaPipe detects, a take is accepted and the tile shows 1/3. On the other hand, the take is not kept, with the other-hand reason in the result card.
- **`hand-mixed.y4m`:** the take is not kept, with "had no hand".
- During capture, the overlay shows "N / 30 frames" and the bar grows.
- Undo removes the last take. Finish and download saves the file, and `npm run check-session` on it prints OK.
- Clicking Learn mid-take, then Record: the take is not in the file, the session is offered back, and on Learn there are 0 live tracks.
- Reload → the session is offered back.

- [ ] **Step 8: Report and stop**

- Run `git status --short` and `git diff --cached --name-only`, and confirm nothing under `docs/design/` is listed.
- Summarize the change and give Lanix the Chrome checks:
  - a few real takes with each hand
  - the result card
  - the "Leave site?" warning
  - Finish and download, plus the checker
- Proposed commit message: `feat(record): move the recorder into the app shell (Phase 3.1, done early: Record is the main page after setup)`
- Wait.


**Built (2026-10-16), when Lanix asked for the Record page to match the website:**

- **Consent step:** the design's wording ("Help train Sema", "What gets saved") with only the training box. The design's optional publishing box is left out: publishing is out of scope (Lanix, 2026-10-16), so the session file keeps `consent: { train, date }`.
- **Wording from the design:** position hints ("centre of the frame", "a little closer", "off to one side"), and "4 had the other hand" in the rejection reason (the data format and spec follow). The format stays 1.
- **Live counts:** "N / 30 frames" counts frames with a hand so far; the bar shows capture time (`captureProgress`, tested).
- **Selected letter:** until a tile is picked, it's the first letter that still needs takes for the chosen hand. Starting a take pins it, so its result stays in view.
- **Not in the design, added (for Lanix to confirm):** a "Last take kept" note (ice tint); the saved-session offer ("Continue your session?") in the design's style; "Keep recording" on the finished step; a note under left-hand instructions ("Described for the right hand; mirror it for your left."); a dark gradient behind the text over the video, so it stays readable on a bright picture. There's no Stop camera and no Delete during recording: the design has neither (Delete is on the finished step and the saved-session offer).
- **Shared:** `src/components/StageProblem.jsx` (camera and hand-tracking problems over the video, also used by the camera check) and `CheckIcon`.
- **Checked:** 92 unit tests, lint and build; a headless Chrome run through consent, a kept and a not-kept take, Finish and download (the file passes `check-session`), with no console errors. The Task 6 and 7 check scripts were lost with the session's temp folder and weren't re-run.
---

### Task 9 (step 5): Learn and Practice placeholders

Phase 3, done early. The menu's Learn and Practice open real pages that say they're coming. The lessons and practice themselves are 3.3–3.4, on `phase-3-preview`.

**Files:**

- **Replace the stand-ins:** `src/pages/learn/LearnPage.jsx`, `src/pages/practice/PracticePage.jsx`
- **Modify:** `src/App.jsx`, `src/styles.css`, `docs/project-plan.md`, `README.md`

**Design source:** none: `Learn.dc.html` and `Practice.dc.html` are for `phase-3-preview`. Lanix gave the copy (2026-10-15). Both use the same shell and menu as the other pages, with the content centred:

- **Learn:** heading "Learn is on its way"; text "Lessons need letter recognition, and your recordings are helping build it. For now, the most useful thing you can do is record a few letters."; button "Go to Record".
- **Practice:** heading "Practice is on its way"; text "Practice mixes letters you've learned, so it comes after Learn."; button "Go to Record".

**Interfaces:**

- **Consumes:** `MenuBar`, `Link`, `PATHS` (Task 6).
- **Produces:** `LearnPage()`, `PracticePage()`.

- [ ] **Step 1: The pages**

Each renders `<MenuBar active="learn">` (or `"practice"`) and the placeholder from Lanix's copy. Neither uses the camera, so opening one turns the camera off (no `CameraStage`). `App.jsx` already routes to both.

- [ ] **Step 2: Docs**

- **`docs/project-plan.md`:** Learn and Practice are placeholders until 3.3–3.4 on `phase-3-preview`.
- **README:** a line on what the menu holds for now.

- [ ] **Step 3: Verify**

Run: `npm test && npm run lint && npm run build && grep -rn "isn't built yet" src || echo none`
Expected: all pass, and the grep prints `none`.

Check with the shared harness:

- Record → Learn → Practice through the menu: each sets `aria-current="page"` on its own link only.
- Refreshing `/learn` and `/practice` keeps the page.
- With the camera on in Record, opening Learn leaves 0 live tracks.

- [ ] **Step 4: Report and stop**

- Run `git status --short` and `git diff --cached --name-only`, and confirm nothing under `docs/design/` is listed.
- Proposed commit message: `feat(preview): add Learn and Practice placeholders (Phase 3, done early: the menu links to them before 3.3–3.4)`
- Wait.


**Built (2026-10-16), from the existing pages (Lanix no longer uses `docs/design/`):**

- **`src/components/PlaceholderPage.jsx`:** the shared layout. It has the menu, then a centred column with the page's art, Lanix's heading and text, and **Go to Record**.
- **Learn:** the art is the tracked hand from Welcome with dashed bones: Sema finds the points but can't name the letter yet. The drawing moved from Welcome into `src/components/HandPoints.jsx`, with a `dashed` option.
- **Practice:** the art is a staggered row of the training letters from `letters.json`, in mixed order (`mixLetters`, tested), because practice mixes letters.
- **Checked:** 94 unit tests, lint and build. Screenshots at 1440×900 and 1024×700 look right. The menu marks the right page, **Go to Record** opens `/record`, Welcome's drawing is unchanged, and there are no console errors.
---

### Task 10: Whole-branch check and review

**Files:** none in the repo, unless the review finds something.

- [ ] **Step 1: The whole journey on a production build**

Run `npm run build && npx vite preview --port 5198`, then use the shared harness with a fresh profile and `hand-only.y4m`:

- `/` → Welcome → the three setup steps → Record → consent → one accepted take per hand that MediaPipe detects in the video → Finish and download → `npm run check-session` OK.
- Reload → Record, with the session offered back.
- Deep links `/setup/hand`, `/record`, `/learn`, `/practice` and `/dev` each load their page after a reload.
- `/nope` → `/` → `/record` (returning visitor).
- No console errors apart from MediaPipe's known noise.

- [ ] **Step 2: Final review**

Follow superpowers:executing-plans' final review:

- **Package:** the whole branch from `cee03b1` (where it left `main`).
- **Reviewer:** a fresh reviewer on the most capable model, given this plan's Review Focus and the ledger's rulings.
- **Fixes:** Critical and Important findings get one fix pass, each fix test-first. Minor findings go to the ledger.

- [ ] **Step 3: Hand over**

Give Lanix the Chrome checklist in one place:

- the setup flow with real hands
- the other-hand state
- a blocked camera
- Record with real takes on both hands
- the "Leave site?" warning
- the downloaded file and the checker
- the menu, Back and Forward, and refresh on every page
- the camera light going off when leaving a camera page
- `/dev` and its benchmark

Then use superpowers:finishing-a-development-branch. Merging and pushing happen only when Lanix says so.
