import { describe, expect, it } from 'vitest'
import {
  BOTH_HANDS_HOLD_MS,
  EDGE_MARGIN,
  HAND_HOLD_MS,
  NO_HOLD,
  holdSecondsLeft,
  isWholeHand,
  seeHands,
  steadySeen,
  updateHold,
} from './handChecks.js'

// 21 points spread over the middle of the frame.
const centred = Array.from({ length: 21 }, (_, i) => ({ x: 0.3 + i * 0.01, y: 0.3 + i * 0.01, z: 0 }))
const hand = (label, landmarks = centred) => ({ landmarks, handedness: { categoryName: label, score: 0.97 } })
const moved = (index, point) => centred.map((p, i) => (i === index ? { ...p, ...point } : p))

// The same hand shape moved sideways, so its wrist sits at x.
const at = (x, landmarks = centred) => landmarks.map((p) => ({ ...p, x: p.x - centred[0].x + x }))

describe('seeHands', () => {
  it('sees no hand when there is none', () => {
    expect(seeHands([])).toEqual({ left: 'none', right: 'none' })
  })

  it('goes by the label when one hand is up', () => {
    expect(seeHands([hand('Right')])).toEqual({ left: 'none', right: 'whole' })
    expect(seeHands([hand('Left')])).toEqual({ left: 'whole', right: 'none' })
  })

  it('goes by position with two hands: the right hand is on the frame\'s left', () => {
    const right = hand('Right', at(0.2))
    const left = hand('Left', at(0.6))
    expect(seeHands([right, left])).toEqual({ left: 'whole', right: 'whole' })
    expect(seeHands([left, right])).toEqual({ left: 'whole', right: 'whole' })
  })

  it('ignores flipped labels with two hands', () => {
    const rightCutOff = hand('Left', moved(0, { y: 1 }).map((p) => ({ ...p, x: p.x - 0.1 })))
    const left = hand('Left', at(0.6))
    expect(seeHands([left, rightCutOff])).toEqual({ left: 'whole', right: 'part' })
  })

  it('needs the wrist inside the frame', () => {
    expect(seeHands([hand('Left', moved(0, { y: 1 - EDGE_MARGIN / 2 }))]).left).toBe('part')
  })

  it('needs every fingertip inside the frame', () => {
    expect(seeHands([hand('Right', moved(8, { x: -0.01 }))]).right).toBe('part')
  })
})

describe('steadySeen', () => {
  const shown = { left: 'part', right: 'whole' }
  const gone = { left: 'none', right: 'none' }

  it('keeps a hand missing for a moment', () => {
    expect(steadySeen(shown, gone, { left: 1000, right: 1000 }, 1000 + HAND_HOLD_MS - 1)).toEqual(shown)
  })

  it('lets a hand go once it has been missing long enough', () => {
    expect(steadySeen(shown, gone, { left: 1000, right: 1000 }, 1000 + HAND_HOLD_MS)).toEqual(gone)
  })

  it('always shows a hand that is in view', () => {
    expect(steadySeen(shown, { left: 'whole', right: 'part' }, { left: 0, right: 0 }, 5000)).toEqual({ left: 'whole', right: 'part' })
  })
})

describe('updateHold', () => {
  const both = { left: 'whole', right: 'whole' }
  const oneHand = { left: 'none', right: 'whole' }

  it('starts when both hands are up and whole', () => {
    expect(updateHold(NO_HOLD, both, 1000)).toEqual({ start: 1000, lastAt: 1000 })
  })

  it('keeps its start while both stay up', () => {
    expect(updateHold({ start: 1000, lastAt: 2000 }, both, 2030)).toEqual({ start: 1000, lastAt: 2030 })
  })

  it('does not start with one hand, or a hand only in part', () => {
    expect(updateHold(NO_HOLD, oneHand, 1000)).toEqual(NO_HOLD)
    expect(updateHold(NO_HOLD, { left: 'part', right: 'whole' }, 1000)).toEqual(NO_HOLD)
  })

  it('survives a short gap', () => {
    const hold = { start: 1000, lastAt: 2000 }
    expect(updateHold(hold, oneHand, 2000 + HAND_HOLD_MS - 1)).toBe(hold)
  })

  it('ends after a longer gap', () => {
    expect(updateHold({ start: 1000, lastAt: 2000 }, oneHand, 2000 + HAND_HOLD_MS)).toEqual(NO_HOLD)
  })

  it('starts again when both hands come back after a longer gap', () => {
    // Both up from 1000 to 2000, then no frames (camera off) until 9000.
    expect(updateHold({ start: 1000, lastAt: 2000 }, both, 9000)).toEqual({ start: 9000, lastAt: 9000 })
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
    expect(holdSecondsLeft(hold, 1000 + BOTH_HANDS_HOLD_MS)).toBe(0)
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
