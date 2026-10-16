import { CheckIcon } from '../../components/icons.jsx'

// The last take's result, beside the video: kept (a soft blue note) or not
// kept / interrupted (amber, with the reason). role="status" lets screen
// readers announce it without interrupting. Shown only for the chosen cell.
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

  const { status, reason, counts } = recording.result
  if (status === 'accepted') {
    const other = counts.mismatched > 0 ? `, ${counts.mismatched} had the other hand` : ''
    return (
      <div className="take-result take-result-kept" role="status">
        <span className="take-result-check" aria-hidden="true">
          <CheckIcon />
        </span>
        <span>
          <strong>Last take kept.</strong> {counts.kept} of 30 frames had a hand{other}.
        </span>
      </div>
    )
  }
  return (
    <div className="take-result take-result-warning" role="status">
      <span className="take-result-dot" aria-hidden="true" />
      <span>
        <strong>Last take not kept.</strong> {reason}. Try again.
      </span>
    </div>
  )
}
