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

  describe('Z', () => {
    const pointing = { 6: [0.3, -1.3], 8: [0.3, -1.9] }
    const indexCurled = { 6: [0.3, -1.3], 8: [0.3, -1.0] }
    const curled = { 10: [0.05, -1.2], 12: [0.05, -0.8], 14: [-0.1, -1.15], 16: [-0.1, -0.8], 18: [-0.3, -1.05], 20: [-0.25, -0.75] }
    const straight = { 10: [0.05, -1.4], 12: [0.05, -1.9], 14: [-0.1, -1.35], 16: [-0.1, -1.8], 18: [-0.3, -1.25], 20: [-0.35, -1.6] }

    it('passes the index pointing, the others curled, the thumb across', () => {
      expect(shapeFix('Z', handWith({ ...knuckles, ...pointing, ...curled, ...thumbIn }))).toBe(null)
    })

    it('asks for the index finger when it is curled too (a fist)', () => {
      expect(shapeFix('Z', handWith({ ...knuckles, ...indexCurled, ...curled, ...thumbIn }))).toBe('Point your index finger.')
    })

    it('asks to curl the other fingers when they are up', () => {
      expect(shapeFix('Z', handWith({ ...knuckles, ...pointing, ...straight, ...thumbIn }))).toBe('Curl your other fingers into your palm.')
    })

    it('asks for the thumb when it sticks out', () => {
      expect(shapeFix('Z', handWith({ ...knuckles, ...pointing, ...curled, ...thumbOut }))).toBe('Fold your thumb over your curled fingers.')
    })
  })

  it('leaves letters without rules to the model', () => {
    expect(shapeFix('C', handWith({ ...knuckles, ...spread, ...thumbOut }))).toBe(null)
  })
})
