import { useEffect, useRef, useState } from 'react'
import MenuBar from '../../app/layout/MenuBar.jsx'
import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import AslDrawing from '../../components/AslDrawing.jsx'
import CameraPanel from '../../components/camera-view/CameraPanel.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import LetterGuide from '../../components/LetterGuide.jsx'
import { useLetters } from '../../recorder/letters.js'
import { frameFromDetection } from '../../recorder/takeRules.js'
import { isWholeHand } from '../../vision/landmarks/handChecks.js'
import { shapeFix } from '../../vision/landmarks/letterShapes.js'
import { J_START_HOLD_MS, PINKY_TIP, jPath, jScale } from '../../vision/landmarks/jTrace.js'
import { INDEX_TIP, NO_TRACE, fingertip, traceDone, traceShare, updateTrace, zPath } from '../../vision/landmarks/zTrace.js'
import { useHandDetection } from '../../vision/tracking/useHandDetection.js'
import { clearTrace, drawTrace } from './drawTrace.js'
import GuidePanel from './GuidePanel.jsx'
import * as knnModel from './knnModel.js'
import {
  LETTER_HOLD_MS,
  NO_HOLD,
  TRACED_LETTERS,
  heldLongEnough,
  holdSecondsLeft,
  practiceStatus,
  showsLetter,
  updateLetterHold,
} from './letterHold.js'
import * as networkModel from './networkModel.js'

const RUN_TRAIN = 'python3 training/train.py data/extracted/<file>.json data/raw/<session>.json'
const RUN_TRAIN_SMALL = 'python3 training/train_small.py data/extracted/<file>.json data/raw/<session>.json'

// The two classifiers this page can run: where each one's file is, how to
// read it and judge a hand with it, and what to say when it's missing. The
// developer dashboard (/dev) picks which one; the default is the small model.
const MODELS = {
  small: {
    // Saved by training/train_small.py into public/ and committed: only
    // weights, a few KB, so the live site has it too.
    url: `${import.meta.env.BASE_URL}models/asl-letters.json`,
    ...networkModel,
    missing: `No small model yet. Run: ${RUN_TRAIN_SMALL}`,
  },
  knn: {
    // Saved by training/train.py, gitignored (11 MB: every training hand);
    // Vite's dev server serves it from the project, the live site doesn't,
    // so it's only used under npm run dev.
    url: `${import.meta.env.BASE_URL}data/models/knn-asl.json`,
    ...knnModel,
    missing: `No k-NN model yet. Run: ${RUN_TRAIN}`,
  },
}
// Under npm run dev, the page also names the model that's running, and the
// k-NN can be chosen on /dev. The live site has only the small model.
const SHOW_DEV_TOOLS = import.meta.env.DEV
// The "Right now" line is redrawn at most this often. The detection loop runs
// about 30 times a second, and redrawing the page that often isn't needed to
// read it. The hold itself is checked on every frame.
const SHOW_EVERY_MS = 100
// The letter picked when the page opens: the first of the 8 that work best.
const FIRST_LETTER = 'B'
// The traced letters: the fingertip that traces, and for J, how long its
// starting handshape (I) is held before the line appears at that fingertip.
// Z's line is always there, fixed in the frame.
const TRACES = {
  J: { tip: PINKY_TIP, startHoldMs: J_START_HOLD_MS },
  Z: { tip: INDEX_TIP, startHoldMs: null },
}

