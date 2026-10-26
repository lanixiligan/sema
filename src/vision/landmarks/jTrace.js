// J moves: it starts as I, then the pinky draws a J in the air. As with Z
// (zTrace.js), Practice doesn't recognize the motion: the person holds the I
// handshape for J_START_HOLD_MS, then a curvy J appears with its start on the
// pinky tip, sized to the hand (jScale), and they trace it with the pinky.
// zTrace.js's updateTrace follows it, with `restart: false` and the J's
// `scale`: after a slip the J goes, and it starts over from the I. Points are
// in frame heights, as in zTrace.js.

// How long the I is held before the J appears. Shorter than a letter's 3 s
// hold: it only shows the hand is ready.
export const J_START_HOLD_MS = 1000
export const PINKY_TIP = 20
const WRIST = 0

// The J as two curves (each a start, two pull points and an end), measured
// from where it starts, for a left hand on the un-mirrored frame. On the
// mirrored video a left hand's J hooks to the right; a right hand's (flipped)
// to the left. A drop that bulges out a little, then a round bowl whose hook
// comes back up past halfway (2026-10-26, Lanix's pick of three mockups).
// J_HEIGHT frame heights tall at scale 1, the size Z's tolerance suits.
const J_CURVES = [
  [
    { x: 0, y: 0 },
    { x: 0.03, y: 0.12 },
    { x: 0.02, y: 0.3 },
    { x: -0.11, y: 0.3 },
  ],
  [
    { x: -0.11, y: 0.3 },
    { x: -0.21, y: 0.3 },
    { x: -0.22, y: 0.2 },
    { x: -0.16, y: 0.14 },
  ],
]
const J_HEIGHT = 0.3
// How tall the J is, in hand lengths (wrist to pinky tip, as the I is held),
// so a bigger hand, or one nearer the camera, gets a bigger J (Lanix's idea,
// 2026-10-26). Tuned by eye.
const J_PER_HAND = 1
// The J may grow only until it still fits in the frame.
const MAX_SCALE = 2.5
// Points per curve: enough that the short straight pieces between them read as
// a smooth curve.
const STEPS = 16
// How far the J stays from the frame's edges.
const MARGIN = 0.03

// How big to draw the J for this hand (MediaPipe's raw points, as the I is
// held): 1 is J_HEIGHT tall. The tolerance to trace it scales the same way.
export function jScale(rawLandmarks, aspect) {
  const wrist = rawLandmarks[WRIST]
  const tip = rawLandmarks[PINKY_TIP]
  const handLength = Math.hypot((tip.x - wrist.x) * aspect, tip.y - wrist.y)
  return Math.min(MAX_SCALE, (J_PER_HAND * handLength) / J_HEIGHT)
}

// A point on a curve, t from 0 (its start) to 1 (its end).
function onCurve([a, b, c, d], t) {
  const u = 1 - t
  const mix = (key) => u * u * u * a[key] + 3 * u * u * t * b[key] + 3 * u * t * t * c[key] + t * t * t * d[key]
  return { x: mix('x'), y: mix('y') }
}

// The J's points measured from its start, for the signing hand.
function jShape(hand) {
  const points = [J_CURVES[0][0]]
  for (const curve of J_CURVES) {
    for (let i = 1; i <= STEPS; i++) points.push(onCurve(curve, i / STEPS))
  }
  return points.map((p) => ({ x: hand === 'right' ? -p.x : p.x, y: p.y }))
}

// The J for the signing hand ('left' or 'right'), its start at `start` (the
// pinky tip, in frame heights), `scale` times its size (jScale), moved inside
// the frame if it would leave it.
export function jPath(hand, aspect, start, scale = 1) {
  const points = jShape(hand).map((p) => ({ x: start.x + p.x * scale, y: start.y + p.y * scale }))
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const dx = shiftInside(Math.min(...xs), Math.max(...xs), aspect)
  const dy = shiftInside(Math.min(...ys), Math.max(...ys), 1)
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

// How far to move something from `low` to `high` so it fits between MARGIN
// and size − MARGIN (0 when it already does).
function shiftInside(low, high, size) {
  if (low < MARGIN) return MARGIN - low
  if (high > size - MARGIN) return size - MARGIN - high
  return 0
}
