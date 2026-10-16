import { useCallback, useEffect, useRef, useState } from 'react'
import { useCamera } from '../camera/useCamera.js'
import { useHandLandmarker } from '../vision/useHandLandmarker.js'
import { CameraContext } from './sharedCamera.js'

// The camera and the hand model, shared by every page through React context.
// They live here, at the top of the app, so changing pages doesn't close the
// camera or reload the hand model. Pages read them with useSharedCamera().
export default function CameraProvider({ children }) {
  const camera = useCamera()
  const handModel = useHandLandmarker(camera.status === 'live', 'GPU')

  // How many camera views (CameraStage) are on screen. The camera is on while
  // there is one: arriving on a page with a camera view starts it (getting
  // there, plus the browser's permission prompt, is the person's consent), and
  // when the last view goes away it stops, so the light is never on without a
  // picture. When one page's view replaces another's, React applies both
  // changes in one update, so the count never touches 0 and the camera stays on.
  const [views, setViews] = useState(0)
  const registerView = useCallback(() => {
    setViews((n) => n + 1)
    return () => setViews((n) => n - 1)
  }, [])

  // Start only when views appear (0 → 1), not on every render while they're
  // there: after an error or a Stop, the camera waits for a button click.
  const hadViews = useRef(false)
  const { status, start, stop } = camera
  useEffect(() => {
    const hasViews = views > 0
    if (hasViews && !hadViews.current && status === 'idle') start()
    if (!hasViews && status !== 'idle') stop()
    hadViews.current = hasViews
  }, [views, status, start, stop])

  return (
    <CameraContext.Provider value={{ ...camera, handModel, registerView }}>{children}</CameraContext.Provider>
  )
}
