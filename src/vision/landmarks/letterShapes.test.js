import { describe, expect, it } from 'vitest'
import { shapeFix } from './letterShapes.js'

// A normalized hand (wrist at 0, y up is negative) with only the points the
// rules read placed; the rest stay at the wrist.
function handWith(points) {
  const landmarks = new Array(63).fill(0)
  for (const [i, [x, y]] of Object.entries(points)) {
    landmarks[3 * i] = x
    landmarks[3 * i + 1] = y
  }
  return landmarks
}

const knuckles = { 5: [0.3, -1], 13: [-0.1, -0.95], 17: [-0.3, -0.9] }
const together = { 8: [0.3, -1.8], 20: [-0.25, -1.6] }
const spread = { 8: [0.6, -1.8], 20: [-0.7, -1.4] }
const thumbIn = { 4: [0, -0.8] }
const thumbOut = { 4: [0.9, -0.5] }

describe('shapeFix', () => {
  it('passes a B: fingers together, thumb across the palm', () => {
    expect(shapeFix('B', handWith({ ...knuckles, ...together, ...thumbIn }))).toBe(null)
  })

  it('turns away an open hand, fingers first', () => {
    expect(shapeFix('B', handWith({ ...knuckles, ...spread, ...thumbOut }))).toBe('Keep your fingers together.')
  })

  it('asks for the thumb when only the thumb is out', () => {
    expect(shapeFix('B', handWith({ ...knuckles, ...together, ...thumbOut }))).toBe('Fold your thumb across your palm.')
  })

  it('asks for the fingers when only they are spread (a 4)', () => {
    expect(shapeFix('B', handWith({ ...knuckles, ...spread, ...thumbIn }))).toBe('Keep your fingers together.')
  })

  it('leaves letters without rules to the model', () => {
    expect(shapeFix('C', handWith({ ...knuckles, ...spread, ...thumbOut }))).toBe(null)
  })
})
