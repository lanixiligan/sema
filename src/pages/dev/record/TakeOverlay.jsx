// On the video itself, only the big countdown, so nothing else covers the
// hand. It's its own layer outside the mirrored video, so it reads normally.
// The take's status is in the panel's header (takePanelHead.jsx).
export default function TakeOverlay({ recording }) {
  return (
    <div className="take-overlay">
      {recording.phase === 'countdown' && (
        <p className="take-countdown" aria-hidden="true">
          {recording.secondsLeft}
        </p>
      )}
    </div>
  )
}
