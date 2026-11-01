import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import { VideoOffIcon } from '../icons/icons.jsx'

// Shown over a camera view while the camera is off (turned off, stopped
// because the person switched to another tab, or because no hand was in view
// for a minute, or not turned on yet): what happened, and a button to turn it
// on. The camera never comes back by itself. `note` is what to say when there's
// no reason to give (the camera check, before it's first turned on). Until the
// hand model has loaded, the button waits and says so: a camera that's on but
// can't track hands yet would only look broken.
const REASONS = {
  hidden: 'Paused while you were in another tab.',
  idle: 'Paused after a minute with no hand in view.',
}

export default function CameraOff({ note }) {
  const camera = useSharedCamera()
  const modelLoading = camera.handModel.status !== 'ready'
  return (
    <div className="camera-off" role="status">
      <span className="camera-off-badge">
        <VideoOffIcon size={32} />
      </span>
      {/* The panel's header already says "Camera off" in words, so this is
          only for screen readers. */}
      <p className="camera-off-title visually-hidden">Camera is off</p>
      {(REASONS[camera.stopReason] ?? note) && (
        <p className="camera-off-text">{REASONS[camera.stopReason] ?? note}</p>
      )}
      <button type="button" onClick={camera.start} disabled={modelLoading} aria-busy={modelLoading}>
        {modelLoading ? 'Loading hand model…' : 'Turn camera on'}
      </button>
    </div>
  )
}
