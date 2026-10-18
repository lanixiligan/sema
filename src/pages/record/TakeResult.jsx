import { CheckIcon } from '../../components/icons.jsx'

// The last take's result, in one short line: kept (soft blue) or not kept /
// cancelled (amber, with the main reason in plain words; the file keeps the
// detailed reason). role="status" lets screen readers announce it without
// interrupting. Shown only for the chosen letter and hand.
export default function TakeResult({ recording, cell }) {
  if (!cell || recording.letter !== cell.letter || recording.hand !== cell.hand) return null

  if (recording.phase === 'discarded') {
    return (
      <div className="take-result take-result-warning" role="status">
        <span className="take-result-dot" aria-hidden="true" />
        <span>{recording.message}</span>
      </div>
    )
  }
  if (recording.phase !== 'review') return null

  const { status, counts } = recording.result
  if (status === 'accepted') {
    return (
      <div className="take-result take-result-kept" role="status">
        <span className="take-result-check" aria-hidden="true">
          <CheckIcon />
        </span>
        <span>Take kept</span>
      </div>
    )
  }
  return (
    <div className="take-result take-result-warning" role="status">
      <span className="take-result-dot" aria-hidden="true" />
      <span>Not kept: {mainProblem(counts, recording.hand)}. Try again.</span>
    </div>
  )
}

// The biggest reason a take wasn't kept, in plain words.
function mainProblem({ mismatched, droppedNoHand }, hand) {
  if (mismatched > 0 && mismatched >= droppedNoHand) return `that was your ${hand === 'left' ? 'right' : 'left'} hand`
  if (droppedNoHand > 0) return 'your hand left the view'
  return 'the camera was too slow'
}
