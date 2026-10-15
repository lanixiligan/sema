# Recorder (milestone 2.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the recorder page that collects labelled hand-landmark sessions for training (milestone 2.1, build part M1), plus the session checker.

**Architecture:** A second Vite page (`record.html`, `/record` on Vercel) with its own React root in `src/recorder/`, reusing the camera and MediaPipe hooks from `src/camera/` and `src/vision/`. Pure logic (normalization, take rules, session file, checker) lives in small modules with Vitest tests; React components and hooks stay thin on top. Sessions autosave to `localStorage` and download as one JSON file.

**Tech Stack:** React 19, Vite 8 (Rolldown), plain JavaScript, `@mediapipe/tasks-vision` 1.1.1, Vitest 5 (dev only), Node 22.

**Spec:** [docs/recorder-design.md](recorder-design.md). Read it before starting; this plan implements it.

## Before you start

- **Prerequisites (from the spec):** do not start until Lanix has filled in the training letters in `public/languages/asl/letters.json` (Task 6 creates the file with only the pilot-only letters if it doesn't exist) and has approved this plan.
- **Git:** do **not** commit or push unless Lanix explicitly asks. Each task ends with a "Report" step instead: show `git status --short`, summarize the change, and suggest a commit message. Work on the current branch unless Lanix says otherwise.
- **Explain as you go** (CLAUDE.md): Lanix is learning; say what each piece does and why, especially browser and React concepts.

## Global Constraints

- React + Vite + plain JavaScript (`.js` / `.jsx`); no TypeScript, no UI or CSS framework.
- Only one new dependency: `vitest` as a dev dependency (approved). Anything else: ask Lanix first.
- Serve every asset from the app itself, never from a CDN.
- React `StrictMode` stays on; code must survive its double mount in development.
- `npm run lint` (oxlint) must report no warnings; `npm run build` must pass.
- Colors only from the CSS variables in `src/styles.css`; never Bright Sky (`--bright-sky`) as text, borders or focus rings on light surfaces.
- Format version `1`, normalization version `1`; bump `normalization` whenever normalization changes.
- Sampling constants: `COUNTDOWN_MS = 3000`, `SETTLE_MS = 500`, `CAPTURE_MS = 3000`, `SAMPLE_INTERVAL_MS = 100`, `MIN_MATCHED_SHARE = 0.8`; a take passes when `kept − mismatched ≥ 24`.
- Recording ID: `<person>-<session>-<letter>-<hand>-<take>`, e.g. `p03-2026-11-02a-W-left-2`; letters `"A"`–`"Z"` or `"none"`; hands `"left"` / `"right"`.
- The left-hand flip uses the **detected hand, for now** (an open decision in the plan); word comments and docs that way.
- `data/raw/` is gitignored and private; never commit recorded sessions.
- `record.html` carries `<meta name="robots" content="noindex">`.
- Consent text: exactly the wording in the spec's section 7.

## Review Focus

Inputs and conditions the spec implies but doesn't spell out, most likely to bite first. Each has a test in the task that owns the code.

1. **A long session outgrows `localStorage`** (a full pilot is ~84 takes, about 3 million characters): saving must fail softly, show the warning, and keep recording. Test in Task 3 (`saveSession` returns `false` when `setItem` throws).
2. **A corrupt or older session in `localStorage`** (invalid JSON, another format version): opening the page must not crash; the saved session is simply not offered. Test in Task 3 (`loadSession` returns `null`).
3. **A slow camera** (auto-exposure at 20 fps, or worse at 7 fps): 20 fps must still give 30 samples; at 7 fps the take must be rejected with a reason that says frames never arrived, not a confusing "21 of 21". Tests in Task 2 (sampler at 20 and 7 fps; reason text).
4. **Undo, then record again**: take numbers are reused only after their entry is removed, so recording IDs stay unique and the checker passes. Test in Task 3.
5. **A participant code typed as `P03` or with spaces**: accepted as `p03`; `p3` or `x03` rejected. Test in Task 3 (`normalizePersonCode` + `isValidPersonCode`).

## File map

| File | Status | Responsibility |
| --- | --- | --- |
| `package.json` | modify | `vitest` dev dependency; scripts `test`, `check-session` |
| `src/vision/normalizeHand.js` (+ `.test.js`) | create | Normalization (spec §3) |
| `src/camera/frameCounter.js` (+ `.test.js`) | create | Read `presentedFrames`; fps between two readings |
| `src/recorder/takeRules.js` (+ `.test.js`) | create | Take timing, sampler, frame conversion, counts, pass/reject |
| `src/recorder/sessionFile.js` (+ `.test.js`) | create | Build the session object (pure) |
| `src/recorder/sessionStore.js` (+ `.test.js`) | create | `localStorage` autosave/restore, used session IDs, download |
| `scripts/check-session.js` (+ `.test.js`) | create | Session checker (spec §8) |
| `src/vision/useHandDetection.js` | modify | Optional `listenerRef`; optional `measurementsRef` |
| `src/vision/browserName.js` | create | `browserName()`, moved from `useBenchmark.js` |
| `src/vision/useBenchmark.js` | modify | Import `browserName` |
| `record.html` | create | Second page, `noindex` |
| `vite.config.js` | modify | Build both pages |
| `vercel.json` | create | `cleanUrls` so the page is at `/record` |
| `public/languages/asl/letters.json` | create if missing | Letter list (pilot-only letters to start) |
| `src/recorder/letters.js` (+ `.test.js`) | create | Split letters into training and pilot; load the file |
| `src/recorder/main.jsx` | create | React root |
| `src/recorder/RecorderApp.jsx` | create | Page: consent → session, camera, grid, take, export |
| `src/recorder/ConsentForm.jsx` | create | Code, session ID, two consent checkboxes |
| `src/recorder/RecordingGrid.jsx` | create | Letter × hand grid |
| `src/recorder/TakePanel.jsx` | create | Instructions, Record, take status |
| `src/recorder/useRecording.js` | create | One take as a state machine |
| `src/styles.css` | modify | Recorder styles |
| `docs/data-format.md` | create | Format reference |
| `README.md`, `CLAUDE.md` | modify | Recording sessions; conventions; `/record` routing warning |
| `.gitignore` | verify | `data/raw/` present |

---

### Task 1: Vitest and hand normalization

**Files:**
- Modify: `package.json`
- Create: `src/vision/normalizeHand.js`
- Test: `src/vision/normalizeHand.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizeHand(raw, { width, height, hand }) → number[63] | null` where `raw` is 21 `{ x, y, z }` objects (MediaPipe `NormalizedLandmark`) and `hand` is `'left'` or `'right'`; `NORMALIZATION_VERSION = 1`.

- [ ] **Step 1: Install Vitest and add the test script**

Run: `npm install --save-dev vitest@^5.0.4`
Then in `package.json` `"scripts"`, add `"test": "vitest run"`.
Expected: `npm ls vitest` shows `vitest@5.x`; no peer-dependency errors (Vitest 5 supports Vite `^8.0.0`).

- [ ] **Step 2: Write the failing tests**

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

- [ ] **Step 3: Run the tests to see them fail**

Run: `npm test -- src/vision/normalizeHand.test.js`
Expected: FAIL, "Failed to resolve import ./normalizeHand.js" (or similar: the module doesn't exist).

- [ ] **Step 4: Implement**

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

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm test -- src/vision/normalizeHand.test.js`
Expected: PASS, 10 tests.

- [ ] **Step 6: Report**

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

- [ ] **Step 1: Write the failing tests**

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

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test -- src/camera/frameCounter.test.js src/recorder/takeRules.test.js`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

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

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test -- src/camera/frameCounter.test.js src/recorder/takeRules.test.js`
Expected: PASS (2 + 15 tests).

- [ ] **Step 5: Report**

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

- [ ] **Step 1: Write the failing tests**

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

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test -- src/recorder/sessionFile.test.js src/recorder/sessionStore.test.js`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

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

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test -- src/recorder/sessionFile.test.js src/recorder/sessionStore.test.js`
Expected: PASS (13 + 7 tests).

- [ ] **Step 5: Report**

`npm run lint`, `git status --short`. Explain why take numbers count attempts and why storage fails softly. Suggested commit message: `Add the recorder's session file and browser storage`.

---

### Task 4: Session checker

**Files:**
- Create: `scripts/check-session.js`, `scripts/check-session.test.js`
- Modify: `package.json` (script `check-session`)

**Interfaces:**
- Consumes: `newSession`, `addTake` (Task 3) in tests only.
- Produces: `KNOWN_FORMATS`, `KNOWN_NORMALIZATIONS`, `checkSession(file, otherRecordingIds = new Set()) → { errors: string[], table: Array<{ letter, hand, accepted, rejected }> }`, `formatTable(table) → string`; CLI `npm run check-session -- <file>`.

- [ ] **Step 1: Write the failing tests**

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

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test -- scripts/check-session.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

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

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test -- scripts/check-session.test.js`
Expected: PASS, 7 tests.
Then run: `npm run check-session` with no file.
Expected: exits with the usage message (code 2).

- [ ] **Step 5: Report**

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

- [ ] **Step 1: Make both refs optional and call the listener**

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

- [ ] **Step 2: Move browserName**

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

- [ ] **Step 3: Verify nothing changed for the main page**

Run: `npm run lint` (no warnings), `npm test` (all pass), `npm run build` (passes).
Then run `npm run dev`, open `http://localhost:5173` in Chrome, start the camera, check that the skeleton, readouts and Developer settings → Run benchmark still work.

- [ ] **Step 4: Report**

`git status --short`. Suggested commit message: `Let other tools listen to hand detection; share browserName`.

---

### Task 6: Recorder page shell, consent and session

**Files:**
- Create: `record.html`, `vercel.json`, `src/recorder/main.jsx`, `src/recorder/RecorderApp.jsx`, `src/recorder/ConsentForm.jsx`, `src/recorder/letters.js`, `src/recorder/letters.test.js`
- Create if missing: `public/languages/asl/letters.json`
- Modify: `vite.config.js`, `src/styles.css`
- Verify: `.gitignore` contains `data/raw/`

**Interfaces:**
- Consumes: Task 3 (`newSession`, `nextSessionId`, `normalizePersonCode`, `isValidPersonCode`, storage functions); `browserName` (Task 5); `useCamera`, `useHandLandmarker`, `useHandDetection`, `LOADING_HAND_MODEL` (existing).
- Produces: `splitLetters(entries) → { training: string[], pilot: string[] }`, `classLabel(letter) → string`, `useLetters() → { status: 'loading' | 'ready' | 'error', training, pilot }`; `ConsentForm({ today, onStart })` calling `onStart({ person, sessionId, consent: { train, publish } })`; `RecorderApp` (Task 7 extends it).

- [ ] **Step 1: Write the failing letters test**

Create `src/recorder/letters.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { classLabel, splitLetters } from './letters.js'

describe('splitLetters', () => {
  it('separates training letters from pilot-only letters', () => {
    expect(
      splitLetters([{ letter: 'B' }, { letter: 'A', pilotOnly: true }, { letter: 'L' }, { letter: 'S', pilotOnly: true }]),
    ).toEqual({ training: ['B', 'L'], pilot: ['A', 'S'] })
  })

  it('ignores entries that are not a single capital letter, and duplicates', () => {
    expect(splitLetters([{ letter: 'b' }, { letter: 'AB' }, {}, { letter: 'C' }, { letter: 'C' }])).toEqual({
      training: ['C'],
      pilot: [],
    })
  })
})

describe('classLabel', () => {
  it('names the no-letter class', () => {
    expect(classLabel('none')).toBe('No letter')
    expect(classLabel('W')).toBe('W')
  })
})
```

Run: `npm test -- src/recorder/letters.test.js`
Expected: FAIL, module not found.

- [ ] **Step 2: Implement letters.js**

Create `src/recorder/letters.js`:

```js
import { useEffect, useState } from 'react'

// The letter list lives in public/languages/asl/letters.json, so changing
// which letters are recorded doesn't need a code change. Entries marked
// pilotOnly are recorded in the pilot but left out of 2.2's first training set.
export function splitLetters(entries) {
  const training = []
  const pilot = []
  for (const entry of entries ?? []) {
    const letter = entry?.letter
    if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) continue
    if (training.includes(letter) || pilot.includes(letter)) continue
    ;(entry.pilotOnly ? pilot : training).push(letter)
  }
  return { training, pilot }
}

export function classLabel(letter) {
  return letter === 'none' ? 'No letter' : letter
}

export function useLetters() {
  const [state, setState] = useState({ status: 'loading', training: [], pilot: [] })

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}languages/asl/letters.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`letters.json: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', ...splitLetters(data.letters) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', training: [], pilot: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
```

Run: `npm test -- src/recorder/letters.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 3: Letter list, second page, build config**

If `public/languages/asl/letters.json` does not exist, create it (Lanix adds the training letters as `{ "letter": "B" }` entries):

```json
{
  "language": "asl",
  "letters": [
    { "letter": "A", "pilotOnly": true },
    { "letter": "S", "pilotOnly": true },
    { "letter": "M", "pilotOnly": true },
    { "letter": "N", "pilotOnly": true },
    { "letter": "T", "pilotOnly": true }
  ]
}
```

Create `record.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Sema recorder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/recorder/main.jsx"></script>
  </body>
</html>
```

Create `vercel.json`:

```json
{
  "cleanUrls": true
}
```

Replace `vite.config.js` with:

```js
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // GitHub Codespaces serves forwarded ports from https://<name>-5173.app.github.dev.
    // Vite blocks unknown hostnames by default (protection against DNS rebinding),
    // so allow that domain and its subdomains. Not needed for localhost.
    allowedHosts: ['.app.github.dev'],
  },
  build: {
    // Two pages: the app and the recorder (record.html, /record on Vercel).
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        record: fileURLToPath(new URL('./record.html', import.meta.url)),
      },
    },
  },
})
```

Run: `git check-ignore -v data/raw/test.json`
Expected: a line naming `.gitignore` and `data/raw/`. If nothing prints, add `data/raw/` to `.gitignore` with the comment `# Recorded landmark data: private, never committed (see README, "Recorded data")`.

- [ ] **Step 4: React root and consent form**

Create `src/recorder/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import RecorderApp from './RecorderApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RecorderApp />
  </StrictMode>,
)
```

Create `src/recorder/ConsentForm.jsx` (consent wording from the spec's section 7):

```jsx
import { useState } from 'react'
import { isValidPersonCode, nextSessionId, normalizePersonCode } from './sessionFile.js'
import { loadUsedSessionIds } from './sessionStore.js'

export default function ConsentForm({ today, onStart }) {
  const [person, setPerson] = useState('')
  const [sessionId, setSessionId] = useState(() => nextSessionId(today, loadUsedSessionIds()))
  const [train, setTrain] = useState(false)
  const [publish, setPublish] = useState(false)

  const code = normalizePersonCode(person)
  const codeOk = isValidPersonCode(code)
  const canStart = codeOk && sessionId.trim() !== '' && train

  function submit(event) {
    event.preventDefault()
    if (canStart) onStart({ person: code, sessionId: sessionId.trim(), consent: { train, publish } })
  }

  return (
    <form className="consent" onSubmit={submit}>
      <h1>Record hand shapes for Sema</h1>
      <div className="consent-text">
        <p>
          Sema is a student project that teaches ASL fingerspelling. This page records the
          positions of 21 points on your hand while you sign letters. It does not save video
          or photos. Your recordings are labelled with a code (like p03), never your name.
        </p>
        <p>
          Everything stays in this browser until you download the file at the end; nothing is
          uploaded. You then send the file to Lanix, who keeps it private and uses it to train
          and test Sema's letter recognition. Ask Lanix to delete your recordings at any time.
          You can stop whenever you like, and "Delete this session" removes what's stored in
          this browser.
        </p>
      </div>

      <label className="field">
        Your code
        <input name="person" value={person} placeholder="p03" autoComplete="off" onChange={(e) => setPerson(e.target.value)} />
      </label>
      {person !== '' && !codeOk && (
        <p className="error">Use the code Lanix gave you: p followed by at least two digits, like p03.</p>
      )}

      <label className="field">
        Session
        <input name="session" value={sessionId} autoComplete="off" onChange={(e) => setSessionId(e.target.value)} />
      </label>

      <label className="check">
        <input type="checkbox" name="train" checked={train} onChange={(e) => setTrain(e.target.checked)} />
        <span>My recordings may be used to train Sema. (required)</span>
      </label>
      <label className="check">
        <input type="checkbox" name="publish" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        <span>My recordings may be published in a public dataset. (optional)</span>
      </label>

      <button type="submit" className="button" disabled={!canStart}>
        Start session
      </button>
    </form>
  )
}
```

- [ ] **Step 5: RecorderApp: saved session, consent, session bar, camera**

Create `src/recorder/RecorderApp.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../camera/useCamera.js'
import { browserName } from '../vision/browserName.js'
import { useHandDetection } from '../vision/useHandDetection.js'
import { useHandLandmarker } from '../vision/useHandLandmarker.js'
import { LOADING_HAND_MODEL } from '../vision/visionMessages.js'
import ConsentForm from './ConsentForm.jsx'
import { useLetters } from './letters.js'
import { newSession } from './sessionFile.js'
import { clearSession, downloadSession, loadSession, rememberSessionId, saveSession } from './sessionStore.js'

// "2026-11-02" in the person's own time zone.
const today = () => new Date().toLocaleDateString('en-CA')

export default function RecorderApp() {
  const [saved, setSaved] = useState(loadSession) // offered back when the page opens
  const [session, setSession] = useState(null)
  const [storageOk, setStorageOk] = useState(true)
  const [downloadedTakes, setDownloadedTakes] = useState(0)
  const letters = useLetters()

  const { videoRef, status, error, start, stop } = useCamera()
  const isLive = status === 'live'
  const canvasRef = useRef(null)
  const listenerRef = useRef(null)
  const handModel = useHandLandmarker(isLive, 'GPU')
  const isDetecting = isLive && handModel.status === 'ready'
  const hand = useHandDetection({
    videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    listenerRef,
    isRunning: isDetecting,
  })

  // Every change to the session is saved in the browser straight away.
  function updateSession(next) {
    setSession(next)
    setStorageOk(saveSession(next))
  }

  function startSession({ person, sessionId, consent }) {
    rememberSessionId(sessionId)
    setSaved(null)
    setDownloadedTakes(0)
    updateSession(newSession({ person, session: sessionId, consent, date: today(), browser: browserName() }))
  }

  function download(current) {
    downloadSession(current)
    setDownloadedTakes(current.recordings.length)
  }

  function deleteSession() {
    if (!window.confirm('Delete this session from this browser? Download it first if you want to keep it.')) return
    startFresh()
  }

  // Back to the consent form, with nothing saved in the browser.
  function startFresh() {
    clearSession()
    setSession(null)
    setSaved(null)
    setDownloadedTakes(0)
  }

  // Warn before leaving if there are takes that haven't been downloaded.
  const unsaved = session !== null && session.recordings.length > downloadedTakes
  useEffect(() => {
    if (!unsaved) return
    function warn(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  return (
    <>
      <header className="top-bar">Sema recorder</header>
      <main className="page">
        {!session && saved && (
          <section className="saved-session">
            <p>
              Continue session {saved.person} · {saved.session} ({saved.recordings.length} takes)?
            </p>
            <div className="controls">
              <button type="button" className="button" onClick={() => setSession(saved)}>Continue</button>
              <button type="button" className="button-quiet" onClick={() => download(saved)}>Download</button>
              <button type="button" className="button-quiet" onClick={deleteSession}>Delete</button>
              {/* A new session needs the old one downloaded or deleted first. */}
              {downloadedTakes === saved.recordings.length && (
                <button type="button" className="button-quiet" onClick={startFresh}>Start a new session</button>
              )}
            </div>
          </section>
        )}

        {!session && !saved && <ConsentForm today={today()} onStart={startSession} />}

        {session && (
          <>
            <div className="session-bar">
              <span>
                Session {session.person} · {session.session} · {session.recordings.length} takes
              </span>
              <button type="button" className="button-quiet" onClick={() => download(session)}>Download session file</button>
              <button type="button" className="button-quiet" onClick={deleteSession}>Delete this session</button>
            </div>
            {!storageOk && (
              <p className="error" role="alert">
                Progress isn't being saved here; download the file before closing.
              </p>
            )}

            <div className="stage">
              <video ref={videoRef} className="video" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="overlay" />
              {!isLive && (
                <p className="stage-message">{status === 'starting' ? 'Waiting for the camera…' : 'Camera is off'}</p>
              )}
            </div>
            <div className="controls">
              {status === 'idle' ? (
                <button type="button" className="button" onClick={start}>Start camera</button>
              ) : (
                <button type="button" className="button" onClick={stop}>
                  {status === 'starting' ? 'Cancel' : 'Stop camera'}
                </button>
              )}
              {isLive && <span className="hand-status">{describeHand(handModel.status, hand.handLabel)}</span>}
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            {isLive && (handModel.error || hand.error) && (
              <p className="error" role="alert">{handModel.error || hand.error}</p>
            )}

            {letters.status === 'error' && (
              <p className="error" role="alert">Couldn't load the letter list (public/languages/asl/letters.json).</p>
            )}
            {letters.status === 'ready' && letters.training.length === 0 && (
              <p className="error">No training letters configured yet.</p>
            )}
            {/* Task 7 adds the recording grid and the take panel here. */}
          </>
        )}
      </main>
    </>
  )
}

function describeHand(modelStatus, handLabel) {
  if (modelStatus === 'loading' || modelStatus === 'idle') return LOADING_HAND_MODEL
  if (modelStatus === 'error') return 'Hand tracking is off'
  return handLabel ? `Hand found (${handLabel})` : 'No hand'
}
```

- [ ] **Step 6: Styles**

Append to `src/styles.css`:

```css
/* Recorder page (record.html) */
.consent h1 {
  margin: 0 0 16px;
  font-size: 1.5rem;
}

.consent-text p {
  margin: 0 0 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 16px;
  color: var(--muted-text);
}

.field input {
  max-width: 240px;
  padding: 8px 10px;
  font: inherit;
  color: var(--deep-cobalt);
  background: #fff;
  border: 1px solid var(--muted-text);
  border-radius: 8px;
}

.check {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 12px;
}

.consent .button {
  margin-top: 24px;
}

.button:disabled {
  opacity: 0.5;
  cursor: default;
}

.field input:focus-visible,
.check input:focus-visible {
  outline: 3px solid var(--deep-sky);
  outline-offset: 2px;
}

.saved-session p,
.session-bar {
  margin: 0 0 16px;
}

.session-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  color: var(--muted-text);
}

.session-bar .button-quiet {
  margin-top: 0;
}

.hand-status {
  color: var(--muted-text);
}
```

- [ ] **Step 7: Verify**

Run: `npm run lint` (no warnings), `npm test` (all pass), `npm run build`.
Expected: build output lists both `dist/index.html` and `dist/record.html`.
Then `npm run dev` and open `http://localhost:5173/record.html` in Chrome:
- The consent form shows; Start session stays disabled until a valid code is typed and the first box is ticked; `P03` is accepted.
- After starting, the session bar shows; refreshing the page offers "Continue session p03 · …"; Delete asks for confirmation and clears it; after Download, "Start a new session" appears and returns to the consent form.
- Start camera shows the mirrored video and skeleton.
- `http://localhost:5173/` (main page) still works.

- [ ] **Step 8: Report**

`git status --short`. Explain the two-page build and why `/record.html` is the dev URL (Vercel's `cleanUrls` serves it at `/record`). Suggested commit message: `Add the recorder page with consent and session storage`.

---

### Task 7: Takes, grid, take panel, undo

**Files:**
- Create: `src/recorder/useRecording.js`, `src/recorder/RecordingGrid.jsx`, `src/recorder/TakePanel.jsx`
- Modify: `src/recorder/RecorderApp.jsx`, `src/styles.css`

**Interfaces:**
- Consumes: Task 2 (`takePhase`, `sampleSlot`, `frameFromDetection`, `tallyTake`, `judgeTake`, `COUNTDOWN_MS`, `SETTLE_MS`, `TAKES_TARGET`, `POSITION_HINTS`, `LIFEPRINT_URL`), `nextFrameCount`, `fpsBetween`; Task 3 (`addTake`, `undoLastTake`, `acceptedCount`); Task 5 listener; Task 6 (`classLabel`, `RecorderApp`).
- Produces: `useRecording({ videoRef, listenerRef, isDetecting, onTakeDone }) → { phase, letter, hand, secondsLeft, result, message, busy, start(letter, hand) }` where `phase` is `'idle' | 'countdown' | 'settling' | 'capturing' | 'saving' | 'review' | 'discarded'` and `onTakeDone(take)` receives the object `addTake` expects.

- [ ] **Step 1: useRecording**

Create `src/recorder/useRecording.js`:

```js
import { useEffect, useRef, useState } from 'react'
import { fpsBetween, nextFrameCount } from '../camera/frameCounter.js'
import {
  COUNTDOWN_MS,
  SETTLE_MS,
  frameFromDetection,
  judgeTake,
  sampleSlot,
  takePhase,
  tallyTake,
} from './takeRules.js'

const BUSY = ['countdown', 'settling', 'capturing', 'saving']

// One take at a time: countdown, a short settle, capture, then the result is
// handed to onTakeDone. Frames arrive through listenerRef from the detection
// loop; a timer drives the phases and checks the take is still valid.
export function useRecording({ videoRef, listenerRef, isDetecting, onTakeDone }) {
  const [state, setState] = useState({ phase: 'idle' })
  const takeRef = useRef(null)
  // Refs so the timer always sees the latest values without restarting.
  const isDetectingRef = useRef(isDetecting)
  const onTakeDoneRef = useRef(onTakeDone)

  useEffect(() => {
    isDetectingRef.current = isDetecting
  }, [isDetecting])

  useEffect(() => {
    onTakeDoneRef.current = onTakeDone
  })

  // If the page goes away mid-take, stop the timer and the listener.
  useEffect(() => () => takeRef.current?.stop(), [])

  function start(letter, hand) {
    if (takeRef.current) return
    const video = videoRef.current
    const startAt = performance.now()
    const captureAt = startAt + COUNTDOWN_MS + SETTLE_MS
    const take = { frames: [], lastSlot: -1, fpsStart: null, fpsRequested: false, hidden: false, stop: null }
    let timer = null

    function onDetection(detection) {
      const t = detection.time - captureAt
      const slot = sampleSlot(t, take.lastSlot)
      if (slot === null) return
      take.lastSlot = slot
      take.frames.push(frameFromDetection(detection, Math.round(t)))
    }

    function onVisibilityChange() {
      if (document.hidden) take.hidden = true
    }

    take.stop = () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (listenerRef.current === onDetection) listenerRef.current = null
      if (takeRef.current === take) takeRef.current = null
    }

    function discard(message) {
      take.stop()
      setState({ phase: 'discarded', letter, hand, message })
    }

    async function finish() {
      take.stop()
      setState({ phase: 'saving', letter, hand })
      const fpsEnd = await nextFrameCount(video)
      const counts = tallyTake(take.frames, hand)
      const result = {
        letter,
        hand,
        counts,
        ...judgeTake(counts),
        cameraFps: fpsBetween(take.fpsStart, fpsEnd),
        frames: take.frames,
      }
      onTakeDoneRef.current(result)
      setState({ phase: 'review', letter, hand, result })
    }

    function tick() {
      if (take.hidden) return discard("The tab was hidden, which pauses the camera. This take wasn't saved.")
      if (!isDetectingRef.current) {
        return discard("The camera stopped or the hand model reloaded. This take wasn't saved.")
      }
      const elapsed = performance.now() - startAt
      const phase = takePhase(elapsed)
      if (phase === 'capturing' && !take.fpsRequested) {
        take.fpsRequested = true
        nextFrameCount(video).then((count) => {
          take.fpsStart = count
        })
      }
      if (phase === 'done') return finish()
      setState({ phase, letter, hand, secondsLeft: Math.ceil((COUNTDOWN_MS - elapsed) / 1000) })
    }

    takeRef.current = take
    listenerRef.current = onDetection
    document.addEventListener('visibilitychange', onVisibilityChange)
    timer = setInterval(tick, 100)
    tick()
  }

  return { ...state, busy: BUSY.includes(state.phase), start }
}
```

- [ ] **Step 2: Grid and take panel**

Create `src/recorder/RecordingGrid.jsx`:

```jsx
import { classLabel } from './letters.js'
import { acceptedCount } from './sessionFile.js'
import { TAKES_TARGET } from './takeRules.js'

const HANDS = ['left', 'right']

export default function RecordingGrid({ training, pilot, session, selected, onSelect, disabled }) {
  const row = (letter) => (
    <tr key={letter}>
      <th scope="row">{classLabel(letter)}</th>
      {HANDS.map((hand) => {
        const isSelected = selected?.letter === letter && selected?.hand === hand
        return (
          <td key={hand}>
            <button
              type="button"
              className="cell-button"
              aria-pressed={isSelected}
              aria-label={`${classLabel(letter)}, ${hand} hand`}
              disabled={disabled}
              onClick={() => onSelect({ letter, hand })}
            >
              {acceptedCount(session, letter, hand)} / {TAKES_TARGET}
            </button>
          </td>
        )
      })}
    </tr>
  )

  return (
    <table className="recording-grid">
      <thead>
        <tr>
          <th scope="col">Letter</th>
          <th scope="col">Left</th>
          <th scope="col">Right</th>
        </tr>
      </thead>
      <tbody>
        {training.map(row)}
        {row('none')}
        {pilot.length > 0 && (
          <tr>
            <th scope="colgroup" colSpan={3} className="grid-group">Pilot only</th>
          </tr>
        )}
        {pilot.map(row)}
      </tbody>
    </table>
  )
}
```

Create `src/recorder/TakePanel.jsx`:

```jsx
import { classLabel } from './letters.js'
import { LIFEPRINT_URL, POSITION_HINTS } from './takeRules.js'

export default function TakePanel({ cell, accepted, recording, canRecord, onRecord }) {
  if (!cell) return <p className="take-panel">Choose a letter and a hand in the table.</p>

  const title = cell.letter === 'none' ? 'No letter' : `Letter ${classLabel(cell.letter)}`
  const hint = accepted < POSITION_HINTS.length ? POSITION_HINTS[accepted] : 'Any position'
  const isThisCell = recording.letter === cell.letter && recording.hand === cell.hand

  return (
    <section className="take-panel">
      <h2>
        {title}, {cell.hand} hand
      </h2>
      {cell.letter === 'none' ? (
        <p>Relax your hand, half-form shapes and move it around.</p>
      ) : (
        <p>
          <a href={LIFEPRINT_URL} target="_blank" rel="noreferrer">How to sign the letters (Lifeprint)</a>
        </p>
      )}
      <p>
        Take {accepted + 1}: {hint}.
      </p>
      <button type="button" className="button" disabled={!canRecord} onClick={onRecord}>
        Record
      </button>
      <div aria-live="polite">{isThisCell && <TakeStatus recording={recording} />}</div>
    </section>
  )
}

function TakeStatus({ recording }) {
  switch (recording.phase) {
    case 'countdown':
      return <p className="take-countdown">{recording.secondsLeft}</p>
    case 'settling':
    case 'capturing':
      return <p className="take-hold">Hold…</p>
    case 'saving':
      return <p>Saving…</p>
    case 'review':
      return <TakeResult result={recording.result} />
    case 'discarded':
      return <p className="error">{recording.message}</p>
    default:
      return null
  }
}

function TakeResult({ result }) {
  const { kept, mismatched } = result.counts
  if (result.status === 'accepted') {
    const other = mismatched > 0 ? `, ${mismatched} with the other hand detected` : ''
    return <p>Saved: {kept} frames with a hand{other}.</p>
  }
  return <p className="error">Not saved: {result.reason}. Try again.</p>
}
```

- [ ] **Step 3: Wire them into RecorderApp**

In `src/recorder/RecorderApp.jsx`:

1. Add imports:

```jsx
import RecordingGrid from './RecordingGrid.jsx'
import TakePanel from './TakePanel.jsx'
import { acceptedCount, addTake, newSession, undoLastTake } from './sessionFile.js'
import { useRecording } from './useRecording.js'
```

(replace the existing `import { newSession } from './sessionFile.js'` line with the third line above).

2. After the `useHandDetection(...)` call, add:

```jsx
  const [cell, setCell] = useState(null) // { letter, hand } chosen in the grid
  const recording = useRecording({
    videoRef,
    listenerRef,
    isDetecting,
    onTakeDone: (take) => updateSession(addTake(session, take)),
  })
```

3. Replace the line `{/* Task 7 adds the recording grid and the take panel here. */}` with:

```jsx
            {letters.status === 'ready' && (
              <div className="recorder-work">
                <RecordingGrid
                  training={letters.training}
                  pilot={letters.pilot}
                  session={session}
                  selected={cell}
                  onSelect={setCell}
                  disabled={recording.busy}
                />
                <div>
                  <TakePanel
                    cell={cell}
                    accepted={cell ? acceptedCount(session, cell.letter, cell.hand) : 0}
                    recording={recording}
                    canRecord={isDetecting && cell !== null && !recording.busy}
                    onRecord={() => recording.start(cell.letter, cell.hand)}
                  />
                  <button
                    type="button"
                    className="button-quiet"
                    disabled={session.recordings.length === 0 || recording.busy}
                    onClick={() => updateSession(undoLastTake(session))}
                  >
                    Undo last take
                  </button>
                </div>
              </div>
            )}
```

- [ ] **Step 4: Styles**

Append to `src/styles.css`:

```css
.recorder-work {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px 40px;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .recorder-work {
    grid-template-columns: 1fr;
  }
}

.recording-grid {
  border-collapse: collapse;
}

.recording-grid th,
.recording-grid td {
  padding: 4px 8px;
  text-align: left;
}

.recording-grid .grid-group {
  padding-top: 16px;
  font-weight: 600;
  color: var(--muted-text);
}

.cell-button {
  min-width: 64px;
  padding: 6px 10px;
  font: inherit;
  font-variant-numeric: tabular-nums;
  color: var(--deep-cobalt);
  background: #fff;
  border: 1px solid var(--muted-text);
  border-radius: 6px;
  cursor: pointer;
}

.cell-button[aria-pressed='true'] {
  color: #fff;
  background: var(--deep-sky);
  border-color: var(--deep-sky);
}

.cell-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.cell-button:focus-visible {
  outline: 3px solid var(--deep-sky);
  outline-offset: 2px;
}

.take-panel h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

.take-panel p {
  margin: 0 0 12px;
}

.take-panel a {
  color: var(--deep-sky);
}

.take-countdown {
  font-size: 3rem;
  font-weight: 600;
}

.take-hold {
  font-size: 1.5rem;
  font-weight: 600;
}
```

- [ ] **Step 5: Verify**

Run: `npm run lint` (no warnings), `npm test` (all pass), `npm run build`.
Then `npm run dev`, open `http://localhost:5173/record.html` in Chrome, start a session and the camera, choose a cell and click Record:
- countdown 3-2-1, then "Hold…" for 3.5 s, then "Saved: … frames with a hand" (hand in view) or "Not saved: …" (hand out of view);
- the cell's count goes up only for saved takes; Undo last take removes the latest;
- switching tabs during a take discards it with a message;
- Download session file saves `sema-asl-<code>-<session>.json`; `npm run check-session -- <that file>` prints the table and "OK".

- [ ] **Step 6: Report**

`git status --short`. Explain the take state machine (why a timer plus a listener, why refs). Suggested commit message: `Record takes in the recorder: grid, take panel, undo`.

---

### Task 8: Docs

**Files:**
- Create: `docs/data-format.md`
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Data format reference**

Create `docs/data-format.md` from the spec's section 2 and section 3, as a standalone reference: the JSON example; header fields (including `consent.train`, `consent.publish`, `consent.date`, and that the header's `person`, `session`, `language` are only a label while each sample's are authoritative); `recordings` fields (`status`, `reason`, `kept`, `mismatched`, `droppedNoHand`, `cameraFps`; rejected takes have no samples; interrupted takes are not logged); sample fields with the coordinate conventions (`raw` in the un-mirrored camera frame; `landmarks` flipped for left hands using the detected hand, for now; training filters to `detected == hand`); the normalization steps; the `z`-in-palm-length 2.2 experiment; the rules "bump `format` when the layout changes, bump `normalization` when normalization changes"; and the privacy rule (`data/raw/` is gitignored and private).

- [ ] **Step 2: README**

Add a section `## Recording sessions` after `## Recorded data`, covering:
- the page: `/record` on the live site, `http://localhost:5173/record.html` in development;
- in person: Lanix opens the page, the participant reads the consent text and ticks the boxes, records each letter and hand 3 times (position hints on screen), then downloads the file;
- remotely: send the `/record` link; the participant downloads the file and sends it to Lanix;
- what participants are told (summary of the consent text) and that nothing is uploaded;
- checking a file before keeping it: `npm run check-session -- path/to/file.json` (what it checks, and that it prints accepted/rejected takes per letter and hand), then moving it into `data/raw/` (private, gitignored);
- the letter list: `public/languages/asl/letters.json`, training letters as `{ "letter": "B" }`, pilot-only letters with `"pilotOnly": true`.

Add `npm test` and `npm run check-session` to the "Other scripts" line, and the new files to the project structure tree (`record.html`, `vercel.json`, `public/languages/asl/letters.json`, `scripts/check-session.js`, `src/recorder/…`, `src/vision/normalizeHand.js`, `src/vision/browserName.js`, `src/camera/frameCounter.js`, `docs/data-format.md`, `docs/recorder-design.md`, `docs/recorder-implementation-plan.md`).

In the "Deploy (Vercel)" section, add: `vercel.json` turns on `cleanUrls`, so the recorder is at `/record`; a future single-page-app rewrite (Phase 3) must exclude `/record`.

- [ ] **Step 3: CLAUDE.md**

Under the folder structure, add `recorder/   the recorder page (record.html): consent, takes, session file` to the `src/` tree. Add a `## Recorder conventions` section:
- Session files follow `docs/data-format.md`; bump `format` / `normalization` when they change; `scripts/check-session.js` knows the valid versions.
- The left-hand flip uses the detected hand, for now (open decision in the plan).
- Take timing and the sampling interval are constants in `src/recorder/takeRules.js`; a take passes when `kept − mismatched ≥ 24`.
- `data/raw/` is gitignored and private; never commit recorded sessions.
- `vercel.json` (`cleanUrls`) serves the recorder at `/record`. JSON can't hold comments, so note here: any future single-page-app rewrite (Phase 3) must exclude `/record`.
- `npm test` runs Vitest; keep pure logic in small modules with tests.

- [ ] **Step 4: Report**

`git status --short`. Suggested commit message: `Document the recorder and the session file format`.

---

### Task 9: End-to-end check in headless Chrome (scratch, not committed)

**Files:** none in the repo. Work in the session's scratchpad directory (`$SP` below).

This exercises the whole page with a fake camera: an accepted take, a mismatch rejection (the same hand recorded as the other hand), a no-hand rejection, download plus checker, and restoring a saved session.

- [ ] **Step 1: Make fake-camera videos**

```bash
mkdir -p $SP/e2e && cd $SP/e2e
curl -fsS -o victory.jpg https://storage.googleapis.com/mediapipe-assets/victory.jpg
cat > make_video.py <<'EOF'
# Usage: python3 -I make_video.py victory.jpg <only|mixed> | ffmpeg ... (raw RGB24 640x480, 30 fps)
import sys
from PIL import Image
W, H = 640, 480
hand_img = Image.open(sys.argv[1]).convert("RGB")
hand_img = hand_img.resize((int(hand_img.width * 440 / hand_img.height), 440))
hand = Image.new("RGB", (W, H), (214, 212, 206))
hand.paste(hand_img, ((W - hand_img.width) // 2, (H - hand_img.height) // 2))
blank = Image.new("RGB", (W, H), (214, 212, 206))
frames = [hand] * 120 if sys.argv[2] == "only" else [hand] * 15 + [blank] * 75
cache = {}
for f in frames:
    sys.stdout.buffer.write(cache.setdefault(id(f), f.tobytes()))
EOF
for v in only mixed; do python3 -I make_video.py victory.jpg $v | ffmpeg -loglevel error -y -f rawvideo -pix_fmt rgb24 -s 640x480 -r 30 -i - -pix_fmt yuv420p hand-$v.y4m; done
```

Expected: `hand-only.y4m` (hand in every frame) and `hand-mixed.y4m` (hand 0.5 s, empty 2.5 s, looping).

- [ ] **Step 2: Driver script**

Create `$SP/e2e/recorder-e2e.mjs`:

```js
// Usage: node recorder-e2e.mjs <debugPort> <appUrl> <downloadDir> <mode: full|nohand>
import { readdirSync, readFileSync } from 'node:fs'
const [port, appUrl, downloadDir, mode] = process.argv.slice(2)
const ws = new WebSocket((await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const pending = new Map()
const listeners = new Set()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
  else for (const l of listeners) l(m)
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params, sessionId })) })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir })
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const page = (m, p) => send(m, p, sessionId)
await page('Page.enable'); await page('Runtime.enable')
listeners.add((m) => { if (m.sessionId === sessionId && m.method === 'Page.javascriptDialogOpening') page('Page.handleJavaScriptDialog', { accept: true }) })
const evaluate = async (expression) => (await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value
const waitFor = async (expr, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await evaluate(expr).catch(() => false)) return true; await wait(100) } return false }
const click = (label) => evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(label)})).click()`)
const type = (name, value) => evaluate(`(() => { const el = document.querySelector('input[name=${name}]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`)
const text = () => evaluate('document.querySelector("main").innerText')
const results = []
const check = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '\n        ' + JSON.stringify(detail).slice(0, 400)}`)

await page('Page.navigate', { url: appUrl })
await waitFor('!!document.querySelector("input[name=person]")', 10000)
check('Start session disabled before consent', await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Start session').disabled`))
await type('person', ' P99 ')
await evaluate(`document.querySelector('input[name=train]').click()`)
await click('Start session')
await waitFor('document.body.innerText.includes("Session p99")')
await click('Start camera')
await waitFor('/Hand found|No hand/.test(document.body.innerText)', 60000)

