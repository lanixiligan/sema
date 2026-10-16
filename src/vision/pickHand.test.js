import { describe, expect, it } from 'vitest'
import { pickHand } from './pickHand.js'

// A detectForVideo result with one entry per hand found, in MediaPipe's shape:
// landmarks[i] is a hand's points, handedness[i] its list of categories.
const points = (x) => Array.from({ length: 21 }, () => ({ x, y: 0.5, z: 0 }))
const result = (...hands) => ({
  landmarks: hands.map(([, x]) => points(x)),
  handedness: hands.map(([label]) => [{ categoryName: label, score: 0.95 }]),
})

describe('pickHand', () => {
  it('finds nothing when there is no hand', () => {
    expect(pickHand(result(), 'right')).toBeNull()
  })

  it('picks the wanted hand when it is the second one found', () => {
    const picked = pickHand(result(['Left', 0.2], ['Right', 0.7]), 'right')
    expect(picked.handedness.categoryName).toBe('Right')
    expect(picked.landmarks[0].x).toBe(0.7)
  })

  it('falls back to the first hand when the wanted one is missing', () => {
    expect(pickHand(result(['Left', 0.2]), 'right').handedness.categoryName).toBe('Left')
  })

  it('takes the first hand when no hand is wanted', () => {
    expect(pickHand(result(['Left', 0.2], ['Right', 0.7])).handedness.categoryName).toBe('Left')
  })
})
