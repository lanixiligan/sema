import { classLabel } from '../../recorder/letters.js'
import { acceptedCount } from '../../recorder/sessionFile.js'
import { TAKES_TARGET } from '../../recorder/takeRules.js'

// The letters to record, in a column on the left: the training letters and
// "None" (no letter), then the pilot letters in their own group, drawn
// fainter with dashed outlines (recorded for testing, not training yet).
// Each row shows its kept takes for the chosen hand as dots, filled when
// kept; the chosen letter is highlighted.
export default function LetterList({ training, pilot, session, hand, selected, onSelect, disabled }) {
  const row = (letter, isPilot) => {
    const kept = acceptedCount(session, letter, hand)
    const classes = ['letter-row']
    if (isPilot) classes.push('pilot')
    if (kept >= TAKES_TARGET) classes.push('done')
    return (
      <li key={letter}>
        <button
          type="button"
          className={classes.join(' ')}
          aria-pressed={selected?.letter === letter}
          aria-label={`${classLabel(letter)}, ${Math.min(kept, TAKES_TARGET)} of ${TAKES_TARGET} takes`}
          disabled={disabled}
          onClick={() => onSelect(letter)}
        >
          <span className="letter-row-letter">{letter === 'none' ? 'None' : letter}</span>
          <TakeDots kept={kept} />
        </button>
      </li>
    )
  }

  return (
    <nav className="letter-list" aria-label="Letters">
      <ul>{[...training, 'none'].map((letter) => row(letter, false))}</ul>
      {pilot.length > 0 && (
        <section aria-labelledby="letter-list-pilot">
          <h2 id="letter-list-pilot" className="letter-list-heading">
            Pilot <span>testing only</span>
          </h2>
          <ul>{pilot.map((letter) => row(letter, true))}</ul>
        </section>
      )}
    </nav>
  )
}

// Three dots, one per take needed; kept takes fill in.
function TakeDots({ kept }) {
  return (
    <span className="take-dots" aria-hidden="true">
      {Array.from({ length: TAKES_TARGET }, (_, i) => (
        <span key={i} className={i < kept ? 'filled' : undefined} />
      ))}
    </span>
  )
}
