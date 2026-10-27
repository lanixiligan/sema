import { FOUR_FINGERS } from './handPoints.js'

// Each letter's finger conditions: "{index} folded down", "{thumb} along the
// side of the fist"… Learn ticks them off live, and the hold counts only
// while the signing hand meets them (letterMatch.js). The words in braces are
// finger names, shown with the finger's number (handPoints.js). This file is
// also where Sema's letters are listed (LETTERS, TRACED_LETTERS).
//
// The approach: measure the hand (handMeasures.js), and score every condition
// from 0 (not at all) to 1 (fully), so a condition fades in instead of
// flipping at one exact angle. The numbers are a start, to be tuned by eye in
// Chrome.

// ---- Scores from 0 to 1 ----

// 0 at `from`, 1 at `to`, a straight line between, and flat outside. `to` may
// be smaller than `from` ("the smaller the better").
function ramp(value, from, to) {
  const share = (value - from) / (to - from)
  return Math.max(0, Math.min(1, share))
}
// 1 between `low` and `high`, fading to 0 at `lowest` and `highest`.
const between = (value, lowest, low, high, highest) => Math.min(ramp(value, lowest, low), ramp(value, highest, high))

const straight = (finger) => Math.min(ramp(finger.total, 95, 55), ramp(finger.middle, 55, 30))
const folded = (finger) => Math.max(ramp(finger.middle, 45, 75), ramp(finger.total, 120, 170))
const curved = (finger) => between(finger.total, 40, 75, 175, 215)

function pointing(direction, way) {
  if (way === 'up') return ramp(-direction.y, 0.35, 0.75)
  if (way === 'down') return ramp(direction.y, 0.2, 0.6)
  return ramp(Math.abs(direction.x), 0.5, 0.85) // sideways
}

// ---- The conditions ----
// Each one: text (the checklist line) and score(hand) from 0 to 1.

const up = (finger) => ({
  text: `{${finger}} straight`,
  score: (hand) => straight(hand[finger]),
})
const down = (finger) => ({
  text: `{${finger}} folded down`,
  score: (hand) => folded(hand[finger]),
})
const thumbTucked = {
  text: '{thumb} tucked in',
  score: (hand) => ramp(hand.thumbAway, 0.95, 0.7),
}
const indexMiddleTogether = {
  text: '{index} and {middle} together',
  score: (hand) => ramp(hand.spreadIndexMiddle, 22, 12),
}
const indexMiddleApart = (from = 12, to = 20) => ({
  text: '{index} and {middle} spread apart',
  score: (hand) => ramp(hand.spreadIndexMiddle, from, to),
})
const notCrossed = {
  text: 'Fingers not crossed',
  score: (hand) => ramp(hand.crossed, 0.02, -0.06),
}
const fingersPoint = (way, source = 'indexDirection') => ({
  text: `Fingers point ${way === 'side' ? 'sideways' : way}`,
  score: (hand) => pointing(hand[source], way),
})
const thumbUnderFingers = {
  text: '{thumb} under the fingers',
  score: (hand) => ramp(hand.thumbInFront, 0.1, 0.02),
}
const foldedOverThumb = {
  text: 'Fingers folded over the {thumb}',
  score: (hand) => ramp(hand.index.knuckle, 52, 66),
}
const thumbParallel = {
  text: '{thumb} parallel to {index}',
  score: (hand) => Math.min(ramp(hand.thumbIndexAngle, 50, 30), ramp(hand.thumbAway, 0.2, 0.32)),
}
const thumbBetween = {
  text: '{thumb} between {index} and {middle}',
  score: (hand) =>
    ramp(Math.min(hand.thumbToMiddleJoint, hand.thumbToMiddleKnuckle, hand.thumbToIndexJoint), 0.55, 0.35),
}

// The four fingers, all folded down.
const fist = FOUR_FINGERS.map(down)

