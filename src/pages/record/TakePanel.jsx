import { LIFEPRINT_URL, TAKES_TARGET } from '../../recorder/takeRules.js'

// The letter card: its name and kept takes on top, the reference picture,
// how to form the letter (in a soft box), and a link to check the shape on
// Lifeprint.
export default function TakePanel({ cell, isPilot, instructions, image, accepted }) {
  const isNone = cell.letter === 'none'
  const title = isNone ? 'No letter' : `Letter ${cell.letter}${isPilot ? ' (pilot)' : ''}`

  return (
    <section className="letter-card letter-card-record" aria-label="Current letter">
      <div className="letter-card-head">
        <h2 className="letter-card-title">{title}</h2>
        <span className="letter-card-count">
          {Math.min(accepted, TAKES_TARGET)} / {TAKES_TARGET} takes
        </span>
      </div>
      <ReferenceImage letter={cell.letter} image={image} mirrored={cell.hand === 'left'} />
      {(isNone || instructions) && (
        <div className="letter-card-how">
          <p className="letter-card-instructions">
            {isNone
              ? "Relax your hand, half-form a shape, or move it around. Anything that isn't a letter."
              : `${instructions}.`}
          </p>
          {/* The instructions describe the right hand. */}
          {!isNone && cell.hand === 'left' && <p className="letter-card-note">Mirror it for your left hand.</p>}
        </div>
      )}
      {!isNone && (
        <a className="letter-card-link" href={LIFEPRINT_URL} target="_blank" rel="noreferrer">
          See it on Lifeprint ↗
        </a>
      )}
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