async function recordCell(label) {
  await evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]').click()`)
  await click('Record')
  await waitFor('/Saved:|Not saved:/.test(document.querySelector(".take-panel").innerText)', 15000)
  return evaluate('document.querySelector(".take-panel").innerText')
}

if (mode === 'full') {
  const left = await recordCell('No letter, left hand')
  const right = await recordCell('No letter, right hand')
  // The same photo is one hand, so recording it as the other hand must fail.
  const saved = [left, right].filter((t) => t.includes('Saved:'))
  const mismatch = [left, right].filter((t) => t.includes('Not saved:') && t.includes('other hand detected'))
  check('One hand accepted, the other rejected as a mismatch', saved.length === 1 && mismatch.length === 1, { left, right })
  await click('Download session file')
  await wait(1500)
  const files = readdirSync(downloadDir).filter((f) => f.startsWith('sema-asl-p99-'))
  check('Downloaded the session file', files.length === 1, files)
  const file = JSON.parse(readFileSync(`${downloadDir}/${files[0]}`, 'utf8'))
  check('File has one accepted and one rejected recording', file.recordings.filter((r) => r.status === 'accepted').length === 1 && file.recordings.filter((r) => r.status === 'rejected').length === 1, file.recordings)
  check('Samples carry detected hand and 63 + 63 numbers', file.samples.length > 0 && file.samples.every((s) => s.raw.length === 63 && s.landmarks.length === 63 && ['left', 'right'].includes(s.detected)), file.samples[0])
  await page('Page.reload')
  await waitFor('document.body.innerText.includes("Continue session p99")', 10000)
  check('Refresh offers the session back', (await text()).includes('Continue session p99'))
  await click('Delete')
  await waitFor('!!document.querySelector("input[name=person]")', 5000)
  check('Delete clears it', await evaluate('!!document.querySelector("input[name=person]")'))
}

