// When the camera turns itself off because no hand is in view: after
// IDLE_NOTICE_MS a notice counts down, and at IDLE_OFF_MS the camera stops.
// Any hand coming back into view starts the count again. A short pause never
// turns it off; walking away, or leaving Sema behind another app, does.
export const IDLE_NOTICE_MS = 10_000
export const IDLE_OFF_MS = 60_000

// Whole seconds left before the camera turns off, for the notice, or null
// while it's too soon to show one. `idleMs` is how long no hand has been seen.
export function idleSecondsLeft(idleMs) {
  if (idleMs < IDLE_NOTICE_MS) return null
  return Math.max(0, Math.ceil((IDLE_OFF_MS - idleMs) / 1000))
}

export function shouldTurnOff(idleMs) {
  return idleMs >= IDLE_OFF_MS
}
