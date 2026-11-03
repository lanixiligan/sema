import { useCallback, useState } from 'react'
import MenuBar from '../../app/layout/MenuBar.jsx'
import { navigate } from '../../app/routing/navigation.js'
import { PATHS } from '../../app/routing/router.js'
import GuessRun from './GuessRun.jsx'
import QuizResults from './QuizResults.jsx'
import { GUESS_COUNT, STILL_LETTERS, endQuiz, markLetter, newQuiz, pickLetters } from './quizRounds.js'

// Guess the letter (/quiz/guess, 2026-11-04): Sema shows GUESS_COUNT random
// hand signs, one at a time, and the person names each letter. No camera, so
// it works for someone who can't or won't use one, or in a room too dark for
// the hand to be seen. The quiz state is the same as the Words quiz's
// (quizRounds.js), with one-letter items marked 'passed', 'wrong' or 'skipped';
// the results are the same page too.
export default function GuessQuizPage({ signingHand, onSigningHandChange }) {
  const [quiz, setQuiz] = useState(() => newQuiz('guess', pickLetters(GUESS_COUNT, Math.random, STILL_LETTERS)))
  // The same function on every render, so the run's timer isn't restarted by
  // each new render.
  const onMark = useCallback((mark) => setQuiz((q) => markLetter(q, mark)), [])

  return (
    <>
      <MenuBar active="quiz" />
      {quiz.at ? (
        <GuessRun
          quiz={quiz}
          hand={signingHand ?? 'right'}
          onHandChange={onSigningHandChange}
          onMark={onMark}
          onQuit={() => setQuiz((q) => endQuiz(q))}
        />
      ) : (
        <QuizResults quiz={quiz} onAgain={() => navigate(PATHS.quiz)} />
      )}
    </>
  )
}
