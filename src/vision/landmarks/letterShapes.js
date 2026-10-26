// Shape rules a hand must also pass to count as a letter, on top of the letter
// model's guess. The model only knows letters, so any hand gets the closest
// one: on ASL-HG's digit photos (never trained on), it called an open hand
// ("5") B 60% of the time, and 4 and 8 over 90% (measured 2026-10-23).
//
// The rules read normalizeHand's numbers (wrist at 0, palm length 1, left
// hands flipped), on x and y only: z is the noisiest coordinate. Their limits
// kept every B in the training photos and in Lanix's recordings, and turned
// away every digit photo the model took for B.

// MediaPipe's point numbers.
const THUMB_TIP = 4
const INDEX_BASE = 5
const INDEX_MIDDLE_JOINT = 6
const INDEX_TIP = 8
const MIDDLE_MIDDLE_JOINT = 10
const MIDDLE_TIP = 12
const RING_BASE = 13
const RING_MIDDLE_JOINT = 14
const RING_TIP = 16
const PINKY_BASE = 17
const PINKY_MIDDLE_JOINT = 18
const PINKY_TIP = 20

// Fingers together: the index and pinky tips no further apart than this many
// times their knuckles. B measured up to 1.13; spread fingers from 1.43.
const MAX_SPREAD = 1.3
// Thumb across the palm: its tip within this many palm lengths of the ring
// finger's knuckle. B measured up to 0.55; a thumb out to the side from 0.84.
const MAX_THUMB_REACH = 0.7

// Z's index finger (J's pinky) is straight: its tip at least this many times
// as far from the wrist as its middle joint (about 1.4 when straight up, under
// 1 when curled). Tuned by eye; pointed at the camera it looks shorter.
const MIN_POINTING = 1.05
// The other fingers may be only half curled: a tip up to this many times as
// far from the wrist as its middle joint.
const MAX_CURL = 1.1
// Z's and J's thumb may be further from the palm than B's (a moving hand opens it).
const MAX_Z_THUMB_REACH = 1.0

// Each finger as [tip, middle joint].
const INDEX = [INDEX_TIP, INDEX_MIDDLE_JOINT]
const MIDDLE = [MIDDLE_TIP, MIDDLE_MIDDLE_JOINT]
const RING = [RING_TIP, RING_MIDDLE_JOINT]
const PINKY = [PINKY_TIP, PINKY_MIDDLE_JOINT]

const point = (landmarks, i) => ({ x: landmarks[3 * i], y: landmarks[3 * i + 1] })
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
// The wrist is at 0 in normalizeHand's numbers.
const fromWrist = (landmarks, i) => Math.hypot(landmarks[3 * i], landmarks[3 * i + 1])

function fingersTogether(landmarks) {
  const tips = distance(point(landmarks, INDEX_TIP), point(landmarks, PINKY_TIP))
  const knuckles = distance(point(landmarks, INDEX_BASE), point(landmarks, PINKY_BASE))
  return tips <= MAX_SPREAD * knuckles
}

function thumbAcrossPalm(landmarks) {
  return distance(point(landmarks, THUMB_TIP), point(landmarks, RING_BASE)) <= MAX_THUMB_REACH
}

function pointing(landmarks, [tip, joint]) {
  return fromWrist(landmarks, tip) >= MIN_POINTING * fromWrist(landmarks, joint)
}

// A curled finger's tip is no further from the wrist than its middle joint
// (a little further is allowed: MAX_CURL).
function curled(landmarks, fingers) {
  return fingers.every(([tip, joint]) => fromWrist(landmarks, tip) <= MAX_CURL * fromWrist(landmarks, joint))
}

function thumbNearPalm(landmarks) {
  return distance(point(landmarks, THUMB_TIP), point(landmarks, RING_BASE)) <= MAX_Z_THUMB_REACH
}

// Each letter's rules, in the order of its instructions (letters.json), with
// what to tell the person. A letter with no rules goes by the model alone.
// J and Z have no model at all (they move): their rules are the whole
// handshape check, held before and while tracing (zTrace.js, jTrace.js). J's
// are I's handshape, kept under J so the letter I still goes by the model alone.
const RULES = {
  B: [
    { passes: fingersTogether, fix: 'Keep your fingers together.' },
    { passes: thumbAcrossPalm, fix: 'Fold your thumb across your palm.' },
  ],
  J: [
    { passes: (landmarks) => pointing(landmarks, PINKY), fix: 'Point your pinky up.' },
    { passes: (landmarks) => curled(landmarks, [INDEX, MIDDLE, RING]), fix: 'Curl your other fingers into your palm.' },
    { passes: thumbNearPalm, fix: 'Fold your thumb over your curled fingers.' },
  ],
  Z: [
    { passes: (landmarks) => pointing(landmarks, INDEX), fix: 'Point your index finger.' },
    { passes: (landmarks) => curled(landmarks, [MIDDLE, RING, PINKY]), fix: 'Curl your other fingers into your palm.' },
    { passes: thumbNearPalm, fix: 'Fold your thumb over your curled fingers.' },
  ],
}

// The first thing to change for this hand to be the letter, or null when it
// passes every rule. landmarks: normalizeHand's 63 numbers.
export function shapeFix(letter, landmarks) {
  const failed = (RULES[letter] ?? []).find((rule) => !rule.passes(landmarks))
  return failed ? failed.fix : null
}
