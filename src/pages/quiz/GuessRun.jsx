import { useEffect, useRef, useState } from 'react'
import { useLeaveWarning } from '../../app/routing/navigation.js'
import { useSettings } from '../../app/settings/settings.js'
import HandSideToggle from '../../app/settings/HandSideToggle.jsx'
import HandNumbersToggle from '../../app/settings/HandNumbersToggle.jsx'
import HandViewToggle from '../../app/settings/HandViewToggle.jsx'
import AnswerHand from './AnswerHand.jsx'
import KeyLayoutToggle from './KeyLayoutToggle.jsx'
import LetterPicture from '../../components/letter-picture/LetterPicture.jsx'
import { loadLetterPose, useLetterPose } from '../../hand-model/letterPoses.js'
import { CheckIcon } from '../../components/icons/icons.jsx'
import { END_QUESTION, GUESS_RIGHT_MS, GUESS_LETTERS, KEYBOARD_LETTERS, currentLetter } from './quizRounds.js'

const LEAVE_QUESTION = 'Leave the quiz? Your answers so far won’t be kept.'

// How a step of the progress bar looks: before the current letter it's done
// (named right) or missed (wrong or skipped); the current one is lit.
function stepClass(quiz, i) {
  if (i === quiz.at.item) return 'current'
  if (i > quiz.at.item) return undefined
  return quiz.marks[i][0] === 'passed' ? 'done' : 'missed'
}

