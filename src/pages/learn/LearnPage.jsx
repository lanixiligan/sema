import { useState } from 'react'
import MenuBar from '../../app/layout/MenuBar.jsx'
import AslDrawing from '../../components/AslDrawing.jsx'
import CameraPanel from '../../components/camera-view/CameraPanel.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { useLetterCheck } from '../../components/letter-check/useLetterCheck.js'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'
import FingerChecklist from './FingerChecklist.jsx'
import GuidePanel from './GuidePanel.jsx'

// The letters in teaching order, for now plain A to Z. (Which order is best
// is still an open decision in docs/project-plan.md.)
const LESSONS = LETTERS

// The model's "Right now" line is for debugging, so only npm run dev has it.
const SHOW_DEV_TOOLS = import.meta.env.DEV

// Learn (Phase 3.3), the main page. It started on 2026-10-27 as the letters
// one at a time, and the same day Practice (the free sandbox) was merged into
// it, because the two had become nearly the same page. Record's three columns:
// the guide of all 26 letters on the left (pick any, or let a pass lead to the
// next), the camera in the middle, and the lesson on the right: the letter's
// drawing and the live finger checklist (2026-10-27; before, also its steps
// from letters.json, which said the same as the checklist). Make the letter and hold it for 3 seconds (letterHold.js) while
// its finger conditions are met (letterShapes.js); then "That's A!" and a
// button to the next letter. The check itself is useLetterCheck, shared with
// the quiz. The drawings face the signing hand (the saved setting the hand
// switch changes, Right by default); only that hand is drawn and judged. The
// camera waits for a click: landing on Sema never turns it on. Nothing is
// saved yet: opening Learn always starts at A.
export default function LearnPage({ signingHand, onSigningHandChange, model = 'small' }) {
  // The letter to make, and each round of it: picking a letter, Try again or
  // Next letter starts a new round, which starts the hold over.
  const [target, setTarget] = useState(LESSONS[0])
  const [round, setRound] = useState(0)
  function startRound(letter) {
    setTarget(letter)
    setRound((n) => n + 1)
  }

  const { canvasRef, traceCanvasRef, hand, drawnHand, isDetecting, traced, loaded, guesses, checks, passed, ...panel } =
    useLetterCheck({ target, round, signingHand, model })
  const index = LESSONS.indexOf(target)
  const next = LESSONS[index + 1]

  return (
    <>
      <MenuBar active="learn" />

      {/* Three columns that start and end on the same lines (grid areas in
          styles.css, shared with the quiz). */}
      <main className="practice learn">
        <GuidePanel hand={drawnHand} selected={target} onSelect={startRound} />

        <section className="practice-camera" aria-label="Camera">
          <CameraPanel
            className="practice-panel"
            status={panel.status}
            tone={panel.tone}
            hold={panel.hold}
            fill={panel.fill}
          >
            {/* The hand switch changes the signing hand, so the drawings face
                the hand being used. J's and Z's line is drawn under the hand. */}
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
                  {next && (
                    <button type="button" className="button" onClick={() => startRound(next)}>
                      Next letter: {next}
                    </button>
                  )}
                  <button type="button" className="button-quiet" onClick={() => startRound(target)}>
                    Try again
                  </button>
                </div>
              )}
            </CameraView>
          </CameraPanel>
        </section>

        <aside className="practice-side" aria-label="Your letter">
          <section className="letter-card letter-card-record" aria-labelledby="learn-letter-title">
            <div className="letter-card-head">
              <h2 id="learn-letter-title" className="letter-card-title">
                Letter {target}
              </h2>
              <span className="letter-card-count">
                {index + 1} of {LESSONS.length}
              </span>
            </div>
            {/* Large, on white in both themes (the drawings are black lines). */}
            <div className="reference-image reference-image-drawing">
              <AslDrawing letter={target} hand={drawnHand} alt={`Handshape for ${target}`} />
            </div>
          </section>
          <FingerChecklist checks={checks} />
          {SHOW_DEV_TOOLS && !traced && loaded.status === 'ready' && isDetecting && (
            <RightNow guesses={guesses} hand={drawnHand} />
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

// What the letter model makes of the signing hand right now. It doesn't
// decide the hold (the checklist does); it's there to compare. The small
// model gives a percentage; the k-NN doesn't.
function RightNow({ guesses, hand }) {
  if (guesses.length === 0) return <p className="practice-now">Right now: no {hand} hand in view</p>
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

const percent = (share) => `${Math.round(share * 100)}%`
