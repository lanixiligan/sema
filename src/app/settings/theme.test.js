import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadProgress } from './progressStore.js'
import { followTheme, resolveTheme } from './theme.js'

// A stand-in for matchMedia's answer that the test can flip.
function fakeSystem(isDark) {
  const listeners = new Set()
  return {
    matches: isDark,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    change(nowDark) {
      this.matches = nowDark
      listeners.forEach((listener) => listener())
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('theme', () => {
  it('defaults to System', () => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    expect(loadProgress().theme).toBe('system')
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('lets a saved choice win over the system', () => {
    const saved = { version: 1, signingHand: 'right', setupDone: true, theme: 'light' }
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(saved) })
    expect(loadProgress().theme).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('ignores an unknown saved choice', () => {
    const saved = { version: 1, signingHand: 'right', setupDone: true, theme: 'sepia' }
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(saved) })
    expect(loadProgress().theme).toBe('system')
  })

  it('follows a system change live with System', () => {
    const system = fakeSystem(false)
    const apply = vi.fn()
    const stop = followTheme('system', system, apply)
    expect(apply).toHaveBeenLastCalledWith('light')
    system.change(true)
    expect(apply).toHaveBeenLastCalledWith('dark')
    stop()
    system.change(false)
    expect(apply).toHaveBeenCalledTimes(2)
  })

  it('ignores a system change when Light or Dark is chosen', () => {
    const system = fakeSystem(false)
    const apply = vi.fn()
    followTheme('dark', system, apply)
    system.change(true)
    system.change(false)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(apply).toHaveBeenLastCalledWith('dark')
  })
})
