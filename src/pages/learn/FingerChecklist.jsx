import { CheckIcon } from '../../components/icons/icons.jsx'
import FingerText from '../../components/FingerText.jsx'

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
