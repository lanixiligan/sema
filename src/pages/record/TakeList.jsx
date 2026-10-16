import { CheckIcon, CloseIcon } from '../../components/icons.jsx'
import { TAKES_TARGET } from '../../recorder/takeRules.js'

// The kept takes for the chosen letter and hand, each with its own delete
// button, then empty slots up to the three needed. They're numbered by
// position (1, 2, 3), not by their take number in the file, which counts
// rejected attempts and can have gaps.
export default function TakeList({ takes, onDelete, disabled }) {
  const slots = Math.max(TAKES_TARGET, takes.length)

  return (
    <ol className="take-list" aria-label="Takes">
      {Array.from({ length: slots }, (_, i) => {
        const take = takes[i]
        if (!take) {
          return (
            <li key={`empty-${i}`} className="take-slot empty">
              <span aria-hidden="true">{i + 1}</span>
              <span className="visually-hidden">Take {i + 1}, not recorded yet</span>
            </li>
          )
        }
        return (
          <li key={take.recording} className="take-slot">
            <span className="take-slot-mark" aria-hidden="true">
              <CheckIcon size={12} />
            </span>
            <span aria-hidden="true">{i + 1}</span>
            <span className="visually-hidden">Take {i + 1}, kept</span>
            <button
              type="button"
              aria-label={`Delete take ${i + 1}`}
              title={`Delete take ${i + 1}`}
              disabled={disabled}
              onClick={() => onDelete(take.recording)}
            >
              <CloseIcon />
            </button>
          </li>
        )
      })}
    </ol>
  )
}
