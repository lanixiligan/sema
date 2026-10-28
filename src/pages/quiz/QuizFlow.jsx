import { useCallback, useState } from 'react'
import { navigate } from '../../app/routing/navigation.js'
import { PATHS } from '../../app/routing/router.js'
import QuizResults from './QuizResults.jsx'
import QuizRun from './QuizRun.jsx'
import { endQuiz, markLetter, newQuiz } from './quizRounds.js'

// One quiz from start to results, for the Letters and Words pages: the quiz
// runs until its `at` is null, then the results show. `pickItems` gives the
// items to ask (random letters, or words) when the quiz starts. Start again on
// the results goes back to /quiz to choose Letters or Words. quizRounds.js
// holds the quiz's state.
export default function QuizFlow({ kind, pickItems, signingHand, onSigningHandChange, model }) {
  const [quiz, setQuiz] = useState(() => newQuiz(kind, pickItems()))
  // The same function on every render, so the run's timer isn't restarted by
  // each new render.
  const onMark = useCallback((mark, peeked) => setQuiz((q) => markLetter(q, mark, peeked)), [])

  if (quiz.at) {
    return (
      <QuizRun
        quiz={quiz}
        signingHand={signingHand}
        onSigningHandChange={onSigningHandChange}
        model={model}
        onMark={onMark}
        onQuit={() => setQuiz((q) => endQuiz(q))}
      />
    )
  }
  return <QuizResults quiz={quiz} onAgain={() => navigate(PATHS.quiz)} />
}
