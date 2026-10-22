import { useEffect, useId, useRef, useState } from 'react'
import MenuBar from '../../app/layout/MenuBar.jsx'
import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import AslDrawing from '../../components/AslDrawing.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { useLetters } from '../../recorder/letters.js'
import { frameFromDetection } from '../../recorder/takeRules.js'
import { isWholeHand } from '../../vision/landmarks/handChecks.js'
import { useHandDetection } from '../../vision/tracking/useHandDetection.js'
import GuidePanel from './GuidePanel.jsx'
import * as knnModel from './knnModel.js'
import {
  LETTER_HOLD_MS,
  NO_HOLD,
  heldLongEnough,
  holdSecondsLeft,
  showsLetter,
  tryStatus,
  updateLetterHold,
} from './letterHold.js'
import * as networkModel from './networkModel.js'

const RUN_TRAIN = 'python3 training/train.py data/extracted/<file>.json data/raw/<session>.json'
const RUN_TRAIN_SMALL = 'python3 training/train_small.py data/extracted/<file>.json data/raw/<session>.json'

// The two classifiers this page can run: where each one's file is, how to
// read it and judge a hand with it, and what to say when it's missing.
const MODELS = {
  small: {
    label: 'Small model',
    // Saved by training/train_small.py into public/ and committed: only
    // weights, a few KB, so the live site has it too.
    url: `${import.meta.env.BASE_URL}models/asl-letters.json`,
    ...networkModel,
    missing: `No small model yet. Run: ${RUN_TRAIN_SMALL}`,
  },
  knn: {
    label: 'k-NN',
    // Saved by training/train.py, gitignored (11 MB: every training hand);
    // Vite's dev server serves it from the project, the live site doesn't,
    // so it's only offered under npm run dev.
    url: `${import.meta.env.BASE_URL}data/models/knn-asl.json`,
    ...knnModel,
    missing: `No k-NN model yet. Run: ${RUN_TRAIN}`,
  },
}
// Under npm run dev, the page also shows the model switch and which model is
// running. The live site has only the small model, so it shows neither.
const SHOW_DEV_TOOLS = import.meta.env.DEV
// The "Right now" line is redrawn at most this often. The detection loop runs
// about 30 times a second, and redrawing the page that often isn't needed to
// read it. The hold itself is checked on every frame.
const SHOW_EVERY_MS = 100
// The letter picked when the page opens: the first of the 8 that work best.
const FIRST_LETTER = 'B'

