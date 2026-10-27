import MenuBar from '../../app/layout/MenuBar.jsx'
import Link from '../../app/routing/Link.jsx'
import { PATHS } from '../../app/routing/router.js'
import QuizFlow from './QuizFlow.jsx'
import { WORD_COUNT, pickWords } from './quizRounds.js'
import { useWords } from './useWords.js'

// The Words quiz (/quiz/words): short words, spelled one letter at a time from
// memory. It needs words.json first, so the quiz starts once the list has
// loaded; QuizFlow runs it.
export default function WordsQuizPage({ signingHand, onSigningHandChange, model = 'small' }) {
  const words = useWords()
  return (
    <>
      <MenuBar active="quiz" />
      {words.status === 'ready' ? (
        <QuizFlow
          kind="words"
          pickItems={() => pickWords(words.list, WORD_COUNT)}
          signingHand={signingHand}
          onSigningHandChange={onSigningHandChange}
          model={model}
        />
      ) : (
        <main className="quiz-start">
          <section>
            {words.status === 'loading' ? (
              <p>Loading the words…</p>
            ) : (
              <>
                <h1>The word list didn’t load.</h1>
                <p>
                  <Link to={PATHS.quiz}>Choose another quiz</Link>
                </p>
              </>
            )}
          </section>
        </main>
      )}
    </>
  )
}
