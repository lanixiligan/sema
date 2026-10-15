import { classLabel } from './letters.js'
import { LIFEPRINT_URL, POSITION_HINTS } from './takeRules.js'

export default function TakePanel({ cell, instructions, accepted, recording, canRecord, onRecord }) {
  if (!cell) return <p className="take-panel">Choose a letter and a hand in the table.</p>

  const title = cell.letter === 'none' ? 'No letter' : `Letter ${classLabel(cell.letter)}`
  const hint = accepted < POSITION_HINTS.length ? POSITION_HINTS[accepted] : 'Any position'
  const isThisCell = recording.letter === cell.letter && recording.hand === cell.hand

  return (
    <section className="take-panel">
      <h2>
        {title}, {cell.hand} hand
      </h2>
      {cell.letter === 'none' ? (
        <p>Relax your hand, half-form shapes and move it around.</p>
      ) : (
        <>
          {instructions && (
            <p>
              {instructions}.{' '}
              <span className="take-note">(Described for the right hand; mirror it for the left.)</span>
            </p>
          )}
          <p>
            <a href={LIFEPRINT_URL} target="_blank" rel="noreferrer">How to sign the letters (Lifeprint)</a>
          </p>
        </>
      )}
      <p>
        Take {accepted + 1}: {hint}.
      </p>
      <button type="button" className="button" disabled={!canRecord} onClick={onRecord}>
        Record
      </button>
      <div aria-live="polite">{isThisCell && <TakeStatus recording={recording} />}</div>
    </section>
  )
}

function TakeStatus({ recording }) {
  switch (recording.phase) {
    case 'countdown':
      return <p className="take-countdown">{recording.secondsLeft}</p>
    case 'settling':
    case 'capturing':
      return <p className="take-hold">Hold…</p>
    case 'saving':
      return <p>Saving…</p>
    case 'review':
      return <TakeResult result={recording.result} />
    case 'discarded':
      return <p className="error">{recording.message}</p>
    default:
      return null
  }
}

function TakeResult({ result }) {
  const { kept, mismatched } = result.counts
  if (result.status === 'accepted') {
    const other = mismatched > 0 ? `, ${mismatched} with the other hand detected` : ''
    return <p>Saved: {kept} frames with a hand{other}.</p>
  }
  return <p className="error">Not saved: {result.reason}. Try again.</p>
}
