import { CheckIcon, CloseIcon } from '../../../components/icons/icons.jsx'
import { TAKES_TARGET } from '../../../recorder/takeRules.js'

// A letter's takes for the chosen hand, as three small circles: a filled
// circle with a tick for each kept take, a plain ring for the rest. A kept
// one is a button: hovering it (or focusing it) turns the tick into a ×,
// and clicking deletes that take (onDelete; not during a take). The rings
// are decoration: the row's label says how many are kept. Takes are
// numbered by position, not by their take number in the file, which counts
// rejected attempts and can have gaps.
export default function TakeMarks({ letter, takes, onDelete, disabled }) {
  return (
    <span className="take-marks">
      {Array.from({ length: TAKES_TARGET }, (_, i) => {
        const take = takes[i]
        if (!take) return <span key={i} className="take-mark" aria-hidden="true" />
        const label = `Delete take ${i + 1} of ${letter}`
        return (
          <button
            key={take.recording}
            type="button"
            className="take-mark kept"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={() => onDelete(take.recording)}
          >
            <span className="take-mark-tick">
              <CheckIcon size={9} strokeWidth={3.2} />
            </span>
            <span className="take-mark-delete">
              <CloseIcon size={8} />
            </span>
          </button>
        )
      })}
    </span>
  )
}
