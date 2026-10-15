import { classLabel } from './letters.js'
import { LIFEPRINT_URL, POSITION_HINTS, TAKES_TARGET } from './takeRules.js'

// The card for the chosen letter and hand: a reference picture, how to form
// the letter, and where to hold the hand for the next take.
export default function TakePanel({ cell, instructions, image, accepted }) {
  if (!cell) {
    return (
      <section className="take-card">
        <p className="take-card-empty">Choose a letter and a hand in the table below.</p>
      </section>
    )
  }

  const isNone = cell.letter === 'none'
  const hint =
    accepted < TAKES_TARGET
      ? `Take ${accepted + 1} of ${TAKES_TARGET}: ${POSITION_HINTS[accepted] ?? 'Any position'}.`
      : 'Extra take: any position.'

  return (
    <section className="take-card">
      <h2>
        {isNone ? 'No letter' : `Letter ${classLabel(cell.letter)}`} · {cell.hand} hand
      </h2>
      {!isNone && <ReferenceImage image={image} letter={cell.letter} mirrored={cell.hand === 'left'} />}
      {isNone ? (
        <p>Relax your hand, half-form shapes and move it around.</p>
      ) : (
        instructions && (
          <p>
            {instructions}.{' '}
            <span className="take-note">(Described for the right hand; mirror it for the left.)</span>
          </p>
        )
      )}
      <p className="take-hint">{hint}</p>
      {!isNone && (
        <p>
          <a href={LIFEPRINT_URL} target="_blank" rel="noreferrer">How to sign the letters (Lifeprint)</a>
        </p>
      )}
    </section>
  )
}

// The letter's reference picture from letters.json ("image", a path inside
// public/languages/asl/), mirrored for the left hand. A placeholder until the
// pictures are added.
function ReferenceImage({ image, letter, mirrored }) {
  if (!image) {
    return <div className="reference reference-placeholder">Reference picture coming soon</div>
  }
  return (
    <figure className="reference-figure">
      <div className="reference">
        <img
          src={`${import.meta.env.BASE_URL}languages/asl/${image}`}
          alt={`Reference handshape for ${letter}`}
          className={mirrored ? 'mirrored' : undefined}
        />
      </div>
      {mirrored && <figcaption>Mirrored for the left hand</figcaption>}
    </figure>
  )
}
