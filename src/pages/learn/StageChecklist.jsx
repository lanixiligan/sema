import { CheckIcon, ChevronIcon } from '../../components/icons/icons.jsx'
import FingerChecklist from './FingerChecklist.jsx'

// The finger checklist on the camera (CameraView's `panel`), on a translucent
// dark panel at the video's left edge. A button in its head minimizes it to a
// small pill, "Checklist 2/5" (how many conditions are met), for a hand that's
// held at that side of the picture; the pill opens it again. `open` and
// `onOpenChange` are Learn's, not this component's own state: the panel goes
// away after a pass and comes back with the next letter, and it should still
// be as the person left it.
export default function StageChecklist({ checks, open, onOpenChange }) {
  if (!open) {
    const met = checks.filter((check) => check.met).length
    return (
      <div className="stage-checks is-closed on-dark">
        <button
          type="button"
          className="stage-checks-open"
          aria-expanded="false"
          aria-label={`Show the checklist, ${met} of ${checks.length} done`}
          onClick={() => onOpenChange(true)}
        >
          <CheckIcon size={14} strokeWidth={3} />
          Checklist
          <span className="stage-checks-count">
            {met}/{checks.length}
          </span>
        </button>
      </div>
    )
  }
  return (
    <div className="stage-checks on-dark">
      <div className="stage-checks-head">
        <span>What to check</span>
        <button
          type="button"
          className="stage-checks-hide"
          aria-expanded="true"
          aria-label="Hide the checklist"
          title="Hide the checklist"
          onClick={() => onOpenChange(false)}
        >
          <ChevronIcon direction="left" size={14} />
        </button>
      </div>
      <FingerChecklist checks={checks} />
    </div>
  )
}
