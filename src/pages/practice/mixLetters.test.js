import { describe, expect, it } from 'vitest'
import { mixLetters } from './mixLetters.js'

describe('mixLetters', () => {
  it('takes letters alternately from the start and the end', () => {
    expect(mixLetters(['B', 'C', 'D', 'F', 'I', 'L', 'W', 'Y'])).toEqual(['B', 'Y', 'C', 'W', 'D'])
  })

  it('uses every letter once when there are fewer than asked for', () => {
    expect(mixLetters(['B', 'C', 'D'])).toEqual(['B', 'D', 'C'])
  })

  it('returns nothing for no letters', () => {
    expect(mixLetters([])).toEqual([])
  })
})
