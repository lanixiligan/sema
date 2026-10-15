import { useRef, useState } from 'react'
import { useCamera } from './camera/useCamera.js'
import { useVideoStats } from './camera/useVideoStats.js'
import { useHandDetection } from './vision/useHandDetection.js'
import { useHandLandmarker } from './vision/useHandLandmarker.js'
import { LOADING_HAND_MODEL } from './vision/visionMessages.js'

export default function App() {
  const { videoRef, status, error, cameras, deviceId, start, stop, switchCamera } =
    useCamera()
  const isLive = status === 'live'
  const stats = useVideoStats(videoRef, isLive)

  const canvasRef = useRef(null)
  const [preferredDelegate, setPreferredDelegate] = useState('GPU')
  const handModel = useHandLandmarker(isLive, preferredDelegate)
  const hand = useHandDetection({
    videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    isRunning: isLive && handModel.status === 'ready',
  })

  return (
    <>
      <header className="top-bar">Sema</header>

      <main className="page">
        <div className="stage">
          {/* The video and the hand overlay share one CSS rule (.video,
              .overlay in styles.css) that mirrors them with scaleX(-1), so it
              feels like looking in a mirror. Only the display is flipped: the
              frames, and the landmarks MediaPipe finds in them, are not. The
              overlay is drawn in un-mirrored video coordinates and flipped by
              the same CSS, which keeps the skeleton on the hand.
              Both elements are always rendered so their refs are ready. */}
          <video
            ref={videoRef}
            className="video"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="overlay" />
          {isLive ? (
            <span className="mirror-label">Mirrored</span>
          ) : (
            <p className="stage-message">
              {status === 'starting' ? 'Waiting for the camera…' : 'Camera is off'}
            </p>
          )}
        </div>

        <div className="controls">
          {status === 'idle' ? (
            <button type="button" className="button" onClick={start}>
              Start camera
            </button>
          ) : (
            <button type="button" className="button" onClick={stop}>
              {status === 'starting' ? 'Cancel' : 'Stop camera'}
            </button>
          )}

          {isLive && cameras.length > 0 && (
            <label className="camera-picker">
              Camera
              <select
                value={deviceId ?? ''}
                onChange={(event) => switchCamera(event.target.value)}
              >
                {cameras.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {isLive && (handModel.error || hand.error) && (
          <p className="error" role="alert">
            {handModel.error || hand.error}
          </p>
        )}

        {isLive && (
          <>
            <dl className="readouts">
              <Readout label="Hand">{describeHand(handModel.status, hand.handLabel)}</Readout>
              <Readout label="Resolution">
                {stats.width ? `${stats.width} × ${stats.height}` : '—'}
              </Readout>
              <Readout label="Runs on">
                {handModel.status === 'ready'
                  ? describeDelegate(handModel.delegate, handModel.gpuFailed)
                  : '—'}
              </Readout>
              <Readout label={stats.fpsIsMeasured ? 'Camera' : 'Camera (setting)'}>
                {formatFps(stats.fps)}
              </Readout>
              <Readout label="Detection">{formatFps(hand.detectionFps)}</Readout>
              <Readout label="Detection time">
                {hand.detectionMs === null ? '—' : `${hand.detectionMs.toFixed(1)} ms`}
              </Readout>
            </dl>

            <details className="dev-settings">
              <summary>Developer settings</summary>
              <label>
                Hand model runs on{' '}
                <select
                  value={preferredDelegate}
                  onChange={(event) => setPreferredDelegate(event.target.value)}
                >
                  <option value="GPU">GPU (falls back to CPU)</option>
                  <option value="CPU">CPU</option>
                </select>
              </label>
              {/* TEMPORARY: for checking MediaPipe's handedness label. */}
              <p>
                MediaPipe's raw label:{' '}
                {hand.rawLabel
                  ? `${hand.rawLabel} (score ${hand.rawScore.toFixed(2)})`
                  : 'no hand'}
              </p>
            </details>
          </>
        )}
      </main>
    </>
  )
}

function Readout({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function describeHand(modelStatus, handLabel) {
  if (modelStatus === 'loading' || modelStatus === 'idle') return LOADING_HAND_MODEL
  if (modelStatus === 'error') return 'Off'
  return handLabel ? `Hand found (${handLabel})` : 'No hand'
}

function describeDelegate(delegate, gpuFailed) {
  return gpuFailed ? `${delegate} (GPU unavailable)` : delegate
}

function formatFps(fps) {
  return fps ? `${Math.round(fps)} fps` : '—'
}
