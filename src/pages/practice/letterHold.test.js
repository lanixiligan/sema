import { describe, expect, it } from 'vitest'
import { LETTER_HOLD_MS, NO_HOLD, heldLongEnough, holdSecondsLeft, showsLetter, practiceStatus, updateLetterHold } from './letterHold.js'

const sureA = { hand: 'right', whole: true, letter: 'A', sure: true }

describe('showsLetter', () => {
  it('needs a whole hand, sure, making the letter', () => {
    expect(showsLetter([sureA], 'A')).toBe(true)
    expect(showsLetter([sureA], 'B')).toBe(false)
    expect(showsLetter([{ ...sureA, sure: false }], 'A')).toBe(false)
    expect(showsLetter([{ hand: 'right', whole: false }], 'A')).toBe(false)
    expect(showsLetter([], 'A')).toBe(false)
  })

  it('needs the letter\'s shape rules to pass', () => {
    expect(showsLetter([{ ...sureA, fix: 'Fold your thumb across your palm.' }], 'A')).toBe(false)
    expect(showsLetter([{ ...sureA, fix: null }], 'A')).toBe(true)
  })

  it('counts any hand it is given (Practice only gives the signing hand)', () => {
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
    expect(practiceStatus({ ...ready, secondsLeft: 2 })).toEqual({ status: 'Hold it… 2', tone: 'ok' })
  })

  it('says what to do otherwise', () => {
    expect(practiceStatus(ready).status).toBe('Show A with your right hand')
    expect(practiceStatus({ ...ready, guesses: [{ whole: false }] }).status).toBe('Show your whole hand')
    expect(practiceStatus({ ...ready, guesses: [{ ...sureA, letter: 'S' }] }).status).toBe('Show A with your right hand')
  })

  it('names the signing hand', () => {
    expect(practiceStatus({ ...ready, hand: 'left' }).status).toBe('Show A with your left hand')
  })
})
