import { EXPECTED_SAMPLES } from '../../recorder/takeRules.js'

// What sits on top of the video: a bar along the top (the take's phase, or
// what Sema sees, centred and large enough to read while signing, and
// "18 / 30 frames" on the right while capturing), the big countdown in the
// middle, and a progress bar along the bottom while capturing. While a take
// waits for the hand, the bar says what's missing (idleText). It's its
// own layer outside the mirrored video, so the text reads normally.
export default function TakeOverlay({ recording, idleText }) {
  const capturing = recording.phase === 'capturing'
  const kept = recording.kept ?? 0

  return (
    <div className="take-overlay">
      <div className="take-overlay-bar" aria-live="polite">
        <span className="take-overlay-phase">{phaseText(recording) ?? idleText}</span>
        {capturing && (
          <span className="take-overlay-frames">
            {kept} / {EXPECTED_SAMPLES} frames
          </span>
        )}
      </div>
      {recording.phase === 'countdown' && (
        <p className="take-countdown" aria-hidden="true">
          {recording.secondsLeft}
        </p>
      )}
      {capturing && (
        <div
          className="take-progress"
          role="progressbar"
          aria-label="Capturing take"
          aria-valuemin="0"
          aria-valuemax={EXPECTED_SAMPLES}
          aria-valuenow={kept}
        >
          <div style={{ width: `${Math.round((recording.progress ?? 0) * 100)}%` }} />
        </div>
      )}
    </div>
  )
}

function phaseText(recording) {
  switch (recording.phase) {
    case 'countdown':
      return `Get ready… ${recording.secondsLeft}`
    case 'waiting':
      return null // the bar shows idleText: what Sema is waiting for
    case 'settling':
    case 'capturing':
      return 'Hold…'
    case 'saving':
      return 'Saving…'
    default:
      return null
  }
}
