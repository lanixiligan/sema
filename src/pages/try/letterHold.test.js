import { describe, expect, it } from 'vitest'
import { LETTER_HOLD_MS, NO_HOLD, heldLongEnough, holdSecondsLeft, showsLetter, tryStatus, updateLetterHold } from './letterHold.js'

const sureA = { hand: 'right', whole: true, letter: 'A', sure: true }

describe('showsLetter', () => {
  it('needs a whole hand, sure, making the letter', () => {
    expect(showsLetter([sureA], 'A')).toBe(true)
    expect(showsLetter([sureA], 'B')).toBe(false)
    expect(showsLetter([{ ...sureA, sure: false }], 'A')).toBe(false)
    expect(showsLetter([{ hand: 'right', whole: false }], 'A')).toBe(false)
    expect(showsLetter([], 'A')).toBe(false)
  })

  it('counts either hand', () => {
    expect(showsLetter([{ ...sureA, letter: 'S' }, { ...sureA, hand: 'left' }], 'A')).toBe(true)
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

describe('the 3 seconds', () => {
  it('counts down whole seconds and passes at LETTER_HOLD_MS', () => {
    const hold = { start: 1000, lastAt: 1000 }
    expect(holdSecondsLeft(NO_HOLD, 5000)).toBe(null)
    expect(holdSecondsLeft(hold, 1000)).toBe(3)
    expect(holdSecondsLeft(hold, 2500)).toBe(2)
    expect(heldLongEnough(hold, 1000 + LETTER_HOLD_MS - 1)).toBe(false)
    expect(heldLongEnough(hold, 1000 + LETTER_HOLD_MS)).toBe(true)
    expect(heldLongEnough(NO_HOLD, 99999)).toBe(false)
  })
})

describe('tryStatus', () => {
  const ready = {
    cameraStatus: 'live',
    cameraError: null,
    trackingError: false,
    ready: true,
    passed: false,
    secondsLeft: null,
    guesses: [],
    target: 'A',
  }

  it('reports problems first, in amber', () => {
    expect(tryStatus({ ...ready, cameraError: 'x', passed: true })).toEqual({ status: 'Camera problem', tone: 'warn' })
    expect(tryStatus({ ...ready, trackingError: true })).toEqual({ status: 'Tracking problem', tone: 'warn' })
  })

  it('says when the letter was held', () => {
    expect(tryStatus({ ...ready, passed: true, cameraStatus: 'idle' })).toEqual({ status: "That's A!", tone: 'ok' })
  })

  it('waits for the camera and the models', () => {
    expect(tryStatus({ ...ready, cameraStatus: 'idle' }).status).toBe('Camera off')
    expect(tryStatus({ ...ready, cameraStatus: 'starting' }).status).toBe('Starting…')
    expect(tryStatus({ ...ready, ready: false }).status).toBe('Getting ready…')
  })

  it('counts down while holding', () => {
    expect(tryStatus({ ...ready, secondsLeft: 2 })).toEqual({ status: 'Hold it… 2', tone: 'ok' })
  })

  it('says what to do otherwise', () => {
    expect(tryStatus(ready).status).toBe('Make A')
    expect(tryStatus({ ...ready, guesses: [{ whole: false }] }).status).toBe('Show your whole hand')
    expect(tryStatus({ ...ready, guesses: [{ ...sureA, letter: 'S' }] }).status).toBe('Make A')
  })
})
