import { afterEach, describe, expect, it, vi } from 'vitest'
import { NEW_VISITOR, PROGRESS_VERSION, clearSavedData, loadProgress, saveProgress } from './progressStore.js'

function fakeStorage(initial = {}, { failWrites = false } = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      if (failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      data.set(key, String(value))
    },
    removeItem: (key) => data.delete(key),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size
    },
    keys: () => [...data.keys()],
  }
}
const saved = (value) => ({ 'sema.progress': JSON.stringify(value) })

afterEach(() => vi.unstubAllGlobals())

describe('progressStore', () => {
  it('starts as a new visitor', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('saves and loads the signing hand, setup, theme, hand picture, developer access and model', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    const progress = {
      version: PROGRESS_VERSION,
      signingHand: 'left',
      setupDone: true,
      theme: 'dark',
      handView: '3d',
      devAccess: 'ab12',
      devModel: 'knn',
    }
    expect(saveProgress(progress)).toBe(true)
    expect(loadProgress()).toEqual(progress)
  })

  it('gives settings saved before the 3D hand existed the drawing', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'left', setupDone: true, theme: 'dark' })))
    expect(loadProgress().handView).toBe('2d')
  })

  it('gives settings saved before developer access existed none', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'left', setupDone: true, theme: 'dark' })))
    expect(loadProgress().devAccess).toBeNull()
  })

  it('gives settings saved before the model choice existed, or with an unknown one, the small model', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'left', setupDone: true })))
    expect(loadProgress().devModel).toBe('small')
    vi.stubGlobal(
      'localStorage',
      fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'left', setupDone: true, devModel: 'forest' })),
    )
    expect(loadProgress().devModel).toBe('small')
  })

  it('gives settings saved before the theme existed the default theme', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'left', setupDone: true })))
    expect(loadProgress().theme).toBe('system')
  })

  it('treats unreadable JSON as a new visitor', () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'sema.progress': '{not json' }))
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('treats another version as a new visitor', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: 99, signingHand: 'left', setupDone: true })))
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('ignores an unknown hand, and setup marked done without a hand', () => {
    vi.stubGlobal('localStorage', fakeStorage(saved({ version: PROGRESS_VERSION, signingHand: 'both', setupDone: true })))
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('treats blocked storage as a new visitor', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('reports a refused save', () => {
    vi.stubGlobal('localStorage', fakeStorage({}, { failWrites: true }))
    expect(saveProgress({ version: PROGRESS_VERSION, signingHand: 'right', setupDone: false })).toBe(false)
  })

  it('deletes every sema. key, and only those', () => {
    const storage = fakeStorage({
      'sema.progress': '{}',
      'sema.recorder.session': '{}',
      'sema.recorder.sessionIds': '[]',
      'other-site': 'keep',
    })
    vi.stubGlobal('localStorage', storage)
    expect(clearSavedData()).toBe(true)
    expect(storage.keys()).toEqual(['other-site'])
    expect(loadProgress()).toEqual(NEW_VISITOR)
  })

  it('reports when the browser blocks storage', () => {
    vi.stubGlobal('localStorage', {
      get length() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    expect(clearSavedData()).toBe(false)
  })
})
