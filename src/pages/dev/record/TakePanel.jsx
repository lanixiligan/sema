import AslDrawing from '../../../components/AslDrawing.jsx'
import { TAKES_TARGET } from '../../../recorder/takeRules.js'

// The letter card: its name and kept takes on top, then the letter's drawing,
// facing the hand of the take, on a white backing in both themes: the
// drawings are black lines, which a dark card would swallow.
export default function TakePanel({ cell, accepted }) {
  return (
    <section className="letter-card letter-card-record" aria-label="Current letter">
      <div className="letter-card-head">
        <h2 className="letter-card-title">Letter {cell.letter}</h2>
        <span className="letter-card-count">
          {Math.min(accepted, TAKES_TARGET)} / {TAKES_TARGET} takes
        </span>
      </div>
      <div className="reference-image reference-image-drawing">
        <AslDrawing letter={cell.letter} hand={cell.hand} alt={`Reference handshape for ${cell.letter}`} />
      </div>
    </section>
  )
}