// One hand sign to name, laid out like the Words quiz (2026-11-04; before, the
// picture was on the left): a tile per letter (A to Z, or a keyboard's rows, chosen with a switch above them) on the left, where the camera is
// there, and on the right the steps on top, the picture in the middle (the 2D | 3D
// switch works as everywhere, so the 3D hand can be turned to tell M, N and T
// apart) and Show answer and End quiz at the bottom. A letter is picked with a
// tile or its key on a keyboard.
// - Right: "Yes, that's B!" for a moment, then the next sign (as when a
//   letter passes in the Words quiz). The line above the tiles is easy to miss
//   when the eyes are on the tile just clicked, so the same words also slap onto
//   the picture as a green sticker, like the camera check's "Camera ready"
//   (2026-11-04), and stay for GUESS_RIGHT_MS.
// - Wrong: the right letter is shown, and stays until Next letter, so there's
//   time to look at the hand again.
export default function GuessRun({ quiz, hand, onHandChange, onMark, onQuit }) {
  const target = currentLetter(quiz)
  const { handView, keyLayout, setKeyLayout } = useSettings()
  // The keys in A to Z order, or a keyboard's. The letters picked by key press are the same.
  const isKeyboard = keyLayout === 'keyboard'
  const keys = isKeyboard ? KEYBOARD_LETTERS : GUESS_LETTERS
  const pose = useLetterPose(target)

  // With 3D chosen, every letter's pose is fetched up front (26 tiny files, each
  // once per visit), so the picked letter's hand has its pose the moment a wrong
  // answer needs it, instead of waiting for the network then.
  useEffect(() => {
    if (handView === '3d') GUESS_LETTERS.forEach(loadLetterPose)
  }, [handView])

  // Leaving mid-quiz asks first, as in the Words quiz.
  useLeaveWarning(true, LEAVE_QUESTION)

  // The letter picked for this sign. `step` says which sign it was for, so a
  // new sign starts unanswered without an effect to reset it.
  // `gaveUp` (2026-11-04): Show answer was pressed, so the right letter is shown, with no pick.
  const [answer, setAnswer] = useState({ step: -1, guess: null, gaveUp: false })
  const here = answer.step === quiz.step
  const guess = here ? answer.guess : null
  const gaveUp = here && answer.gaveUp
  const isRight = guess !== null && guess === target
  const isWrong = guess !== null && guess !== target
  // After a wrong answer or Show answer the right letter is shown and waits for Next letter.
  const isRevealed = isWrong || gaveUp
  const answered = guess !== null || gaveUp

  // Named right: the next sign after a moment.
  useEffect(() => {
    if (!isRight) return
    const timer = setTimeout(() => onMark('passed'), GUESS_RIGHT_MS)
    return () => clearTimeout(timer)
  }, [isRight, onMark])

  // Named wrong: Next letter gets the focus, so Enter (or Space) goes on from
  // the keyboard as well.
  const nextRef = useRef(null)
  useEffect(() => {
    if (isRevealed) nextRef.current?.focus()
  }, [isRevealed])

  // A letter's key picks it, once per sign. Not with Ctrl, Alt or Cmd held
  // (the browser's own shortcuts), nor while the larger picture's window is
  // open (its own keys, like Escape, belong to it).
  useEffect(() => {
    if (answered) return
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if (event.target instanceof Element && event.target.closest('dialog')) return
      const letter = event.key.toUpperCase()
      if (!GUESS_LETTERS.includes(letter)) return
      event.preventDefault()
      setAnswer({ step: quiz.step, guess: letter, gaveUp: false })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [answered, quiz.step])

  function tileClass(letter) {
    if (!answered) return 'guess-tile'
    if (letter === target) return 'guess-tile is-right'
    if (letter === guess) return 'guess-tile is-wrong'
    return 'guess-tile'
  }

  // Which hand the pictures show, switched in the frame's lower left corner
  // (the camera pages have it on the camera, which this page doesn't have).
  const handSwitch = <HandSideToggle hand={hand} onChange={onHandChange} />

  const number = quiz.at.item + 1
  return (
    <main className="quiz-guess">
      {/* The real quiz state: one step per sign, the count said to screen readers. */}
      <div
        className="quiz-steps guess-steps"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={1}
        aria-valuemax={quiz.items.length}
        aria-valuenow={number}
        aria-valuetext={`Sign ${number} of ${quiz.items.length}`}
      >
        {quiz.items.map((_, i) => (
          <span key={i} className={stepClass(quiz, i)} />
        ))}
      </div>

      <section className="guess-picture-side" aria-label="The hand sign">
        {isRevealed ? (
          // Named wrong: the sign steps aside for the two hands to compare, the
          // right letter's on the left and the picked one's on the right, in
          // a frame like the Peek's (dark in the dark theme), with the same 2D | 3D switch.
          <div className={`letter-picture guess-compare-frame${handView === '3d' ? ' has-numbers' : ''}`}>
            <div className="picture-controls">
              <HandViewToggle />
              {handView === '3d' && <HandNumbersToggle />}
            </div>
            <div className="picture-corner">{handSwitch}</div>
            {/* The answer, in the frame with the two hands (2026-11-04): the line above
                the tiles is far from them. That line is still what a screen reader hears. */}
            <p className="guess-compare-message" aria-hidden="true">
              <span className="is-answer">It&rsquo;s {target}.</span>
              {isWrong && <> <span className="is-pick">You picked {guess}.</span></>}
            </p>
            <div className="guess-compare-row">
              <AnswerHand letter={target} kind="right" hand={hand} view={handView} />
              {isWrong && <AnswerHand letter={guess} kind="wrong" hand={hand} view={handView} />}
            </div>
          </div>
        ) : (
          // hideLetter: the picture is the question, so it never names the letter.
          <LetterPicture letter={target} hand={hand} view={handView} pose={pose} className="guess-picture" hideLetter corner={handSwitch} />
        )}
        {isRight && (
          // Decorative: the status line below is what a screen reader hears.
          <div className="camera-ready-flash" aria-hidden="true">
            <span className="camera-ready-sticker guess-right-sticker">
              <span className="camera-ready-check">
                <CheckIcon size={22} strokeWidth={3} />
              </span>
              Yes, that&rsquo;s {target}!
            </span>
          </div>
        )}
      </section>

      {/* What happened, for a screen reader only: sighted people get it as the sticker on
          the picture (right) or the message in its frame (wrong), so the line that used to
          sit above the tiles is gone (2026-11-04). It's always in the page, out of the
          layout, so a screen reader hears its text when it arrives. */}
      <p className="visually-hidden" role="status">
        {isRight && <>Yes, that&rsquo;s {target}!</>}
        {isWrong && (
          <>
            It&rsquo;s {target}. You picked {guess}.
          </>
        )}
        {gaveUp && <>It&rsquo;s {target}.</>}
      </p>

      {/* The question isn't written on the page (the tiles say it), so the
          section is named for screen readers only. */}
      <section className="guess-answer" aria-label="Which letter is this?">
        <div className="guess-keys">
          <KeyLayoutToggle layout={keyLayout} onChange={setKeyLayout} />
          <div className={isKeyboard ? 'guess-tiles is-keyboard' : 'guess-tiles'}>
            {keys.map((letter) => (
              <button
                key={letter}
                type="button"
                className={tileClass(letter)}
                disabled={answered}
                onClick={() => setAnswer({ step: quiz.step, guess: letter, gaveUp: false })}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="quiz-actions guess-actions">
        {isRevealed ? (
          // A wrong answer counts as wrong; Show answer counts as skipped.
          <button ref={nextRef} type="button" className="key-button guess-next" onClick={() => onMark(isWrong ? 'wrong' : 'skipped')}>
            Next letter
            <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="quiz-skip"
            disabled={answered}
            onClick={() => setAnswer({ step: quiz.step, guess: null, gaveUp: true })}
          >
            Show answer
          </button>
        )}
        {/* A sign already answered keeps its answer; the rest count as skipped. */}
        <button
          type="button"
          className="quiz-quit"
          onClick={() => {
            if (!window.confirm(END_QUESTION)) return
            if (guess !== null) onMark(isRight ? 'passed' : 'wrong')
            onQuit()
          }}
        >
          End quiz
        </button>
      </div>
    </main>
  )
}
