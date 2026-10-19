import Link from '../../app/routing/Link.jsx'

// Previous and Next, the way through the onboarding pages: quiet text along
// the bottom of the page, Previous at the left and Next at the right. They sit
// in the same place on every onboarding page and are there from the start, so
// someone can click Next page after page without moving the mouse. Each one is
// a link ({ to }) or a button ({ onClick }); leave one out and it isn't shown.
// Next can be { disabled: true } (the camera check, until it passes).
// It comes after the page's <main>, so Tab reaches the page's own items first.
export default function StepNav({ previous, next }) {
  return (
    <div className="step-nav">
      {previous && <Step step={previous} label="Previous" className="step-nav-previous" />}
      {next && <Step step={next} label="Next" className="step-nav-next" />}
    </div>
  )
}

function Step({ step, label, className }) {
  if (step.to) {
    return (
      <Link to={step.to} className={`step-nav-link ${className}`}>
        {label}
      </Link>
    )
  }
  return (
    <button type="button" className={`step-nav-link ${className}`} disabled={step.disabled} onClick={step.onClick}>
      {label}
    </button>
  )
}
