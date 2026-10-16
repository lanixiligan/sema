import { toPhysicalHand } from './handedness.js'

// How far inside the frame's edges every hand point must be for "whole hand in
// view", as a fraction of the frame (0.02 = 2%).
export const EDGE_MARGIN = 0.02

// The camera check's two checks for one detection result (the object
// useHandDetection gives its listener).
// hand: 'none' (no hand), 'match' (the signing hand) or 'other' (the other one).
// wholeHand: every point, wrist included, is inside the frame.
export function checkHand(detection, signingHand) {
  if (!detection?.landmarks || !detection.handedness) return { hand: 'none', wholeHand: false }
  const detected = toPhysicalHand(detection.handedness.categoryName).toLowerCase()
  const inside = (value) => value >= EDGE_MARGIN && value <= 1 - EDGE_MARGIN
  return {
    hand: detected === signingHand ? 'match' : 'other',
    wholeHand: detection.landmarks.every((point) => inside(point.x) && inside(point.y)),
  }
}
