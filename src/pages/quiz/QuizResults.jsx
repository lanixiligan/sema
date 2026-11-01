import { CheckIcon, EyeIcon } from '../../components/icons/icons.jsx'
import { letterClass } from './letterClass.js'
import { peekCount, quizScore, resultsVerdict } from './quizRounds.js'

// Every item as a row of tiles, all filled in (a finished quiz has a mark on
// every letter; End quiz marks the ones not reached as skipped). The tiles
// spring on one after another (--index).
function ItemRows({ quiz }) {
  let index = 0
  return (
    <ul className={`quiz-rows ${quiz.kind === 'letters' ? 'quiz-rows-letters' : ''}`}>
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
                <span className="visually-hidden">
                  {mark}
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
// Start again.
export default function QuizResults({ quiz, onAgain }) {
  const { passed, total } = quizScore(quiz)
  const clues = peekCount(quiz)
  const skipped = quiz.marks.flat().filter((mark) => mark === 'skipped').length
  const verdict = resultsVerdict(passed, total)
  return (
    <main className={`quiz-results quiz-results-${quiz.kind}`}>
      <section className="quiz-results-tag" aria-label="Score">
        <div className="quiz-results-band">
          <p className="quiz-results-number" aria-label={`You signed ${passed} of ${total}`}>
            <span aria-hidden="true">
              {passed}
              <small>/{total}</small>
            </span>
          </p>
          <p className="quiz-results-label" aria-hidden="true">
            letters signed
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
          <li>
            <span className="quiz-key-swatch quiz-skipped" />
            Skipped <strong>{skipped}</strong>
          </li>
        </ul>
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
