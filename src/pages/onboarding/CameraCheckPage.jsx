import { useEffect, useRef, useState } from 'react'
import { PATHS } from '../../app/routing/router.js'
import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import TopBar from '../../app/layout/TopBar.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { BOTH_HANDS_HOLD_MS, NO_HOLD, holdSecondsLeft, seeHands, steadySeen, updateHold } from '../../vision/landmarks/handChecks.js'
import { useHandDetection } from '../../vision/tracking/useHandDetection.js'
import StepNav from './StepNav.jsx'

const NOT_SEEN = { left: 'none', right: 'none' }
const HANDS = ['left', 'right']

// Setup's one page, the camera check: Sema must see both hands, whole (wrist
// included), at the same time for 3 seconds (handChecks.js). Needing both at
// once means one hand that MediaPipe labels wrongly while it turns can't pass
// for the other. Two columns:
// - a checklist of three numbered steps (enable the camera, show both hands,
//   hold still), each ticked off once it's really done;
// - the camera panel: a header with a short status, and along its bottom
//   edge a line that fills over the 3 seconds; then the live video (only the
//   camera controls on it).
// Next opens once the check passes, stays open, and finishes setup.
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
  // when the current 3-second hold started (null with no hold; a new start
  // restarts the bar), the seconds left in it, and whether the check has
  // passed. The detection loop calls the listener on every frame; state only
  // changes when a value does, so the page doesn't re-render 30 times a
  // second. steadySeen keeps a hand missed for a frame from flickering.
  const [seen, setSeen] = useState(NOT_SEEN)
  const [holdStart, setHoldStart] = useState(null)
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
      setHoldStart(hold.start)
      const left = holdSecondsLeft(hold, now)
      setSecondsLeft(left)
      if (left === 0) setPassed(true)
    }
    return () => {
      listenerRef.current = null
    }
  }, [])
  // Only what's true now counts: with the camera or tracking stopped, no hand
  // is in view and no hold is running.
  const shown = isDetecting ? seen : NOT_SEEN
  const holding = isDetecting && !passed && holdStart !== null
  const bothInView = shown.left === 'whole' && shown.right === 'whole'

  const steps = [
    passed || isLive ? 'done' : 'active',
    passed || bothInView ? 'done' : isLive ? 'active' : 'todo',
    passed ? 'done' : holding ? 'active' : 'todo',
  ]
  const { status, tone } = readiness({ camera, handModel, hand, passed, holding, secondsLeft, shown })

  return (
    <div className="setup-page">
      <TopBar />
      <main className="camera-check">
        <section className="camera-check-text">
          <div>
            <h1 className="setup-title">Check your camera</h1>
            <p className="setup-lead">Let's make sure your camera is ready before you start recording.</p>
          </div>
          <ol className="setup-steps">
            <Step n={1} state={steps[0]} title="Enable your camera">
              Allow camera access when your browser asks, so Sema can see your hands.
            </Step>
            <Step n={2} state={steps[1]} title="Show both hands">
              Hold both hands up with your wrists in view.
            </Step>
            <Step n={3} state={steps[2]} title="Hold still">
              Keep both hands visible for three seconds.
            </Step>
          </ol>
        </section>

        <section className="camera-check-preview">
          {/* Dark in every theme, like every camera frame (.on-dark). */}
          <div className="camera-panel on-dark" role="group" aria-label="Camera preview">
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
                    style={{ animationDuration: `${BOTH_HANDS_HOLD_MS}ms` }}
                  />
                )}
              </div>
            </div>
            {/* The camera waits for the person: arriving here isn't a choice
                to turn it on, so the browser only asks after Turn camera on. */}
            <CameraView
              canvasRef={canvasRef}
              hand={hand}
              className="camera-check-stage"
              autoStart={false}
              offNote="Turn it on when you're ready. Sema only looks for your hands."
            />
          </div>
        </section>
      </main>
      <StepNav previous={{ to: PATHS.privacy }} next={{ onClick: onDone, disabled: !passed }} />
    </div>
  )
}

// One numbered step: ✓ once done; the step to do now stands out; later ones
// are quiet. The mark is decoration; screen readers get the state as text.
const STEP_STATE_TEXT = { done: 'done', active: 'now', todo: 'next' }

function Step({ n, state, title, children }) {
  return (
    <li className={`setup-step-item ${state}`}>
      <span className="setup-step-mark" aria-hidden="true">
        {state === 'done' ? '✓' : n}
      </span>
      <div className="setup-step-body">
        <h2>
          {title}
          <span className="visually-hidden"> ({STEP_STATE_TEXT[state]})</span>
        </h2>
        <p>{children}</p>
      </div>
    </li>
  )
}

// The panel's status, short, from the camera, hand tracking and what Sema
// sees, and its tone: 'ok' (accent) while it's going well, 'warn' (amber) on
// a problem, '' otherwise. The problem panel on the video explains a failure
// in full.
function readiness({ camera, handModel, hand, passed, holding, secondsLeft, shown }) {
  if (camera.error) return { status: 'Camera problem', tone: 'warn' }
  if (handModel.status === 'error' || hand.error) return { status: 'Tracking problem', tone: 'warn' }
  if (passed) return { status: 'Camera ready', tone: 'ok' }
  if (camera.status === 'idle') return { status: 'Camera off', tone: '' }
  if (camera.status === 'starting') return { status: 'Starting…', tone: '' }
  if (handModel.status !== 'ready') return { status: 'Getting ready…', tone: '' }
  if (holding) return { status: `Hold still… ${secondsLeft}`, tone: 'ok' }
  return { status: handsStatus(shown), tone: '' }
}

// What to do about the hands, from what Sema sees of each, in as few words
// as possible: first get both hands in view, then their wrists.
function handsStatus(shown) {
  const inView = HANDS.filter((side) => shown[side] !== 'none').length
  if (inView === 0) return 'Waiting for both hands'
  if (inView === 1) return 'Show other hand'
  // Both whole but no hold running only lasts a moment (a hand just left).
  if (HANDS.every((side) => shown[side] === 'whole')) return 'Hold still'
  return 'Show wrists'
}
