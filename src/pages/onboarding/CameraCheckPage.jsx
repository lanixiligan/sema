import { useEffect, useRef, useState } from 'react'
import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import TopBar from '../../app/layout/TopBar.jsx'
import CameraPanel from '../../components/camera-view/CameraPanel.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { CheckIcon } from '../../components/icons/icons.jsx'
import { CHECK_HOLD_MS, NO_HOLD, holdSecondsLeft, seeHand, steadySeen, updateHold } from '../../vision/landmarks/handChecks.js'
import { useHandDetection } from '../../vision/tracking/useHandDetection.js'

// Setup's one page, the camera check: Sema must see one hand, left or right,
// whole (wrist included) for 3 seconds (handChecks.js). Two columns:
// - a checklist of three numbered steps (enable the camera, show one hand,
//   hold still), each ticked off once it's really done;
// - the camera panel: a header with a short status, and along its bottom
//   edge a line that fills over the 3 seconds; then the live video (only the
//   camera controls on it).
// When the check passes, a "Camera ready" sticker slaps onto the video for a
// moment, and the key button under the steps (greyed out until then) turns on
// and finishes setup.
// Redesigned 2026-10-31 in Welcome's look (stickers, Gabarito, the amber key
// button), but the page follows the theme: light or dark, not Welcome's blue.
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

  // What Sema sees of the hand now (handChecks.js: 'none', 'part', 'whole'),
  // when the current 3-second hold started (null with no hold; a new start
  // restarts the bar), the seconds left in it, and whether the check has
  // passed. The detection loop calls the listener on every frame; state only
  // changes when a value does, so the page doesn't re-render 30 times a
  // second. steadySeen keeps a hand missed for a frame from flickering.
  const [seen, setSeen] = useState('none')
  const [holdStart, setHoldStart] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    let lastSeenAt = 0
    let shownSeen = 'none'
    let hold = NO_HOLD
    listenerRef.current = (detection) => {
      const now = detection.time
      const frame = seeHand(detection.hands)
      if (frame !== 'none') lastSeenAt = now
      const steady = steadySeen(shownSeen, frame, lastSeenAt, now)
      if (steady !== shownSeen) {
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
  const shown = isDetecting ? seen : 'none'
  const holding = isDetecting && !passed && holdStart !== null
  const handInView = shown === 'whole'

  const steps = [
    passed || isLive ? 'done' : 'active',
    passed || handInView ? 'done' : isLive ? 'active' : 'todo',
    passed ? 'done' : holding ? 'active' : 'todo',
  ]
  const { status, tone } = readiness({ camera, handModel, hand, passed, holding, secondsLeft, shown })

  return (
    <div className="setup-page">
      <TopBar />
      <main className="camera-check">
        <section className="camera-check-text">
          <div>
            <h1 className="setup-title">First, let's check your camera</h1>
          </div>
          <ol className="setup-steps">
            <Step n={1} state={steps[0]} title="Enable your camera">
              Allow camera access when your browser asks, so Sema can see your hand.
            </Step>
            <Step n={2} state={steps[1]} title="Show one hand">
              Hold up your left or right hand with your wrist in view.
            </Step>
            <Step n={3} state={steps[2]} title="Hold still">
              Keep your hand visible for three seconds.
            </Step>
          </ol>
          {/* Always there, so the person sees where the check leads: greyed out
              and unclickable (disabled) until the check passes, then it pops
              up once (.ready) as it turns amber. */}
          <button
            type="button"
            className={`key-button camera-check-continue${passed ? ' ready' : ''}`}
            disabled={!passed}
            onClick={onDone}
          >
            Start learning
            <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
        </section>

        <section className="camera-check-preview">
          <CameraPanel
            status={status}
            tone={tone}
            hold={(holding || passed) && { start: holdStart, ms: CHECK_HOLD_MS, done: passed }}
          >
            {/* The camera waits for the person: arriving here isn't a choice
                to turn it on, so the browser only asks after Turn camera on. */}
            <CameraView
              canvasRef={canvasRef}
              hand={hand}
              className="camera-check-stage"
              autoStart={false}
              offNote="Turn it on when you're ready. Sema only looks for your hand."
            >
              {/* Plays once, when the check passes: the sticker slaps on,
                  waits, and fades out by itself (the panel's header says
                  "Camera ready" for good, and is what screen readers get). */}
              {passed && (
                <div className="camera-ready-flash" aria-hidden="true">
                  <span className="camera-ready-sticker">
                    <span className="camera-ready-check">
                      <CheckIcon size={22} strokeWidth={3} />
                    </span>
                    Camera ready
                  </span>
                </div>
              )}
            </CameraView>
          </CameraPanel>
        </section>
      </main>
    </div>
  )
}

// One numbered step, a sticker card: the step to do now is stuck on with an
// amber number; done ones get a green check stamped on; later ones are flat
// and quiet. The mark is decoration; screen readers get the state as text.
const STEP_STATE_TEXT = { done: 'done', active: 'now', todo: 'next' }

function Step({ n, state, title, children }) {
  return (
    <li className={`setup-step-item ${state}`}>
      <span className="setup-step-mark" aria-hidden="true">
        {state === 'done' ? <CheckIcon size={22} strokeWidth={3} /> : n}
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

// What to do about the hand, from what Sema sees of it, in as few words as
// possible: first get a hand in view, then its wrist.
function handsStatus(shown) {
  if (shown === 'none') return 'Waiting for a hand'
  // Whole but no hold running only lasts a moment (the hand just left).
  if (shown === 'whole') return 'Hold still'
  return 'Show wrist'
}
