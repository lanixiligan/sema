import { afterEach, describe, expect, it, vi } from 'vitest'
import { browserName } from './browserName.js'

afterEach(() => vi.unstubAllGlobals())

describe('browserName', () => {
  it('names Chrome by its brand and major version', () => {
    vi.stubGlobal('navigator', {
      userAgentData: { brands: [{ brand: 'Chromium', version: '155' }, { brand: 'Google Chrome', version: '155' }] },
      userAgent: '',
    })
    expect(browserName()).toBe('Chrome 155')
  })

  it('names Chromium when Google Chrome is not among the brands', () => {
    vi.stubGlobal('navigator', { userAgentData: { brands: [{ brand: 'Chromium', version: '154' }] }, userAgent: '' })
    expect(browserName()).toBe('Chromium 154')
  })

  it('reads Firefox from the user agent', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0' })
    expect(browserName()).toBe('Firefox 157')
  })

  it('falls back for other browsers', () => {
    vi.stubGlobal('navigator', { userAgent: 'SomethingElse/1.0' })
    expect(browserName()).toBe('Other browser')
  })
})
