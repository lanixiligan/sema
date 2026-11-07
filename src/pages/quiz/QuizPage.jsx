import MenuBar from '../../app/layout/MenuBar.jsx'
import { navigate } from '../../app/routing/navigation.js'
import { PATHS } from '../../app/routing/router.js'
import { useSettings } from '../../app/settings/settings.js'
import AslDrawing from '../../components/AslDrawing.jsx'
import { GUESS_COUNT, WORD_COUNT } from './quizRounds.js'
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
// Redesigned 2026-11-01 in the camera check's look: sticker cards (with a
// small letter tile row each until 2026-11-07), and the amber key look for Start. Until
// 2026-11-02 the words were few on purpose; that day Lanix asked for more
// description (a count, a sentence and two short facts on each card), and on
// 2026-11-07 it was trimmed so the two cards read as opposites: the title on
// top (the Words quiz is called Fingerspell here), a preview, the count with
// the camera fact, and one "A … is shown on screen." sentence. The card is one <button>,
// so it holds only <span>s.

// The keys the Guess preview shows: the first row and a half of the real
// page's A to Z keys, enough to read as "pick a letter".
const PREVIEW_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// One random letter from those keys for the Guess card's picture, so its key
// can be shown answered (green). Chosen once when the site loads (module
// level, not inside the component), so it changes on every refresh but stays
// put while the person moves between pages.
const SAMPLE_LETTER = PREVIEW_KEYS[Math.floor(Math.random() * PREVIEW_KEYS.length)]

// The Fingerspell card does the same with one random word from words.json. The
// list arrives after the page opens (useWords), so the word is picked the first
// time the list is there, then kept at module level like the letter. HAND
// shows only until then.
let sampleWord = null

function pickSampleWord(list) {
  if (sampleWord === null && list.length > 0) {
    sampleWord = list[Math.floor(Math.random() * list.length)]
  }
  return sampleWord ?? 'HAND'
}

// 2026-11-07: each card shows a small, still picture of its quiz, built from
// the same shapes as the real page (before, a row of green letter tiles on
// both cards, which made them look alike). Decoration (aria-hidden): the title
// and the sentence say what the quiz is. Spans only, because the card is a
// <button>.

// Fingerspell: the camera frame with its corner marks and a hand signing the
// word's first letter, beside the letter card: the letter large, the word's
// tiles under it, the first one outlined as the current letter.
function SpellPreview({ word, hand }) {
  const letters = [...word]
  return (
    <span className="quiz-preview" aria-hidden="true">
      <span className="quiz-preview-camera">
        <span className="quiz-preview-corners" />
        <AslDrawing letter={letters[0]} hand={hand} onDark />
      </span>
      <span className="quiz-preview-panel quiz-preview-letter">
        <span className="quiz-preview-big">{letters[0]}</span>
        <span className="quiz-preview-word">
          {letters.map((letter, i) => (
            <span key={i} className={i === 0 ? 'is-current' : undefined}>
              {letter}
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

// Guess the letter: letter keys on the left, as on the real page, and the hand
// sign to name on the right. The sign's own key is green, as if just answered.
function GuessPreview({ letter, hand }) {
  return (
    <span className="quiz-preview" aria-hidden="true">
      <span className="quiz-preview-keys">
        {PREVIEW_KEYS.map((key) => (
          <span key={key} className={key === letter ? 'is-right' : undefined}>
            {key}
          </span>
        ))}
      </span>
      <span className="quiz-preview-panel quiz-preview-picture">
        <AslDrawing letter={letter} hand={hand} />
      </span>
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

export default function QuizPage({ signingHand = 'right' }) {
  const words = useWords()
  // Without the camera check, Words opens the check first, and comes back.
  const { cameraChecked, openCameraCheck } = useSettings()
  const openWords = () => (cameraChecked ? navigate(PATHS.quizWords) : openCameraCheck(PATHS.quizWords))
  const sampleWordText = pickSampleWord(words.list)
  const wordsText =
    words.status === 'error'
      ? 'Words didn’t load.'
      : words.status === 'loading'
        ? 'Loading words…'
        : `${WORD_COUNT} words · ${cameraChecked ? 'Camera on' : 'Camera setup first'}`
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
            <span className="quiz-choice-title">Fingerspell</span>
            <SpellPreview word={sampleWordText} hand={signingHand} />
            <span className="quiz-choice-count">{wordsText}</span>
            <span className="quiz-choice-text">A letter is shown on screen. Sign it with your hand, from memory.</span>
            <StartKey label={cameraChecked ? 'Start' : 'Set up camera'} />
          </button>
          <button type="button" className="quiz-choice" onClick={() => navigate(PATHS.quizGuess)}>
            <span className="quiz-choice-title">Guess the letter</span>
            <GuessPreview letter={SAMPLE_LETTER} hand={signingHand} />
            <span className="quiz-choice-count">{GUESS_COUNT} signs · No camera</span>
            <span className="quiz-choice-text">A sign is shown on screen. Pick the letter it makes.</span>
            <StartKey />
          </button>
        </div>
      </main>
    </>
  )
}
