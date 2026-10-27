import MenuBar from '../../app/layout/MenuBar.jsx'
import { navigate } from '../../app/routing/navigation.js'
import { PATHS } from '../../app/routing/router.js'
import { EyeIcon } from '../../components/icons/icons.jsx'
import { CameraIcon, TrophyIcon } from '../../components/icons/LineIcons.jsx'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'
import { LETTER_COUNT, WORD_COUNT } from './quizRounds.js'
import { useWords } from './useWords.js'

// The quiz (/quiz, 2026-10-27) tests what someone has learned. This page is
// the choice: letters or words. Each kind has its own page, /quiz/letters
// (LettersQuizPage) and /quiz/words (WordsQuizPage), where they sign each letter
// from memory: no steps and no hints, only an eye to peek at the letter's
// drawing (a peeked pass still counts, and is marked). QuizFlow runs the quiz
// and its results; QuizRun checks each letter exactly as on Learn
// (useLetterCheck: the model's sure guess and the shape rules, held 3 s; J and
// Z traced). quizRounds.js holds the quiz's state.
// Four random letters for the Letters card's picture. Chosen once when the site
// loads (module level, not inside the component), so they change on every
// refresh but stay put while the person moves between pages.
// Sorting by a random number shuffles a copy of the list; the first four are
// then four different letters.
const SAMPLE_LETTERS = [...LETTERS].sort(() => Math.random() - 0.5).slice(0, 4)

export default function QuizPage() {
  const words = useWords()
  return (
    <>
      <MenuBar active="quiz" />
      <main className="quiz-choose">
        <header className="quiz-choose-head">
          <span className="quiz-choose-eyebrow">
            <TrophyIcon size={16} />
            Quiz time
          </span>
          <h1>Choose your quiz mode</h1>
          <p>Practice fingerspelling from memory, one letter at a time.</p>
        </header>
        <div className="quiz-choices">
          <button type="button" className="quiz-choice" onClick={() => navigate(PATHS.quizLetters)}>
            <span className="quiz-choice-top" aria-hidden="true">
              {/* Four random letters, the first lit like the Words card's. */}
              <span className="quiz-choice-art">
                {SAMPLE_LETTERS.map((letter, i) => (
                  <span key={letter} className={i === 0 ? 'quiz-art-tile quiz-art-lit' : 'quiz-art-tile'}>
                    {letter}
                  </span>
                ))}
              </span>
            </span>
            <span className="quiz-choice-title">Letters</span>
            <span className="quiz-choice-text">Practice {LETTER_COUNT} random letters, one at a time.</span>
            {/* Looks like a button, but the whole card is the button (a button can't hold another). */}
            <span className="quiz-choice-foot">
              <span className="quiz-choice-start">Start</span>
            </span>
          </button>
          {/* Words waits for words.json. */}
          <button
            type="button"
            className="quiz-choice"
            disabled={words.list.length === 0}
            onClick={() => navigate(PATHS.quizWords)}
          >
            <span className="quiz-choice-top" aria-hidden="true">
              {/* A short word in tiles, the first letter lit like the quiz's own word line. */}
              <span className="quiz-choice-art">
                <span className="quiz-art-tile quiz-art-lit">H</span>
                <span className="quiz-art-tile">A</span>
                <span className="quiz-art-tile">N</span>
                <span className="quiz-art-tile">D</span>
              </span>
            </span>
            <span className="quiz-choice-title">Words</span>
            <span className="quiz-choice-text">
              {words.status === 'error'
                ? 'The word list didn’t load.'
                : `Spell ${WORD_COUNT} short words, one letter at a time.`}
            </span>
            {/* Looks like a button, but the whole card is the button (a button can't hold another). */}
            <span className="quiz-choice-foot">
              <span className="quiz-choice-start">Start</span>
            </span>
          </button>
        </div>
        {/* How a quiz goes, in three short points. */}
        <ul className="quiz-perks">
          <li>
            <span className="quiz-perk-icon">
              <CameraIcon size={20} />
            </span>
            Sign each letter to your camera
          </li>
          <li>
            <span className="quiz-perk-icon">
              <EyeIcon size={20} />
            </span>
            Stuck? Peek at the drawing
          </li>
          <li>
            <span className="quiz-perk-icon">
              <TrophyIcon size={20} />
            </span>
            See your score at the end
          </li>
        </ul>
      </main>
    </>
  )
}
