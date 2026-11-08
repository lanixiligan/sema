import { useState } from 'react'
import MenuBar from '../../app/layout/MenuBar.jsx'
import { useSettings } from '../../app/settings/settings.js'
import CameraPanel from '../../components/camera-view/CameraPanel.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { useLetterCheck } from '../../components/letter-check/useLetterCheck.js'
import LetterPicture from '../../components/letter-picture/LetterPicture.jsx'
import { useLetterPose } from '../../hand-model/letterPoses.js'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'
import StageChecklist from './StageChecklist.jsx'
import GuidePanel from './GuidePanel.jsx'
import Tour from './tour/Tour.jsx'
import { TOUR_STEPS } from './tour/tourSteps.js'

// The letters in teaching order, for now plain A to Z. (Which order is best
// is still an open decision in docs/project-plan.md.)
const LESSONS = LETTERS

// Learn (Phase 3.3), the main page. It started on 2026-10-27 as the letters
// one at a time, and the same day Practice (the free sandbox) was merged into
// it, because the two had become nearly the same page. Since 2026-11-02 it is
// laid out like the quiz: the guide of all 26 letters as one row on top (pick
// any, or let a pass lead to the next), then the camera on the left and the
// lesson on the right: the letter's drawing and the live finger checklist
// (2026-10-27; before, also its steps from letters.json, which said the same
// as the checklist). Make the letter and hold it for 1.5 seconds (LETTER_HOLD_MS in letterHold.js) while
// its finger conditions are met (letterShapes.js); then "That's A!" and a
// button to the next letter, with what the letter model made of the hold (a
// second opinion that never decides: ModelOpinion, below, and the note under
// "That's A!"). The check itself is useLetterCheck, shared with
// the quiz. The drawings face the signing hand (the saved setting the hand
// switch changes, Right by default); only that hand is drawn and judged. The
// camera waits for a click: landing on Sema never turns it on. Nothing is
// saved yet: opening Learn always starts at A, and the ticks on the guide's
// tiles (`done`) only last until the person leaves.
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
  // The letters passed during this visit, for the guide's ticks. A pass is
  // `passed` turning true for the current letter. Setting state while rendering
  // is allowed when it's guarded like this (React renders again right away
  // and the condition is then false), and it needs no effect.
  const [done, setDone] = useState(() => new Set())
  if (passed && !done.has(target)) setDone(new Set(done).add(target))
  // Whether the checklist on the camera is open or minimized to its pill; it's
  // kept here so a pass, or the next letter, doesn't open it again. On a small
  // screen it starts as the pill: the video is small there, and an open
  // checklist would cover most of it.
  const [checklistOpen, setChecklistOpen] = useState(() => !window.matchMedia('(max-width: 899px)').matches)
  const index = LESSONS.indexOf(target)
  const next = LESSONS[index + 1]
  // The letter's 3D hand (a pose in public/languages/asl/letters/), and the
  // picture's 2D | 3D choice, which the switch on the picture changes. A letter with
  // no pose shows its drawing, but the saved choice stays: the next letter that
  // has a pose is shown in 3D again.
  const pose = useLetterPose(target)
  const { handView, tourDone, finishTour } = useSettings()
  // The first-visit tour (tour/): open on the first visit until it's finished
  // or skipped, and again with the Tour button in the top bar (there for now,
  // while Sema is being built; Lanix will decide whether it stays).
  const [touring, setTouring] = useState(!tourDone)
  function closeTour(view) {
    finishTour(view)
    setTouring(false)
  }

  return (
    <>
      <MenuBar active="learn">
        <button type="button" className="bar-button" onClick={() => setTouring(true)}>
          Tour
        </button>
      </MenuBar>
      {touring && <Tour steps={TOUR_STEPS} onClose={closeTour} />}

      {/* The guide's row on top, then two columns that start and end on the
          same lines (grid areas in styles.css, shared with the quiz). */}
      <main className="practice learn">
        <GuidePanel selected={target} done={done} onSelect={startRound} />

        <section className="practice-camera" aria-label="Camera">
          <CameraPanel
            className="practice-panel"
            // After a pass the message stays blank: "That's A!" shows once, in
            // the middle of the camera.
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
              // The finger checklist on the picture, on a translucent dark
              // panel at its left edge, where the conditions are read while
              // signing. It steps aside for "That's A!".
              panel={!passed && <StageChecklist checks={checks} open={checklistOpen} onOpenChange={setChecklistOpen} />}
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
          <section className="learn-letter" aria-labelledby="learn-letter-title">
            {/* One card, white in the light theme and dark in the dark one (the
                drawing is Deep Sky lines in the light one, white in the dark one): the letter and the letter model's second opinion (not for J and
                Z, which it doesn't know) in a row on top, then the picture, the
                drawing or the 3D hand by the 2D | 3D switch in its corner. The
                finger checklist is on the camera. */}
            <div className="learn-card">
              <div className="learn-info">
                <h2 id="learn-letter-title" className="learn-title">
                  Letter <span className="learn-title-letter">{target}</span>
                </h2>
                {/* Over the picture's upper right, so it takes no row. With no
                    reading it's a dim empty tile. */}
                <div className="learn-opinion">
                  {!traced && loaded.status === 'ready' && isDetecting && (
                    <ModelOpinion guesses={guesses} hand={drawnHand} target={target} />
                  )}
                </div>
              </div>
              <LetterPicture letter={target} hand={drawnHand} view={handView} pose={pose} className="learn-picture" />
            </div>
          </section>
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

// The letter model's second opinion (2026-10-29; before, a "Right now" line
// only npm run dev showed), a small pill over the picture's upper right since
// 2026-11-02 (before, a row with a sentence and a bar, under the checklist):
// what the classifier trained in training/ reads in the signing hand right now.
// The checklist decides the pass; this is there to compare. The letter it reads
// sits in a tile, like the guide's, filled with the accent when it's the letter
// being made (as a met condition's tick is), dim and empty with no reading, and
// beside it how sure it is. The small model gives a percentage; the k-NN (npm
// run dev only) doesn't, so it shows the tile alone. The sentence it used to
// show is the pill's tooltip and its text for screen readers. It updates ten
// times a second, so it isn't a live region: a screen reader would hear it
// constantly.
function ModelOpinion({ guesses, hand, target }) {
  const g = guesses.find((guess) => guess.whole) ?? guesses[0]
  // The letter when it's sure, '?' when not, nothing without a whole hand.
  const reading = g?.whole ? (g.sure ? g.letter : '?') : null
  const agrees = reading === target
  const sure = g?.whole && 'confidence' in g ? percent(g.confidence) : null
  // The words are for the tooltip and screen readers; the chip shows only the
  // tile and the percentage. With no reading (no hand, or not a whole one) the
  // chip is `idle`: invisible, and out of the way of screen readers, so the
  // card stays quiet until the model has something to say. It stays in the
  // page, so it fades in and out instead of popping.
  const sentence = `${opinionText(g, reading, hand)}${sure ? `, ${sure} sure` : ''}`
  const state = !reading ? ' idle' : agrees ? ' agrees' : reading === '?' ? ' unsure' : ''
  return (
    <section className={`model-opinion${state}`} aria-label="Letter model" title={sentence} aria-hidden={!reading || undefined}>
      <span className="model-opinion-label" aria-hidden="true">
        Model
      </span>
      <span className="model-tile" aria-hidden="true">
        {reading}
      </span>
      <span className="model-opinion-value" aria-hidden="true">
        {sure}
      </span>
      <span className="visually-hidden">{sentence}</span>
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
