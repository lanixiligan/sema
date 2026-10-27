import Link from '../../app/routing/Link.jsx'
import { PATHS } from '../../app/routing/router.js'
import { EyeIcon } from '../../components/icons/icons.jsx'
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
            return (
              <span key={j} className={`quiz-tile ${letterClass(mark, current)}`}>
                {mark || current || shows(i) ? letter : ''}
                {mark && <span className="visually-hidden"> {mark}</span>}
                {peeked && (
                  <span className="quiz-tile-peek">
                    <EyeIcon size={11} />
                    <span className="visually-hidden"> (looked at the drawing)</span>
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

// The end: the score, every item with its marks, and what's next.
export default function QuizResults({ quiz, onAgain, onChoose }) {
  const { passed, total } = quizScore(quiz)
  const marks = quiz.marks.flat()
  const skipped = marks.filter((mark) => mark === 'skipped').length
  const notReached = marks.filter((mark) => mark === null).length
  const peeks = peekCount(quiz)
  return (
    <main className="quiz-start quiz-results">
      <section>
        <h1>
          You signed {passed} of {total}
          {peeks > 0 && ` (${peeks} with a peek)`}
        </h1>
        <p>
          {notReached > 0 && 'You ended the quiz early: the letters left blank weren’t asked. '}
          {skipped === 0 && notReached === 0 && 'Every letter, without skipping one.'}
          {skipped > 0 && (
            <>
              The skipped letters are marked in amber. <Link to={PATHS.learn}>Learn</Link> them, then try again.
            </>
          )}
        </p>
        <ItemRows quiz={quiz} />
        <div className="quiz-actions">
          <button type="button" className="button" onClick={onAgain}>
            Start again
          </button>
          <button type="button" className="button-quiet" onClick={onChoose}>
            Choose another quiz
          </button>
        </div>
      </section>
    </main>
  )
}
