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

// Learn (Phase 3.3), the main page. It started on 2026-10-27 as the letters
// one at a time, and the same day Practice (the free sandbox) was merged into
// it, because the two had become nearly the same page. Record's three columns:
// the guide of all 26 letters on the left (pick any, or let a pass lead to the
// next), the camera in the middle, and the lesson on the right: the letter's
// drawing and the live finger checklist (2026-10-27; before, also its steps
// from letters.json, which said the same as the checklist). Make the letter and hold it for 1.5 seconds (LETTER_HOLD_MS in letterHold.js) while
// its finger conditions are met (letterShapes.js); then "That's A!" and a
// button to the next letter, with what the letter model made of the hold (a
// second opinion that never decides: ModelOpinion, below, and the note under
// "That's A!"). The check itself is useLetterCheck, shared with
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

  const {
    canvasRef,
    traceCanvasRef,
    hand,
    drawnHand,
    isDetecting,
    traced,
    loaded,
    guesses,
    modelSaid,
    checks,
    passed,
    ...panel
  } = useLetterCheck({ target, round, signingHand, model })
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
            // After a pass the header stays blank (a non-breaking space keeps
            // its height, so nothing jumps): "That's A!" shows once, in the
            // middle of the camera.
            status={passed ? ' ' : panel.status}
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
                  {/* role="status": with the header blank, this is what screen readers hear. */}
                  <p className="practice-done-title" role="status">
                    That&rsquo;s {target}!
                  </p>
                  {/* The letter model's second opinion on the hold (not for J
                      and Z, which it doesn't know). */}
                  {modelSaid && (
                    <p className={`practice-done-note${modelSaid === target ? ' agrees' : ''}`}>
                      <span className="model-tile" aria-hidden="true">
                        {modelSaid}
                      </span>
                      {modelNote(modelSaid, target)}
                    </p>
                  )}
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
          {!traced && loaded.status === 'ready' && isDetecting && (
            <ModelOpinion guesses={guesses} hand={drawnHand} target={target} />
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

// The letter model's second opinion, under the checklist (2026-10-29; before,
// a "Right now" line only npm run dev showed): what the classifier trained in
// training/ reads in the signing hand right now. The checklist decides the
// pass; this is there to compare. The letter it reads sits in a tile, like the
// guide's, filled with the accent when it's the letter being made (as a met
// condition's tick is), then a sentence and how sure it is. The small model
// gives a percentage; the k-NN (npm run dev only) doesn't, so its bar stays
// empty. It updates ten times a second, so it isn't a live region: a screen
// reader would hear it constantly.
function ModelOpinion({ guesses, hand, target }) {
  const g = guesses.find((guess) => guess.whole) ?? guesses[0]
  // The letter when it's sure, '?' when not, nothing without a whole hand.
  const reading = g?.whole ? (g.sure ? g.letter : '?') : null
  const agrees = reading === target
  const sure = g?.whole && 'confidence' in g ? percent(g.confidence) : null
  return (
    <section className={`model-opinion${agrees ? ' agrees' : ''}`} aria-label="Letter model">
      <span className={`model-tile${reading ? '' : ' empty'}`} aria-hidden="true">
        {reading}
      </span>
      <div>
        <p>
          {opinionText(g, reading, hand)}
          {sure && <span className="visually-hidden">, {sure} sure</span>}
        </p>
        {/* Keeps its space while empty, so the column doesn't jump. */}
        <div className={`model-meter${sure ? '' : ' is-empty'}`} aria-hidden="true">
          <span className="model-meter-track">
            <span className="model-meter-fill" style={{ width: sure ?? 0 }} />
          </span>
          <span className="model-meter-value">{sure}</span>
        </div>
      </div>
    </section>
  )
}

function opinionText(g, reading, hand) {
  if (!g) return `Letter model is waiting for your ${hand} hand`
  if (!reading) return 'Letter model needs your whole hand'
  if (reading === '?') return 'Letter model isn’t sure'
  return `Letter model sees ${reading}`
}

// What the model made of the whole hold, after a pass (modelVerdict).
function modelNote(said, target) {
  if (said === target) return 'The letter model agrees'
  if (said === '?') return 'The letter model wasn’t sure'
  return `The letter model read ${said}`
}

const percent = (share) => `${Math.round(share * 100)}%`
