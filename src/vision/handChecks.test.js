import { describe, expect, it } from 'vitest'
import { EDGE_MARGIN, checkHand } from './handChecks.js'

// 21 points spread over the middle of the frame.
const centred = Array.from({ length: 21 }, (_, i) => ({ x: 0.3 + i * 0.01, y: 0.3 + i * 0.01, z: 0 }))
const detection = (label, landmarks = centred) => ({ landmarks, handedness: { categoryName: label, score: 0.97 } })
const moved = (index, point) => centred.map((p, i) => (i === index ? { ...p, ...point } : p))

describe('checkHand', () => {
  it('finds no hand when there is none', () => {
    expect(checkHand({ landmarks: null, handedness: null }, 'right')).toEqual({ hand: 'none', wholeHand: false })
  })

  it('matches the signing hand', () => {
    expect(checkHand(detection('Right'), 'right')).toEqual({ hand: 'match', wholeHand: true })
    expect(checkHand(detection('Left'), 'left')).toEqual({ hand: 'match', wholeHand: true })
  })

  it('notices the other hand', () => {
    expect(checkHand(detection('Left'), 'right').hand).toBe('other')
  })

  it('needs the wrist inside the frame', () => {
    expect(checkHand(detection('Right', moved(0, { y: 1 - EDGE_MARGIN / 2 })), 'right').wholeHand).toBe(false)
  })

  it('needs every fingertip inside the frame', () => {
    expect(checkHand(detection('Right', moved(8, { x: -0.01 })), 'right').wholeHand).toBe(false)
  })
})