// Practice: the main page for now (2026-10-23; until then it was Try, at
// /try). Pick a letter in the guide, make it, and hold it for 3 seconds
// (letterHold.js); the classifier trained in training/ (step 5's small model)
// judges every frame. Record's three columns: the letter guide on the left,
// the camera in the camera check's panel (a status and a line that fills over
// the 3 seconds) with the hand switch in its controls, and the letter to make
// on the right (its drawing, large, how to form it, what Sema sees right
// now). The drawings face the signing hand, the saved setting the hand switch
// changes (Right by default); only that hand is drawn and judged. The camera waits for a click, as on
// the camera check: landing on Sema never turns it on. Each hand goes through
// the recorder's own frameFromDetection, so it's normalized exactly as recorded.
export default function PracticePage({ signingHand, onSigningHandChange, model = 'small' }) {
  const camera = useSharedCamera()
  const { handModel } = camera
  const isDetecting = camera.status === 'live' && handModel.status === 'ready'
  const drawnHand = signingHand ?? 'right'
  const canvasRef = useRef(null)
  const listenerRef = useRef(null)
  // Only the signing hand's points are drawn; the other hand gets none, as on
  // Record (useHandDetection's wantedHand).
  const hand = useHandDetection({
    videoRef: camera.videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    listenerRef,
    isRunning: isDetecting,
    wantedHand: drawnHand,
  })
  const kind = MODELS[SHOW_DEV_TOOLS ? model : 'small']
  const loaded = useModelFile(kind)
  const letters = useLetters()

  // The letter to make, and each round of it: picking a letter or Try again
  // starts a new round, which starts the hold over.
  const [target, setTarget] = useState(FIRST_LETTER)
  const traced = TRACED_LETTERS.includes(target)
  const [round, setRound] = useState(0)
  const [passed, setPassed] = useState(false)
  const [guesses, setGuesses] = useState([])
  // When the hold started: the letter's 3 s, or for J, the I's before its line.
  const [holdStart, setHoldStart] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  // J's and Z's trace: started on the dot, how much is traced (0 to 1), and
  // the canvas under the hand drawing that shows it.
  const [tracing, setTracing] = useState(false)
  const [traceFill, setTraceFill] = useState(0)
  const traceCanvasRef = useRef(null)
  function startRound(letter) {
    setTarget(letter)
    setPassed(false)
    setRound((n) => n + 1)
  }

  // The detection loop calls the listener on every frame, with every hand.
  // State only changes when a value does, so React skips most of these.
  useEffect(() => {
    // J and Z move, so they're traced instead (the next effect).
    if (loaded.status !== 'ready' || traced) return
    let shownAt = 0
    let hold = NO_HOLD
    let done = false
    listenerRef.current = (detection) => {
      if (done) return
      const now = detection.time
      // Only the signing hand counts: the other one isn't drawn, so it
      // mustn't be able to make the letter either.
      const frame = detection.hands
        .map((h) => guess(kind, loaded.model, h, detection))
        .filter((g) => g && g.hand === drawnHand)
      hold = updateLetterHold(hold, showsLetter(frame, target), now)
      setHoldStart(hold.start)
      setSecondsLeft(holdSecondsLeft(hold, now))
      if (heldLongEnough(hold, now)) {
        done = true
        setPassed(true)
      }
      if (now - shownAt >= SHOW_EVERY_MS) {
        shownAt = now
        setGuesses(frame)
      }
    }
    return () => {
      listenerRef.current = null
      // So a new round, the other model or the other hand starts from nothing.
      setGuesses([])
      setHoldStart(null)
      setSecondsLeft(null)
    }
  }, [kind, loaded, target, round, traced, drawnHand])

  // J and Z: no classifier. Every frame moves the trace on with the signing
  // hand's fingertip (TRACES), while that hand makes the letter's handshape,
  // and draws the line (zTrace.js, jTrace.js). Z's line is always there. J's
  // appears once the I is held, starting at the pinky tip and sized to the
  // hand, and goes again after a slip, so J starts over from the I. The
  // drawing goes straight to the canvas, not through state.
  useEffect(() => {
    if (!traced) return
    const { tip: tipPoint, startHoldMs } = TRACES[target]
    let path = null
    // J's size, from the hand as the I was held (jScale); Z's is always 1.
    let scale = 1
    let startHold = NO_HOLD
    let trace = NO_TRACE
    let done = false
    listenerRef.current = (detection) => {
      if (done) return
      const now = detection.time
      const aspect = detection.width / detection.height
      const raw = handInShape(detection, drawnHand, target)
      const tip = raw && fingertip(raw, aspect, tipPoint)
      if (!startHoldMs) {
        path = zPath(drawnHand, aspect)
        trace = updateTrace(trace, tip, now, path)
      } else if (path === null) {
        // The same gap rule as a letter's hold, so one odd frame can't restart it.
        startHold = updateLetterHold(startHold, tip !== null, now)
        if (tip !== null && now - startHold.start >= startHoldMs) {
          // Already started: point 1 is where the pinky is.
          scale = jScale(raw, aspect)
          path = jPath(drawnHand, aspect, tip, scale)
          trace = { along: 0, lastOnAt: now, done: false }
          startHold = NO_HOLD
        }
        setHoldStart(startHold.start)
      } else {
        trace = updateTrace(trace, tip, now, path, { restart: false, scale })
        if (trace.along === null) path = null
      }
      const canvas = traceCanvasRef.current
      if (canvas && path) drawTrace(canvas, path, trace.along, detection.width, detection.height)
      if (canvas && !path) clearTrace(canvas)
      setTracing(trace.along !== null)
      // In whole percent, so the state only changes when the panel line would.
      setTraceFill(path ? Math.round(traceShare(trace, path) * 100) / 100 : 0)
      if (traceDone(trace)) {
        done = true
        setPassed(true)
      }
    }
    return () => {
      listenerRef.current = null
      setTracing(false)
      setTraceFill(0)
      setHoldStart(null)
    }
  }, [traced, target, round, drawnHand])

  // Only what's true now counts: with the camera or tracking stopped, no hand
  // is in view and no hold is running.
  const shown = isDetecting ? guesses : []
  // A letter's 3 s hold, or J's I before its line appears.
  const holding = isDetecting && !passed && holdStart !== null
  const holdingI = traced && holding
  const { status, tone } = practiceStatus({
    cameraStatus: camera.status,
    cameraError: camera.error,
    trackingError: handModel.status === 'error' || Boolean(hand.error),
    ready: handModel.status === 'ready' && (traced || loaded.status === 'ready'),
    passed,
    secondsLeft: holding ? secondsLeft : null,
    guesses: shown,
    target,
    hand: drawnHand,
    traced,
    tracing: isDetecting && tracing,
    holdingI,
  })
  // A traced letter's panel line fills as it's traced, instead of over a
  // hold; J's fills over the I's hold first.
  const fill = passed ? 1 : traceFill
  const traceLine = traced && (passed || (isDetecting && tracing)) && {
    share: fill,
    label: `${target} traced`,
    text: `${Math.round(fill * 100)}%`,
  }
  return (
    <>
      <MenuBar active="practice" />

      {/* Three columns that start and end on the same lines, as on Record
          (grid areas in styles.css). */}
      <main className="practice">
        <GuidePanel hand={drawnHand} selected={target} onSelect={startRound} />

        <section className="practice-camera" aria-label="Camera">
          <CameraPanel
            className="practice-panel"
            status={status}
            tone={tone}
            hold={
              traced
                ? holdingI && { start: holdStart, ms: J_START_HOLD_MS, done: false }
                : (holding || passed) && { start: holdStart, ms: LETTER_HOLD_MS, done: passed }
            }
            fill={traceLine}
          >
            {/* The hand switch, as on Record: here it changes the signing
                hand, so the drawings face the hand being used. J's and Z's
                line is drawn under the hand. */}
            <CameraView
              canvasRef={canvasRef}
              hand={hand}
              className="practice-stage"
              autoStart={false}
              controls={{ hand: drawnHand, onHandChange: onSigningHandChange, handLabel: 'Signing hand' }}
              underlay={traced && <canvas ref={traceCanvasRef} className="overlay" aria-hidden="true" />}
            >
              {passed && (
                <div className="practice-done">
                  <p className="practice-done-title">That&rsquo;s {target}!</p>
                  <button type="button" className="button" onClick={() => startRound(target)}>
                    Try again
                  </button>
                  <p className="practice-done-note">or pick another letter in the guide</p>
                </div>
              )}
            </CameraView>
          </CameraPanel>
        </section>

        <aside className="practice-side" aria-label="Your letter">
          <section className="letter-card letter-card-record" aria-labelledby="practice-letter-title">
            <h2 id="practice-letter-title" className="letter-card-title">
              Letter {target}
            </h2>
            {/* Large, on white in both themes (the drawings are black lines). */}
            <div className="reference-image reference-image-drawing">
              <AslDrawing letter={target} hand={drawnHand} alt={`Handshape for ${target}`} />
            </div>
          </section>
          <LetterGuide steps={letters.instructions[target]} hand={drawnHand} />
          {!traced && loaded.status === 'ready' && isDetecting && (
            <RightNow guesses={shown} target={target} hand={drawnHand} />
          )}
          {loaded.status === 'loading' && <p className="practice-note">Loading the model…</p>}
          {loaded.status === 'error' && (
            <p className="error" role="alert">
              {loaded.error}
            </p>
          )}
        </aside>
      </main>
    </>
  )
}

