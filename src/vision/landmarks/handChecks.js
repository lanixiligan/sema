// How far inside the frame's edges every hand point must be for "whole hand in
// view", as a fraction of the frame (0.02 = 2%).
export const EDGE_MARGIN = 0.02

// Whether every hand point, wrist included, is inside the frame (by
// EDGE_MARGIN). Used by the camera check and by Record before a take.
export function isWholeHand(landmarks) {
  if (!landmarks) return false
  const inside = (value) => value >= EDGE_MARGIN && value <= 1 - EDGE_MARGIN
  return landmarks.every((point) => inside(point.x) && inside(point.y))
}

// The camera check looks at one hand, left or right, whichever the person
// shows. It sees 'none' (no hand in view), 'part' (in view, but not all of it)
// or 'whole' (every point, wrist included, inside the frame). It passes once a
// hand has been whole for CHECK_HOLD_MS. Which hand it is doesn't matter, so
// MediaPipe's Left/Right label (which can flip while a hand turns) isn't used.

// How long the hand may be missing before the check stops showing it, like
// useHandDetection's 300 ms "No hand": one missed frame mustn't flicker.
export const HAND_HOLD_MS = 300

// How long the hand must stay up, whole, for the check to pass.
export const CHECK_HOLD_MS = 3000

// What one frame shows of the hand. `hands` is the detection listener's list
// of every hand found; if the person shows two, the best one counts.
export function seeHand(hands) {
  if (hands.some((hand) => isWholeHand(hand.landmarks))) return 'whole'
  return hands.length > 0 ? 'part' : 'none'
}

// `seen`, steadied: a hand missing for less than HAND_HOLD_MS keeps what
// `shown` had. `lastSeenAt` says when a hand was last in view.
export function steadySeen(shown, seen, lastSeenAt, now) {
  return seen === 'none' && now - lastSeenAt < HAND_HOLD_MS ? shown : seen
}

// The current hold: `start` is when the hand was first up and whole (null
// while it isn't), `lastAt` the last frame it was. A gap shorter than
// HAND_HOLD_MS doesn't end the hold; a longer one does, even if no frame came
// in between (the camera was off), so the 3 seconds always start again.
export const NO_HOLD = { start: null, lastAt: 0 }

export function updateHold(hold, seen, now) {
  const holding = hold.start !== null && now - hold.lastAt < HAND_HOLD_MS
  if (seen === 'whole') return { start: holding ? hold.start : now, lastAt: now }
  return holding ? hold : NO_HOLD
}

// Whole seconds left in the hold (3, 2, 1), 0 once it's long enough, or null
// with no hold.
export function holdSecondsLeft(hold, now) {
  if (hold.start === null) return null
  return Math.max(0, Math.ceil((CHECK_HOLD_MS - (now - hold.start)) / 1000))
}
