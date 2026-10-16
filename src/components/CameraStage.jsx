import { useEffect } from 'react'
import { useSharedCamera } from '../app/sharedCamera.js'

// The camera view: the shared camera's video, the hand overlay canvas, and
// whatever the page puts on top (children). While it's on screen the camera
// is on (see CameraProvider). The video and the canvas share one CSS rule that
// mirrors them (.video and .overlay in styles.css).
export default function CameraStage({ canvasRef, className = 'stage', children }) {
  const { attachVideo, registerView } = useSharedCamera()
  useEffect(() => registerView(), [registerView])
  return (
    <div className={className}>
      <video ref={attachVideo} className="video" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="overlay" />
      {children}
    </div>
  )
}
