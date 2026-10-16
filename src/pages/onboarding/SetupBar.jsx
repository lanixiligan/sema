import TopBar from '../../app/TopBar.jsx'

const STEPS = [1, 2]

// The top bar on the setup pages, with "Step N of 2" and two segments that
// fill in as you go (the intro pages before them have no step count). The segments are a progress bar for screen readers
// (role="progressbar").
export default function SetupBar({ step }) {
  return (
    <TopBar>
      <div className="setup-step">
        Step {step} of {STEPS.length}
        <div
          className="setup-segments"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin="1"
          aria-valuemax={STEPS.length}
          aria-valuenow={step}
        >
          {STEPS.map((n) => (
            <span key={n} className={n <= step ? 'done' : undefined} />
          ))}
        </div>
      </div>
    </TopBar>
  )
}
