import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { formatReport, tallyRules, usableHands } from './check-rules.js'

// One real hand per still letter (src/vision/landmarks/fixtures/).
const fixture = JSON.parse(
  readFileSync(new URL('../src/vision/landmarks/fixtures/letter-hands.json', import.meta.url), 'utf8'),
)
const hand = (letter) => fixture.hands.find((h) => h.letter === letter)

// A sample as an extracted file holds it: every raw point in the middle of
// the photo, so the hand is whole.
function photo(changes = {}) {
  return { letter: 'B', detected: 'right', handsFound: 1, raw: Array(63).fill(0.5), landmarks: hand('B').landmarks, ...changes }
}
const extracted = (samples) => ({ kind: 'extracted', dataset: 'asl-hg', samples })
const session = (samples) => ({ format: 1, person: 'p00', session: '2026-10-20a', samples })

describe('usableHands, from an extracted file', () => {
  it('keeps a whole right hand alone in its photo', () => {
    expect(usableHands(extracted([photo()]))).toEqual([{ letter: 'B', landmarks: hand('B').landmarks }])
  })

  it('drops a hand detected as left: the public signers used their right', () => {
    expect(usableHands(extracted([photo({ detected: 'left' })]))).toEqual([])
  })

  it('drops a photo where two hands were found', () => {
    expect(usableHands(extracted([photo({ handsFound: 2 })]))).toEqual([])
  })

  it('drops a hand with a point outside the photo’s edge margin', () => {
    const raw = Array(63).fill(0.5)
    raw[0] = 0.01 // the wrist's x
    expect(usableHands(extracted([photo({ raw })]))).toEqual([])
  })

  it('drops letters the rules don’t judge as still shapes', () => {
    expect(usableHands(extracted([photo({ letter: 'J' }), photo({ letter: '7' })]))).toEqual([])
  })
})

describe('usableHands, from a session file', () => {
  const frame = (changes = {}) => ({ letter: 'B', hand: 'left', detected: 'left', raw: Array(63).fill(0.5), landmarks: hand('B').landmarks, ...changes })

  it('keeps a frame where the hand asked for was the one detected, left or right', () => {
    expect(usableHands(session([frame()]))).toHaveLength(1)
  })

  it('drops a frame where the other hand was detected: it is flipped the wrong way', () => {
    expect(usableHands(session([frame({ detected: 'right' })]))).toEqual([])
  })
})

describe('tallyRules', () => {
  const tally = tallyRules(fixture.hands)

  it('counts a hand that makes its own letter', () => {
    expect(tally.B).toMatchObject({ hands: 1, own: 1, none: 0, others: {} })
  })

  it('counts every other letter a hand would pass as', () => {
    // The typical E also passes when X is the letter asked for.
    expect(tally.E).toMatchObject({ own: 1, others: { X: 1 } })
  })

  it('counts a hand that passes no letter at all', () => {
    expect(tally.P).toMatchObject({ own: 0, none: 1 })
  })

  it('averages each condition’s score, in the checklist’s order', () => {
    const tightFist = tally.S.conditions.find((c) => c.text === 'Tight fist')
    expect(tightFist.mean).toBeLessThan(0.5)
    expect(tally.S.conditions[0]).toMatchObject({ text: '{index} folded down', mean: 1 })
  })

  it('leaves out letters with no hands', () => {
    expect(Object.keys(tallyRules([hand('B')]))).toEqual(['B'])
  })
})

describe('formatReport', () => {
  const report = formatReport([{ name: 'asl-hg', tally: tallyRules(fixture.hands) }]).join('\n')

  it('has a row per letter: hands, own share, no letter, other letters', () => {
    expect(report).toContain('| E | 1 | 100.0% | 0.0% | X 100% |')
  })

  it('lists a letter’s conditions with their mean scores', () => {
    expect(report).toMatch(/\| S \|.*Tight fist \*\*0\.\d\d\*\*/)
  })
})
