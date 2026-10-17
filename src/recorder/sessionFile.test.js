import { describe, expect, it } from 'vitest'
import {
  acceptedCount,
  addTake,
  attemptCount,
  isValidPersonCode,
  makeRecordingId,
  needsDownload,
  newSession,
  nextSessionId,
  normalizePersonCode,
  sessionFileName,
  deleteTake,
  takeProgress,
} from './sessionFile.js'

function frame(detected = 'left', t = 0) {
  return {
    hasHand: true,
    t,
    detected,
    detectedScore: 0.98765,
    width: 640,
    height: 480,
    raw: Array(63).fill(0.123456),
    landmarks: Array(63).fill(-0.987654),
  }
}

function session() {
  return newSession({
    person: 'p03',
    session: '2026-11-02a',
    consent: { train: true },
    date: '2026-11-02',
    browser: 'Chrome 155',
  })
}

function take(overrides = {}) {
  return {
    letter: 'W',
    hand: 'left',
    counts: { kept: 2, mismatched: 1, droppedNoHand: 1 },
    status: 'accepted',
    reason: null,
    cameraFps: 29.96,
    frames: [frame('left', 0), frame('right', 100), { hasHand: false, t: 200 }],
    ...overrides,
  }
}

describe('person codes', () => {
  it('accepts P03 with spaces as p03', () => {
    const code = normalizePersonCode('  P03 ')
    expect(code).toBe('p03')
    expect(isValidPersonCode(code)).toBe(true)
  })

  it('needs p and at least two digits', () => {
    expect(isValidPersonCode('p003')).toBe(true)
    expect(isValidPersonCode('p3')).toBe(false)
    expect(isValidPersonCode('x03')).toBe(false)
    expect(isValidPersonCode('')).toBe(false)
  })
})

describe('nextSessionId', () => {
  it('uses the first unused letter for the day', () => {
    expect(nextSessionId('2026-11-02', [])).toBe('2026-11-02a')
    expect(nextSessionId('2026-11-02', ['2026-11-02a', '2026-11-02b', '2026-11-01c'])).toBe('2026-11-02c')
  })
})

describe('makeRecordingId', () => {
  it('starts with the person', () => {
    expect(makeRecordingId({ person: 'p03', session: '2026-11-02a', letter: 'W', hand: 'left', take: 2 })).toBe(
      'p03-2026-11-02a-W-left-2',
    )
    expect(makeRecordingId({ person: 'p03', session: '2026-11-02a', letter: 'none', hand: 'right', take: 1 })).toBe(
      'p03-2026-11-02a-none-right-1',
    )
  })
})

describe('newSession', () => {
  it('fills in the header', () => {
    expect(session()).toEqual({
      format: 1,
      normalization: 1,
      language: 'asl',
      person: 'p03',
      session: '2026-11-02a',
      browser: 'Chrome 155',
      cameraFps: null,
      consent: { train: true, date: '2026-11-02' },
      recordings: [],
      samples: [],
    })
  })
})

describe('consent', () => {
  it('records training consent and its date only (publishing is out of scope)', () => {
    expect(session().consent).toEqual({ train: true, date: '2026-11-02' })
    const s = newSession({ person: 'p03', session: '2026-11-02a', consent: { train: true, publish: true }, date: '2026-11-02', browser: 'Chrome 155' })
    expect(Object.keys(s.consent)).toEqual(['train', 'date'])
  })
})

