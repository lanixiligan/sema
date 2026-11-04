import MenuBar from '../../app/layout/MenuBar.jsx'
import { navigate } from '../../app/routing/navigation.js'
import { PATHS } from '../../app/routing/router.js'
import { useSettings } from '../../app/settings/settings.js'
import { GUESS_COUNT, GUESS_LETTERS, WORD_COUNT } from './quizRounds.js'
import { useWords } from './useWords.js'

// The quiz (/quiz, 2026-10-27) tests what someone has learned. This page is
// the choice, since 2026-11-04 between two different skills (before, Letters
// and Words, which both asked for signs):
// - Words (/quiz/words, WordsQuizPage): sign each letter from memory with the
//   camera, no hints, only an eye to peek at the letter's drawing (a peeked
//   pass still counts, and is marked). QuizFlow runs it and its results;
//   QuizRun checks each letter exactly as on Learn (useLetterCheck).
// - Guess the letter (/quiz/guess, GuessQuizPage): Sema shows a hand sign and
//   the person names its letter. No camera, so it's also the quiz for someone
//   who can't or won't use one. Until the camera check has passed, the Words
//   card leads to the check first.
// quizRounds.js holds the quiz's state.
// Redesigned 2026-11-01 in the camera check's look: sticker cards with a
// small letter tile row each, and the amber key look for Start. Until
// 2026-11-02 the words were few on purpose; that day Lanix asked for more
// description: a count, a sentence and two short facts on each card. The card
// is one <button>, so it holds only <span>s (a list can't go inside a button).

// Three random letters and a question mark for the Guess card's picture.
// Chosen once when the site loads (module level, not inside the component), so
// they change on every refresh but stay put while the person moves between
// pages. Sorting by a random number shuffles a copy of the list; the first
// three are then three different letters.
const SAMPLE_LETTERS = [...[...GUESS_LETTERS].sort(() => Math.random() - 0.5).slice(0, 3), '?']

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
function StartKey({ label = 'Start' }) {
  return (
    <span className="quiz-choice-start">
      {label}
      <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h13M13 6l6 6-6 6" />
      </svg>
    </span>
  )
}

export default function QuizPage() {
  const words = useWords()
  // Without the camera check, Words opens the check first, and comes back.
  const { cameraChecked, openCameraCheck } = useSettings()
  const openWords = () => (cameraChecked ? navigate(PATHS.quizWords) : openCameraCheck(PATHS.quizWords))
  const wordLetters = [...pickSampleWord(words.list)]
  const wordsText =
    words.status === 'error'
      ? 'Words didn’t load.'
      : words.status === 'loading'
        ? 'Loading words…'
        : `${WORD_COUNT} short words`
  return (
    <>
      <MenuBar active="quiz" />
      <main className="quiz-choose">
        <header className="quiz-choose-head">
          <h1>Ready to test yourself?</h1>
        </header>
        <div className="quiz-choices">
          {/* Words waits for words.json. */}
          <button type="button" className="quiz-choice" disabled={words.list.length === 0} onClick={openWords}>
            <ArtTiles letters={wordLetters} />
            <span className="quiz-choice-title">Words</span>
            <span className="quiz-choice-count">{wordsText}</span>
            <span className="quiz-choice-text">Fingerspell whole words to the camera, from memory.</span>
            <span className="quiz-choice-points">
              <span>Hold each letter for 1.5 seconds to pass it.</span>
              <span>{cameraChecked ? 'Uses your camera.' : 'Set up your camera first.'}</span>
            </span>
            <StartKey label={cameraChecked ? 'Start' : 'Set up camera'} />
          </button>
          <button type="button" className="quiz-choice" onClick={() => navigate(PATHS.quizGuess)}>
            <ArtTiles letters={SAMPLE_LETTERS} />
            <span className="quiz-choice-title">Guess the letter</span>
            <span className="quiz-choice-count">{GUESS_COUNT} hand signs</span>
            <span className="quiz-choice-text">Read a hand and pick the letter it shows.</span>
            <span className="quiz-choice-points">
              <span>No camera needed.</span>
              <span>In 3D, J and Z move.</span>
            </span>
            <StartKey />
          </button>
        </div>
      </main>
    </>
  )
}
