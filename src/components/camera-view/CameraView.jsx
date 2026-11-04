import { useSettings } from '../../app/settings/settings.js'
import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import { VideoIcon } from '../icons/icons.jsx'
import { useIdleCameraOff } from '../../app/shared-camera/useIdleCameraOff.js'
import { CAMERA_VIEW_ERRORS, CAMERA_VIEW_OTHER_TITLE } from '../../camera/cameraMessages.js'
import { CAMERA_VIEW_NO_WEBGL, CAMERA_VIEW_TRACKING_FAILED_TITLE } from '../../vision/model/visionMessages.js'
import CameraControls from './CameraControls.jsx'
import CameraOff from './CameraOff.jsx'
import CameraStage from './CameraStage.jsx'
import IdleNotice from './IdleNotice.jsx'
import StageMessage from './StageMessage.jsx'
import StageProblem from './StageProblem.jsx'

// The camera view every camera page uses (the camera check, Record): the
// shared camera's picture with its hand drawing, and everything around it that
// works the same on every page:
// - the camera panel's message, as a sticker at the top of the picture
//   while it's live (StageMessage);
// - a problem panel when the camera or hand tracking fails;
// - "Camera is off" with a Turn camera on button while it's off (`offNote`
//   says what to do before it's first turned on);
// - the idle timeout: no hand for a minute turns the camera off, after a
//   notice that counts down;
// - the camera controls (on/off, the camera list), with the page's options
//   (`controls`: a hand switch, a place on the view), or `false` to hide them.
// The page brings its own hand detection (`hand` is what useHandDetection
// returns, drawn on `canvasRef`) and its overlays, shown while the camera is
// live: over the hand drawing (`children`) or under it (`underlay`).
// `panel` is for a page's own readout on the picture (Learn's finger checklist):
// shown while the camera is live only: not while it's off, nor over a problem panel.
// `autoStart` is CameraStage's.
// `setupFirst` (2026-11-04): the camera check hasn't passed (the person chose
// "No camera? Guess letters instead"), so the frame says "Set up your camera"
// with a button to the check, and nothing else: no video, so neither the camera
// nor the hand model is loaded.
export default function CameraView({ setupFirst = false, className = '', ...props }) {
  if (setupFirst) {
    return (
      <div className={`stage ${className}`}>
        <CameraSetupNeeded />
      </div>
    )
  }
  return <LiveCameraView className={className} {...props} />
}

// Drawn like "Camera is off" (CameraOff), with its key button. Passing the
// check comes back to this page.
function CameraSetupNeeded() {
  const { openCameraCheck } = useSettings()
  return (
    <div className="camera-off" role="status">
      <span className="camera-off-badge">
        <VideoIcon size={32} />
      </span>
      <p className="camera-off-title">Set up your camera</p>
      <p className="camera-off-text">A quick check first, so Sema can see your hand.</p>
      <button type="button" onClick={() => openCameraCheck(window.location.pathname)}>
        Set up your camera
      </button>
    </div>
  )
}

// A hook can't be called after an early return, so the live view is its own
// component (the hooks are in here).
function LiveCameraView({ canvasRef, hand, className, autoStart = true, offNote, controls = {}, underlay, panel, children }) {
  const camera = useSharedCamera()
  const { handModel } = camera
  const isDetecting = camera.status === 'live' && handModel.status === 'ready'
  const idleSecondsLeft = useIdleCameraOff({ isDetecting, handInView: Boolean(hand.handLabel) })
  const failure = describeFailure(camera, handModel, hand.error)
  const live = !failure && camera.status !== 'idle'

  return (
    <CameraStage canvasRef={canvasRef} className={`stage ${className}`} autoStart={autoStart} underlay={live && underlay}>
      {failure ? (
        <StageProblem title={failure.title} body={failure.body} onRetry={failure.canRetry ? camera.start : undefined} />
      ) : camera.status === 'idle' ? (
        <CameraOff note={offNote} />
      ) : (
        <>
          {children}
          <IdleNotice secondsLeft={idleSecondsLeft} />
        </>
      )}
      {live && panel}
      <StageMessage show={live} />
      {controls && <CameraControls {...controls} />}
    </CameraStage>
  )
}

// What went wrong, as the title and text the problem panel shows, or null.
// Camera problems can be retried; hand-tracking problems can't from here.
function describeFailure(camera, handModel, detectionError) {
  if (camera.error) {
    const known = CAMERA_VIEW_ERRORS[camera.errorKind]
    return { ...(known ?? { title: CAMERA_VIEW_OTHER_TITLE, body: camera.error }), canRetry: true }
  }
  if (handModel.status === 'error') {
    if (handModel.errorName === 'WebGLUnavailableError') return { ...CAMERA_VIEW_NO_WEBGL, canRetry: false }
    return { title: CAMERA_VIEW_TRACKING_FAILED_TITLE, body: handModel.error, canRetry: false }
  }
  if (detectionError) return { title: CAMERA_VIEW_TRACKING_FAILED_TITLE, body: detectionError, canRetry: false }
  return null
}
