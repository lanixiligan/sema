import { useEffect, useRef, useState } from 'react'
import CameraStage from '../../components/CameraStage.jsx'
import { LockIcon } from '../../components/icons.jsx'
import StageProblem from '../../components/StageProblem.jsx'
import { PATHS } from '../../app/router.js'
import TopBar from '../../app/TopBar.jsx'
import StepNav from './StepNav.jsx'
import { useSharedCamera } from '../../app/sharedCamera.js'
import { CAMERA_CHECK_ERRORS, CAMERA_CHECK_OTHER_TITLE } from '../../camera/cameraMessages.js'
import { NO_HOLD, holdSecondsLeft, seeHands, steadySeen, updateHold } from '../../vision/handChecks.js'
import { useHandDetection } from '../../vision/useHandDetection.js'
import { CAMERA_CHECK_NO_WEBGL, CAMERA_CHECK_TRACKING_FAILED_TITLE } from '../../vision/visionMessages.js'

const NOT_SEEN = { left: 'none', right: 'none' }
const HANDS = ['left', 'right']

// Setup's one page, the camera check. The camera starts by itself
// (CameraStage), and Sema looks for both hands, drawing the 21 points on each
// hand it finds. The checklist under the video shows each hand as it is now.
// The check passes once both hands have been up, whole (wrist included), at
// the same time for 3 seconds (handChecks.js): needing both at once means one
// hand that MediaPipe labels wrongly while it turns can't pass for the other.
// A short line on the video says what to do, counts the 3 seconds down, and
// says when it's done. Next opens then, stays open, and finishes setup.
export default function CameraCheckPage({ onDone }) {
  const camera = useSharedCamera()
  const { handModel } = camera
  const isLive = camera.status === 'live'
  const isDetecting = isLive && handModel.status === 'ready'
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

  // What Sema sees of each hand now (handChecks.js: 'none', 'part', 'whole'),
  // the seconds left in the 3-second hold (null with no hold), and whether
  // the check has passed. The detection loop calls the listener on every
  // frame; state only changes when a value does, so the page doesn't
  // re-render 30 times a second. steadySeen keeps a hand missed for a frame
  // from flickering.
  const [seen, setSeen] = useState(NOT_SEEN)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    const lastSeenAt = { left: 0, right: 0 }
    let shownSeen = NOT_SEEN
    let hold = NO_HOLD
    listenerRef.current = (detection) => {
      const now = detection.time
      const frame = seeHands(detection.hands)
      for (const side of HANDS) if (frame[side] !== 'none') lastSeenAt[side] = now
      const steady = steadySeen(shownSeen, frame, lastSeenAt, now)
      if (steady.left !== shownSeen.left || steady.right !== shownSeen.right) {
        shownSeen = steady
        setSeen(steady)
      }
      hold = updateHold(hold, frame, now)
      const left = holdSecondsLeft(hold, now)
      setSecondsLeft(left)
      if (left === 0) setPassed(true)
    }
    return () => {
      listenerRef.current = null
    }
  }, [])
  const shown = isDetecting ? seen : NOT_SEEN

  const failure = describeFailure(camera, handModel, hand.error)

  return (
    <div className="setup-page">
      <TopBar />
      <main className="camera-check">
        <section className="camera-check-text">
          <div>
            <h1 className="setup-title">Check your camera</h1>
            <p className="setup-lead">
              Sema needs to see both of your hands at once. Hold them up together, wrists in view, and keep them
              there for 3 seconds.
            </p>
          </div>

          <div className="camera-check-picker">
            <label htmlFor="setup-camera">Camera</label>
            <select
              id="setup-camera"
              value={camera.deviceId ?? ''}
              disabled={camera.cameras.length === 0}
              onChange={(event) => camera.switchCamera(event.target.value)}
            >
              {camera.cameras.length === 0 ? (
                <option value="">Default webcam</option>
              ) : (
                camera.cameras.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>
        </section>

        <section className="camera-check-preview" aria-label="Camera preview">
          <CameraStage canvasRef={canvasRef} className="stage camera-check-stage">
            {failure ? (
              <StageProblem
                title={failure.title}
                body={failure.body}
                onRetry={failure.canRetry ? camera.start : undefined}
              />
            ) : (
              <>
                {/* The short instruction on the video. It's a live region, so
                    screen readers also hear "Both hands found". */}
                <p className={`camera-check-hint${passed ? ' done' : ''}`} role="status">
                  {passed && <span aria-hidden="true">✓</span>}
                  {hint(passed, secondsLeft)}
                </p>
                <ul className="camera-checks" aria-label="Camera checks">
                  {HANDS.map((side) => (
                    <Check key={side} {...handCheck(side, shown[side], passed)} />
                  ))}
                </ul>
              </>
            )}
          </CameraStage>
          <p className="camera-check-private">
            <LockIcon size={14} />
            Your video stays on this device.
          </p>
        </section>
      </main>
      <StepNav previous={{ to: PATHS.privacy }} next={{ onClick: onDone, disabled: Boolean(failure) || !passed }} />
    </div>
  )
}

// One check in the strip under the video: ✓ passed (blue), ! needs something
// (amber), ○ waiting (grey). The mark is decoration; the text says it all.
const MARKS = { ok: '✓', warn: '!', wait: '○' }

function Check({ state, text }) {
  return (
    <li className={`camera-check-item ${state}`}>
      <span aria-hidden="true">{MARKS[state]}</span>
      {text}
    </li>
  )
}

// One hand's check: once the check has passed, ✓ found; before that, how the
// hand is now: ✓ in view, ! only part of it, ○ not in view.
function handCheck(side, seen, passed) {
  const Hand = capitalize(side)
  if (passed) return { state: 'ok', text: `${Hand} hand found` }
  if (seen === 'whole') return { state: 'ok', text: `${Hand} hand in view` }
  if (seen === 'part') return { state: 'warn', text: `${Hand} hand: show the wrist too` }
  return { state: 'wait', text: `${Hand} hand` }
}

// The line on the video: what to do, the countdown, or that it's done.
function hint(passed, secondsLeft) {
  if (passed) return 'Both hands found. You can continue.'
  if (secondsLeft) return `Keep both hands up… ${secondsLeft}`
  return 'Hold up both hands, wrists in view'
}

// What went wrong, as the title and text the error panel shows, or null.
// Camera problems can be retried; hand-tracking problems can't from here.
function describeFailure(camera, handModel, detectionError) {
  if (camera.error) {
    const known = CAMERA_CHECK_ERRORS[camera.errorKind]
    return { ...(known ?? { title: CAMERA_CHECK_OTHER_TITLE, body: camera.error }), canRetry: true }
  }
  if (handModel.status === 'error') {
    if (handModel.errorName === 'WebGLUnavailableError') return { ...CAMERA_CHECK_NO_WEBGL, canRetry: false }
    return { title: CAMERA_CHECK_TRACKING_FAILED_TITLE, body: handModel.error, canRetry: false }
  }
  if (detectionError) return { title: CAMERA_CHECK_TRACKING_FAILED_TITLE, body: detectionError, canRetry: false }
  return null
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
