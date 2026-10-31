// The notice in the middle of a camera view when no hand has been in view for
// a while (useIdleCameraOff): the camera turns off soon, with the seconds
// left. Screen readers hear it once; the number counting down is hidden from
// them, so they aren't told every second.
export default function IdleNotice({ secondsLeft }) {
  if (secondsLeft === null) return null
  return (
    <div className="idle-notice">
      <p className="idle-notice-title" role="status">
        Still there?<span className="visually-hidden"> No hand is in view, so the camera will turn off soon.</span>
      </p>
      <p aria-hidden="true">Show a hand to keep going. The camera turns off in {secondsLeft} s.</p>
    </div>
  )
}
