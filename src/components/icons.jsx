// Line icons from the designs, used on more than one page. They draw in
// currentColor, so the surrounding CSS picks their colour. They're decoration:
// the text beside them says the same thing, so wrap them in aria-hidden.

// An open right hand seen from the back, as you see your own raised hand:
// four fingers up, the thumb out to the left, open at the wrist. Mirror it
// (scaleX(-1)) for a left hand. One outline: up the thumb, over each
// fingertip and down into the gap before the next, then down to the wrist.
export function HandIcon({ size = 18, strokeWidth = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="-0.6 0 32 32" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M12.2 29C12.2 26.6 10.6 24.4 9.4 21.4L4.9 14.9A1.7 1.7 0 0 1 7.7 12.9L10.4 16.8
           V6.2A1.7 1.7 0 0 1 13.8 6.2V14A0.4 0.4 0 0 0 14.6 14
           V4.4A1.7 1.7 0 0 1 18 4.4V14A0.4 0.4 0 0 0 18.8 14
           V5.6A1.7 1.7 0 0 1 22.2 5.6V14.5A0.4 0.4 0 0 0 23 14.5
           V9A1.6 1.6 0 0 1 26.2 9V19C26.2 23 24 25.5 22.8 26.6V29"
      />
    </svg>
  )
}

export function CheckIcon({ size = 14, strokeWidth = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11.5l4 4 8-9" />
    </svg>
  )
}

// The settings menu's button: three sliders.
export function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4h12M2 8h12M2 12h12" />
      <circle cx="5" cy="4" r="1.6" fill="var(--surface)" />
      <circle cx="10.5" cy="8" r="1.6" fill="var(--surface)" />
      <circle cx="6.5" cy="12" r="1.6" fill="var(--surface)" />
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
