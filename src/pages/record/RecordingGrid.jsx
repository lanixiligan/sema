import { classLabel } from '../../recorder/letters.js'
import { acceptedCount } from '../../recorder/sessionFile.js'
import { TAKES_TARGET } from '../../recorder/takeRules.js'

// The letters for one hand, as a row of tiles: the training letters, "None"
// (no letter), then the pilot-only letters. Each tile shows takes kept out of
// 3; a full tile turns blue, a pilot tile is grey, the chosen one has a dark
// border. The legend underneath says what the looks mean.
export default function RecordingGrid({ training, pilot, session, hand, selected, onSelect, disabled }) {
  const letters = [...training, 'none', ...pilot]

  return (
    <section className="letters" aria-label="Letters">
      <div className="letters-head">
        <h2>{hand === 'left' ? 'Left' : 'Right'} hand · takes kept</h2>
        {pilot.length > 0 && (
          <span className="letters-pilot-note">Pilot letters are recorded for testing only, not for training yet.</span>
        )}
      </div>
      <div className="letter-tiles" style={{ gridTemplateColumns: `repeat(${letters.length}, minmax(0, 1fr))` }}>
        {letters.map((letter) => {
          const kept = acceptedCount(session, letter, hand)
          const isPilot = pilot.includes(letter)
          const classes = ['letter-tile-button']
          if (kept >= TAKES_TARGET) classes.push('done')
          else if (isPilot) classes.push('pilot')
          if (letter === 'none') classes.push('none')
          return (
            <button
              key={letter}
              type="button"
              className={classes.join(' ')}
              aria-pressed={selected?.letter === letter}
              aria-label={`${classLabel(letter)}, ${hand} hand, ${kept} of ${TAKES_TARGET} takes kept${isPilot ? ', pilot only' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(letter)}
            >
              <span className="letter-tile-letter">{letter === 'none' ? 'None' : letter}</span>
              <span className="letter-tile-count">
                {kept}/{TAKES_TARGET}
              </span>
            </button>
          )
        })}
      </div>
      <div className="letters-legend" aria-hidden="true">
        <span>
          <span className="legend-swatch done" />3 of 3 kept
        </span>
        <span>
          <span className="legend-swatch" />
          Still to do
        </span>
        {pilot.length > 0 && (
          <span>
            <span className="legend-swatch pilot" />
            Pilot only
          </span>
        )}
      </div>
    </section>
  )
}
