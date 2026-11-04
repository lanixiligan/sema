import { PATHS } from '../../app/routing/router.js'
import { useSettings } from '../../app/settings/settings.js'
import { CheckIcon, CloseIcon, EyeIcon } from '../../components/icons/icons.jsx'
import { letterClass } from './letterClass.js'
import { guessVerdict, markCount, peekCount, quizScore, resultsVerdict } from './quizRounds.js'

// Every item as a row of tiles, all filled in (a finished quiz has a mark on
// every letter; End quiz marks the ones not reached as skipped). The tiles
// spring on one after another (--index).
function ItemRows({ quiz }) {
  let index = 0
  return (
    <ul className={`quiz-rows ${quiz.kind === 'guess' ? 'quiz-rows-letters' : ''}`}>
      {quiz.items.map((item, i) => (
        <li key={i}>
          {[...item].map((letter, j) => {
            const mark = quiz.marks[i][j]
            const peeked = quiz.peeked[i][j]
            // Passed after a peek: a pale tile with an outline instead of a solid one.
            const clue = mark === 'passed' && peeked
            const n = index++
            return (
              <span
                key={j}
                className={`quiz-tile ${letterClass(mark, false)}${clue ? ' quiz-clue' : ''}`}
                style={{ '--index': n }}
              >
                {letter}
                {mark === 'passed' && (peeked ? <EyeIcon size={16} /> : <CheckIcon size={16} strokeWidth={3} />)}
                {mark === 'wrong' && <CloseIcon size={13} />}
                <span className="visually-hidden">
                  {mark === 'passed' && quiz.kind === 'guess' ? 'named' : mark}
                  {peeked && ' (looked at the drawing)'}
                </span>
              </span>
            )
          })}
        </li>
      ))}
    </ul>
  )
}

// The end, laid out like Welcome: the score on a tag with every letter
// stuck below it, and on the right a headline, what the score is made of, and
// Start again. Guess the letter (2026-11-04) counts letters named, right or
// wrong, and for someone who hasn't set up the camera ends with an invitation
// to sign them too.
export default function QuizResults({ quiz, onAgain }) {
  const { cameraChecked, openCameraCheck } = useSettings()
  const isGuess = quiz.kind === 'guess'
  const { passed, total } = quizScore(quiz)
  const clues = peekCount(quiz)
  const skipped = markCount(quiz, 'skipped')
  const verdict = isGuess ? guessVerdict(passed, total) : resultsVerdict(passed, total)
  const done = isGuess ? 'named' : 'signed'
  return (
    <main className={`quiz-results quiz-results-${quiz.kind}`}>
      <section className="quiz-results-tag" aria-label="Score">
        <div className="quiz-results-band">
          <p className="quiz-results-number" aria-label={`You ${done} ${passed} of ${total}`}>
            <span aria-hidden="true">
              {passed}
              <small>/{total}</small>
            </span>
          </p>
          <p className="quiz-results-label" aria-hidden="true">
            letters {done}
          </p>
        </div>
        <div className="quiz-results-body">
          <ItemRows quiz={quiz} />
        </div>
      </section>

      <section className="quiz-results-copy">
        <h1 className="quiz-results-title">{verdict.title}</h1>
        <p className="quiz-results-lead">{verdict.text}</p>
        <ul className="quiz-key">
          {isGuess ? (
            <>
              <li>
                <span className="quiz-key-swatch quiz-passed">
                  <CheckIcon size={14} strokeWidth={3} />
                </span>
                Right <strong>{passed}</strong>
              </li>
              <li>
                <span className="quiz-key-swatch quiz-wrong">
                  <CloseIcon size={11} />
                </span>
                Wrong <strong>{markCount(quiz, 'wrong')}</strong>
              </li>
            </>
          ) : (
            <>
              <li>
                <span className="quiz-key-swatch quiz-passed">
                  <CheckIcon size={14} strokeWidth={3} />
                </span>
                From memory <strong>{passed - clues}</strong>
              </li>
              <li>
                <span className="quiz-key-swatch quiz-clue">
                  <EyeIcon size={14} />
                </span>
                With a clue <strong>{clues}</strong>
              </li>
            </>
          )}
          <li>
            <span className="quiz-key-swatch quiz-skipped" />
            Skipped <strong>{skipped}</strong>
          </li>
        </ul>
        {/* Named them? Now sign them: for someone who skipped the camera check. */}
        {isGuess && !cameraChecked && (
          <div className="quiz-camera-invite">
            <p className="quiz-camera-invite-title">Ready to sign them yourself?</p>
            <p>Set up your camera, and Sema checks your own hand as you make each letter.</p>
            <button type="button" className="button" onClick={() => openCameraCheck(PATHS.learn)}>
              Set up your camera
            </button>
          </div>
        )}
        <button type="button" className="key-button quiz-again" onClick={onAgain}>
          Start again
          <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </button>
      </section>
    </main>
  )
}
