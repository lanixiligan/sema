import { useSharedCamera } from '../app/sharedCamera.js'
import { VideoOffIcon } from './icons.jsx'

// Shown over a camera view while the camera is off (turned off, stopped
// because the person switched to another tab, or because no hand was in view
// for a minute, or not turned on yet): what happened, and a button to turn it
// on. The camera never comes back by itself. `note` is what to say when there's
// no reason to give (the camera check, before it's first turned on). Until the
// hand model has loaded, the button waits and says so: a camera that's on but
// can't track hands yet would only look broken.
const REASONS = {
  hidden: 'It turned off when you switched to another tab.',
  idle: 'It turned off because no hand was seen for a minute.',
}

export default function CameraOff({ note }) {
  const camera = useSharedCamera()
  const modelLoading = camera.handModel.status !== 'ready'
  return (
    <div className="camera-off" role="status">
      <VideoOffIcon size={28} />
      <p className="camera-off-title">Camera is off</p>
      {(REASONS[camera.stopReason] ?? note) && (
        <p className="camera-off-text">{REASONS[camera.stopReason] ?? note}</p>
      )}
      <button type="button" onClick={camera.start} disabled={modelLoading} aria-busy={modelLoading}>
        {modelLoading ? 'Loading hand model…' : 'Turn camera on'}
      </button>
    </div>
  )
}
