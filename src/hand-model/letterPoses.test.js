import { readFileSync } from 'node:fs'
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

  it('reads a pose that moves (J and Z) with its position and movement', () => {
    const still = {
      pinky: [0, 0, 0],
      ring: [1.2, 2, 0.2],
      middle: [1.3, 2, 0.3],
      index: [1.4, 1.9, 0.3],
      thumb: [1.2, 1.5],
      spread: { index: -0.3, middle: -0.4, ring: -0.4, pinky: 0.1, thumb: -1 },
    }
    const text = JSON.stringify({
      version: 1,
      ...still,
      move: { side: 0.2, up: -0.3, forward: 0 },
      motion: [{ duration: 400, pose: { ...still, move: { side: -0.5, up: 0, forward: 0 } } }],
    })
    const pose = readLetterPose(text)
    expect(pose.move).toEqual({ side: 0.2, up: -0.3, forward: 0 })
    expect(pose.motion).toHaveLength(1)
    expect(pose.motion[0].duration).toBe(400)
    expect(pose.motion[0].pose.move.side).toBe(-0.5)
  })

  it('reads the J and Z files as poses that move', () => {
    for (const letter of ['J', 'Z']) {
      const text = readFileSync(new URL(`../../public/languages/asl/letters/${letter}.json`, import.meta.url), 'utf8')
      expect(readLetterPose(text).motion.length).toBeGreaterThan(0)
    }
  })

  it('throws on pose values that make no valid pose', () => {
    expect(() => readLetterPose('{ "version": 1, "index": [1, 2] }')).toThrow()
    expect(() => readLetterPose('{ "version": 1,')).toThrow()
  })
})
