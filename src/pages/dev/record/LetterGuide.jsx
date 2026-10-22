// How to form the chosen letter, under the letter card: its steps from
// letters.json as a bullet list (described for the right hand, so with the
// left hand a last line says to mirror them). A letter without steps (the
// pilot letters) shows nothing.
export default function LetterGuide({ steps, hand }) {
  if (!steps) return null

  return (
    <section className="letter-guide" aria-label="How to form it">
      <ul>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {hand === 'left' && <p className="letter-guide-note">Mirror it for your left hand.</p>}
    </section>
  )
}
