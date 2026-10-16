import PreviewPill from '../../app/PreviewPill.jsx'

// The top bar on the setup pages: Sema with its Preview pill, and "Step N of 3"
// with three segments that fill in as you go. The segments are a progress bar
// for screen readers (role="progressbar"), as in the design.
export default function SetupBar({ step }) {
  return (
    <header className="setup-bar">
      <div className="brand">
        <span className="brand-name">Sema</span>
        <PreviewPill />
      </div>
      <div className="setup-step">
        Step {step} of 3
        <div
          className="setup-segments"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin="1"
          aria-valuemax="3"
          aria-valuenow={step}
        >
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= step ? 'done' : undefined} />
          ))}
        </div>
      </div>
    </header>
  )
}
