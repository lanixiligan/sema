import { FINGERS, WRIST } from './handPoints.js'

// Turns MediaPipe's 21 hand landmarks into 63 numbers that describe only the
// hand's shape: the same handshape gives the same numbers wherever it is in
// the picture, however big it looks, and whichever hand made it.
// See docs/data-format.md. Bump NORMALIZATION_VERSION whenever this changes:
// session files record which version produced their landmarks.
export const NORMALIZATION_VERSION = 1

const MIDDLE_FINGER_BASE = FINGERS.middle[0]
// A palm shorter than this (in pixels) means the landmarks are unusable.
const MIN_PALM_LENGTH = 1e-6

// raw: 21 { x, y, z } points as MediaPipe returns them, in the un-mirrored
// camera frame (x and y are fractions of the width and height; z is depth on
// roughly the same scale as x). hand: 'left' or 'right'.
// Returns 63 numbers (x, y, z for points 0–20, wrist first), or null.
export function normalizeHand(raw, { width, height, hand }) {
  // 1. Equal units: pixels on both axes, so a 640×480 frame doesn't stretch
  //    the hand sideways. MediaPipe gives z on roughly x's scale.
  const points = raw.map((p) => ({ x: p.x * width, y: p.y * height, z: p.z * width }))

  // 2. Wrist to origin.
  const wrist = points[WRIST]
  const moved = points.map((p) => ({ x: p.x - wrist.x, y: p.y - wrist.y, z: p.z - wrist.z }))

  // 3. Scale by palm length: wrist to the base of the middle finger, which
  //    doesn't change when fingers curl. Whether z belongs in this distance is
  //    an experiment for milestone 2.2 (z is the noisiest coordinate).
  const base = moved[MIDDLE_FINGER_BASE]
  const palm = Math.hypot(base.x, base.y, base.z)
  if (!(palm > MIN_PALM_LENGTH)) return null

  // 4. Flip left hands so they look like right hands. `hand` is the detected
  //    hand, for now: which hand drives the flip is an open decision in the plan.
  // 5. No rotation, deliberately: orientation carries meaning (H vs U).
  const flip = hand === 'left' ? -1 : 1
  return moved.flatMap((p) => [(flip * p.x) / palm, p.y / palm, p.z / palm])
}
