import { useEffect, useState } from 'react'
import { useLeaveWarning } from '../../app/routing/navigation.js'
import { useSettings } from '../../app/settings/settings.js'
import CameraPanel from '../../components/camera-view/CameraPanel.jsx'
import CameraView from '../../components/camera-view/CameraView.jsx'
import { EyeIcon } from '../../components/icons/icons.jsx'
import { useLetterCheck } from '../../components/letter-check/useLetterCheck.js'
import LetterPicture from '../../components/letter-picture/LetterPicture.jsx'
import { useLetterPose } from '../../hand-model/letterPoses.js'
import { letterClass } from './letterClass.js'
import { NEXT_LETTER_MS, currentLetter } from './quizRounds.js'

const LEAVE_QUESTION = 'Leave the quiz? Your answers so far won’t be kept.'

// How a step of the progress bar looks: before the current item it's done, or
// missed if a letter in it was skipped; the current item is lit.
function stepClass(quiz, i) {
  if (i === quiz.at.item) return 'current'
  if (i > quiz.at.item) return undefined
  return quiz.marks[i].includes('skipped') ? 'missed' : 'done'
}

// The quiz itself, kept minimal: the camera on the left (it starts on
// arrival, since the person just chose a quiz), whole as on Learn, and
// on the right what to sign: the quiz's steps on top, the big letter on a
// sticker with its Peek eye (and under it, in a words quiz, the word with the
// current letter lit), then Skip letter and End quiz side by side at the bottom
// (2026-11-02; before, the count "Letter 1 of 10" and End quiz were on top).
// Nothing on this page moves, not even when a letter passes (2026-11-01).
export default function QuizRun({ quiz, signingHand, onSigningHandChange, model, onMark, onQuit }) {
  const target = currentLetter(quiz)
  // quiz.step changes with every letter asked, so each one is a new check.
  const { canvasRef, traceCanvasRef, hand, drawnHand, traced, loaded, passed, ...panel } =
    useLetterCheck({ target, round: quiz.step, signingHand, model })

  // Leaving mid-quiz (the menu, Back, closing the tab) asks first: results
  // aren't saved, so the quiz would be lost. End quiz doesn't ask: it shows them.
  useLeaveWarning(true, LEAVE_QUESTION)

  // The eye: a peek at this letter's drawing. `step` says which letter it was
  // for, so every new letter starts hidden and unpeeked. `used` stays true
  // once the drawing was opened, even if it's closed again; a passed letter
  // is then marked as peeked.
  const [peek, setPeek] = useState({ step: -1, open: false, used: false })
  const thisPeek = peek.step === quiz.step ? peek : { step: quiz.step, open: false, used: false }
  function togglePeek() {
    setPeek({ step: quiz.step, open: !thisPeek.open, used: true })
  }

  // What the peek shows, by the picture's 2D | 3D switch: the drawing, or the
  // 3D hand when the letter has a pose (the picture says when it doesn't).
  const { handView } = useSettings()
  const pose = useLetterPose(target)

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
        {/* The real quiz state: one step per item. Done ones are green (amber
            if a letter in them was skipped), the current one is lit. The count
            ("Letter 1 of 10") is only said to screen readers, by the bar. */}
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
            <span key={i} className={stepClass(quiz, i)} />
          ))}
        </div>

        {/* The letter sticker, its eye and the word under it are one group,
            centred in the space the steps and the buttons leave. */}
        <div className="quiz-prompt-main">
          {/* The letter and the drawing share one fixed-size sticker, so Peek
              stays where it is when the drawing takes the letter's place. A new
              letter just replaces the old one: nothing moves. */}
          <div className="quiz-sticker">
            {thisPeek.open ? (
              <LetterPicture
                letter={target}
                hand={drawnHand}
                view={handView}
                pose={pose}
                className="quiz-peek-drawing"
                notes={false}
              />
            ) : (
              <p className="quiz-prompt-letter" aria-label={`Sign ${target}`}>
                {target}
              </p>
            )}
            <button
              type="button"
              className={thisPeek.open ? 'quiz-peek is-open' : 'quiz-peek'}
              aria-label={thisPeek.open ? 'Hide the drawing' : 'Show the drawing'}
              disabled={passed}
              onClick={togglePeek}
            >
              <EyeIcon size={22} off={thisPeek.open} />
              {thisPeek.open ? 'Hide' : 'Peek'}
            </button>
            {/* A pop-up on the card's lower edge, not a line of its own, so
                nothing on the page moves when it appears. It's always in the
                page (empty until the first peek) so a screen reader hears it
                when its text arrives. */}
            <p className="quiz-peek-popup" role="status">
              {thisPeek.used ? 'Peeking counts as a clue.' : ''}
            </p>
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

        {/* Both buttons at the bottom, side by side. End quiz is red, so it isn't
            taken for Skip. */}
        <div className="quiz-actions">
          <button type="button" className="quiz-skip" disabled={passed} onClick={() => onMark('skipped', thisPeek.used)}>
            Skip letter
          </button>
          <button type="button" className="quiz-quit" onClick={onQuit}>
            End quiz
          </button>
        </div>
        {loaded.status === 'loading' && <p className="practice-note">Loading the model…</p>}
        {loaded.status === 'error' && (
          <p className="error" role="alert">
            {loaded.error}
          </p>
        )}
      </section>

      <section className="practice-camera" aria-label="Camera">
        {/* As on Learn: one whole frame, the controls on the picture. After a
            pass the message stays blank: "That's B!" shows once, in the middle
            of the camera. */}
        <CameraPanel
          className="practice-panel"
          status={passed ? ' ' : panel.status}
          tone={panel.tone}
          hold={panel.hold}
          fill={panel.fill}
        >
          <CameraView
            canvasRef={canvasRef}
            hand={hand}
            className="practice-stage"
            controls={{ hand: drawnHand, onHandChange: onSigningHandChange, handLabel: 'Signing hand' }}
            underlay={traced && <canvas ref={traceCanvasRef} className="overlay" aria-hidden="true" />}
          >
            {passed && (
              <div className="practice-done">
                {/* role="status": with the header blank, this is what screen readers hear. */}
                <p className="practice-done-title" role="status">
                  That&rsquo;s {target}!
                </p>
              </div>
            )}
          </CameraView>
        </CameraPanel>
      </section>
    </main>
  )
}
