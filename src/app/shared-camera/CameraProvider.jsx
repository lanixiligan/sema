import { useCallback, useEffect, useRef, useState } from 'react'
import { useCamera } from '../../camera/useCamera.js'
import { useHandLandmarker } from '../../vision/model/useHandLandmarker.js'
import { CameraContext } from './sharedCamera.js'

// The camera and the hand model, shared by every page through React context.
// They live here, at the top of the app, so changing pages doesn't close the
// camera or reload the hand model. Pages read them with useSharedCamera().
export default function CameraProvider({ children }) {
  const camera = useCamera()

  // How many camera views (CameraStage) are on screen. When the last view goes
  // away the camera stops, so the light is never on without a picture. A view
  // can also start the camera when it appears (`autoStart`): Record does, since
  // the person just pressed Start recording. The camera check doesn't: it
  // waits for its Turn camera on button. When one page's view replaces
  // another's, React applies both changes in one update, so the count never
  // touches 0 and the camera stays on.
  const [views, setViews] = useState(0)
  // The hand model starts downloading as soon as a camera view is on screen,
  // before the camera is on, so the camera check's Turn camera on button
  // (which waits for it) is ready sooner. Welcome and the intro pages have
  // no camera view, so they download nothing.
  const handModel = useHandLandmarker(views > 0 || camera.status === 'live', 'GPU')
  const autoStartRef = useRef(false)
  const registerView = useCallback((autoStart) => {
    autoStartRef.current = autoStart
    setViews((n) => n + 1)
    return () => setViews((n) => n - 1)
  }, [])

  // Start only when views appear (0 → 1), and only for a view that asks for
  // it; not on every render while they're there: after an error or a Stop,
  // the camera waits for a button click.
  const hadViews = useRef(false)
  const { status, start, stop } = camera
  useEffect(() => {
    const hasViews = views > 0
    if (hasViews && !hadViews.current && autoStartRef.current && status === 'idle') start()
    if (!hasViews && status !== 'idle') stop()
    hadViews.current = hasViews
  }, [views, status, start, stop])

  // Switching to another tab (or minimising the window) stops the camera, so
  // its light is never on while the person can't see Sema. It doesn't come
  // back by itself: the camera view says why it's off (stopReason 'hidden')
  // and offers a button.
  useEffect(() => {
    function stopWhenHidden() {
      if (document.hidden && status !== 'idle') stop('hidden')
    }
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => document.removeEventListener('visibilitychange', stopWhenHidden)
  }, [status, stop])

  return (
    <CameraContext.Provider value={{ ...camera, handModel, registerView }}>
      {children}
    </CameraContext.Provider>
  )
}
