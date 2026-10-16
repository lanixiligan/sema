// A problem shown over the camera view (the camera check and Record): an
// amber "!" mark, a title, a line of explanation, and "Try again" when trying
// again can help. role="alert" makes screen readers announce it straight away.
export default function StageProblem({ title, body, onRetry }) {
  return (
    <div className="stage-problem" role="alert">
      <div className="stage-problem-mark" aria-hidden="true">
        !
      </div>
      <div className="stage-problem-title">{title}</div>
      <div className="stage-problem-body">{body}</div>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
