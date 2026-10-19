import { describe, expect, it } from 'vitest'
import { NORMALIZATION_VERSION, normalizeHand } from './normalizeHand.js'

// A made-up but hand-like set of 21 points in pixels (x, y, z), wrist first.
function pixelHand() {
  return Array.from({ length: 21 }, (_, i) => ({
    x: 320 + ((i % 5) - 2) * 15,
    y: 400 - i * 8,
    z: ((i % 3) - 1) * 5,
  }))
}

// MediaPipe-style landmarks: x and y as fractions of the frame, z on x's scale.
function toRaw(points, width, height) {
  return points.map((p) => ({ x: p.x / width, y: p.y / height, z: p.z / width }))
}

function expectClose(actual, expected) {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 9))
}

const at640 = { width: 640, height: 480 }

describe('normalizeHand', () => {
  it('returns 63 numbers', () => {
    expect(normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' })).toHaveLength(63)
  })

  it('puts the wrist at the origin', () => {
    const out = normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' })
    expectClose(out.slice(0, 3), [0, 0, 0])
  })

  it('makes the palm length (wrist to point 9) equal to 1', () => {
    const out = normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' })
    const [x, y, z] = out.slice(27, 30)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9)
  })

  it('gives the same output when the hand moves in the frame', () => {
    const moved = pixelHand().map((p) => ({ x: p.x + 50, y: p.y - 30, z: p.z }))
    expectClose(
      normalizeHand(toRaw(moved, 640, 480), { ...at640, hand: 'right' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('gives the same output when the hand looks bigger', () => {
    const wrist = pixelHand()[0]
    const bigger = pixelHand().map((p) => ({
      x: wrist.x + (p.x - wrist.x) * 1.7,
      y: wrist.y + (p.y - wrist.y) * 1.7,
      z: p.z * 1.7,
    }))
    expectClose(
      normalizeHand(toRaw(bigger, 640, 480), { ...at640, hand: 'right' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('gives the same output for the same hand at 640×480 and 1280×720', () => {
    // The same hand, twice as many pixels across, in a 16:9 frame.
    const hd = pixelHand().map((p) => ({ x: p.x * 2, y: p.y * 2 - 150, z: p.z * 2 }))
    expectClose(
      normalizeHand(toRaw(hd, 1280, 720), { width: 1280, height: 720, hand: 'right' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('makes a left hand match the mirrored right hand', () => {
    const mirrored = pixelHand().map((p) => ({ x: 640 - p.x, y: p.y, z: p.z }))
    expectClose(
      normalizeHand(toRaw(mirrored, 640, 480), { ...at640, hand: 'left' }),
      normalizeHand(toRaw(pixelHand(), 640, 480), { ...at640, hand: 'right' }),
    )
  })

  it('flipping twice gives the original: left output negated in x equals right output', () => {
    const raw = toRaw(pixelHand(), 640, 480)
    const left = normalizeHand(raw, { ...at640, hand: 'left' })
    const right = normalizeHand(raw, { ...at640, hand: 'right' })
    const unflipped = left.map((v, i) => (i % 3 === 0 ? -v : v))
    expectClose(unflipped, right)
  })

  it('returns null when the palm length is about zero', () => {
    const flat = pixelHand().map(() => ({ x: 320, y: 400, z: 0 }))
    expect(normalizeHand(toRaw(flat, 640, 480), { ...at640, hand: 'right' })).toBeNull()
  })

  it('exports normalization version 1', () => {
    expect(NORMALIZATION_VERSION).toBe(1)
  })
})
