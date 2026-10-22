import AslDrawing from '../../components/AslDrawing.jsx'

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
// J and Z move; the classifier only knows still shapes, so they can't be picked yet.
const MOVING = ['J', 'Z']
// The 8 letters tested on Lanix's own recordings (training/reports/small.md).
const FOCUS = ['B', 'C', 'D', 'F', 'I', 'L', 'W', 'Y']

// The letter guide in the right column: every letter's drawing, facing the
// signing hand (hand). Clicking a tile picks the letter to practise
// (selected). Each tile is a real button, so the keyboard and screen readers
// can use it; aria-pressed says which one is picked.
export default function GuidePanel({ hand, selected, onSelect }) {
  return (
    <section className="try-guide" aria-labelledby="try-guide-title">
      <h2 id="try-guide-title" className="try-guide-title">
        Letter guide
      </h2>
      <ul className="try-guide-tiles">
        {LETTERS.map((letter) => {
          const moving = MOVING.includes(letter)
          const focus = FOCUS.includes(letter)
          return (
            <li key={letter}>
              <button
                type="button"
                className={`try-guide-tile${moving ? ' moving' : ''}`}
                aria-pressed={letter === selected}
                disabled={moving}
                onClick={() => onSelect(letter)}
              >
                {focus && <span className="try-guide-dot" aria-hidden="true" />}
                <span className="try-guide-drawing">
                  <AslDrawing letter={letter} hand={hand} />
                </span>
                {letter}
                <span className="visually-hidden">
                  {focus ? ', works best so far' : moving ? ', moves, not available yet' : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="try-guide-legend">
        <span>
          <span className="try-guide-dot" aria-hidden="true" /> Works best so far
        </span>
        <span>
          <span className="try-guide-swatch" aria-hidden="true" /> Moves, not available yet
        </span>
      </div>
    </section>
  )
}
