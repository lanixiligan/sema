import { toPhysicalHand } from './handedness.js'

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

// The camera check looks at both hands. For each one it shows 'none' (not in
// view), 'part' (in view, but not all of it) or 'whole' (every point, wrist
// included, inside the frame). It passes once both hands have been up and
// whole at the same time for BOTH_HANDS_HOLD_MS.

// How long a hand may be missing before the check stops showing it, like
// useHandDetection's 300 ms "No hand": one missed frame mustn't flicker.
export const HAND_HOLD_MS = 300

// How long both hands must stay up, whole, for the check to pass.
export const BOTH_HANDS_HOLD_MS = 3000

// What one frame shows of each hand. `hands` is the detection listener's list
// of every hand found.
// MediaPipe's Left/Right label comes from the hand's shape, and it can flip
// while a hand turns (palm, back, edge-on). So with two hands, which is which
// comes from where they are: in our un-mirrored frames, the person's right
// hand is on the frame's left (the smaller x of the wrist). One hand alone
// can only go by its label.
export function seeHands(hands) {
  const seen = { left: 'none', right: 'none' }
  const view = (hand) => (isWholeHand(hand.landmarks) ? 'whole' : 'part')
  if (hands.length >= 2) {
    const [onFrameLeft, onFrameRight] = [...hands.slice(0, 2)].sort((a, b) => a.landmarks[0].x - b.landmarks[0].x)
    seen.right = view(onFrameLeft)
    seen.left = view(onFrameRight)
  } else if (hands.length === 1) {
    seen[toPhysicalHand(hands[0].handedness.categoryName).toLowerCase()] = view(hands[0])
  }
  return seen
}

// `seen`, steadied: a hand missing for less than HAND_HOLD_MS keeps what
// `shown` had for it. `lastSeenAt` says when each hand was last in view.
export function steadySeen(shown, seen, lastSeenAt, now) {
  const steady = (hand) => (seen[hand] === 'none' && now - lastSeenAt[hand] < HAND_HOLD_MS ? shown[hand] : seen[hand])
  return { left: steady('left'), right: steady('right') }
}

// The current hold of both hands: `start` is when both were first up and
// whole together (null while they aren't), `lastAt` the last frame they were.
// A gap shorter than HAND_HOLD_MS doesn't end the hold; a longer one does,
// even if no frame came in between (the camera was off), so the 3 seconds
// always start again.
export const NO_HOLD = { start: null, lastAt: 0 }

export function updateHold(hold, seen, now) {
  const holding = hold.start !== null && now - hold.lastAt < HAND_HOLD_MS
  if (seen.left === 'whole' && seen.right === 'whole') return { start: holding ? hold.start : now, lastAt: now }
  return holding ? hold : NO_HOLD
}

// Whole seconds left in the hold (3, 2, 1), 0 once it's long enough, or null
// with no hold.
export function holdSecondsLeft(hold, now) {
  if (hold.start === null) return null
  return Math.max(0, Math.ceil((BOTH_HANDS_HOLD_MS - (now - hold.start)) / 1000))
}
