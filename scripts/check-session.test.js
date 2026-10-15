import { describe, expect, it } from 'vitest'
import { addTake, newSession } from '../src/recorder/sessionFile.js'
import { checkSession, formatTable } from './check-session.js'

function frame(t) {
  return {
    hasHand: true,
    t,
    detected: 'left',
    detectedScore: 0.97,
    width: 640,
    height: 480,
    raw: Array(63).fill(0.5),
    landmarks: Array(63).fill(0.1),
  }
}

function validFile() {
  let s = newSession({
    person: 'p03',
    session: '2026-11-02a',
    consent: { train: true },
    date: '2026-11-02',
    browser: 'Chrome 155',
  })
  const frames = Array.from({ length: 30 }, (_, i) => frame(i * 100))
  s = addTake(s, {
    letter: 'W', hand: 'left', counts: { kept: 30, mismatched: 0, droppedNoHand: 0 },
    status: 'accepted', reason: null, cameraFps: 30, frames,
  })
  s = addTake(s, {
    letter: 'W', hand: 'right', counts: { kept: 10, mismatched: 0, droppedNoHand: 20 },
    status: 'rejected', reason: '10 of 30 frames matched: 20 had no hand', cameraFps: 30, frames: [],
  })
  return s
}

function broken(change) {
  const file = structuredClone(validFile())
  change(file)
  return checkSession(file).errors
}

describe('checkSession', () => {
  it('passes a valid file', () => {
    expect(checkSession(validFile()).errors).toEqual([])
  })

  it('counts accepted and rejected takes per letter and hand', () => {
    expect(checkSession(validFile()).table).toEqual([
      { letter: 'W', hand: 'left', accepted: 1, rejected: 0 },
      { letter: 'W', hand: 'right', accepted: 0, rejected: 1 },
    ])
    expect(formatTable(checkSession(validFile()).table)).toContain('W')
  })

  it('rejects unknown format and normalization versions', () => {
    expect(broken((f) => { f.format = 2 })).toContain('Unknown format version: 2')
    expect(broken((f) => { f.normalization = 3 })).toContain('Unknown normalization version: 3')
  })

  it('needs 63 numbers in raw and landmarks', () => {
    expect(broken((f) => { f.samples[0].landmarks.pop() })[0]).toMatch(/Sample 0: landmarks must be 63 numbers/)
    expect(broken((f) => { f.samples[1].raw[5] = null })[0]).toMatch(/Sample 1: raw must be 63 numbers/)
  })

  it('needs consent to train and a date', () => {
    expect(broken((f) => { f.consent.train = false })).toContain('consent.train must be true')
    expect(broken((f) => { f.consent.date = 'today' })).toContain('consent.date must be a date like 2026-11-02')
  })

  it('finds a recording ID used twice in the file or already in data/raw/', () => {
    expect(broken((f) => { f.recordings[1].recording = f.recordings[0].recording })).toContain(
      'Recording p03-2026-11-02a-W-left-1 appears twice in this file',
    )
    const errors = checkSession(validFile(), new Set(['p03-2026-11-02a-W-left-1'])).errors
    expect(errors).toContain('Recording p03-2026-11-02a-W-left-1 is already in another file in data/raw/')
  })

  it('needs every sample to belong to an accepted recording, with matching counts', () => {
    expect(broken((f) => { f.samples[0].recording = 'p03-2026-11-02a-W-right-1' })[0]).toMatch(
      /Sample 0: recording p03-2026-11-02a-W-right-1 has no accepted entry/,
    )
    expect(broken((f) => { f.recordings[0].kept = 29 })).toContain(
      'Recording p03-2026-11-02a-W-left-1 says kept 29 but has 30 samples',
    )
  })
})
