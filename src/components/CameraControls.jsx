import { useEffect, useId, useRef, useState } from 'react'
import { useSharedCamera } from '../app/sharedCamera.js'
import { CheckIcon, ChevronIcon, HandIcon, VideoIcon, VideoOffIcon } from './icons.jsx'

const HANDS = [
  { id: 'left', name: 'Left' },
  { id: 'right', name: 'Right' },
]

// The controls on the camera view, as in a video call: when the page passes
// `onHandChange`, a Left | Right switch after a hand icon; then an arrow that
// opens the list of cameras and a camera button that turns it off and on. They sit at the
// bottom of the view, or wherever the page's `className` puts them (the camera
// check: the top-right corner, since its checks fill the bottom).
// The page decides what the hand means and names it with `handLabel`: on
// Record it's the hand for the next take.
// Turning the camera off stops every track, so the camera light goes out;
// CameraProvider then leaves it off until it's turned on again. The hand model
// stays loaded, so turning it back on is quick.
// The list works like the settings menu: a click outside or Escape closes it.
export default function CameraControls({ hand, onHandChange, handLabel, className = '' }) {
  const camera = useSharedCamera()
  const isOn = camera.status !== 'idle' // 'starting' counts: Stop cancels it
  // Turning it on waits for the hand model, like CameraOff's button.
  const canTurnOn = camera.handModel.status === 'ready'
  const [open, setOpen] = useState(false)
  const controlsRef = useRef(null)
  const menuButtonRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    function closeOnOutsideClick(event) {
      if (!controlsRef.current.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButtonRef.current.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  // Picking a camera opens it, which also turns the camera on if it was off.
  function choose(deviceId) {
    setOpen(false)
    if (!isOn && !canTurnOn) return
    if (deviceId !== camera.deviceId || !isOn) camera.switchCamera(deviceId)
  }

  const toggleLabel = isOn ? 'Turn off camera' : 'Turn on camera'

  return (
    <div className={`camera-controls ${className}`} ref={controlsRef}>
      {open && (
        // .on-dark: the panel sits on the dark camera frame in every theme.
        <div id={`${id}-menu`} className="camera-menu on-dark">
          <p className="camera-menu-title">Camera</p>
          {camera.cameras.length === 0 ? (
            <p className="camera-menu-note">Camera names show once the camera has been on.</p>
          ) : (
            <ul>
              {camera.cameras.map((device, index) => {
                const current = device.deviceId === camera.deviceId
                return (
                  <li key={device.deviceId}>
                    <button type="button" aria-pressed={current} onClick={() => choose(device.deviceId)}>
                      <span className="camera-menu-check">{current && <CheckIcon />}</span>
                      <span className="camera-menu-name">{device.label || `Camera ${index + 1}`}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <div className="camera-controls-pill">
        {/* The hand first, as a labelled group, then the camera's own buttons. */}
        {onHandChange && (
          <>
            {/* aria-pressed marks the hand that's on. */}
            <div className="camera-controls-hands" role="group" aria-label={handLabel}>
              <span className="camera-controls-hands-label" aria-hidden="true">
                <HandIcon size={16} />
              </span>
              {HANDS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={hand === option.id}
                  onClick={() => onHandChange(option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
            <span className="camera-controls-divider" aria-hidden="true" />
          </>
        )}

        <button
          ref={menuButtonRef}
          type="button"
          className="camera-controls-menu"
          aria-label="Choose camera"
          title="Choose camera"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          onClick={() => setOpen(!open)}
        >
          <ChevronIcon direction="up" />
        </button>
        <button
          type="button"
          className={`camera-controls-toggle${isOn ? '' : ' off'}`}
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={isOn ? () => camera.stop() : camera.start}
          disabled={!isOn && !canTurnOn}
        >
          {isOn ? <VideoIcon /> : <VideoOffIcon />}
        </button>
      </div>
    </div>
  )
}
