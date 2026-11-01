import { useContext } from 'react'
import { PanelMessageContext } from './panelMessage.js'

// The camera panel's message, on the video itself (2026-11-01; before, in a
// header above it): a sticker at the top of the picture, where the hand
// usually isn't. Large while Sema waits for something (neutral, or amber on a
// problem), compact once it's going well (`tone` 'ok'), so nothing big
// competes with a hand being held. A blank status shows nothing.
// `show` is false while the picture isn't live (the camera is off, or a
// problem panel is up), which already say what's wrong. The region is always
// there, so screen readers hear each new message as it changes.
export default function StageMessage({ show }) {
  const message = useContext(PanelMessageContext)
  if (!message) return null
  const { status, tone, hold, fill, extra } = message
  const text = typeof status === 'string' ? status.trim() : status
  return (
    <div className="camera-message-region" role="status">
      {show && text && (
        <div className={`camera-message ${tone}`}>
          <p className="camera-message-text">{status}</p>
          {extra}
          <MessageLine hold={hold} fill={fill} />
        </div>
      )}
    </div>
  )
}

// The line along the sticker's bottom edge: for a hold, it fills once over
// the hold's time (set inline) each time a hold starts, so a new hold starts a
// new line, and is full once it passes; on Record, it follows the take.
function MessageLine({ hold, fill }) {
  if (fill) {
    const percent = Math.round(fill.share * 100)
    return (
      <div
        className="camera-progress"
        role="progressbar"
        aria-label={fill.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={fill.text}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
    )
  }
  if (!hold) return null
  return (
    <div className="camera-progress" aria-hidden="true">
      <span
        key={hold.done ? 'done' : hold.start}
        className={hold.done ? 'full' : 'filling'}
        style={{ animationDuration: `${hold.ms}ms` }}
      />
    </div>
  )
}
