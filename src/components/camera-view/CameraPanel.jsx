// The panel every camera page puts its camera in (the camera check, Practice,
// Record, /dev/tracking): one frame, dark in every theme (.on-dark), with a
// header and the camera under it (`children`, a CameraView, or the tracking
// page's own video).
// The header shows a short status, centred: white, or the accent while it's
// going well (`tone` 'ok') and amber on a problem ('warn'). Along its bottom
// edge runs a line that fills in one of two ways:
// - `hold`: { start, ms, done }: over `ms` from each new `start` (a new start
//   draws a new line), and full once `done` (the camera check, Practice);
// - `fill`: { share, label, text }: to `share` (0 to 1) of the way, read out
//   as a progress bar named `label`, its value said as `text` (Record).
// `extra` sits at the header's right (Record's frame count).
export default function CameraPanel({ status, tone = '', hold, fill, extra, className = '', children }) {
  return (
    <div className={`camera-panel on-dark ${className}`} role="group" aria-label="Camera preview">
      <div className="camera-panel-head">
        {/* A live region: screen readers hear each new status. */}
        <span className={`camera-panel-status ${tone}`} role="status">
          {status}
        </span>
        {extra}
        <PanelLine hold={hold} fill={fill} />
      </div>
      {children}
    </div>
  )
}

function PanelLine({ hold, fill }) {
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
  return (
    <div className="camera-progress" aria-hidden="true">
      {hold && (
        <span
          key={hold.done ? 'done' : hold.start}
          className={hold.done ? 'full' : 'filling'}
          style={{ animationDuration: `${hold.ms}ms` }}
        />
      )}
    </div>
  )
}
