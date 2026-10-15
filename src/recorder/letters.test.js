import { describe, expect, it } from 'vitest'
import { classLabel, splitLetters } from './letters.js'

describe('splitLetters', () => {
  it('separates training letters from pilot-only letters', () => {
    expect(
      splitLetters([{ letter: 'B' }, { letter: 'A', pilotOnly: true }, { letter: 'L' }, { letter: 'S', pilotOnly: true }]),
    ).toEqual({ training: ['B', 'L'], pilot: ['A', 'S'], instructions: {}, images: {} })
  })

  it('ignores entries that are not a single capital letter, and duplicates', () => {
    expect(splitLetters([{ letter: 'b' }, { letter: 'AB' }, {}, { letter: 'C' }, { letter: 'C' }])).toEqual({
      training: ['C'],
      pilot: [],
      instructions: {},
      images: {},
    })
  })

  it('collects the instructions for each letter', () => {
    expect(
      splitLetters([
        { letter: 'B', instructions: 'Flat hand, four fingers straight up' },
        { letter: 'A', pilotOnly: true },
        { letter: 'C', instructions: 42 },
      ]).instructions,
    ).toEqual({ B: 'Flat hand, four fingers straight up' })
  })
})

describe('reference images', () => {
  it('collects the image path for each letter that has one', () => {
    expect(
      splitLetters([
        { letter: 'B', image: 'reference/B.svg' },
        { letter: 'C' },
        { letter: 'A', pilotOnly: true, image: 'reference/A.svg' },
        { letter: 'D', image: 7 },
      ]).images,
    ).toEqual({ B: 'reference/B.svg', A: 'reference/A.svg' })
  })
})

describe('classLabel', () => {
  it('names the no-letter class', () => {
    expect(classLabel('none')).toBe('No letter')
    expect(classLabel('W')).toBe('W')
  })
})
