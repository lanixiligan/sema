import { afterEach, describe, expect, it, vi } from 'vitest'
import { newSession } from './sessionFile.js'
import { clearSession, loadSession, loadUsedSessionIds, rememberSessionId, saveSession } from './sessionStore.js'

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
  consent: { train: true, publish: false },
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
})
