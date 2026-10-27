import { CheckIcon } from '../../components/icons/icons.jsx'
import { FINGER_NUMBERS } from '../../vision/landmarks/handPoints.js'

// The letter's finger conditions (letterShapes.js) as a checklist, ticked off
// live as the signing hand meets them; the hold starts once the letter is
// made. Each finger name has its number in a badge, the same number as on that
// fingertip over the camera (handPoints.js).
// checks: useLetterCheck's `checks`, each with `met`; only scored ones (a
// hand in view) have `smooth`.
export default function FingerChecklist({ checks }) {
  return (
    <section className="finger-checks" aria-label="What to check">
      <ul>
        {checks.map((check) => (
          <li key={check.text} className={check.met ? 'met' : undefined}>
            <span className="finger-check-mark" aria-hidden="true">
              {check.met && <CheckIcon size={11} strokeWidth={3} />}
            </span>
            <span>
              <FingerText text={check.text} />
              {check.met && <span className="visually-hidden"> (done)</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// A condition's text with every {finger} as its number badge and its name in bold.
function FingerText({ text }) {
  return text.split(/\{(\w+)\}/).map((part, i) =>
    // split puts the names in braces at the odd places.
    i % 2 === 1 ? (
      <b key={i} className="finger-name">
        <FingerBadge name={part} />
        {part}
      </b>
    ) : (
      part
    ),
  )
}

function FingerBadge({ name }) {
  return (
    <span className="finger-badge" aria-hidden="true">
      {FINGER_NUMBERS[name]}
    </span>
  )
}
