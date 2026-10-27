import { FINGERS, FOUR_FINGERS, WRIST } from './handPoints.js'

// Measures a hand for the letters' finger conditions (letterShapes.js): joint
// bends, where the thumb is, how far apart the fingers are.
//
// The measurements read normalizeHand's numbers (wrist at 0, palm length 1,
// left hands flipped to look like right ones). That only moves, scales and
// flips the hand, so angles are the hand's real angles. z comes from a single
// camera, so bends are least reliable when a finger points at the camera.

// ---- Vector maths on { x, y, z } points ----
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const length = (a) => Math.hypot(a.x, a.y, a.z)
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })
const scale = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s })
// Distances are already in palm lengths (normalizeHand's scale).
const distance = (a, b) => length(sub(a, b))

// The angle between two directions, in degrees: 0 when they point the same way.
function angle(u, w) {
  const cos = dot(u, w) / (length(u) * length(w) || 1)
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}

// How much a joint at b bends, from a to b to c: 0 when straight.
const bend = (a, b, c) => angle(sub(b, a), sub(c, b))

// Which way a point lies from another on screen (x, y only; y grows
// downwards), as a unit direction.
function direction(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const size = Math.hypot(dx, dy) || 1
  return { x: dx / size, y: dy / size }
}

// Everything the conditions look at, from one hand's 63 numbers.
export function measureHand(landmarks) {
  const p = Array.from({ length: 21 }, (_, i) => ({
    x: landmarks[3 * i],
    y: landmarks[3 * i + 1],
    z: landmarks[3 * i + 2],
  }))
  const wrist = p[WRIST]
  const thumb = FINGERS.thumb.map((i) => p[i])
  const thumbTip = thumb[3]
  const [indexKnuckle, indexJoint, , indexTip] = FINGERS.index.map((i) => p[i])
  const [middleKnuckle, middleJoint, , middleTip] = FINGERS.middle.map((i) => p[i])
  const pinkyKnuckle = p[FINGERS.pinky[0]]

  const hand = {}
  // Each finger's three bends, knuckle to tip, and their total.
  for (const name of FOUR_FINGERS) {
    const [a, b, c, tip] = FINGERS[name].map((i) => p[i])
    const knuckle = bend(wrist, a, b)
    const middle = bend(a, b, c)
    const top = bend(b, c, tip)
    hand[name] = { knuckle, middle, top, total: knuckle + middle + top }
  }
  // The thumb's two upper bends together: small when the thumb is straight.
  hand.thumbBend = bend(thumb[0], thumb[1], thumb[2]) + bend(thumb[1], thumb[2], thumb[3])

  // How far across the palm the thumb tip is: 0 level with the index
  // knuckle, 1 level with the pinky knuckle, below 0 out on the index side.
  const knuckles = sub(pinkyKnuckle, indexKnuckle)
  hand.across = dot(sub(thumbTip, indexKnuckle), knuckles) / (dot(knuckles, knuckles) || 1)
  // Thumb tip to index knuckle, and the thumb's angle to the index finger.
  hand.thumbAway = distance(thumbTip, indexKnuckle)
  hand.thumbIndexAngle = angle(sub(thumbTip, thumb[1]), sub(indexTip, indexKnuckle))
  // Thumb tip to fingertips and to joints it may rest against.
  hand.thumbToIndexTip = distance(thumbTip, indexTip)
  hand.thumbToMiddleTip = distance(thumbTip, middleTip)
  hand.thumbToIndexJoint = distance(thumbTip, indexJoint)
  hand.thumbToMiddleJoint = distance(thumbTip, middleJoint)
  hand.thumbToMiddleKnuckle = distance(thumbTip, middleKnuckle)

  // The angle between the index and middle fingers: about 0 when together.
  hand.spreadIndexMiddle = angle(sub(indexTip, indexKnuckle), sub(middleTip, middleKnuckle))
  // Index and middle crossed: the index tip is further towards the pinky
  // side than the middle tip (positive when crossed).
  const side = scale(knuckles, 1 / (length(knuckles) || 1))
  hand.crossed = dot(sub(indexTip, indexKnuckle), side) - dot(sub(middleTip, indexKnuckle), side)

  // How far the thumb tip is in front of the curled fingers (positive) or
  // under them (negative), along the palm's normal. The normal is turned to
  // point the way the fingers curl, so a flipped left hand reads the same.
  let normal = cross(sub(indexKnuckle, wrist), sub(pinkyKnuckle, wrist))
  normal = scale(normal, 1 / (length(normal) || 1))
  const fingersDepth = dot(sub(middleJoint, wrist), normal)
  if (fingersDepth < 0) normal = scale(normal, -1)
  hand.thumbInFront = dot(sub(thumbTip, wrist), normal) - Math.abs(fingersDepth)

  // Which way the index finger and the hand point on screen.
  hand.indexDirection = direction(indexKnuckle, indexTip)
  hand.handDirection = direction(wrist, middleKnuckle)
  return hand
}
