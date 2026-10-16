import { LIFEPRINT_URL, POSITION_HINTS, TAKES_TARGET } from '../../recorder/takeRules.js'

// The letter card: the reference picture on top, then how to form the letter,
// where to hold the hand for the next take, and a link to check the shape on
// Lifeprint.
export default function TakePanel({ cell, isPilot, instructions, image, accepted }) {
  const isNone = cell.letter === 'none'
  const title = isNone ? 'No letter' : `Letter ${cell.letter}${isPilot ? ' (pilot)' : ''}`
  // Where to hold the hand for the next take; the takes themselves are shown
  // under the card (TakeList).
  const takeLine = accepted < TAKES_TARGET ? `Next take: ${POSITION_HINTS[accepted]}` : 'All takes done'

  return (
    <section className="letter-card letter-card-record" aria-label="Current letter">
      <ReferenceImage letter={cell.letter} image={image} mirrored={cell.hand === 'left'} />
      <div className="letter-card-text">
        <div className="letter-card-title">{title}</div>
        <div className="letter-card-instructions">
          {isNone
            ? "Relax your hand, half-form a shape, or move it around. Anything that isn't a letter."
            : instructions && `${instructions}.`}
        </div>
        {!isNone && instructions && cell.hand === 'left' && (
          <div className="letter-card-note">Described for the right hand; mirror it for your left.</div>
        )}
        <div className="letter-card-take">{takeLine}</div>
        {!isNone && (
          <a className="letter-card-link" href={LIFEPRINT_URL} target="_blank" rel="noreferrer">
            See it on Lifeprint ↗
          </a>
        )}
      </div>
    </section>
  )
}

// The reference picture once letters.json has one ("image", a path inside
// public/languages/asl/), mirrored for the left hand. Until then, a
// placeholder with the letter itself.
function ReferenceImage({ letter, image, mirrored }) {
  if (image) {
    return (
      <div className="reference-image">
        <img
          src={`${import.meta.env.BASE_URL}languages/asl/${image}`}
          alt={`Reference handshape for ${letter}`}
          className={mirrored ? 'mirrored' : undefined}
        />
      </div>
    )
  }
  return (
    <div className="reference-image reference-image-empty">
      <span className="reference-image-letter" aria-hidden="true">
        {letter === 'none' ? '–' : letter}
      </span>
      <span className="reference-image-note">Photo coming soon</span>
    </div>
  )
}