// Try: the main page for now (2026-10-22), and the prototype of Practice
// (3.4). Pick a letter in the guide, make it, and hold it for 3 seconds
// (letterHold.js); the classifier trained in training/ (step 5's small model)
// judges every frame. Record's three columns: the letter to make on the left
// (big, its drawing, how to form it, what Sema sees right now), the camera in
// the camera check's panel (a status and a line that fills over the 3
// seconds), and the letter guide on the right, its drawings facing the
// signing hand (the saved setting). Under npm run dev, a switch also offers
// step 4's k-nearest-neighbours. The camera waits for a click, as on the
// camera check: landing on Sema never turns it on. Each hand goes through the
// recorder's own frameFromDetection, so it's normalized exactly as recorded.
export default function TryPage({ signingHand }) {
  const camera = useSharedCamera()
  const { handModel } = camera
  const isDetecting = camera.status === 'live' && handModel.status === 'ready'
  const canvasRef = useRef(null)
  const listenerRef = useRef(null)
  const hand = useHandDetection({
    videoRef: camera.videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    listenerRef,
    isRunning: isDetecting,
    drawAllHands: true,
  })
  const [choice, setChoice] = useState('small')
  const kind = MODELS[choice]
  const loaded = useModelFile(kind)
  const letters = useLetters()
  const drawnHand = signingHand ?? 'right'

  // The letter to make, and each round of it: picking a letter or Try again
  // starts a new round, which starts the hold over.
  const [target, setTarget] = useState(FIRST_LETTER)
  const [round, setRound] = useState(0)
  const [passed, setPassed] = useState(false)
  const [guesses, setGuesses] = useState([])
  const [holdStart, setHoldStart] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  function startRound(letter) {
    setTarget(letter)
    setPassed(false)
    setRound((n) => n + 1)
  }

  // The detection loop calls the listener on every frame, with every hand.
  // State only changes when a value does, so React skips most of these.
  useEffect(() => {
    if (loaded.status !== 'ready') return
    let shownAt = 0
    let hold = NO_HOLD
    let done = false
    listenerRef.current = (detection) => {
      if (done) return
      const now = detection.time
      const frame = detection.hands.map((h) => guess(kind, loaded.model, h, detection)).filter(Boolean)
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
      // So a new round, or the other model, starts from nothing.
      setGuesses([])
      setHoldStart(null)
      setSecondsLeft(null)
    }
  }, [kind, loaded, target, round])

  // Only what's true now counts: with the camera or tracking stopped, no hand
  // is in view and no hold is running.
  const shown = isDetecting ? guesses : []
  const holding = isDetecting && !passed && holdStart !== null
  const { status, tone } = tryStatus({
    cameraStatus: camera.status,
    cameraError: camera.error,
    trackingError: handModel.status === 'error' || Boolean(hand.error),
    ready: handModel.status === 'ready' && loaded.status === 'ready',
    passed,
    secondsLeft: holding ? secondsLeft : null,
    guesses: shown,
    target,
  })
  const steps = letters.instructions[target]

  return (
    <>
      <MenuBar active="try" />

      <main className="try">
        <div className="try-intro">
          <p>
            Pick a letter in the guide, make it with either hand, and hold it for 3 seconds. The letters with a dot
            work best so far.
          </p>
          {SHOW_DEV_TOOLS && <ModelSwitch choice={choice} onChange={setChoice} />}
        </div>

        <div className="try-results">
          <section className="try-target" aria-labelledby="try-target-title">
            <h2 id="try-target-title">Your letter</h2>
            <div className="try-target-row">
              <p className="try-letter">{target}</p>
              <span className="try-target-drawing">
                <AslDrawing letter={target} hand={drawnHand} />
              </span>
            </div>
            {steps && (
              <ul className="try-steps">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            )}
            {steps && drawnHand === 'left' && <p className="try-steps-note">Mirror it for your left hand.</p>}
            {loaded.status === 'ready' && isDetecting && <RightNow guesses={shown} />}
          </section>
          {loaded.status === 'loading' && <p className="try-note">Loading the model…</p>}
          {loaded.status === 'error' && (
            <p className="error" role="alert">
              {loaded.error}
            </p>
          )}
          {SHOW_DEV_TOOLS && loaded.status === 'ready' && (
            <p className="try-model">
              {choice === 'small' ? (
                <>
                  Model: {loaded.model.name}, &ldquo;not sure&rdquo; under {percent(loaded.model.threshold)}.
                </>
              ) : (
                <>
                  Model: {loaded.model.count.toLocaleString()} training hands, k = {loaded.model.k}, &ldquo;not
                  sure&rdquo; beyond {loaded.model.threshold.toFixed(2)}.
                </>
              )}
            </p>
          )}
        </div>

        <div className="try-camera">
          {/* The camera check's panel, dark in every theme (.on-dark). */}
          <div className="camera-panel on-dark try-panel" role="group" aria-label="Camera preview">
            <div className="camera-panel-head">
              {/* A live region: screen readers hear each new status. */}
              <span className={`camera-panel-status ${tone}`} role="status">
                {status}
              </span>
              <div className="camera-progress" aria-hidden="true">
                {(holding || passed) && (
                  <span
                    key={passed ? 'passed' : holdStart}
                    className={passed ? 'full' : 'filling'}
                    style={{ animationDuration: `${LETTER_HOLD_MS}ms` }}
                  />
                )}
              </div>
            </div>
            <CameraView canvasRef={canvasRef} hand={hand} className="try-stage" autoStart={false}>
              {passed && (
                <div className="try-done">
                  <p className="try-done-title">That&rsquo;s {target}!</p>
                  <button type="button" className="button" onClick={() => startRound(target)}>
                    Try again
                  </button>
                  <p className="try-done-note">or pick another letter in the guide</p>
                </div>
              )}
            </CameraView>
          </div>
        </div>

        <GuidePanel hand={drawnHand} selected={target} onSelect={startRound} />
      </main>
    </>
  )
}

// What Sema sees right now, one line per hand in view, so it's clear why the
// hold isn't counting. The small model gives a percentage; the k-NN doesn't.
function RightNow({ guesses }) {
  if (guesses.length === 0) return <p className="try-now">Right now: no hand in view</p>
  return (
    <div className="try-now">
      {guesses.map((g, i) => (
        <p key={i}>
          {g.hand === 'left' ? 'Left hand' : 'Right hand'}: {seenText(g)}
        </p>
      ))}
    </div>
  )
}

function seenText(g) {
  if (!g.whole) return 'show the whole hand'
  if (!g.sure) return 'not sure'
  return 'confidence' in g ? `${g.letter}, ${percent(g.confidence)} sure` : g.letter
}

// The small model or the k-NN: real radio buttons, like the theme toggle, so
// screen readers announce one "Model" group and the arrow keys move between them.
function ModelSwitch({ choice, onChange }) {
  const name = useId()
  return (
    <fieldset className="try-switch">
      <legend className="visually-hidden">Model</legend>
      <div className="try-switch-track">
        {Object.entries(MODELS).map(([id, { label }]) => (
          <label key={id}>
            <input type="radio" name={name} value={id} checked={choice === id} onChange={() => onChange(id)} />
            <span className="try-switch-option">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// One hand's guess, or null if its points are unusable.
function guess(kind, model, hand, { width, height }) {
  const frame = frameFromDetection({ ...hand, width, height }, null)
  if (!frame.hasHand) return null
  // Training only used whole hands (training/dataset.py), and so does Record.
  if (!isWholeHand(hand.landmarks)) return { hand: frame.detected, whole: false }
  return { hand: frame.detected, whole: true, ...kind.classify(model, frame.landmarks) }
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