if (mode === 'nohand') {
  const result = await recordCell('No letter, left hand')
  check('No-hand take rejected with counts', result.includes('Not saved:') && result.includes('had no hand'), result)
}

console.log(results.join('\n'))
await send('Target.closeTarget', { targetId })
ws.close()
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0)
```

- [ ] **Step 3: Run it**

```bash
cd <repo> && npx vite --port 5199 --strictPort > $SP/e2e/vite.log 2>&1 & VITE=$!
mkdir -p $SP/e2e/dl1 $SP/e2e/dl2
google-chrome --headless=new --remote-debugging-port=9370 --user-data-dir=$SP/e2e/chrome1 --no-first-run --use-fake-device-for-media-stream --use-file-for-fake-video-capture=$SP/e2e/hand-only.y4m --use-fake-ui-for-media-stream about:blank >/dev/null 2>&1 & C1=$!
google-chrome --headless=new --remote-debugging-port=9371 --user-data-dir=$SP/e2e/chrome2 --no-first-run --use-fake-device-for-media-stream --use-file-for-fake-video-capture=$SP/e2e/hand-mixed.y4m --use-fake-ui-for-media-stream about:blank >/dev/null 2>&1 & C2=$!
sleep 3
node $SP/e2e/recorder-e2e.mjs 9370 http://localhost:5199/record.html $SP/e2e/dl1 full
npm run check-session -- $SP/e2e/dl1/sema-asl-p99-*.json
node $SP/e2e/recorder-e2e.mjs 9371 http://localhost:5199/record.html $SP/e2e/dl2 nohand
npm run build && ls dist/record.html
kill $C1 $C2 $VITE
```

Expected: every line `PASS`; the checker prints the table and `OK`; `dist/record.html` exists. Never use `pkill -f` with the scratchpad path (it matches the shell itself); kill by PID.

- [ ] **Step 4: Report**

Tell Lanix what passed and what only they can check in Chrome with a real webcam: real left and right hands, the consent text, the "Leave site?" warning, and the downloaded file. Then the pilot (M2) is Lanix's: a full session with all letters in `letters.json` plus "none", both hands, 3 takes each, passing the checker; after that, 2.1 becomes "In progress" in the plan.
