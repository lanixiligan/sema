// The take's status (countdown, "Hold…", result), shown on top of the video
// where the signer is looking. It's its own layer outside the mirrored video
// and canvas, so the text reads normally. aria-live announces each change.
export default function TakeOverlay({ recording, cell }) {
  const isThisCell = cell !== null && recording.letter === cell.letter && recording.hand === cell.hand
  return (
    <div className="take-overlay" aria-live="polite">
      {isThisCell && <TakeStatus recording={recording} />}
    </div>
  )
}

function TakeStatus({ recording }) {
  switch (recording.phase) {
    case 'countdown':
      return <p className="take-countdown">{recording.secondsLeft}</p>
    case 'settling':
    case 'capturing':
      return <p className="take-hold">Hold…</p>
    case 'saving':
      return <p className="take-banner">Saving…</p>
    case 'review':
      return <TakeResult result={recording.result} />
    case 'discarded':
      return <p className="take-banner take-banner-warning">{recording.message}</p>
    default:
      return null
  }
}

function TakeResult({ result }) {
  const { kept, mismatched } = result.counts
  if (result.status === 'accepted') {
    const other = mismatched > 0 ? `, ${mismatched} with the other hand detected` : ''
    return (
      <p className="take-banner take-banner-saved">
        Saved: {kept} frames with a hand{other}.
      </p>
    )
  }
  return <p className="take-banner take-banner-warning">Not saved: {result.reason}. Try again.</p>
}
