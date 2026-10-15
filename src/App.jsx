import { useCamera } from './camera/useCamera.js'
import { useVideoStats } from './camera/useVideoStats.js'

export default function App() {
  const { videoRef, status, error, cameras, deviceId, start, stop, switchCamera } =
    useCamera()
  const isLive = status === 'live'
  const stats = useVideoStats(videoRef, isLive)

  return (
    <>
      <header className="top-bar">Sema</header>

      <main className="page">
        <div className="stage">
          {/* The video is mirrored with CSS (.video in styles.css) so it feels
              like looking in a mirror. Only what's drawn on screen is flipped:
              the frames themselves are not, so hand landmarks computed from
              them will be un-mirrored. The landmark overlay added in a later
              phase must be mirrored the same way (transform: scaleX(-1)),
              or the dots will land on the wrong side of the hand.
              The <video> is always rendered so videoRef is ready when the
              stream arrives. */}
          <video
            ref={videoRef}
            className="video"
            autoPlay
            playsInline
            muted
          />
          {isLive ? (
            <span className="mirror-label">Mirrored</span>
          ) : (
            <p className="stage-message">
              {status === 'starting'
                ? 'Waiting for the camera…'
                : 'Camera is off'}
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

        {isLive && (
          <dl className="readouts">
            <div>
              <dt>Resolution</dt>
              <dd>{stats.width ? `${stats.width} × ${stats.height}` : '—'}</dd>
            </div>
            <div>
              <dt>
                {stats.fpsIsMeasured
                  ? 'Frame rate'
                  : 'Frame rate (camera setting)'}
              </dt>
              <dd>{stats.fps ? `${Math.round(stats.fps)} fps` : '—'}</dd>
            </div>
          </dl>
        )}
      </main>
    </>
  )
}
