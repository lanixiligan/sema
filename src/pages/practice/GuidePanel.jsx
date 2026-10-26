import AslDrawing from '../../components/AslDrawing.jsx'

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

// The letter guide in the left column: every letter's drawing, facing the
// signing hand (hand). Clicking a tile picks the letter to practise
// (selected). Each tile is a real button, so the keyboard and screen readers
// can use it; aria-pressed says which one is picked.
export default function GuidePanel({ hand, selected, onSelect }) {
  return (
    <section className="practice-guide" aria-labelledby="practice-guide-title">
      <h2 id="practice-guide-title" className="practice-guide-title">
        Letter guide
      </h2>
      <ul className="practice-guide-tiles">
        {LETTERS.map((letter) => (
          <li key={letter}>
            <button
              type="button"
              className="practice-guide-tile"
              aria-pressed={letter === selected}
              onClick={() => onSelect(letter)}
            >
              <span className="practice-guide-drawing">
                <AslDrawing letter={letter} hand={hand} />
              </span>
              {letter}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
