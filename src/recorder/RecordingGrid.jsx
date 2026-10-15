import { classLabel } from './letters.js'
import { acceptedCount } from './sessionFile.js'
import { TAKES_TARGET } from './takeRules.js'

const HANDS = ['left', 'right']

export default function RecordingGrid({ training, pilot, session, selected, onSelect, disabled }) {
  const row = (letter) => (
    <tr key={letter}>
      <th scope="row">{classLabel(letter)}</th>
      {HANDS.map((hand) => {
        const isSelected = selected?.letter === letter && selected?.hand === hand
        return (
          <td key={hand}>
            <button
              type="button"
              className="cell-button"
              aria-pressed={isSelected}
              aria-label={`${classLabel(letter)}, ${hand} hand`}
              disabled={disabled}
              onClick={() => onSelect({ letter, hand })}
            >
              {acceptedCount(session, letter, hand)} / {TAKES_TARGET}
            </button>
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className="recording-grid-wrap">
      <table className="recording-grid">
        <thead>
          <tr>
            <th scope="col">Letter</th>
            <th scope="col">Left</th>
            <th scope="col">Right</th>
          </tr>
        </thead>
        <tbody>
          {training.map(row)}
          {row('none')}
        </tbody>
      </table>
      {pilot.length > 0 && (
        <details className="pilot-letters">
          <summary>Pilot letters ({pilot.length})</summary>
          <table className="recording-grid">
            <tbody>{pilot.map(row)}</tbody>
          </table>
        </details>
      )}
    </div>
  )
}
