import { describe, expect, it } from 'vitest'
import { readLetterPose } from './letterPoses.js'

describe('readLetterPose', () => {
  it('reads an empty file, {} and a placeholder as no pose (unavailable)', () => {
    expect(readLetterPose('')).toBeNull()
    expect(readLetterPose('  \n')).toBeNull()
    expect(readLetterPose('{}')).toBeNull()
    expect(readLetterPose('{ "version": 1 }')).toBeNull()
    expect(readLetterPose('{ "version": 1, "available": false }')).toBeNull()
  })

  it('reads a pose from Eidos', () => {
    // Eidos's example pose (docs/POSE_FORMAT.md)
    const text = JSON.stringify({
      version: 1,
      pinky: [1.31, 1.7, 0.25],
      ring: [1.37, 1.7, 0.2],
      middle: [1.41, 1.7, 0.18],
      index: [1.39, 1.7, 0.67],
      thumb: [0.79, 0.69],
      spread: { index: -0.15, middle: -0.03, ring: -0.1, pinky: 0.13, thumb: -0.22 },
    })
    expect(readLetterPose(text).index).toEqual([1.39, 1.7, 0.67])
  })

  it('throws on pose values that make no valid pose', () => {
    expect(() => readLetterPose('{ "version": 1, "index": [1, 2] }')).toThrow()
    expect(() => readLetterPose('{ "version": 1,')).toThrow()
  })
})
