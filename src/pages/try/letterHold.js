import { HAND_HOLD_MS, NO_HOLD } from '../../vision/landmarks/handChecks.js'

// Try's practice round: pick a letter, make it, hold it for LETTER_HOLD_MS.
// The hold counts while any whole hand's guess is that letter and sure (at
// or over the model's "not sure" line). Like the camera check's hold, a gap
// shorter than HAND_HOLD_MS doesn't end it, so one odd frame can't restart
// the 3 seconds; a longer one does.
export const LETTER_HOLD_MS = 3000
export { NO_HOLD }

// guesses: one per hand in view, as TryPage's guess() makes them.
export function showsLetter(guesses, letter) {
  return guesses.some((g) => g.whole && g.sure && g.letter === letter)
}

// hold: { start, lastAt }, as in handChecks.js (start is null with no hold).
export function updateLetterHold(hold, matching, now) {
  const holding = hold.start !== null && now - hold.lastAt < HAND_HOLD_MS
  if (matching) return { start: holding ? hold.start : now, lastAt: now }
  return holding ? hold : NO_HOLD
}

// Whole seconds left (3, 2, 1, then 0), or null with no hold.
export function holdSecondsLeft(hold, now) {
  if (hold.start === null) return null
  return Math.max(0, Math.ceil((LETTER_HOLD_MS - (now - hold.start)) / 1000))
}

export function heldLongEnough(hold, now) {
  return hold.start !== null && now - hold.start >= LETTER_HOLD_MS
}

// The camera panel's short status and its tone: 'ok' (accent) while it's going
// well, 'warn' (amber) on a problem, '' otherwise. The problem panel on the
// video explains a failure in full. `ready`: the hand model and the letter
// model are both loaded.
export function tryStatus({ cameraStatus, cameraError, trackingError, ready, passed, secondsLeft, guesses, target }) {
  if (cameraError) return { status: 'Camera problem', tone: 'warn' }
  if (trackingError) return { status: 'Tracking problem', tone: 'warn' }
  if (passed) return { status: `That's ${target}!`, tone: 'ok' }
  if (cameraStatus === 'idle') return { status: 'Camera off', tone: '' }
  if (cameraStatus === 'starting') return { status: 'Starting…', tone: '' }
  if (!ready) return { status: 'Getting ready…', tone: '' }
  if (secondsLeft !== null) return { status: `Hold it… ${secondsLeft}`, tone: 'ok' }
  if (guesses.length > 0 && guesses.every((g) => !g.whole)) return { status: 'Show your whole hand', tone: '' }
  return { status: `Make ${target}`, tone: '' }
}
