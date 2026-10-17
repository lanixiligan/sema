import { useEffect } from 'react'
import { useSharedCamera } from '../app/sharedCamera.js'

// The camera view: the shared camera's video, the hand overlay canvas, and
// whatever the page puts on top (children). The camera can only be on while
// a view is on screen (see CameraProvider). With `autoStart` (the default)
// showing the view turns the camera on; without it, the camera waits for the
// person to turn it on. The video and the canvas share one CSS rule that
// mirrors them (.video and .overlay in styles.css).
export default function CameraStage({ canvasRef, className = 'stage', autoStart = true, children }) {
  const { attachVideo, registerView } = useSharedCamera()
  useEffect(() => registerView(autoStart), [registerView, autoStart])
  return (
    <div className={className}>
      <video ref={attachVideo} className="video" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="overlay" />
      {children}
    </div>
  )
}
