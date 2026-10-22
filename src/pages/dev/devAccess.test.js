import { describe, expect, it } from 'vitest'
import { fingerprint } from '../../../scripts/dev-code.js'
import { hashCode, isUnlocked } from './devAccess.js'

describe('hashCode', () => {
  it('gives the standard SHA-256 fingerprint', async () => {
    expect(await hashCode('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('ignores spaces at either end', async () => {
    expect(await hashCode('  abc ')).toBe(await hashCode('abc'))
  })

  it('matches the fingerprint npm run dev-code saves', async () => {
    const code = 'violet kettle harbour seven ü'
    expect(await hashCode(code)).toBe(fingerprint(code))
  })
})

describe('isUnlocked', () => {
  it('opens with the current code', () => {
    expect(isUnlocked('ab12', 'ab12')).toBe(true)
  })

  it('stays shut with an old code, none saved, or no code set', () => {
    expect(isUnlocked('ab12', 'cd34')).toBe(false)
    expect(isUnlocked(null, 'cd34')).toBe(false)
    expect(isUnlocked(null, null)).toBe(false)
  })
})
