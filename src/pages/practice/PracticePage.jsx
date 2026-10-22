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
import { useHandDetection } from '../../vision/tracking/useHandDetection.js'
import GuidePanel from './GuidePanel.jsx'
import * as knnModel from './knnModel.js'
import {
  LETTER_HOLD_MS,
  MOVING_LETTERS,
  NO_HOLD,
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

// Practice: the main page for now (2026-10-23; until then it was Try, at
// /try). Pick a letter in the guide, make it, and hold it for 3 seconds
// (letterHold.js); the classifier trained in training/ (step 5's small model)
// judges every frame. Record's three columns: the letter guide on the left,
// the camera in the camera check's panel (a status and a line that fills over
// the 3 seconds) with the hand switch in its controls, and the letter to make
// on the right (its drawing, large, how to form it, what Sema sees right
// now). The drawings face the signing hand, the saved setting the hand switch
// changes; either hand can make the letter. The camera waits for a click, as on
// the camera check: landing on Sema never turns it on. Each hand goes through
// the recorder's own frameFromDetection, so it's normalized exactly as recorded.
export default function PracticePage({ signingHand, onSigningHandChange, model = 'small' }) {
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
  const kind = MODELS[SHOW_DEV_TOOLS ? model : 'small']
  const loaded = useModelFile(kind)
  const letters = useLetters()
  const drawnHand = signingHand ?? 'right'

  // The letter to make, and each round of it: picking a letter or Try again
  // starts a new round, which starts the hold over.
  const [target, setTarget] = useState(FIRST_LETTER)
  const moving = MOVING_LETTERS.includes(target)
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
    // A moving letter (J, Z) can't be checked, so nothing is judged or held.
    if (loaded.status !== 'ready' || moving) return
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
  }, [kind, loaded, target, round, moving])

  // Only what's true now counts: with the camera or tracking stopped, no hand
  // is in view and no hold is running.
  const shown = isDetecting ? guesses : []
  const holding = isDetecting && !passed && holdStart !== null
  const { status, tone } = practiceStatus({
    cameraStatus: camera.status,
    cameraError: camera.error,
    trackingError: handModel.status === 'error' || Boolean(hand.error),
    ready: handModel.status === 'ready' && loaded.status === 'ready',
    passed,
    secondsLeft: holding ? secondsLeft : null,
    guesses: shown,
    target,
    moving,
  })
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
            hold={(holding || passed) && { start: holdStart, ms: LETTER_HOLD_MS, done: passed }}
          >
            {/* The hand switch, as on Record: here it changes the signing
                hand, so the drawings face the hand being used. */}
            <CameraView
              canvasRef={canvasRef}
              hand={hand}
              className="practice-stage"
              autoStart={false}
              controls={{ hand: drawnHand, onHandChange: onSigningHandChange, handLabel: 'Signing hand' }}
            >
              {moving && (
                <div className="practice-done">
                  <p className="practice-done-title">Letter {target} is unavailable</p>
                  <p className="practice-done-note">{target} moves, and Sema can only check still handshapes for now.</p>
                </div>
              )}
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
          {!moving && loaded.status === 'ready' && isDetecting && <RightNow guesses={shown} />}
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

// What Sema sees right now, one line per hand in view, so it's clear why the
// hold isn't counting. The small model gives a percentage; the k-NN doesn't.
function RightNow({ guesses }) {
  if (guesses.length === 0) return <p className="practice-now">Right now: no hand in view</p>
  return (
    <div className="practice-now">
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
