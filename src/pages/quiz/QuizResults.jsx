import { CheckIcon, EyeIcon } from '../../components/icons/icons.jsx'
import { letterClass } from './letterClass.js'
import { peekCount, quizScore } from './quizRounds.js'

// The items as rows of tiles (the results show the same rows, all filled in).
function ItemRows({ quiz }) {
  const shows = (item) => !quiz.at || item < quiz.at.item || (quiz.kind === 'words' && item === quiz.at.item)
  return (
    <ul className={`quiz-rows ${quiz.kind === 'letters' ? 'quiz-rows-letters' : ''}`}>
      {quiz.items.map((item, i) => (
        <li key={i}>
          {[...item].map((letter, j) => {
            const mark = quiz.marks[i][j]
            const current = quiz.at?.item === i && quiz.at.letter === j
            const peeked = quiz.peeked[i][j]
            // Passed after a peek: an outlined tile instead of a solid one.
            const clue = mark === 'passed' && peeked
            return (
              <span key={j} className={`quiz-tile ${letterClass(mark, current)}${clue ? ' quiz-clue' : ''}`}>
                {mark || current || shows(i) ? letter : ''}
                {mark === 'passed' && (peeked ? <EyeIcon size={14} /> : <CheckIcon size={14} />)}
                {mark && (
                  <span className="visually-hidden">
                    {mark}
                    {peeked && ' (looked at the drawing)'}
                  </span>
                )}
              </span>
            )
          })}
        </li>
      ))}
    </ul>
  )
}

// The score as a ring (green for the share passed, amber for the rest, the
// percentage in the middle) with the count beside it, in the same colours as
// the key and the tiles. Screen readers get the score from its label.
const RING_RADIUS = 70
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function ScoreRing({ passed, total, clues, skipped }) {
  const share = total > 0 ? passed / total : 0
  return (
    <div className="quiz-score" role="img"
      aria-label={`You signed ${passed} of ${total}: ${passed - clues} answered, ${clues} with a clue, ${skipped} skipped`}
    >
      <div className="quiz-ring">
        <svg viewBox="0 0 160 160">
          <circle className="quiz-ring-track" cx="80" cy="80" r={RING_RADIUS} />
          <circle
            className="quiz-ring-arc"
            cx="80"
            cy="80"
            r={RING_RADIUS}
            strokeDasharray={RING_LENGTH}
            style={{ '--ring-length': RING_LENGTH, '--ring-offset': RING_LENGTH * (1 - share) }}
          />
        </svg>
        <div className="quiz-ring-text">{Math.round(share * 100)}%</div>
      </div>
      <div className="quiz-score-count">
        <strong>{passed}</strong>
        <span>/{total}</span>
      </div>
      <ul className="quiz-key">
        <li>
          <span className="quiz-key-swatch quiz-passed">
            <CheckIcon size={12} />
          </span>
          Answered <strong>{passed - clues}</strong>
        </li>
        <li>
          <span className="quiz-key-swatch quiz-clue">
            <EyeIcon size={12} />
          </span>
          With a clue <strong>{clues}</strong>
        </li>
        <li>
          <span className="quiz-key-swatch quiz-skipped" />
          Skipped <strong>{skipped}</strong>
        </li>
      </ul>
    </div>
  )
}

// The end: the score, every item with its marks, and Start again.
export default function QuizResults({ quiz, onAgain }) {
  const { passed, total } = quizScore(quiz)
  const skipped = quiz.marks.flat().filter((mark) => mark === 'skipped').length
  return (
    <main className={`quiz-start quiz-results quiz-results-${quiz.kind}`}>
      <section>
        {/* For screen readers: the page's name, which the score ring shows
            without words. */}
        <h1 className="visually-hidden">Quiz results</h1>
        <ScoreRing passed={passed} total={total} clues={peekCount(quiz)} skipped={skipped} />
        <div className="quiz-results-card">
          <ItemRows quiz={quiz} />
        </div>
        <div className="quiz-actions">
          <button type="button" className="button" onClick={onAgain}>
            Start again
          </button>
        </div>
      </section>
    </main>
  )
}
