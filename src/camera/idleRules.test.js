import { describe, expect, it } from 'vitest'
import { IDLE_NOTICE_MS, IDLE_OFF_MS, idleSecondsLeft, shouldTurnOff } from './idleRules.js'

describe('idleSecondsLeft', () => {
  it('shows nothing during a short pause', () => {
    expect(idleSecondsLeft(0)).toBe(null)
    expect(idleSecondsLeft(IDLE_NOTICE_MS - 1)).toBe(null)
  })

  it('counts down once the notice is due', () => {
    expect(idleSecondsLeft(IDLE_NOTICE_MS)).toBe(50)
    expect(idleSecondsLeft(IDLE_OFF_MS - 1500)).toBe(2)
  })

  it('never goes below zero', () => {
    expect(idleSecondsLeft(IDLE_OFF_MS + 5000)).toBe(0)
  })
})

describe('shouldTurnOff', () => {
  it('turns off after a minute without a hand, not before', () => {
    expect(shouldTurnOff(IDLE_OFF_MS - 1)).toBe(false)
    expect(shouldTurnOff(IDLE_OFF_MS)).toBe(true)
  })
})
