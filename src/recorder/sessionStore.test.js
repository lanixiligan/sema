import { afterEach, describe, expect, it, vi } from 'vitest'
import { addTake, deleteTake, newSession } from './sessionFile.js'
import {
  clearSession,
  fingerprint,
  loadSession,
  loadUsedSessionIds,
  rememberDownload,
  rememberSessionId,
  saveSession,
  wasDownloaded,
} from './sessionStore.js'

function fakeStorage({ failWrites = false } = {}) {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      if (failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      data.set(key, String(value))
    },
    removeItem: (key) => data.delete(key),
  }
}

const session = newSession({
  person: 'p03',
  session: '2026-11-02a',
  consent: { train: true },
  date: '2026-11-02',
  browser: 'Chrome 155',
})

afterEach(() => vi.unstubAllGlobals())

describe('sessionStore', () => {
  it('saves and loads a session', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(saveSession(session)).toBe(true)
    expect(loadSession()).toEqual(session)
  })

  it('returns false when the browser refuses to save (storage full)', () => {
    vi.stubGlobal('localStorage', fakeStorage({ failWrites: true }))
    expect(saveSession(session)).toBe(false)
  })

  it('ignores a saved session that is not valid JSON', () => {
    const storage = fakeStorage()
    storage.setItem('sema.recorder.session', '{not json')
    vi.stubGlobal('localStorage', storage)
    expect(loadSession()).toBeNull()
  })

  it('ignores a saved session from another format version', () => {
    const storage = fakeStorage()
    storage.setItem('sema.recorder.session', JSON.stringify({ ...session, format: 99 }))
    vi.stubGlobal('localStorage', storage)
    expect(loadSession()).toBeNull()
  })

  it('returns null when storage itself is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(loadSession()).toBeNull()
    expect(saveSession(session)).toBe(false)
  })

  it('clears the saved session', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    saveSession(session)
    clearSession()
    expect(loadSession()).toBeNull()
  })

  it('remembers used session IDs', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(loadUsedSessionIds()).toEqual([])
    rememberSessionId('2026-11-02a')
    rememberSessionId('2026-11-02a')
    rememberSessionId('2026-11-02b')
    expect(loadUsedSessionIds()).toEqual(['2026-11-02a', '2026-11-02b'])
  })

  it('remembers a download across a reload, for that exact session only', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    const take = (n) => ({
      letter: 'B',
      hand: 'right',
      counts: { kept: 1, mismatched: 0, droppedNoHand: 0 },
      status: 'accepted',
      reason: null,
      cameraFps: 30,
      frames: [{ hasHand: true, t: 0, detected: 'right', detectedScore: 0.9, width: 640, height: 480, raw: Array(63).fill(n), landmarks: Array(63).fill(n) }],
    })
    const one = addTake(session, take(0.1))
    expect(wasDownloaded(one)).toBe(false)
    rememberDownload(one)
    // A reload gives a new object with the same contents.
    expect(wasDownloaded(JSON.parse(JSON.stringify(one)))).toBe(true)
    // Another take, or deleting the last take and recording it again (which
    // reuses its ID), is not downloaded yet.
    expect(wasDownloaded(addTake(one, take(0.1)))).toBe(false)
    const redone = addTake(deleteTake(one, one.recordings[0].recording), take(0.2))
    expect(redone.recordings[0].recording).toBe(one.recordings[0].recording)
    expect(wasDownloaded(redone)).toBe(false)
    // Clearing the session forgets the download too.
    clearSession()
    expect(wasDownloaded(one)).toBe(false)
  })

  it('fingerprints differ when the text differs', () => {
    expect(fingerprint('abc')).toBe(fingerprint('abc'))
    expect(fingerprint('abc')).not.toBe(fingerprint('abd'))
    expect(fingerprint('')).toBe('0:811c9dc5')
  })
})
