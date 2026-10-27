// Line icons from the designs, used on more than one page. They draw in
// currentColor, so the surrounding CSS picks their colour. They're decoration:
// the text beside them says the same thing, so wrap them in aria-hidden.

export function CheckIcon({ size = 14, strokeWidth = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11.5l4 4 8-9" />
    </svg>
  )
}

// The settings menu's button: a gear with eight teeth.
export function SettingsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.84 4.92 L10.44 2.12 L13.56 2.12 L14.16 4.92 L15.47 5.47 L17.88 3.91 L20.09 6.12 L18.53 8.53 L19.08 9.84 L21.88 10.44 L21.88 13.56 L19.08 14.16 L18.53 15.47 L20.09 17.88 L17.88 20.09 L15.47 18.53 L14.16 19.08 L13.56 21.88 L10.44 21.88 L9.84 19.08 L8.53 18.53 L6.12 20.09 L3.91 17.88 L5.47 15.47 L4.92 14.16 L2.12 13.56 L2.12 10.44 L4.92 9.84 L5.47 8.53 L3.91 6.12 L6.12 3.91 L8.53 5.47Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// A cross, for removing something (a take, on Record).
export function CloseIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  )
}

// A video camera: a rounded body with the lens cone on the right.
export function VideoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="11" height="10" rx="2" />
      <path d="M13 8.5l5-3v9l-5-3" />
    </svg>
  )
}

// The same camera, struck through: the camera is off.
export function VideoOffIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="11" height="10" rx="2" />
      <path d="M13 8.5l5-3v9l-5-3" />
      <path d="M2.5 2.5l15 15" />
    </svg>
  )
}

// A small chevron for text links: right by default, or left (Back), down or up.
const CHEVRON_TURN = { right: 0, down: 90, left: 180, up: 270 }

export function ChevronIcon({ direction = 'right', size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={CHEVRON_TURN[direction] ? { rotate: `${CHEVRON_TURN[direction]}deg` } : undefined}
    >
      <path d="M5 3l4 4-4 4" />
    </svg>
  )
}

// The theme toggle's three choices: a crescent moon (Dark), a sun (Light)
// and a screen (System, follow the computer's setting).
export function MoonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 8.53A6 6 0 1 1 7.47 2a4.67 4.67 0 0 0 6.53 6.53z" />
    </svg>
  )
}

export function SunIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
    </svg>
  )
}

export function MonitorIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="1.5" />
      <path d="M8 11v3M5.5 14h5" />
    </svg>
  )
}

// An eye, and the same eye crossed out: show and hide (the quiz's peek at a
// letter's drawing).
export function EyeIcon({ size = 20, off = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}