describe('addTake', () => {
  it('adds an accepted take: an entry plus one sample per frame with a hand', () => {
    const s = addTake(session(), take())
    expect(s.recordings).toEqual([
      {
        recording: 'p03-2026-11-02a-W-left-1',
        letter: 'W',
        hand: 'left',
        take: 1,
        status: 'accepted',
        reason: null,
        kept: 2,
        mismatched: 1,
        droppedNoHand: 1,
        cameraFps: 30,
      },
    ])
    expect(s.samples).toHaveLength(2)
    expect(s.samples[1]).toMatchObject({
      person: 'p03',
      session: '2026-11-02a',
      language: 'asl',
      letter: 'W',
      hand: 'left',
      detected: 'right',
      detectedScore: 0.99,
      recording: 'p03-2026-11-02a-W-left-1',
      take: 1,
      t: 100,
      width: 640,
      height: 480,
    })
    expect(s.samples[0].raw[0]).toBe(0.1235)
    expect(s.samples[0].landmarks[0]).toBe(-0.9877)
  })

  it('adds a rejected take as an entry without samples', () => {
    const s = addTake(session(), take({ status: 'rejected', reason: '18 of 30 frames matched' }))
    expect(s.recordings[0]).toMatchObject({ status: 'rejected', reason: '18 of 30 frames matched' })
    expect(s.samples).toHaveLength(0)
  })

  it('numbers takes by attempt, counting rejected ones, so IDs stay unique', () => {
    let s = addTake(session(), take({ status: 'rejected', reason: 'x' }))
    s = addTake(s, take())
    expect(s.recordings.map((r) => r.recording)).toEqual(['p03-2026-11-02a-W-left-1', 'p03-2026-11-02a-W-left-2'])
    expect(attemptCount(s, 'W', 'left')).toBe(2)
    expect(acceptedCount(s, 'W', 'left')).toBe(1)
    expect(acceptedCount(s, 'W', 'right')).toBe(0)
  })

  it('sets the session camera fps to the median of its takes', () => {
    let s = addTake(session(), take({ cameraFps: 30 }))
    s = addTake(s, take({ cameraFps: 20 }))
    s = addTake(s, take({ cameraFps: 29.6 }))
    expect(s.cameraFps).toBe(29.6)
  })

  it('does not change the session it was given', () => {
    const before = session()
    addTake(before, take())
    expect(before.recordings).toHaveLength(0)
  })
})

describe('deleteTake', () => {
  const ids = (s) => s.recordings.map((r) => r.recording)

  it('removes one take and its samples, and keeps the others', () => {
    let s = addTake(addTake(addTake(session(), take()), take()), take())
    s = deleteTake(s, 'p03-2026-11-02a-W-left-2')
    expect(ids(s)).toEqual(['p03-2026-11-02a-W-left-1', 'p03-2026-11-02a-W-left-3'])
    expect(s.samples.some((x) => x.recording === 'p03-2026-11-02a-W-left-2')).toBe(false)
    expect(s.samples.some((x) => x.recording === 'p03-2026-11-02a-W-left-3')).toBe(true)
  })

  it('never reuses a take number still in the session', () => {
    let s = addTake(addTake(addTake(session(), take()), take()), take())
    s = addTake(deleteTake(s, 'p03-2026-11-02a-W-left-2'), take())
    expect(ids(s)).toEqual(['p03-2026-11-02a-W-left-1', 'p03-2026-11-02a-W-left-3', 'p03-2026-11-02a-W-left-4'])
  })

  it('does nothing for a take that is not there', () => {
    const s = addTake(session(), take())
    expect(deleteTake(s, 'nope')).toBe(s)
  })
})

describe('sessionFileName', () => {
  it('names the file after the person and session', () => {
    expect(sessionFileName(session())).toBe('sema-asl-p03-2026-11-02a.json')
  })
})

describe('takeProgress', () => {
  it('counts kept takes for every letter and both hands, out of 3 each', () => {
    let s = session()
    s = addTake(s, take({ letter: 'W', hand: 'left' }))
    s = addTake(s, take({ letter: 'W', hand: 'right' }))
    s = addTake(s, take({ letter: 'B', hand: 'left', status: 'rejected', reason: 'too-few-frames' }))
    expect(takeProgress(s, ['B', 'W', 'none'])).toEqual({ kept: 2, needed: 18 })
  })

  it('counts at most 3 takes per letter and hand', () => {
    let s = session()
    for (let i = 0; i < 4; i++) s = addTake(s, take())
    expect(takeProgress(s, ['W'], ['left'])).toEqual({ kept: 3, needed: 3 })
  })
})

describe('needsDownload', () => {
  it('is false with no session, or a session with no takes yet', () => {
    expect(needsDownload(null, null)).toBe(false)
    expect(needsDownload(session(), null)).toBe(false)
  })

  it('is true for takes that were never downloaded', () => {
    expect(needsDownload(addTake(session(), take()), null)).toBe(true)
  })

  it('is false right after downloading that exact session', () => {
    const s = addTake(session(), take())
    expect(needsDownload(s, s)).toBe(false)
  })

  const deleteLast = (s) => deleteTake(s, s.recordings.at(-1).recording)

  it('is true again after a delete, even though there are fewer takes', () => {
    const downloaded = addTake(addTake(session(), take()), take())
    expect(needsDownload(deleteLast(downloaded), downloaded)).toBe(true)
  })

  it('is true after a delete and a new take bring the count back', () => {
    const downloaded = addTake(addTake(session(), take()), take())
    expect(needsDownload(addTake(deleteLast(downloaded), take()), downloaded)).toBe(true)
  })
})
