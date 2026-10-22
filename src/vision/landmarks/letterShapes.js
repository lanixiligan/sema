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
const INDEX_TIP = 8
const RING_BASE = 13
const PINKY_BASE = 17
const PINKY_TIP = 20

// Fingers together: the index and pinky tips no further apart than this many
// times their knuckles. B measured up to 1.13; spread fingers from 1.43.
const MAX_SPREAD = 1.3
// Thumb across the palm: its tip within this many palm lengths of the ring
// finger's knuckle. B measured up to 0.55; a thumb out to the side from 0.84.
const MAX_THUMB_REACH = 0.7

const point = (landmarks, i) => ({ x: landmarks[3 * i], y: landmarks[3 * i + 1] })
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

function fingersTogether(landmarks) {
  const tips = distance(point(landmarks, INDEX_TIP), point(landmarks, PINKY_TIP))
  const knuckles = distance(point(landmarks, INDEX_BASE), point(landmarks, PINKY_BASE))
  return tips <= MAX_SPREAD * knuckles
}

function thumbAcrossPalm(landmarks) {
  return distance(point(landmarks, THUMB_TIP), point(landmarks, RING_BASE)) <= MAX_THUMB_REACH
}

// Each letter's rules, in the order of its instructions (letters.json), with
// what to tell the person. A letter with no rules goes by the model alone.
const RULES = {
  B: [
    { passes: fingersTogether, fix: 'Keep your fingers together.' },
    { passes: thumbAcrossPalm, fix: 'Fold your thumb across your palm.' },
  ],
}

// The first thing to change for this hand to be the letter, or null when it
// passes every rule. landmarks: normalizeHand's 63 numbers.
export function shapeFix(letter, landmarks) {
  const failed = (RULES[letter] ?? []).find((rule) => !rule.passes(landmarks))
  return failed ? failed.fix : null
}
