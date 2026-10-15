import { describe, expect, it } from 'vitest'
import {
  CAPTURE_MS,
  COUNTDOWN_MS,
  EXPECTED_SAMPLES,
  MIN_MATCHED,
  SETTLE_MS,
  frameFromDetection,
  judgeTake,
  sampleSlot,
  takePhase,
  tallyTake,
} from './takeRules.js'

// Detection times (ms since capture started) for a camera at `fps`, starting
// during the settle period, and the samples the sampler would take.
function sampleTimes(fps, { stallFrom, stallTo } = {}) {
  const taken = []
  let lastSlot = -1
  for (let t = -SETTLE_MS; t < CAPTURE_MS + 200; t += 1000 / fps) {
    if (stallFrom !== undefined && t >= stallFrom && t < stallTo) continue
    const slot = sampleSlot(t, lastSlot)
    if (slot === null) continue
    lastSlot = slot
    taken.push(t)
  }
  return taken
}

function pointsAt(width, height) {
  return Array.from({ length: 21 }, (_, i) => ({
    x: (320 + ((i % 5) - 2) * 15) / width,
    y: (400 - i * 8) / height,
    z: ((i % 3) - 1) * 5 / width,
  }))
}

describe('constants', () => {
  it('expects 30 samples and needs 24 to pass', () => {
    expect(EXPECTED_SAMPLES).toBe(30)
    expect(MIN_MATCHED).toBe(24)
  })
})

describe('takePhase', () => {
  it('moves through countdown, settling, capturing and done', () => {
    expect(takePhase(0)).toBe('countdown')
    expect(takePhase(COUNTDOWN_MS - 1)).toBe('countdown')
    expect(takePhase(COUNTDOWN_MS)).toBe('settling')
    expect(takePhase(COUNTDOWN_MS + SETTLE_MS)).toBe('capturing')
    expect(takePhase(COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS - 1)).toBe('capturing')
    expect(takePhase(COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS)).toBe('done')
  })
})

describe('sampleSlot', () => {
  it('takes 30 samples from a 30 fps camera', () => {
    expect(sampleTimes(30)).toHaveLength(30)
  })

  it('still takes 30 samples from a camera slowed to 20 fps', () => {
    expect(sampleTimes(20)).toHaveLength(30)
  })

  it('takes only the frames that exist from a 7 fps camera', () => {
    expect(sampleTimes(7)).toHaveLength(21)
  })

  it('samples nothing during settling or after capture', () => {
    expect(sampleSlot(-1, -1)).toBeNull()
    expect(sampleSlot(CAPTURE_MS, -1)).toBeNull()
  })

  it('does not bunch samples after a stall', () => {
    const times = sampleTimes(30, { stallFrom: 100, stallTo: 600 })
    const gaps = times.slice(1).map((t, i) => t - times[i])
    expect(Math.min(...gaps)).toBeGreaterThan(60)
  })
})

describe('frameFromDetection', () => {
  const detection = {
    landmarks: pointsAt(640, 480),
    handedness: { categoryName: 'Left', score: 0.93 },
    width: 640,
    height: 480,
    time: 0,
  }

  it('records the detected hand in lowercase, with raw and normalized landmarks', () => {
    const frame = frameFromDetection(detection, 400)
    expect(frame).toMatchObject({ hasHand: true, t: 400, detected: 'left', detectedScore: 0.93, width: 640, height: 480 })
    expect(frame.raw).toHaveLength(63)
    expect(frame.landmarks).toHaveLength(63)
  })

  it('marks a frame without a hand', () => {
    expect(frameFromDetection({ ...detection, landmarks: null, handedness: null }, 100)).toEqual({ hasHand: false, t: 100 })
  })

  it('treats unusable landmarks as no hand', () => {
    const flat = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    expect(frameFromDetection({ ...detection, landmarks: flat }, 100)).toEqual({ hasHand: false, t: 100 })
  })
})

describe('tallyTake', () => {
  it('counts kept, mismatched and no-hand frames separately', () => {
    const frames = [
      { hasHand: true, detected: 'left' },
      { hasHand: true, detected: 'right' },
      { hasHand: false },
      { hasHand: true, detected: 'left' },
    ]
    expect(tallyTake(frames, 'left')).toEqual({ kept: 3, mismatched: 1, droppedNoHand: 1 })
  })
})

describe('judgeTake', () => {
  it('accepts at exactly 24 matched', () => {
    expect(judgeTake({ kept: 30, mismatched: 6, droppedNoHand: 0 })).toEqual({ status: 'accepted', reason: null })
  })

  it('rejects at 23 matched and says why', () => {
    expect(judgeTake({ kept: 30, mismatched: 7, droppedNoHand: 0 })).toEqual({
      status: 'rejected',
      reason: '23 of 30 frames matched: 7 had the other hand detected',
    })
  })

  it('reports no-hand and mismatched frames together', () => {
    expect(judgeTake({ kept: 22, mismatched: 4, droppedNoHand: 8 }).reason).toBe(
      '18 of 30 frames matched: 8 had no hand, 4 had the other hand detected',
    )
  })

  it('says frames never arrived when the camera or hand tracking was too slow', () => {
    expect(judgeTake({ kept: 21, mismatched: 0, droppedNoHand: 0 }).reason).toBe(
      '21 of 30 frames matched: 9 never arrived (the camera or hand tracking was too slow)',
    )
  })
})
