import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FINGERS, WRIST } from './handPoints.js'
import { measureHand } from './handMeasures.js'

// A flat right hand drawn by hand, in normalizeHand's units (wrist at 0, palm
// length 1, y growing downwards): the four fingers straight up, the knuckles
// in a row from the index (x = -0.3) to the pinky (x = 0.3), the thumb out to
// the index side. `change` moves points: { 8: [x, y, z] }.
function flatHand(change = {}) {
  const points = Array.from({ length: 21 }, () => [0, 0, 0])
  const knuckleX = { index: -0.3, middle: -0.1, ring: 0.1, pinky: 0.3 }
  for (const [finger, x] of Object.entries(knuckleX)) {
    FINGERS[finger].forEach((point, i) => (points[point] = [x, -1 - 0.3 * i, 0]))
  }
  FINGERS.thumb.forEach((point, i) => (points[point] = [-0.4 - 0.2 * i, -0.3 - 0.1 * i, 0]))
  points[WRIST] = [0, 0, 0]
  for (const [point, position] of Object.entries(change)) points[point] = position
  return points.flat()
}

const { hands } = JSON.parse(readFileSync(new URL('./fixtures/letter-hands.json', import.meta.url), 'utf8'))

describe('measureHand: finger bends', () => {
  it('measures no bend along a straight finger', () => {
    const { middle } = measureHand(flatHand())
    expect(middle.middle).toBeCloseTo(0)
    expect(middle.top).toBeCloseTo(0)
  })

  it('measures 90° where a finger turns a right angle at its middle joint', () => {
    // The index goes up to its middle joint, then straight towards the camera.
    const [, , next, tip] = FINGERS.index
    const hand = measureHand(flatHand({ [next]: [-0.3, -1.3, -0.3], [tip]: [-0.3, -1.3, -0.6] }))
    expect(hand.index.middle).toBeCloseTo(90)
    expect(hand.index.top).toBeCloseTo(0)
  })

  it('adds a finger’s three bends up as its total', () => {
    const { index } = measureHand(hands[0].landmarks)
    expect(index.total).toBeCloseTo(index.knuckle + index.middle + index.top)
  })
})

describe('measureHand: where the thumb is', () => {
  const thumbTip = FINGERS.thumb[3]

  it('puts a thumb tip on the index knuckle at 0 across the palm, and 0 away from it', () => {
    const hand = measureHand(flatHand({ [thumbTip]: [-0.3, -1, 0] }))
    expect(hand.across).toBeCloseTo(0)
    expect(hand.thumbAway).toBeCloseTo(0)
  })

  it('puts a thumb tip on the pinky knuckle at 1 across the palm', () => {
    expect(measureHand(flatHand({ [thumbTip]: [0.3, -1, 0] })).across).toBeCloseTo(1)
  })

  it('puts a thumb out on the index side below 0', () => {
    expect(measureHand(flatHand()).across).toBeLessThan(0)
  })

  it('measures distances in palm lengths', () => {
    // The index tip is 0.9 above its knuckle, where the thumb tip is put.
    expect(measureHand(flatHand({ [thumbTip]: [-0.3, -1, 0] })).thumbToIndexTip).toBeCloseTo(0.9)
  })
})

describe('measureHand: the fingers together', () => {
  const [, , , indexTip] = FINGERS.index

  it('measures no spread between parallel index and middle fingers', () => {
    expect(measureHand(flatHand()).spreadIndexMiddle).toBeCloseTo(0)
  })

  it('measures the angle between spread index and middle fingers', () => {
    // The index tip moved sideways by its own length: 45° from the middle finger.
    expect(measureHand(flatHand({ [indexTip]: [-1.2, -1.9, 0] })).spreadIndexMiddle).toBeCloseTo(45)
  })

  it('is positive for crossed fingers: the index tip past the middle tip, towards the pinky', () => {
    expect(measureHand(flatHand({ [indexTip]: [0.05, -1.9, 0] })).crossed).toBeGreaterThan(0)
    expect(measureHand(flatHand()).crossed).toBeLessThan(0)
  })

  it('says which way the fingers point on screen', () => {
    const hand = measureHand(flatHand())
    expect(hand.indexDirection.x).toBeCloseTo(0)
    expect(hand.indexDirection.y).toBeCloseTo(-1) // up: y grows downwards
    expect(hand.handDirection.y).toBeLessThan(-0.9)
  })
})

describe('measureHand: left and right hands', () => {
  // A hand flipped the wrong way (MediaPipe naming the other hand) is the same
  // hand mirrored. Every measure the rules read must come out the same, or a
  // left hand would be judged differently from a right one.
  it.each(hands)('measures a mirrored $letter hand the same', ({ landmarks }) => {
    const mirrored = landmarks.map((value, i) => (i % 3 === 0 ? -value : value))
    const a = measureHand(landmarks)
    const b = measureHand(mirrored)
    for (const finger of ['index', 'middle', 'ring', 'pinky']) expect(b[finger].total).toBeCloseTo(a[finger].total, 6)
    for (const name of ['thumbBend', 'across', 'thumbAway', 'thumbIndexAngle', 'spreadIndexMiddle', 'crossed', 'thumbInFront']) {
      expect(b[name]).toBeCloseTo(a[name], 6)
    }
    expect(b.indexDirection.y).toBeCloseTo(a.indexDirection.y, 6)
    expect(b.indexDirection.x).toBeCloseTo(-a.indexDirection.x, 6)
  })
})
