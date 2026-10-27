import { describe, expect, it } from 'vitest'
import { classify, readModel, vote } from './knnModel.js'

// A hand whose 63 numbers are all `value`.
const hand = (value) => Array(63).fill(value)

// Two letters: A's hands near 0, B's near 1.
function model({ k = 1, threshold = 1 } = {}) {
  return readModel({
    kind: 'knn',
    normalization: 1,
    letters: ['A', 'B'],
    k,
    threshold,
    labels: [0, 0, 1, 1],
    shapes: [...hand(0), ...hand(0.1), ...hand(1), ...hand(1.1)],
  })
}

describe('readModel', () => {
  it('refuses other files and other normalizations', () => {
    expect(() => readModel({ kind: 'extracted' })).toThrow()
    expect(() => readModel({ kind: 'knn', normalization: 2 })).toThrow(/normalization 2/)
  })
})

describe('classify', () => {
  it('takes the letter of the nearest training hand', () => {
    expect(classify(model(), hand(0.05)).letter).toBe('A')
    expect(classify(model(), hand(0.95)).letter).toBe('B')
  })

  it('measures the average distance to the k neighbours', () => {
    // From all-0.2 to all-0.1 and all-0: sqrt(63) × 0.1 and × 0.2.
    const result = classify(model({ k: 2 }), hand(0.2))
    expect(result.distance).toBeCloseTo((Math.sqrt(63) * 0.1 + Math.sqrt(63) * 0.2) / 2)
  })

  it('is not sure when the neighbours are further than the threshold', () => {
    expect(classify(model({ threshold: 1 }), hand(0)).sure).toBe(true)
    expect(classify(model({ threshold: 1 }), hand(-1)).sure).toBe(false)
  })

  it('lists the closest letters, nearest first', () => {
    const { closest } = classify(model(), hand(0.9))
    expect(closest.map((c) => c.letter)).toEqual(['B', 'A'])
    expect(closest[0].distance).toBeCloseTo(Math.sqrt(63) * 0.1)
  })
})

describe('vote', () => {
  it('takes the most common label', () => {
    expect(vote([1, 0, 0])).toBe(0)
  })

  it('gives a tie to the nearest neighbour', () => {
    expect(vote([1, 0, 0, 1])).toBe(1)
  })
})
