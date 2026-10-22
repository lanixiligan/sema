import { describe, expect, it } from 'vitest'
import { createHandSmoother, createOneEuroFilter } from './smoothHands.js'

const FRAME_MS = 1000 / 30 // a 30 fps camera

// Feeds a filter one value per frame and returns what it gave back.
const runFilter = (filter, values) => values.map((value, i) => filter(value, i * FRAME_MS))
const spread = (values) => Math.max(...values) - Math.min(...values)

describe('createOneEuroFilter', () => {
  const settings = { minCutoff: 1, beta: 20, dCutoff: 1 }

  it('passes the first value through unchanged', () => {
    expect(createOneEuroFilter(settings)(0.42, 0)).toBe(0.42)
  })

  it('steadies a value that jitters in place', () => {
    // 0.49, 0.51, 0.49…: a point buzzing around a still spot, swinging 0.02.
    const jitter = Array.from({ length: 60 }, (_, i) => (i % 2 ? 0.51 : 0.49))
    const settled = runFilter(createOneEuroFilter(settings), jitter).slice(30)
    expect(spread(settled)).toBeLessThan(0.005)
  })

  it('keeps up with a fast move', () => {
    // Crossing the whole frame in a second, for half a second.
    const move = Array.from({ length: 16 }, (_, i) => 0.2 + (i * FRAME_MS) / 1000)
    const out = runFilter(createOneEuroFilter(settings), move)
    expect(move.at(-1) - out.at(-1)).toBeLessThan(0.03)
  })
})

// A hand's 21 points, all at one spot: enough to tell where a hand is.
const hand = (x, y = 0.5, z = 0) => Array.from({ length: 21 }, () => ({ x, y, z }))

describe('createHandSmoother', () => {
  it('draws a new hand exactly where it was found', () => {
    const smoothHands = createHandSmoother()
    expect(smoothHands([hand(0.3)], 0)).toEqual([hand(0.3)])
  })

  it('smooths every coordinate of every point', () => {
    const smoothHands = createHandSmoother()
    smoothHands([hand(0.5, 0.5, 0)], 0)
    const [points] = smoothHands([hand(0.51, 0.51, 0.01)], FRAME_MS)
    for (const p of points) {
      expect(p.x).toBeGreaterThan(0.5)
      expect(p.x).toBeLessThan(0.51)
      expect(p.y).toBeGreaterThan(0.5)
      expect(p.y).toBeLessThan(0.51)
      expect(p.z).toBeGreaterThan(0)
      expect(p.z).toBeLessThan(0.01)
    }
  })

  it('keeps each hand on its own filters when the two swap places in the list', () => {
    const smoothHands = createHandSmoother()
    smoothHands([hand(0.2), hand(0.7)], 0)
    const [first, second] = smoothHands([hand(0.71), hand(0.21)], FRAME_MS)
    expect(first[0].x).toBeGreaterThanOrEqual(0.7)
    expect(first[0].x).toBeLessThanOrEqual(0.71)
    expect(second[0].x).toBeGreaterThanOrEqual(0.2)
    expect(second[0].x).toBeLessThanOrEqual(0.21)
  })

  it('starts fresh when the hand jumps across the frame', () => {
    // As when the drawn hand switches from one hand to the other.
    const smoothHands = createHandSmoother()
    smoothHands([hand(0.2)], 0)
    expect(smoothHands([hand(0.7)], FRAME_MS)).toEqual([hand(0.7)])
  })

  it('starts fresh when a hand comes back after being lost', () => {
    const smoothHands = createHandSmoother()
    smoothHands([hand(0.3)], 0)
    expect(smoothHands([hand(0.32)], 1000)).toEqual([hand(0.32)])
  })
})
