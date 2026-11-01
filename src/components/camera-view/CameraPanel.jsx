import { PanelMessageContext } from './panelMessage.js'

// The panel every camera page puts its camera in (the camera check, Learn,
// Quiz, Record, /dev/tracking): one frame, dark in every theme (.on-dark),
// around the camera (`children`, a CameraView, or the tracking page's own
// video).
// The page's short message goes on the video, as a sticker at its top
// (StageMessage, shown by CameraView): white while it waits, the accent while
// it's going well (`tone` 'ok') and amber on a problem ('warn'). Along its
// bottom edge runs a line that fills in one of two ways:
// - `hold`: { start, ms, done }: over `ms` from each new `start` (a new start
//   draws a new line), and full once `done` (the camera check, Learn, Quiz);
// - `fill`: { share, label, text }: to `share` (0 to 1) of the way, read out
//   as a progress bar named `label`, its value said as `text` (Record).
// `extra` sits at the sticker's right (Record's frame count). The message was
// in a header above the video until 2026-11-01.
export default function CameraPanel({ status, tone = '', hold, fill, extra, className = '', children }) {
  return (
    <PanelMessageContext.Provider value={{ status, tone, hold, fill, extra }}>
      <div className={`camera-panel on-dark ${tone ? `is-${tone}` : ''} ${className}`} role="group" aria-label="Camera preview">
        {children}
      </div>
    </PanelMessageContext.Provider>
  )
}