// What Sema sees of the signing hand right now, so it's clear why the hold
// isn't counting. The small model gives a percentage; the k-NN doesn't.
function RightNow({ guesses, target, hand }) {
  if (guesses.length === 0) return <p className="practice-now">Right now: no {hand} hand in view</p>
  return (
    <div className="practice-now">
      {guesses.map((g, i) => (
        <p key={i}>
          {g.hand === 'left' ? 'Left hand' : 'Right hand'}: {seenText(g, target)}
        </p>
      ))}
    </div>
  )
}

function seenText(g, target) {
  if (!g.whole) return 'show the whole hand'
  if (!g.sure) return 'not sure'
  // Near the letter but failing its shape rules: what to change if it's the
  // letter being made, and otherwise not that letter at all.
  if (g.fix) return g.letter === target ? `almost ${g.letter}. ${g.fix}` : 'not sure'
  return 'confidence' in g ? `${g.letter}, ${percent(g.confidence)} sure` : g.letter
}

// The signing hand's raw points, or null when that hand isn't in view or
// isn't making the letter's handshape (J's is I's).
function handInShape({ hands, width, height }, signingHand, letter) {
  for (const hand of hands) {
    const frame = frameFromDetection({ ...hand, width, height }, null)
    if (frame.hasHand && frame.detected === signingHand && !shapeFix(letter, frame.landmarks)) {
      return hand.landmarks
    }
  }
  return null
}

