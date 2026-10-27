import MenuBar from '../../app/layout/MenuBar.jsx'
import QuizFlow from './QuizFlow.jsx'
import { LETTER_COUNT, pickLetters } from './quizRounds.js'

// The Letters quiz (/quiz/letters): random letters, signed one at a time from
// memory. QuizFlow runs it.
export default function LettersQuizPage({ signingHand, onSigningHandChange, model = 'small' }) {
  return (
    <>
      <MenuBar active="quiz" />
      <QuizFlow
        kind="letters"
        pickItems={() => pickLetters(LETTER_COUNT)}
        signingHand={signingHand}
        onSigningHandChange={onSigningHandChange}
        model={model}
      />
    </>
  )
}
