// Larger line icons: one per step on How Sema works, one per point on the
// data page, one per fact on Record's consent step. Like the small ones in
// icons.jsx, they
// draw in currentColor (the CSS picks the accent) and are decoration, since
// the title next to each says the same.
const LINE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

// Step 1, Explore a letter: an open book.
export function BookIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <path d="M12 6.5C9.5 4.8 6.3 4.5 3 5.5v13c3.3-1 6.5-.7 9 1z" />
      <path d="M12 6.5c2.5-1.7 5.7-2 9-1v13c-3.3-1-6.5-.7-9 1z" />
    </svg>
  )
}

// Step 2, Form the letter: a camera's scan frame, its four corners around a lens.
export function ScanIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

// Step 3, Understand the handshape: a hand drawn as Sema tracks it, bones
// from the wrist to the knuckles and out to each fingertip. Only the wrist
// and the five tips get a dot: more would crowd the icon at this size.
const POINTS = [
  [12, 21.5],
  [3, 13], [5.5, 3.5], [10.5, 2], [15.5, 3], [20.5, 6.5],
]

export function HandPointsIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <path d="M12 21.5L7 17.5L3 13M12 21.5L7 11L5.5 3.5M7 11L10.5 9.5L10.5 2M10.5 9.5L14.5 9.5L15.5 3M14.5 9.5L18 11L20.5 6.5M12 21.5L18 11" />
      {POINTS.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

// The data page. A video camera: your camera helps you practice.
export function CameraIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="M15 10.5l6-3.5v10l-6-3.5" />
    </svg>
  )
}

// The same camera, struck through: no video recordings.
export function CameraOffIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="M15 10.5l6-3.5v10l-6-3.5" />
      <path d="M3 3l18 18" />
    </svg>
  )
}

// A person with a cross: no account.
export function NoAccountIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <circle cx="10" cy="8" r="4" />
      <path d="M3 21c0-3.9 3.1-7 7-7 1.5 0 2.9.5 4 1.2" />
      <path d="M17 15l4 4M21 15l-4 4" />
    </svg>
  )
}

// The data page's badge: a shield with a check.
export function ShieldCheckIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
      <path d="M8.75 12.25l2.25 2.25 4.25-4.5" />
    </svg>
  )
}

// Record's consent step. A file with an arrow going up: you send the file.
export function FileSendIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 18v-6M9.5 14.5L12 12l2.5 2.5" />
    </svg>
  )
}

// The quiz page: the score, a trophy.
export function TrophyIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...LINE}>
      <path d="M8 4h8v6a4 4 0 0 1-8 0z" />
      <path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11" />
      <path d="M12 14v3.5M8.5 20.5h7M9.5 20.5L10 17.5h4l.5 3" />
    </svg>
  )
}
