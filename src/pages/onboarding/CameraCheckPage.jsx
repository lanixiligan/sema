import { useEffect, useRef, useState } from 'react'
import CameraStage from '../../components/CameraStage.jsx'
import Link from '../../app/Link.jsx'
import { LockIcon } from '../../components/icons.jsx'
import StageProblem from '../../components/StageProblem.jsx'
import { PATHS } from '../../app/router.js'
import SetupBar from './SetupBar.jsx'
import { useSharedCamera } from '../../app/sharedCamera.js'
import { CAMERA_CHECK_ERRORS, CAMERA_CHECK_OTHER_TITLE } from '../../camera/cameraMessages.js'
import { checkHand } from '../../vision/handChecks.js'
import { useHandDetection } from '../../vision/useHandDetection.js'
import { CAMERA_CHECK_NO_WEBGL, CAMERA_CHECK_TRACKING_FAILED_TITLE } from '../../vision/visionMessages.js'

const NO_HAND = { hand: 'none', wholeHand: false }

// Setup step 2 of 2: the camera starts by itself (CameraStage), and two checks
// say whether Sema sees the signing hand and all of it, wrist included.
// Continue is open unless the camera or hand tracking failed: the checks are
// guidance, as in the design ("When both checks turn blue, you're ready").
export default function CameraCheckPage({ signingHand, onSwitchHand, onDone }) {
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
  })

  // The detection loop calls the listener on every frame. State only changes
  // when the result does, so the page doesn't re-render 30 times a second. A
  // frame without a hand is ignored here: useHandDetection reports the hand
  // lost after 300 ms (hand.handLabel becomes null), which keeps the checks
  // from flickering.
  const [checks, setChecks] = useState(NO_HAND)
  useEffect(() => {
    listenerRef.current = (detection) => {
      const next = checkHand(detection, signingHand)
      if (next.hand === 'none') return
      setChecks((prev) => (prev.hand === next.hand && prev.wholeHand === next.wholeHand ? prev : next))
    }
    return () => {
      listenerRef.current = null
    }
  }, [signingHand])
  const shown = isDetecting && hand.handLabel ? checks : NO_HAND

  const failure = describeFailure(camera, handModel, hand.error)
  const other = signingHand === 'left' ? 'right' : 'left'

  return (
    <div className="setup-page">
      <SetupBar step={2} />
      <main className="camera-check">
        <section className="camera-check-text">
          <div>
            <h1 className="setup-title">Check your camera</h1>
            <p className="setup-lead">
              Hold up your {signingHand} hand anywhere in view. When both checks turn blue, you're ready.
            </p>
          </div>

          {!failure && shown.hand === 'other' && (
            <div className="other-hand-note" role="status">
              <strong>That looks like your {other} hand.</strong> You chose to sign with your {signingHand}. Sema
              only follows the hand you chose, so switch hands or change your choice.
              <button type="button" onClick={() => onSwitchHand(other)}>
                Sign with my {other} hand instead
              </button>
            </div>
          )}

          <ul className="camera-check-tips">
            <li>Keep your whole hand and wrist in view.</li>
            <li>Light on your hand helps Sema find it.</li>
          </ul>

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

          <div className="setup-actions">
            <Link to={PATHS.signingHand} className="back-link">
              Back
            </Link>
            <button type="button" className="primary-button" disabled={Boolean(failure)} onClick={onDone}>
              Continue
            </button>
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
              <ul className="camera-checks" aria-label="Camera checks" aria-live="polite">
                <Check {...handCheck(shown, signingHand, other)} />
                <Check {...wholeHandCheck(shown)} />
              </ul>
            )}
          </CameraStage>
          <p className="camera-check-private">
            <LockIcon size={14} />
            Your video stays on this device.
          </p>
        </section>
      </main>
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

function handCheck(checks, signingHand, other) {
  const Hand = capitalize(signingHand)
  if (checks.hand === 'match') return { state: 'ok', text: `${Hand} hand found` }
  if (checks.hand === 'other') return { state: 'warn', text: `${capitalize(other)} hand seen: waiting for your ${signingHand}` }
  return { state: 'wait', text: `Waiting for your ${signingHand} hand` }
}

function wholeHandCheck(checks) {
  if (checks.hand !== 'match') return { state: 'wait', text: 'Show your whole hand, including the wrist' }
  if (checks.wholeHand) return { state: 'ok', text: 'Whole hand in view' }
  return { state: 'warn', text: 'Show your whole hand, including the wrist' }
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
