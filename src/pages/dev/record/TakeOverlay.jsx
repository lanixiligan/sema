import { EXPECTED_SAMPLES } from '../../../recorder/takeRules.js'

// The camera panel's header on Record (the same panel as the camera check's):
// the take's phase, or what Sema sees (idleText) while no take runs or a take
// waits for the hand, centred; "18 / 30 frames" on the right while
// capturing; and along its bottom edge a line that fills as the take is
// captured. A live region, so screen readers hear each new phase.
export function TakePanelHead({ recording, idleText }) {
  const capturing = recording.phase === 'capturing'
  const kept = recording.kept ?? 0

  return (
    <div className="camera-panel-head record-panel-head">
      <span className="camera-panel-status" aria-live="polite">
        {phaseText(recording) ?? idleText}
      </span>
      {capturing && (
        <span className="record-panel-frames">
          {kept} / {EXPECTED_SAMPLES} frames
        </span>
      )}
      <div
        className="camera-progress"
        role={capturing ? 'progressbar' : undefined}
        aria-label={capturing ? 'Capturing take' : undefined}
        aria-valuemin={capturing ? 0 : undefined}
        aria-valuemax={capturing ? EXPECTED_SAMPLES : undefined}
        aria-valuenow={capturing ? kept : undefined}
        aria-hidden={capturing ? undefined : 'true'}
      >
        {capturing && <span style={{ width: `${Math.round((recording.progress ?? 0) * 100)}%` }} />}
      </div>
    </div>
  )
}

// On the video itself, only the big countdown, so nothing else covers the
// hand. It's its own layer outside the mirrored video, so it reads normally.
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

function phaseText(recording) {
  switch (recording.phase) {
    case 'countdown':
      return `Get ready… ${recording.secondsLeft}`
    case 'waiting':
      return null // the header shows idleText: what Sema is waiting for
    case 'settling':
    case 'capturing':
      return 'Hold…'
    case 'saving':
      return 'Saving…'
    default:
      return null
  }
}
