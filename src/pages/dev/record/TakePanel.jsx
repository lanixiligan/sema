import { DRAWN_HAND } from '../../../components/AslDrawing.jsx'
import { TAKES_TARGET } from '../../../recorder/takeRules.js'

// The letter card: its name and kept takes on top, then the reference
// picture. How to form the letter is under the card (LetterGuide).
export default function TakePanel({ cell, isPilot, image, accepted }) {
  const title = `Letter ${cell.letter}${isPilot ? ' (pilot)' : ''}`

  return (
    <section className="letter-card letter-card-record" aria-label="Current letter">
      <div className="letter-card-head">
        <h2 className="letter-card-title">{title}</h2>
        <span className="letter-card-count">
          {Math.min(accepted, TAKES_TARGET)} / {TAKES_TARGET} takes
        </span>
      </div>
      <ReferenceImage letter={cell.letter} image={image} mirrored={cell.hand !== DRAWN_HAND} />
    </section>
  )
}

// The reference picture once letters.json has one ("image", a path inside
// public/), mirrored when the take is for the hand it doesn't show, on a
// white backing in both themes: the drawings are black lines, which a dark
// card would swallow. Without one, a placeholder with the letter.
function ReferenceImage({ letter, image, mirrored }) {
  if (image) {
    return (
      <div className="reference-image reference-image-drawing">
        <img
          src={`${import.meta.env.BASE_URL}${image}`}
          alt={`Reference handshape for ${letter}`}
          className={mirrored ? 'mirrored' : undefined}
        />
      </div>
    )
  }
  return (
    <div className="reference-image reference-image-empty">
      <span className="reference-image-letter" aria-hidden="true">
        {letter}
      </span>
      <span className="reference-image-note">Photo coming soon</span>
    </div>
  )
}
