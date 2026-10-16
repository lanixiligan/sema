import { toPhysicalHand } from './handedness.js'

// The landmarker looks for up to two hands (numHands: 2), so a page can find
// the hand it wants even when the other one came into view first. This picks
// one hand from a detectForVideo result: the wanted hand ('left' or 'right')
// if it was found, otherwise the first hand found (so a page can still say
// "Left hand seen"), or null when there's no hand.
// Returns { landmarks, handedness }, handedness being the hand's top category.
export function pickHand(result, wantedHand) {
  const hands = result.landmarks.map((landmarks, i) => ({ landmarks, handedness: result.handedness[i][0] }))
  if (hands.length === 0) return null
  const wanted = wantedHand && hands.find((hand) => toPhysicalHand(hand.handedness.categoryName).toLowerCase() === wantedHand)
  return wanted ?? hands[0]
}
