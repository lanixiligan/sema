import { describe, expect, it } from 'vitest'
import { jPath, jScale } from './jTrace.js'
import { NO_TRACE, pathLength, pointAlong, traceDone, updateTrace } from './zTrace.js'

const ASPECT = 640 / 480
const START = { x: 0.6, y: 0.3 }
const height = (path) => Math.max(...path.map((p) => p.y)) - Math.min(...path.map((p) => p.y))

// Raw points with the pinky tip `length` frame heights straight above the wrist.
function hand(length) {
  const raw = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.8, z: 0 }))
  raw[20] = { x: 0.5, y: 0.8 - length, z: 0 }
  return raw
}

describe('jPath', () => {
  it('starts on the pinky tip and goes down', () => {
    const path = jPath('right', ASPECT, START)
    expect(path[0]).toEqual(START)
    expect(Math.max(...path.map((p) => p.y))).toBeGreaterThan(START.y + 0.25)
  })

  it('hooks toward the frame\'s right for a right hand (the screen\'s left) and the other way for a left', () => {
    const right = jPath('right', ASPECT, START)
    const left = jPath('left', ASPECT, START)
    expect(right.at(-1).x).toBeGreaterThan(START.x)
    expect(left.at(-1).x).toBeLessThan(START.x)
    expect(right.at(-1).x - START.x).toBeCloseTo(START.x - left.at(-1).x)
  })

  it('ends with the hook back up past halfway', () => {
    const path = jPath('right', ASPECT, START)
    const bottom = Math.max(...path.map((p) => p.y))
    expect(path.at(-1).y).toBeLessThan((START.y + bottom) / 2)
  })

  it('grows with its scale', () => {
    expect(height(jPath('right', ASPECT, START, 0.5))).toBeCloseTo(height(jPath('right', ASPECT, START)) / 2)
  })

  it('moves inside the frame when the pinky is near its edge', () => {
    const path = jPath('right', ASPECT, { x: ASPECT - 0.01, y: 0.9 })
    for (const p of path) {
      expect(p.x).toBeLessThanOrEqual(ASPECT)
      expect(p.y).toBeLessThanOrEqual(1)
    }
  })
})

describe('jScale', () => {
  it('makes the J as tall as the hand, wrist to pinky tip', () => {
    expect(height(jPath('right', ASPECT, START, jScale(hand(0.2), ASPECT)))).toBeCloseTo(0.2)
    expect(height(jPath('right', ASPECT, { x: 0.6, y: 0.1 }, jScale(hand(0.4), ASPECT)))).toBeCloseTo(0.4)
  })

  it('stops growing before the J outgrows the frame', () => {
    expect(height(jPath('right', ASPECT, START, jScale(hand(2), ASPECT)))).toBeLessThan(1)
  })
})

describe('tracing the J', () => {
  for (const scale of [0.5, 1, 2]) {
    it(`passes when the pinky follows the curve to its end (scale ${scale})`, () => {
      const path = jPath('right', ASPECT, { x: 0.6, y: 0.05 }, scale)
      let trace = { along: 0, lastOnAt: 0, done: false }
      const step = 0.02 * scale
      let t = 33
      for (let a = step; a <= pathLength(path); a += step, t += 33) {
        trace = updateTrace(trace, pointAlong(path, a), t, path, { restart: false, scale })
      }
      trace = updateTrace(trace, path.at(-1), t, path, { restart: false, scale })
      expect(traceDone(trace)).toBe(true)
    })
  }

  it('isn\'t done halfway down the drop, at any scale', () => {
    for (const scale of [0.5, 1, 2]) {
      const path = jPath('right', ASPECT, { x: 0.6, y: 0.05 }, scale)
      const trace = updateTrace({ along: 0, lastOnAt: 0, done: false }, pointAlong(path, 0.1 * scale), 33, path, { restart: false, scale })
      expect(traceDone(trace)).toBe(false)
    }
  })

  it('ends without starting over after a slip, so the J goes', () => {
    const path = jPath('right', ASPECT, START)
    const trace = updateTrace({ along: 0, lastOnAt: 0, done: false }, null, 900, path, { restart: false })
    expect(trace).toEqual(NO_TRACE)
  })
})
