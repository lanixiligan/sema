import { useEffect, useRef, useState } from 'react'
import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import { frameFromDetection } from '../../recorder/takeRules.js'
import { isWholeHand } from '../../vision/landmarks/handChecks.js'
import { TIPS } from '../../vision/landmarks/handPoints.js'
import { J_START_HOLD_MS, jPath, jScale } from '../../vision/landmarks/jTrace.js'
import { emptyChecks, matchLetter, steadyChecks } from '../../vision/landmarks/letterMatch.js'
import { TRACED_LETTERS } from '../../vision/landmarks/letterShapes.js'
import { NO_TRACE, fingertip, traceDone, traceShare, updateTrace, zPath } from '../../vision/landmarks/zTrace.js'
import { useHandDetection } from '../../vision/tracking/useHandDetection.js'
import { clearTrace, drawTrace } from './drawTrace.js'
import * as knnModel from './knnModel.js'
import {
  LETTER_HOLD_MS,
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

// The two classifiers a page can run: where each one's file is, how to
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
// Under npm run dev the k-NN can be chosen on /dev. The live site has only
// the small model.
const SHOW_DEV_TOOLS = import.meta.env.DEV
// The guesses (for Practice's "Right now" line) are passed on at most this
// often. The detection loop runs about 30 times a second, and redrawing the
// page that often isn't needed to read it. The hold itself is checked on
// every frame.
const SHOW_EVERY_MS = 100
// The traced letters: the fingertip that traces, and for J, how long its
// starting handshape (I) is held before the line appears at that fingertip.
// Z's line is always there, fixed in the frame.
const TRACES = {
  J: { tip: TIPS.pinky, startHoldMs: J_START_HOLD_MS },
  Z: { tip: TIPS.index, startHoldMs: null },
}

// Is the signing hand making `target`? The check Practice and the quiz share
// (moved out of PracticePage on 2026-10-27, for the quiz). Every frame scores
// the letter's finger conditions (letterShapes.js), and the letter passes
// after a 3-second hold while they're met (letterHold.js); the classifier
// trained in training/ only gives the "Right now" guess. J and Z are traced
// instead (zTrace.js, jTrace.js), their handshape's conditions met all along.
// Only the signing hand is drawn and judged. Each hand goes
// through the recorder's own frameFromDetection, so it's normalized exactly
// as recorded.
// `round`: a number the page changes to start the same letter over (Try
// again), or to check the next one; a new round starts the hold over.
// Returns what the page shows: the refs and hand for its CameraView, the
// panel's status, tone, hold and fill, `passed`, the guesses, and the
// conditions with their ticks (`checks`).
export function useLetterCheck({ target, round, signingHand, model = 'small' }) {
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
  const traced = TRACED_LETTERS.includes(target)

  // Which round passed. Passing remembers its round, so a new round (or a new
  // letter) isn't passed yet, with nothing to reset.
  const roundKey = `${target}/${round}`
  const [passedKey, setPassedKey] = useState(null)
  const passed = passedKey === roundKey
  const [guesses, setGuesses] = useState([])
  // The target's finger conditions for the signing hand, ticks steadied
  // (letterShapes.js), or null with no signing hand in view.
  const [checks, setChecks] = useState(null)
  // When the hold started: the letter's hold, or for J, the I's before its line.
  const [holdStart, setHoldStart] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  // J's and Z's trace: started on the dot, how much is traced (0 to 1), and
  // the canvas under the hand drawing that shows it.
  const [tracing, setTracing] = useState(false)
  const [traceFill, setTraceFill] = useState(0)
  const traceCanvasRef = useRef(null)

  // The detection loop calls the listener on every frame, with every hand.
  // State only changes when a value does, so React skips most of these.
  useEffect(() => {
    // J and Z move, so they're traced instead (the next effect).
    if (loaded.status !== 'ready' || traced) return
    let shownAt = 0
    let hold = NO_HOLD
    let done = false
    let ticks = null
    listenerRef.current = (detection) => {
      if (done) return
      const now = detection.time
      // Only the signing hand counts: the other one isn't drawn, so it
      // mustn't be able to make the letter either.
      const frame = detection.hands
        .map((h) => guess(kind, loaded.model, h, detection, target))
        .filter((g) => g && g.hand === drawnHand)
      const scored = frame.find((g) => g.checks)?.checks
      ticks = scored ? steadyChecks(ticks, scored) : null
      hold = updateLetterHold(hold, showsLetter(frame), now)
      setHoldStart(hold.start)
      setSecondsLeft(holdSecondsLeft(hold, now))
      if (heldLongEnough(hold, now)) {
        done = true
        setPassedKey(roundKey)
      }
      if (now - shownAt >= SHOW_EVERY_MS) {
        shownAt = now
        setGuesses(frame)
        setChecks(ticks)
      }
    }
    return () => {
      listenerRef.current = null
      // So a new round, the other model or the other hand starts from nothing.
      setGuesses([])
      setChecks(null)
      setHoldStart(null)
      setSecondsLeft(null)
    }
  }, [kind, loaded, target, roundKey, traced, drawnHand])

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
    let ticks = null
    let shownAt = 0
    listenerRef.current = (detection) => {
      if (done) return
      const now = detection.time
      const aspect = detection.width / detection.height
      // The handshape must hold all along (J's is I's).
      const seen = signingHandChecks(detection, drawnHand, target)
      ticks = seen ? steadyChecks(ticks, seen.checks) : null
      if (now - shownAt >= SHOW_EVERY_MS) {
        shownAt = now
        setChecks(ticks)
      }
      const raw = seen?.makes ? seen.raw : null
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
        setPassedKey(roundKey)
      }
    }
    return () => {
      listenerRef.current = null
      setChecks(null)
      setTracing(false)
      setTraceFill(0)
      setHoldStart(null)
    }
  }, [traced, target, roundKey, drawnHand])

  // Only what's true now counts: with the camera or tracking stopped, no hand
  // is in view and no hold is running.
  const shown = isDetecting ? guesses : []
  // A letter's hold, or J's I before its line appears.
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
  // The camera panel's line: over a letter's hold, or J's I before its
  // line appears.
  const hold = traced
    ? holdingI && { start: holdStart, ms: J_START_HOLD_MS, done: false }
    : (holding || passed) && { start: holdStart, ms: LETTER_HOLD_MS, done: passed }
  // A traced letter's line fills as it's traced instead.
  const share = passed ? 1 : traceFill
  const fill = traced &&
    (passed || (isDetecting && tracing)) && {
      share,
      label: `${target} traced`,
      text: `${Math.round(share * 100)}%`,
    }

  return {
    canvasRef,
    traceCanvasRef,
    hand,
    drawnHand,
    isDetecting,
    traced,
    loaded,
    guesses: shown,
    checks: isDetecting && checks ? checks : emptyChecks(target),
    passed,
    status,
    tone,
    hold,
    fill,
  }
}

// The signing hand's raw points, the letter's conditions scored for it and
// whether it makes the letter's handshape (matchLetter), or null when that
// hand isn't in view.
function signingHandChecks({ hands, width, height }, signingHand, letter) {
  for (const hand of hands) {
    const frame = frameFromDetection({ ...hand, width, height }, null)
    if (frame.hasHand && frame.detected === signingHand) {
      return { raw: hand.landmarks, ...matchLetter(letter, frame.landmarks) }
    }
  }
  return null
}

// One hand's guess, with the target's finger conditions scored for it, or
// null if its points are unusable.
function guess(kind, model, hand, { width, height }, target) {
  const frame = frameFromDetection({ ...hand, width, height }, null)
  if (!frame.hasHand) return null
  // Training only used whole hands (training/dataset.py), and so does Record.
  if (!isWholeHand(hand.landmarks)) return { hand: frame.detected, whole: false }
  // The model's guess is only shown ("Right now"); the conditions decide.
  const result = kind.classify(model, frame.landmarks)
  return { hand: frame.detected, whole: true, ...result, ...matchLetter(target, frame.landmarks) }
}

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