// One hand's guess, or null if its points are unusable.
function guess(kind, model, hand, { width, height }) {
  const frame = frameFromDetection({ ...hand, width, height }, null)
  if (!frame.hasHand) return null
  // Training only used whole hands (training/dataset.py), and so does Record.
  if (!isWholeHand(hand.landmarks)) return { hand: frame.detected, whole: false }
  // The model always names its closest letter; the letter's shape rules catch
  // hands that are only near it, such as an open hand for B.
  const result = kind.classify(model, frame.landmarks)
  return { hand: frame.detected, whole: true, ...result, fix: shapeFix(result.letter, frame.landmarks) }
}

const percent = (share) => `${Math.round(share * 100)}%`

// Loads a model's file, again whenever the kind changes.
// { status: 'loading' | 'ready' | 'error', model, error }
function useModelFile(kind) {
  // Each result remembers which kind it's for, so right after a switch the
  // old model reads as still loading instead of being used for the new kind.
  const [state, setState] = useState({ kind: null })
  useEffect(() => {
    let cancelled = false
    fetch(kind.url)
      .then((response) => {
        // Vite's dev server answers a missing file with index.html and
        // status 200, so check the type as well as the status.
        if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
          throw new Error(kind.missing)
        }
        return response.json()
      })
      .then((json) => {
        if (!cancelled) setState({ kind, status: 'ready', model: kind.readModel(json) })
      })
      .catch((error) => {
        if (!cancelled) setState({ kind, status: 'error', error: error.message })
      })
    // Switching kinds or leaving the page before it loads (or React's test
    // unmount in development) must not set state afterwards.
    return () => {
      cancelled = true
    }
  }, [kind])
  return state.kind === kind ? state : LOADING
}

// One object, so a render while loading doesn't look like a change to effects.
const LOADING = { status: 'loading' }
