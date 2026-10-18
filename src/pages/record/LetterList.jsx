import { classLabel } from '../../recorder/letters.js'
import { takeProgress } from '../../recorder/sessionFile.js'
import { TAKES_TARGET } from '../../recorder/takeRules.js'
import TakeMarks from './TakeMarks.jsx'

// The letters to record, in a panel on the left, in two groups: the training
// letters and "None" (no letter), then the pilot letters (recorded for
// testing, not training yet), their letters drawn fainter. Each group's
// heading counts its kept takes for the chosen hand; each row shows its own
// as three marks (TakeMarks, where a kept take can be deleted), and the
// chosen letter is highlighted. The marks sit on top of the row's right end,
// not inside its button (a button can't hold other buttons).
export default function LetterList({ training, pilot, session, hand, selected, onSelect, onDelete, disabled }) {
  const row = (letter, isPilot) => {
    const takes = keptTakes(session, letter, hand)
    const kept = takes.length
    const isSelected = selected?.letter === letter
    const classes = ['letter-row']
    if (isPilot) classes.push('pilot')
    if (kept >= TAKES_TARGET) classes.push('done')
    return (
      <li key={letter} className="letter-item">
        <button
          type="button"
          className={classes.join(' ')}
          aria-pressed={isSelected}
          aria-label={`${classLabel(letter)}, ${Math.min(kept, TAKES_TARGET)} of ${TAKES_TARGET} takes`}
          disabled={disabled}
          onClick={() => onSelect(letter)}
        >
          <span className="letter-row-letter">{letter === 'none' ? 'None' : letter}</span>
        </button>
        <TakeMarks letter={letter} takes={takes} onDelete={onDelete} disabled={disabled} />
      </li>
    )
  }

  const group = (id, title, letters, isPilot) => {
    const { kept, needed } = takeProgress(session, letters, [hand])
    return (
      // Each group gets a share of the panel's height for each of its rows,
      // so every row is the same height (styles.css lets the rows grow).
      <section className="letter-group" aria-labelledby={id} style={{ flexGrow: letters.length }}>
        <h2 id={id} className="letter-list-heading">
          {title}
          <span className="letter-list-count">
            {kept} / {needed}
            <span className="visually-hidden"> takes, {hand} hand</span>
          </span>
        </h2>
        <ul>{letters.map((letter) => row(letter, isPilot))}</ul>
      </section>
    )
  }

  return (
    <nav className="letter-list" aria-label="Letters">
      {group('letter-list-main', 'Letters', [...training, 'none'], false)}
      {pilot.length > 0 && group('letter-list-pilot', 'Pilot letters', pilot, true)}
    </nav>
  )
}

// The kept takes for one letter and hand, oldest first. Rejected attempts
// stay in the file but don't count here.
function keptTakes(session, letter, hand) {
  return session.recordings.filter((r) => r.letter === letter && r.hand === hand && r.status === 'accepted')
}
