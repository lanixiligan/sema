import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { emptyChecks, matchLetter, steadyChecks } from './letterMatch.js'
import { RULES } from './letterShapes.js'

// One real hand per still letter: the most typical one in the public ASL-HG
// photos (fixtures/letter-hands.json, made by training/letter_hands.py).
const { hands } = JSON.parse(readFileSync(new URL('./fixtures/letter-hands.json', import.meta.url), 'utf8'))
const hand = (letter) => hands.find((h) => h.letter === letter).landmarks
const STILL = hands.map((h) => h.letter)
const makes = (letter, shown) => matchLetter(letter, hand(shown)).makes

// What the rules get right today, and what they don't yet (measured on every
// photo by `npm run check-rules`, training/reports/rules.md). The lists below
// are the typical hands' results on 2026-11-10. When a rule is fixed, its
// `it.fails` line starts failing: move the letter to the list above it.
const MAKES_ITSELF = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'O', 'R', 'T', 'U', 'W', 'Y']
const NOT_YET = ['M', 'N', 'P', 'Q', 'S', 'V', 'X']
// Hands that pass no other letter than their own.
const ONLY_ITSELF = ['A', 'B', 'C', 'D', 'F', 'H', 'I', 'L', 'O', 'T', 'U', 'W', 'Y']
// [the hand shown, a letter it also passes as, wrongly].
const LOOK_ALIKES = [
  ['E', 'X'],
  ['G', 'P'],
  ['K', 'P'],
  ['K', 'U'],
  ['R', 'K'],
  ['R', 'P'],
]

describe('matchLetter', () => {
  it.each(MAKES_ITSELF)('a typical %s makes its own letter', (letter) => {
    expect(makes(letter, letter)).toBe(true)
  })

  it.fails.each(NOT_YET)('a typical %s makes its own letter (not yet)', (letter) => {
    expect(makes(letter, letter)).toBe(true)
  })

  it.each(ONLY_ITSELF)('a typical %s makes no other still letter', (shown) => {
    expect(STILL.filter((letter) => letter !== shown && makes(letter, shown))).toEqual([])
  })

  it.fails.each(LOOK_ALIKES)('a typical %s does not pass as %s (not yet)', (shown, letter) => {
    expect(makes(letter, shown)).toBe(false)
  })

  it('scores every condition of the letter, in the checklist’s order', () => {
    const { checks } = matchLetter('B', hand('B'))
    expect(checks.map((check) => check.text)).toEqual(RULES.B.map((rule) => rule.text))
    expect(checks.every((check) => check.score >= 0 && check.score <= 1)).toBe(true)
  })

  it('judges a traced letter by its handshape alone: an I makes J’s', () => {
    expect(makes('J', 'I')).toBe(true)
    expect(makes('J', 'B')).toBe(false)
  })

  it('judges a left hand like a right one: mirroring the hand changes nothing', () => {
    const mirrored = hand('B').map((value, i) => (i % 3 === 0 ? -value : value))
    expect(matchLetter('B', mirrored).makes).toBe(true)
    expect(matchLetter('A', mirrored).makes).toBe(false)
  })
})

describe('emptyChecks', () => {
  it('lists the letter’s conditions, every one unmet', () => {
    const checks = emptyChecks('B')
    expect(checks).toHaveLength(RULES.B.length)
    expect(checks.every((check) => check.score === 0 && check.met === false)).toBe(true)
  })
})

describe('steadyChecks', () => {
  const at = (score) => [{ text: 'a condition', score }]
  // Feeds the same score until the smoothed value has settled on it.
  const settle = (previous, score) => Array.from({ length: 30 }).reduce((checks) => steadyChecks(checks, at(score)), previous)

  it('ticks a condition at 0.6 on the first frame, and not under it', () => {
    expect(steadyChecks(null, at(0.6))[0].met).toBe(true)
    expect(steadyChecks(null, at(0.59))[0].met).toBe(false)
  })

  it('keeps a tick on while the score sits between 0.45 and 0.6', () => {
    const ticked = steadyChecks(null, at(0.9))
    expect(settle(ticked, 0.5)[0].met).toBe(true)
  })

  it('takes a tick off once the score settles under 0.45', () => {
    const ticked = steadyChecks(null, at(0.9))
    expect(settle(ticked, 0.4)[0].met).toBe(false)
  })

  it('does not tick an unticked condition between 0.45 and 0.6', () => {
    const unticked = steadyChecks(null, at(0.1))
    expect(settle(unticked, 0.55)[0].met).toBe(false)
  })

  it('smooths the score, so one odd frame cannot take a tick off', () => {
    const ticked = settle(null, 0.9)
    expect(steadyChecks(ticked, at(0))[0].met).toBe(true)
  })
})
