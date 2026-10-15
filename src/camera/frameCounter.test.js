import { describe, expect, it } from 'vitest'
import { fpsBetween } from './frameCounter.js'

describe('fpsBetween', () => {
  it('divides frames shown by the time between two readings', () => {
    expect(fpsBetween({ time: 1000, frames: 100 }, { time: 4000, frames: 190 })).toBeCloseTo(30, 9)
  })

  it('returns null when a reading is missing or time did not move', () => {
    expect(fpsBetween(null, { time: 4000, frames: 190 })).toBeNull()
    expect(fpsBetween({ time: 1000, frames: 100 }, null)).toBeNull()
    expect(fpsBetween({ time: 1000, frames: 100 }, { time: 1000, frames: 100 })).toBeNull()
  })
})
