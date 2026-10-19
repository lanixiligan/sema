import { useSharedCamera } from '../../app/shared-camera/sharedCamera.js'
import { useIdleCameraOff } from '../../app/shared-camera/useIdleCameraOff.js'
import { CAMERA_VIEW_ERRORS, CAMERA_VIEW_OTHER_TITLE } from '../../camera/cameraMessages.js'
import { CAMERA_VIEW_NO_WEBGL, CAMERA_VIEW_TRACKING_FAILED_TITLE } from '../../vision/model/visionMessages.js'
import CameraControls from './CameraControls.jsx'
import CameraOff from './CameraOff.jsx'
import CameraStage from './CameraStage.jsx'
import IdleNotice from './IdleNotice.jsx'
import StageProblem from './StageProblem.jsx'

// The camera view every camera page uses (the camera check, Record): the
// shared camera's picture with its hand drawing, and everything around it that
// works the same on every page:
// - a problem panel when the camera or hand tracking fails;
// - "Camera is off" with a Turn camera on button while it's off (`offNote`
//   says what to do before it's first turned on);
// - the idle timeout: no hand for a minute turns the camera off, after a
//   notice that counts down;
// - the camera controls (on/off, the camera list), with the page's options
//   (`controls`: a hand switch, a place on the view), or `false` to hide them.
// The page brings its own hand detection (`hand` is what useHandDetection
// returns, drawn on `canvasRef`) and its overlays, shown while the camera is
// live (`children`). `autoStart` is CameraStage's.
export default function CameraView({
  canvasRef,
  hand,
  className = '',
  autoStart = true,
  offNote,
  controls = {},
  children,
}) {
  const camera = useSharedCamera()
  const { handModel } = camera
  const isDetecting = camera.status === 'live' && handModel.status === 'ready'
  const idleSecondsLeft = useIdleCameraOff({ isDetecting, handInView: Boolean(hand.handLabel) })
  const failure = describeFailure(camera, handModel, hand.error)

  return (
    <CameraStage canvasRef={canvasRef} className={`stage ${className}`} autoStart={autoStart}>
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
