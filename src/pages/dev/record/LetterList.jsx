import { takeProgress } from '../../../recorder/sessionFile.js'
import { TAKES_TARGET } from '../../../recorder/takeRules.js'
import TakeMarks from './TakeMarks.jsx'

// The letters to record, in a panel on the left, in one list from A to Z. The heading counts all the kept takes for the chosen hand; each row shows its own
// as three marks (TakeMarks, where a kept take can be deleted), and the
// chosen letter is highlighted. The marks sit on top of the row's right end,
// not inside its button (a button can't hold other buttons).
export default function LetterList({ letters, session, hand, selected, onSelect, onDelete, disabled }) {
  const row = (letter) => {
    const takes = keptTakes(session, letter, hand)
    const kept = takes.length
    const isSelected = selected?.letter === letter
    const classes = ['letter-row']
    if (kept >= TAKES_TARGET) classes.push('done')
    return (
      <li key={letter} className="letter-item">
        <button
          type="button"
          className={classes.join(' ')}
          aria-pressed={isSelected}
          aria-label={`${letter}, ${Math.min(kept, TAKES_TARGET)} of ${TAKES_TARGET} takes`}
          disabled={disabled}
          onClick={() => onSelect(letter)}
        >
          <span className="letter-row-letter">{letter}</span>
        </button>
        <TakeMarks letter={letter} takes={takes} onDelete={onDelete} disabled={disabled} />
      </li>
    )
  }

  const all = [...letters].sort()
  const { kept, needed } = takeProgress(session, all, [hand])

  return (
    <nav className="letter-list" aria-label="Letters">
      {/* The rows share the panel's height, so every row is the same height
          (styles.css lets them grow). */}
      <section className="letter-group" aria-labelledby="letter-list-main">
        <h2 id="letter-list-main" className="letter-list-heading">
          Letters
          <span className="letter-list-count">
            {kept} / {needed}
            <span className="visually-hidden"> takes, {hand} hand</span>
          </span>
        </h2>
        <ul>{all.map(row)}</ul>
      </section>
    </nav>
  )
}

// The kept takes for one letter and hand, oldest first. Rejected attempts
// stay in the file but don't count here.
function keptTakes(session, letter, hand) {
  return session.recordings.filter((r) => r.letter === letter && r.hand === hand && r.status === 'accepted')
}
