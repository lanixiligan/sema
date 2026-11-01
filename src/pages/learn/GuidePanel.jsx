import { CheckIcon } from '../../components/icons/icons.jsx'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// The letter guide: one row of 26 tiles, A to Z, above the camera and the
// lesson (2026-11-02; before, a slim two-column rail on the left). It's only
// for picking, since the drawing is on the lesson. The tile of the letter
// being practised is lit; a letter passed during this visit gets a green tick
// (`done`, a Set held by LearnPage: nothing is saved yet, so it starts empty
// on every visit). Each tile is a real button, so the keyboard and screen
// readers can use it; aria-pressed says which one is picked.
export default function GuidePanel({ selected, done, onSelect }) {
  return (
    <section className="learn-strip" aria-labelledby="learn-strip-title">
      <h2 id="learn-strip-title" className="visually-hidden">
        Letter guide
      </h2>
      <ul>
        {LETTERS.map((letter) => (
          <li key={letter}>
            <button
              type="button"
              className={done.has(letter) ? 'learn-tile done' : 'learn-tile'}
              aria-pressed={letter === selected}
              onClick={() => onSelect(letter)}
            >
              {letter}
              {done.has(letter) && (
                <>
                  <span className="learn-tile-tick" aria-hidden="true">
                    <CheckIcon size={11} strokeWidth={3.5} />
                  </span>
                  <span className="visually-hidden"> (done)</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
