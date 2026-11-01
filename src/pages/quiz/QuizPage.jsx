import MenuBar from '../../app/layout/MenuBar.jsx'
import { navigate } from '../../app/routing/navigation.js'
import { PATHS } from '../../app/routing/router.js'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'
import { LETTER_COUNT, WORD_COUNT } from './quizRounds.js'
import { useWords } from './useWords.js'

// The quiz (/quiz, 2026-10-27) tests what someone has learned. This page is
// the choice: letters or words. Each kind has its own page, /quiz/letters
// (LettersQuizPage) and /quiz/words (WordsQuizPage), where they sign each letter
// from memory: no steps and no hints, only an eye to peek at the letter's
// drawing (a peeked pass still counts, and is marked). QuizFlow runs the quiz
// and its results; QuizRun checks each letter exactly as on Learn
// (useLetterCheck: the finger conditions decide, held 1.5 s; J and
// Z traced). quizRounds.js holds the quiz's state.
// Redesigned 2026-11-01 in the camera check's look: sticker cards with a
// small letter tile row each, and the amber key look for Start.

// Four random letters for the Letters card's picture. Chosen once when the site
// loads (module level, not inside the component), so they change on every
// refresh but stay put while the person moves between pages.
// Sorting by a random number shuffles a copy of the list; the first four are
// then four different letters.
const SAMPLE_LETTERS = [...LETTERS].sort(() => Math.random() - 0.5).slice(0, 4)

// The Words card does the same with one random word from words.json. The list
// arrives after the page opens (useWords), so the word is picked the first time
// the list is there, then kept at module level like the letters. HAND shows
// only until then.
let sampleWord = null

function pickSampleWord(list) {
  if (sampleWord === null && list.length > 0) {
    sampleWord = list[Math.floor(Math.random() * list.length)]
  }
  return sampleWord ?? 'HAND'
}

// A row of small tiles, one letter each, drawn like the quiz's own tiles. When
// the page opens they fill with green one after another, as if signed
// (styles.css). Decoration: the card's title says what it is.
function ArtTiles({ letters }) {
  return (
    <span className="quiz-choice-art" aria-hidden="true">
      {letters.map((letter, i) => (
        <span key={i} className="quiz-art-tile" style={{ '--i': i }}>
          {letter}
        </span>
      ))}
    </span>
  )
}

// Looks like Welcome's key button, but the whole card is the button (a button
// can't hold another), so this is only drawn like one.
function StartKey() {
  return (
    <span className="quiz-choice-start">
      Start
      <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h13M13 6l6 6-6 6" />
      </svg>
    </span>
  )
}

export default function QuizPage() {
  const words = useWords()
  const wordLetters = [...pickSampleWord(words.list)]
  const wordsText =
    words.status === 'error'
      ? 'The word list didn’t load.'
      : words.status === 'loading'
        ? 'Getting the word list…'
        : `Spell ${WORD_COUNT} short words, one letter at a time.`
  return (
    <>
      <MenuBar active="quiz" />
      <main className="quiz-choose">
        <header className="quiz-choose-head">
          <h1>Ready to test yourself?</h1>
          <p>Sign each letter from memory, with only your camera watching. Stuck? Peek at the drawing. It counts as a clue.</p>
        </header>
        <div className="quiz-choices">
          <button type="button" className="quiz-choice" onClick={() => navigate(PATHS.quizLetters)}>
            <ArtTiles letters={SAMPLE_LETTERS} />
            <span className="quiz-choice-title">Letters</span>
            <span className="quiz-choice-text">{LETTER_COUNT} random letters, one at a time. How many can you sign?</span>
            <StartKey />
          </button>
          {/* Words waits for words.json. */}
          <button
            type="button"
            className="quiz-choice"
            disabled={words.list.length === 0}
            onClick={() => navigate(PATHS.quizWords)}
          >
            <ArtTiles letters={wordLetters} />
            <span className="quiz-choice-title">Words</span>
            <span className="quiz-choice-text">{wordsText}</span>
            <StartKey />
          </button>
        </div>
      </main>
    </>
  )
}
