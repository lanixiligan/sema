import { describe, expect, it } from 'vitest'
import {
  CHECK_HOLD_MS,
  EDGE_MARGIN,
  HAND_HOLD_MS,
  NO_HOLD,
  holdSecondsLeft,
  isWholeHand,
  seeHand,
  steadySeen,
  updateHold,
} from './handChecks.js'

// 21 points spread over the middle of the frame.
const centred = Array.from({ length: 21 }, (_, i) => ({ x: 0.3 + i * 0.01, y: 0.3 + i * 0.01, z: 0 }))
const hand = (label, landmarks = centred) => ({ landmarks, handedness: { categoryName: label, score: 0.97 } })
const moved = (index, point) => centred.map((p, i) => (i === index ? { ...p, ...point } : p))

describe('seeHand', () => {
  it('sees no hand when there is none', () => {
    expect(seeHand([])).toBe('none')
  })

  it('sees a whole hand, left or right', () => {
    expect(seeHand([hand('Right')])).toBe('whole')
    expect(seeHand([hand('Left')])).toBe('whole')
  })

  it('needs the wrist inside the frame', () => {
    expect(seeHand([hand('Left', moved(0, { y: 1 - EDGE_MARGIN / 2 }))])).toBe('part')
  })

  it('needs every fingertip inside the frame', () => {
    expect(seeHand([hand('Right', moved(8, { x: -0.01 }))])).toBe('part')
  })

  it('counts the best hand when two are up', () => {
    const cutOff = hand('Right', moved(8, { x: -0.01 }))
    expect(seeHand([cutOff, hand('Left')])).toBe('whole')
    expect(seeHand([hand('Left'), cutOff])).toBe('whole')
  })
})

describe('steadySeen', () => {
  it('keeps the hand missing for a moment', () => {
    expect(steadySeen('part', 'none', 1000, 1000 + HAND_HOLD_MS - 1)).toBe('part')
  })

  it('lets the hand go once it has been missing long enough', () => {
    expect(steadySeen('part', 'none', 1000, 1000 + HAND_HOLD_MS)).toBe('none')
  })

  it('always shows a hand that is in view', () => {
    expect(steadySeen('none', 'whole', 0, 5000)).toBe('whole')
  })
})

describe('updateHold', () => {
  it('starts when the hand is up and whole', () => {
    expect(updateHold(NO_HOLD, 'whole', 1000)).toEqual({ start: 1000, lastAt: 1000 })
  })

  it('keeps its start while the hand stays up', () => {
    expect(updateHold({ start: 1000, lastAt: 2000 }, 'whole', 2030)).toEqual({ start: 1000, lastAt: 2030 })
  })

  it('does not start with a hand only in part, or none', () => {
    expect(updateHold(NO_HOLD, 'part', 1000)).toEqual(NO_HOLD)
    expect(updateHold(NO_HOLD, 'none', 1000)).toEqual(NO_HOLD)
  })

  it('survives a short gap', () => {
    const hold = { start: 1000, lastAt: 2000 }
    expect(updateHold(hold, 'part', 2000 + HAND_HOLD_MS - 1)).toBe(hold)
  })

  it('ends after a longer gap', () => {
    expect(updateHold({ start: 1000, lastAt: 2000 }, 'part', 2000 + HAND_HOLD_MS)).toEqual(NO_HOLD)
  })

  it('starts again when the hand comes back after a longer gap', () => {
    // Up from 1000 to 2000, then no frames (camera off) until 9000.
    expect(updateHold({ start: 1000, lastAt: 2000 }, 'whole', 9000)).toEqual({ start: 9000, lastAt: 9000 })
  })
})

describe('holdSecondsLeft', () => {
  it('is null with no hold', () => {
    expect(holdSecondsLeft(NO_HOLD, 5000)).toBe(null)
  })

  it('counts down whole seconds', () => {
    const hold = { start: 1000, lastAt: 1000 }
    expect(holdSecondsLeft(hold, 1000)).toBe(3)
    expect(holdSecondsLeft(hold, 2001)).toBe(2)
    expect(holdSecondsLeft(hold, 3500)).toBe(1)
    expect(holdSecondsLeft(hold, 1000 + CHECK_HOLD_MS)).toBe(0)
  })
})

describe('isWholeHand', () => {
  it('is true when every point is inside the edges', () => {
    expect(isWholeHand(centred)).toBe(true)
  })

  it('is false when the wrist is too close to the bottom', () => {
    expect(isWholeHand(moved(0, { y: 1 - EDGE_MARGIN / 2 }))).toBe(false)
  })

  it('is false without points', () => {
    expect(isWholeHand(null)).toBe(false)
  })
})
