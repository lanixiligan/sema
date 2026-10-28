import { HAND_HOLD_MS, NO_HOLD } from '../../vision/landmarks/handChecks.js'

// Practice's round: pick a letter, make it, hold it for LETTER_HOLD_MS.
// The hold counts while the signing hand meets the letter's finger
// conditions (letterMatch.js). Like the camera check's hold, a gap
// shorter than HAND_HOLD_MS doesn't end it, so one odd frame can't restart
// the 1.5 seconds; a longer one does.
export const LETTER_HOLD_MS = 1500
export { NO_HOLD }

// guesses: one per hand in view, as useLetterCheck's guess() makes them (it
// only passes the signing hand's); `makes`: the hand makes the target
// (matchLetter in letterMatch.js). The conditions decide alone (2026-10-27).
// The letter model is a second opinion (2026-10-29, below), not a gate: adding
// `&& g.sure && g.letter === letter` here would make it one, so that a letter
// passes only when the model agrees too. Lanix chose not to.
export function showsLetter(guesses) {
  return guesses.some((g) => g.whole && g.makes)
}

// The letter model's reading of one frame: the letter when it's sure, '?'
// when it isn't, or null with no whole signing hand to read.
export function modelReading(guesses) {
  const g = guesses.find((guess) => guess.whole)
  if (!g) return null
  return g.sure ? g.letter : '?'
}

// The letter model's second opinion on a whole hold: it never decides the
// pass, but after one Learn says what it made of the hold. `readings` counts
// each frame's reading ({ B: 40, '?': 3 }); the answer is the most frequent
// one, so a frame or two can't change it: a letter, '?' (mostly not sure), or
// null (nothing read).
export function modelVerdict(readings) {
  const [top] = Object.entries(readings).sort((a, b) => b[1] - a[1])
  return top ? top[0] : null
}

// hold: { start, lastAt }, as in handChecks.js (start is null with no hold).
export function updateLetterHold(hold, matching, now) {
  const holding = hold.start !== null && now - hold.lastAt < HAND_HOLD_MS
  if (matching) return { start: holding ? hold.start : now, lastAt: now }
  return holding ? hold : NO_HOLD
}

// Whole seconds left (2, 1, then 0), or null with no hold.
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
// model are both loaded (for a traced letter, only the hand model). `hand`: the
// signing hand, 'left' or 'right'. `traced`: the letter is traced (J, Z), and
// `tracing` once the fingertip has started on point 1; before J's line
// appears, `holdingI` while the I is being held.
export function practiceStatus({
  cameraStatus,
  cameraError,
  trackingError,
  ready,
  passed,
  secondsLeft,
  guesses,
  target,
  hand,
  traced = false,
  tracing = false,
  holdingI = false,
}) {
  if (cameraError) return { status: 'Camera problem', tone: 'warn' }
  if (trackingError) return { status: 'Tracking problem', tone: 'warn' }
  if (passed) return { status: `That's ${target}!`, tone: 'ok' }
  if (cameraStatus === 'idle') return { status: 'Camera off', tone: '' }
  if (cameraStatus === 'starting') return { status: 'Starting…', tone: '' }
  if (!ready) return { status: 'Getting ready…', tone: '' }
  if (traced) {
    if (tracing) return { status: 'Follow the line to point 2…', tone: 'ok' }
    if (target === 'J') {
      if (holdingI) return { status: 'Hold the I…', tone: 'ok' }
      return { status: `Make I with your ${hand} hand`, tone: '' }
    }
    return { status: `Put your ${hand} index finger on point 1`, tone: '' }
  }
  if (secondsLeft !== null) return { status: `Hold it… ${secondsLeft}`, tone: 'ok' }
  if (guesses.length > 0 && guesses.every((g) => !g.whole)) return { status: 'Show your whole hand', tone: '' }
  return { status: `Show ${target} with your ${hand} hand`, tone: '' }
}
