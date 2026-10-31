import { useEffect, useState } from 'react'
import TopBar from '../../app/layout/TopBar.jsx'
import AslDrawing from '../../components/AslDrawing.jsx'

// Whether Welcome has already played its entrance. A module variable lives
// as long as the browser tab, so the entrance plays on the first load only:
// coming back from About shows the page straight away. A reload resets it.
let entrancePlayed = false

// What the tag says until the visitor types their own name.
const SAMPLE_NAME = 'Sema'
// Enough for most first names; more tiles would shrink too small to read.
const MAX_LETTERS = 12

// The letters of a name that have a drawing: A to Z only, upper case.
// Accents are taken off first (é → E), anything else is dropped.
function nameLetters(name) {
  return name
    .normalize('NFD')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, MAX_LETTERS)
    .split('')
}

// Page 1, Welcome (redesigned 2026-10-31): a "HELLO my name is" tag on a Deep
// Sky page. Whatever the visitor types on the tag is fingerspelled under it,
// one drawing per letter, because your name is the first word most people
// learn to fingerspell. The name stays in this component's state: it's never
// saved or sent. Only new visitors see the page; returning ones go straight to
// Learn. Get started opens the camera check, setup's one page (onStart).
export default function WelcomePage({ onStart }) {
  const [animate] = useState(() => !entrancePlayed)
  const [name, setName] = useState('')
  const [typed, setTyped] = useState(false)
  useEffect(() => {
    entrancePlayed = true
  }, [])

  const letters = nameLetters(name || SAMPLE_NAME)
  // The entrance: the tag lands, then the tiles one after another, then the
  // text on the right (enter-* in styles.css). Its classes come off at the
  // first keystroke, so a typed letter pops in straight away instead of
  // waiting for the entrance's delays. With reduced motion the CSS turns
  // the motion off.
  const enter = (part) => (animate && !typed ? ` enter-${part}` : '')

  function changeName(event) {
    setName(event.target.value)
    setTyped(true)
  }

  return (
    <div className="welcome">
      <TopBar />
      <main className="welcome-main">
        <div className="welcome-stage">
          <div className={`name-tag${enter('tag')}`}>
            <div className="name-tag-band">
              <span className="name-tag-hello" aria-hidden="true">
                HELLO
              </span>
              <label className="name-tag-label" htmlFor="welcome-name">
                my name is
              </label>
            </div>
            <div className="name-tag-write">
              <input
                id="welcome-name"
                className="name-tag-input"
                type="text"
                value={name}
                onChange={changeName}
                placeholder={SAMPLE_NAME}
                maxLength={24}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck="false"
              />
              <p className="name-tag-hint">Type your name and see it fingerspelled. It isn't saved.</p>
            </div>
          </div>

          {/* The name in ASL. Each tile is keyed by its place and letter, so
              typing one more letter pops in one new tile and leaves the
              others still. Screen readers get the letters as one sentence. */}
          <p className="visually-hidden" aria-live="polite">
            {`In ASL fingerspelling: ${letters.join(', ')}.`}
          </p>
          <ol className={`name-tiles${enter('tiles')}`} aria-hidden="true">
            {letters.map((letter, index) => (
              <li key={`${index}-${letter}`} className="name-tile" style={{ '--tilt': index % 2 ? 1 : -1, '--index': index }}>
                <span className="name-tile-drawing">
                  <AslDrawing letter={letter} hand="right" />
                </span>
                <span className="name-tile-letter">{letter}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={`welcome-copy${enter('copy')}`}>
          <h1 className="welcome-title">Your name is your first word.</h1>
          <p className="welcome-lead">
            Learn the ASL fingerspelling alphabet at your webcam. Sema checks every finger and cheers you on.
          </p>
          <button type="button" className="key-button" onClick={onStart}>
            Get started
            <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
          <p className="welcome-note">No account. Your video never leaves this device.</p>
        </div>
      </main>
    </div>
  )
}
