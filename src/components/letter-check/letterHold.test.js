import { describe, expect, it } from 'vitest'
import {
  LETTER_HOLD_MS,
  NO_HOLD,
  heldLongEnough,
  holdSecondsLeft,
  modelReading,
  modelVerdict,
  showsLetter,
  practiceStatus,
  updateLetterHold,
} from './letterHold.js'

const sureA = { hand: 'right', whole: true, letter: 'A', sure: true }

describe('showsLetter', () => {
  it('needs a whole hand that makes the letter', () => {
    expect(showsLetter([{ ...sureA, makes: true }])).toBe(true)
    expect(showsLetter([{ ...sureA, makes: false }])).toBe(false)
    expect(showsLetter([{ hand: 'right', whole: false }])).toBe(false)
    expect(showsLetter([])).toBe(false)
  })

  it('goes by the conditions, not the model', () => {
    expect(showsLetter([{ ...sureA, letter: 'S', sure: false, makes: true }])).toBe(true)
  })
})

describe('updateLetterHold', () => {
  it('starts on the first matching frame and keeps its start', () => {
    const first = updateLetterHold(NO_HOLD, true, 1000)
    expect(first).toEqual({ start: 1000, lastAt: 1000 })
    expect(updateLetterHold(first, true, 1100)).toEqual({ start: 1000, lastAt: 1100 })
  })

  it('survives a short gap but not a long one', () => {
    const hold = { start: 1000, lastAt: 2000 }
    expect(updateLetterHold(hold, false, 2200)).toBe(hold)
    expect(updateLetterHold(hold, true, 2200)).toEqual({ start: 1000, lastAt: 2200 })
    expect(updateLetterHold(hold, false, 2400)).toBe(NO_HOLD)
    expect(updateLetterHold(hold, true, 2400)).toEqual({ start: 2400, lastAt: 2400 })
  })
})

describe('the hold', () => {
  it('counts down whole seconds and passes at LETTER_HOLD_MS', () => {
    const hold = { start: 1000, lastAt: 1000 }
    expect(holdSecondsLeft(NO_HOLD, 5000)).toBe(null)
    expect(holdSecondsLeft(hold, 1000)).toBe(2)
    expect(holdSecondsLeft(hold, 1600)).toBe(1)
    expect(holdSecondsLeft(hold, 2500)).toBe(0)
    expect(heldLongEnough(hold, 1000 + LETTER_HOLD_MS - 1)).toBe(false)
    expect(heldLongEnough(hold, 1000 + LETTER_HOLD_MS)).toBe(true)
    expect(heldLongEnough(NO_HOLD, 99999)).toBe(false)
  })
})

describe('practiceStatus', () => {
  const ready = {
    cameraStatus: 'live',
    cameraError: null,
    trackingError: false,
    ready: true,
    passed: false,
    secondsLeft: null,
    guesses: [],
    target: 'A',
    hand: 'right',
  }

  it('reports problems first, in amber', () => {
    expect(practiceStatus({ ...ready, cameraError: 'x', passed: true })).toEqual({ status: 'Camera problem', tone: 'warn' })
    expect(practiceStatus({ ...ready, trackingError: true })).toEqual({ status: 'Tracking problem', tone: 'warn' })
  })

  it('says when the letter was held', () => {
    expect(practiceStatus({ ...ready, passed: true, cameraStatus: 'idle' })).toEqual({ status: "That's A!", tone: 'ok' })
  })

  it('waits for the camera and the models', () => {
    expect(practiceStatus({ ...ready, cameraStatus: 'idle' }).status).toBe('Camera off')
    expect(practiceStatus({ ...ready, cameraStatus: 'starting' }).status).toBe('Starting…')
    expect(practiceStatus({ ...ready, ready: false }).status).toBe('Getting ready…')
  })

  it('counts down while holding', () => {
    expect(practiceStatus({ ...ready, secondsLeft: 2 })).toEqual({ status: "That's it, hold… 2", tone: 'ok' })
  })

  it('says what to do otherwise', () => {
    expect(practiceStatus(ready).status).toBe('Show A with your right hand')
    expect(practiceStatus({ ...ready, guesses: [{ whole: false }] }).status).toBe('Show your whole hand, wrist too')
    expect(practiceStatus({ ...ready, guesses: [{ ...sureA, letter: 'S' }] }).status).toBe('Show A with your right hand')
  })

  it('names the signing hand', () => {
    expect(practiceStatus({ ...ready, hand: 'left' }).status).toBe('Show A with your left hand')
  })

  it('guides a traced letter (Z): point 1, then the line to point 2', () => {
    const z = { ...ready, target: 'Z', traced: true }
    expect(practiceStatus(z)).toEqual({ status: 'Put your right index finger on point 1', tone: '' })
    expect(practiceStatus({ ...z, tracing: true })).toEqual({ status: 'Follow the line to point 2…', tone: 'ok' })
    expect(practiceStatus({ ...z, tracing: true, passed: true })).toEqual({ status: "That's Z!", tone: 'ok' })
  })

  it('guides J: make I, hold it, then the line to point 2', () => {
    const j = { ...ready, target: 'J', traced: true }
    expect(practiceStatus(j)).toEqual({ status: 'Make I with your right hand', tone: '' })
    expect(practiceStatus({ ...j, holdingI: true })).toEqual({ status: 'Hold the I…', tone: 'ok' })
    expect(practiceStatus({ ...j, tracing: true })).toEqual({ status: 'Follow the line to point 2…', tone: 'ok' })
    expect(practiceStatus({ ...j, tracing: true, passed: true })).toEqual({ status: "That's J!", tone: 'ok' })
  })
})

describe('modelReading', () => {
  it("is the model's letter when it's sure, '?' when not", () => {
    expect(modelReading([sureA])).toBe('A')
    expect(modelReading([{ ...sureA, sure: false }])).toBe('?')
  })

  it('reads nothing without a whole hand', () => {
    expect(modelReading([{ hand: 'right', whole: false }])).toBe(null)
    expect(modelReading([])).toBe(null)
  })
})

describe('modelVerdict', () => {
  it("is the hold's most frequent reading, so a few odd frames don't change it", () => {
    expect(modelVerdict({ B: 40, U: 3, '?': 2 })).toBe('B')
    expect(modelVerdict({ B: 5, U: 30 })).toBe('U')
    expect(modelVerdict({ '?': 20, B: 6 })).toBe('?')
  })

  it('is null when nothing was read', () => {
    expect(modelVerdict({})).toBe(null)
  })
})