// Every letter's conditions, in the order the checklist shows them. J and Z
// are the handshapes held while tracing (I's and an index finger's).
export const RULES = {
  A: [
    ...fist,
    {
      text: '{thumb} along the side of the fist',
      score: (hand) => ramp(hand.across, 0.18, 0.02),
    },
    { text: '{thumb} straight', score: (hand) => ramp(hand.thumbBend, 115, 75) },
  ],
  B: [
    up('index'),
    up('middle'),
    up('ring'),
    up('pinky'),
    indexMiddleTogether,
    {
      text: '{thumb} folded across the palm',
      score: (hand) => Math.min(ramp(hand.across, 0.05, 0.25), ramp(hand.thumbAway, 0.9, 0.65)),
    },
  ],
  C: [
    {
      text: 'All four fingers curved',
      score: (hand) => Math.min(curved(hand.index), curved(hand.middle), curved(hand.ring)),
    },
    {
      text: 'Gap between {thumb} and fingertips',
      score: (hand) => between(hand.thumbToIndexTip, 0.2, 0.32, 1.0, 1.3),
    },
    indexMiddleTogether,
  ],
  D: [
    up('index'),
    down('middle'),
    down('ring'),
    down('pinky'),
    {
      text: '{thumb} touches the {middle} tip',
      score: (hand) => ramp(hand.thumbToMiddleTip, 0.45, 0.25),
    },
  ],
  E: [
    ...fist,
    {
      text: '{thumb} tucked under the fingertips',
      score: (hand) =>
        Math.min(ramp(hand.across, 0.1, 0.3), ramp(Math.min(hand.thumbToIndexTip, hand.thumbToMiddleTip), 0.6, 0.38)),
    },
    {
      text: 'Fingers bent, not a tight fist',
      score: (hand) => ramp((hand.index.knuckle + hand.middle.knuckle) / 2, 75, 55),
    },
  ],
  F: [
    {
      text: '{thumb} and {index} tips touch',
      score: (hand) => ramp(hand.thumbToIndexTip, 0.4, 0.22),
    },
    up('middle'),
    up('ring'),
    up('pinky'),
  ],
  G: [up('index'), down('middle'), down('ring'), down('pinky'), thumbParallel, fingersPoint('side')],
  H: [up('index'), up('middle'), down('ring'), down('pinky'), indexMiddleTogether, fingersPoint('side')],
  I: [up('pinky'), down('index'), down('middle'), down('ring'), thumbTucked],
  J: [up('pinky'), down('index'), down('middle'), down('ring'), thumbTucked],
  K: [
    up('index'),
    up('middle'),
    down('ring'),
    down('pinky'),
    indexMiddleApart(10, 18),
    thumbBetween,
    fingersPoint('up', 'handDirection'),
  ],
  L: [
    up('index'),
    down('middle'),
    down('ring'),
    down('pinky'),
    {
      text: '{thumb} stretched out to the side',
      score: (hand) => Math.min(ramp(hand.thumbAway, 0.5, 0.72), ramp(hand.thumbIndexAngle, 30, 48)),
    },
    fingersPoint('up'),
  ],
  M: [
    ...fist,
    {
      text: '{thumb} under three fingers',
      score: (hand) => ramp(hand.across, 0.55, 0.72),
    },
    thumbUnderFingers,
    foldedOverThumb,
  ],
  N: [
    ...fist,
    {
      text: '{thumb} under two fingers',
      score: (hand) => between(hand.across, 0.22, 0.36, 0.6, 0.72),
    },
    thumbUnderFingers,
    foldedOverThumb,
  ],
  O: [
    {
      text: 'Fingers curved',
      score: (hand) => Math.min(curved(hand.index), curved(hand.middle)),
    },
    {
      text: '{thumb} touches the fingertips',
      score: (hand) => ramp(hand.thumbToIndexTip, 0.42, 0.24),
    },
    {
      text: '{middle}, {ring} and {pinky} curved too',
      score: (hand) => Math.min(ramp(hand.middle.total, 55, 85), ramp(hand.ring.total, 55, 85)),
    },
  ],
  P: [
    up('index'),
    up('middle'),
    down('ring'),
    down('pinky'),
    indexMiddleApart(10, 18),
    thumbBetween,
    fingersPoint('down', 'handDirection'),
  ],
  Q: [up('index'), down('middle'), down('ring'), down('pinky'), thumbParallel, fingersPoint('down')],
  R: [
    up('index'),
    up('middle'),
    down('ring'),
    down('pinky'),
    {
      text: '{index} and {middle} crossed',
      score: (hand) => ramp(hand.crossed, -0.02, 0.06),
    },
  ],
  S: [
    ...fist,
    {
      text: '{thumb} across the front of the fist',
      score: (hand) =>
        Math.min(
          between(hand.across, 0.12, 0.25, 0.62, 0.75),
          ramp(hand.thumbToMiddleJoint, 0.6, 0.38),
          ramp(hand.thumbInFront, 0, 0.08),
        ),
    },
    {
      text: 'Tight fist',
      score: (hand) => ramp((hand.index.knuckle + hand.middle.knuckle) / 2, 50, 68),
    },
  ],
  T: [
    ...fist,
    {
      text: '{thumb} tucked between {index} and {middle}',
      score: (hand) =>
        Math.min(ramp(hand.thumbToIndexJoint, 0.48, 0.3), between(hand.across, -0.05, 0.08, 0.4, 0.5)),
    },
    thumbUnderFingers,
  ],
  U: [up('index'), up('middle'), down('ring'), down('pinky'), indexMiddleTogether, notCrossed, fingersPoint('up')],
  V: [
    up('index'),
    up('middle'),
    down('ring'),
    down('pinky'),
    indexMiddleApart(),
    notCrossed,
    fingersPoint('up'),
    {
      text: '{thumb} holding {ring} and {pinky}',
      score: (hand) => ramp(hand.thumbToMiddleJoint, 0.3, 0.45),
    },
  ],
  W: [up('index'), up('middle'), up('ring'), down('pinky'), indexMiddleApart(8, 14)],
  X: [
    {
      text: '{index} bent into a hook',
      score: (hand) => Math.min(ramp(hand.index.middle, 40, 65), ramp(hand.index.knuckle, 55, 30)),
    },
    down('middle'),
    down('ring'),
    down('pinky'),
  ],
  Y: [
    up('pinky'),
    down('index'),
    down('middle'),
    down('ring'),
    {
      text: '{thumb} stretched out',
      score: (hand) => ramp(hand.thumbAway, 0.5, 0.72),
    },
  ],
  Z: [up('index'), down('middle'), down('ring'), down('pinky'), thumbTucked],
}

// Sema's letters, A to Z (RULES' order).
export const LETTERS = Object.keys(RULES)

// J and Z move, and the classifier only knows still shapes, so they're
// traced on the camera view instead (zTrace.js, jTrace.js), their handshape's
// conditions met all along.
export const TRACED_LETTERS = ['J', 'Z']
