// How to form the chosen letter, under the letter card: its steps from
// letters.json as a bullet list (described for the right hand, so with the
// left hand a last line says to mirror them). "None" gets what to do
// instead; a letter without steps (the pilot letters) shows nothing.
export default function LetterGuide({ letter, steps, hand }) {
  const isNone = letter === 'none'
  if (!isNone && !steps) return null
  const items = isNone
    ? ['Relax your hand, half-form a shape, or move it around', "Anything that isn't a letter"]
    : steps

  return (
    <section className="letter-guide" aria-label="How to form it">
      <ul>
        {items.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {!isNone && hand === 'left' && <p className="letter-guide-note">Mirror it for your left hand.</p>}
    </section>
  )
}
