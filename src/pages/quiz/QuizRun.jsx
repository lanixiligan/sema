import { useEffect, useState } from 'react'
import AslDrawing from '../../components/AslDrawing.jsx'
import CameraControls from '../../components/camera-view/CameraControls.jsx'
import CameraPanel from '../../components/camera-view/CameraPanel.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { EyeIcon } from '../../components/icons/icons.jsx'
import { useLetterCheck } from '../../components/letter-check/useLetterCheck.js'
import { letterClass } from './letterClass.js'
import { NEXT_LETTER_MS, currentLetter } from './quizRounds.js'

// The quiz itself, kept minimal: the camera on the left (it starts on
// arrival, since the person just chose a quiz), its controls in a footer, and
// on the right what to sign: the count and End quiz on top, the big letter
// with its eye (and under it, in a words quiz, the word with the current letter
// lit), then the quiz's steps and Skip letter.
export default function QuizRun({ quiz, signingHand, onSigningHandChange, model, onMark, onQuit }) {
  const target = currentLetter(quiz)
  // quiz.step changes with every letter asked, so each one is a new check.
  const { canvasRef, traceCanvasRef, hand, drawnHand, traced, loaded, passed, ...panel } =
    useLetterCheck({ target, round: quiz.step, signingHand, model })

  // The eye: a peek at this letter's drawing. `step` says which letter it was
  // for, so every new letter starts hidden and unpeeked. `used` stays true
  // once the drawing was opened, even if it's closed again; a passed letter
  // is then marked as peeked.
  const [peek, setPeek] = useState({ step: -1, open: false, used: false })
  const thisPeek = peek.step === quiz.step ? peek : { step: quiz.step, open: false, used: false }
  function togglePeek() {
    setPeek({ step: quiz.step, open: !thisPeek.open, used: true })
  }

  // "That's B!" for a moment, then the next letter. A Skip in the meantime
  // asks a new letter, which ends `passed` and clears this timer.
  const peeked = thisPeek.used
  useEffect(() => {
    if (!passed) return
    const timer = setTimeout(() => onMark('passed', peeked), NEXT_LETTER_MS)
    return () => clearTimeout(timer)
  }, [passed, peeked, onMark])

  const isWords = quiz.kind === 'words'
  const word = quiz.items[quiz.at.item]
  const itemName = isWords ? 'Word' : 'Letter'
  // The count and the steps go by items: a letters quiz asks one letter per
  // item, a words quiz one word.
  const itemNumber = quiz.at.item + 1
  return (
    <main className="practice quiz-run">
      <section className="quiz-prompt" aria-label="What to sign">
        <div className="quiz-prompt-top">
          <p className="quiz-count">
            {itemName} {itemNumber} of {quiz.items.length}
          </p>
          <button type="button" className="quiz-quit" onClick={onQuit}>
            End quiz
          </button>
        </div>

        {/* The letter, its eye and the word under it are one group, centred in
            the space the top row and the steps leave. */}
        <div className="quiz-prompt-main">
          <div className="quiz-prompt-letter-row">
            {/* The letter and the drawing share one fixed-size box, so the eye
                stays where it is when the drawing takes the letter's place. */}
            <div className="quiz-prompt-visual">
              {thisPeek.open ? (
                <div className="reference-image reference-image-drawing quiz-peek-drawing">
                  <AslDrawing letter={target} hand={drawnHand} alt={`Handshape for ${target}`} />
                </div>
              ) : (
                <p className="quiz-prompt-letter" aria-label={`Sign ${target}`}>
                  {target}
                </p>
              )}
            </div>
            <button
              type="button"
              className="quiz-peek"
              aria-pressed={thisPeek.open}
              aria-label={thisPeek.open ? 'Hide the drawing' : 'Show the drawing'}
              title={thisPeek.open ? 'Hide the drawing' : 'Show the drawing'}
              disabled={passed}
              onClick={togglePeek}
            >
              <EyeIcon off={thisPeek.open} />
            </button>
          </div>
          {isWords && (
            <p className="quiz-prompt-word" aria-label={`${word}, letter ${quiz.at.letter + 1}`}>
              {[...word].map((letter, i) => (
                <span key={i} className={letterClass(quiz.marks[quiz.at.item][i], i === quiz.at.letter)}>
                  {letter}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="quiz-prompt-bottom">
          {/* The real quiz state: one step per item, done before the current
              one, the current one lit. */}
          <div
            className="quiz-steps"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={1}
            aria-valuemax={quiz.items.length}
            aria-valuenow={itemNumber}
            aria-valuetext={`${itemName} ${itemNumber} of ${quiz.items.length}`}
          >
            {quiz.items.map((_, i) => (
              <span key={i} className={i < quiz.at.item ? 'done' : i === quiz.at.item ? 'current' : undefined} />
            ))}
          </div>
          <button type="button" className="quiz-skip" disabled={passed} onClick={() => onMark('skipped', thisPeek.used)}>
            Skip letter
          </button>
          {loaded.status === 'loading' && <p className="practice-note">Loading the model…</p>}
          {loaded.status === 'error' && (
            <p className="error" role="alert">
              {loaded.error}
            </p>
          )}
        </div>
      </section>

      <section className="practice-camera" aria-label="Camera">
        <CameraPanel className="practice-panel" status={panel.status} tone={panel.tone} hold={panel.hold} fill={panel.fill}>
          <CameraView
            canvasRef={canvasRef}
            hand={hand}
            className="practice-stage"
            controls={false}
            underlay={traced && <canvas ref={traceCanvasRef} className="overlay" aria-hidden="true" />}
          >
            {passed && (
              <div className="practice-done">
                <p className="practice-done-title">That&rsquo;s {target}!</p>
              </div>
            )}
          </CameraView>
          {/* The hand switch and camera buttons in a footer under the picture,
              the same size whether the camera is on or off. */}
          <div className="quiz-camera-footer">
            <CameraControls hand={drawnHand} onHandChange={onSigningHandChange} handLabel="Signing hand" />
          </div>
        </CameraPanel>
      </section>
    </main>
  )
}
