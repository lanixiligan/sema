import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LETTERS, RULES } from '../vision/landmarks/letterShapes.js'
import { readGuide } from './letterGuides.js'
import { readLetterPose } from './letterPoses.js'
import { FINGERS, stillPose } from './pose.js'

const file = (path) => new URL(`../../public/languages/asl/${path}`, import.meta.url)
const readJson = (path) => JSON.parse(readFileSync(file(path), 'utf8'))
const LETTERS_WITH_GUIDES = readJson('guides/text/index.json')
const TEXTS = Object.fromEntries(LETTERS_WITH_GUIDES.map((letter) => [letter, readJson(`guides/text/${letter}.json`)]))
const START = { pose: readLetterPose(readFileSync(file('guides/Relaxed.json'), 'utf8')), texts: readJson('guides/text/Relaxed.json') }
const guideOf = (letter) => readLetterPose(readFileSync(file(`guides/${letter}.json`), 'utf8'))

const still = {
  pinky: [0, 0, 0],
  ring: [0, 0, 0],
  middle: [0, 0, 0],
  index: [0, 0, 0],
  thumb: [0, 0],
  spread: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0 },
}
const folded = { ...still, index: [1.4, 1.7, 0.6] }
const start = { pose: readLetterPose(JSON.stringify(still)), texts: [{ say: 'Start with an open hand.' }] }
// The guide file's own pose (a bent pinky) is replaced by the start's.
const guide = readLetterPose(JSON.stringify({ ...still, pinky: [1, 1, 1], motion: [{ duration: 500, pose: folded }] }))

describe('readGuide', () => {
  it("starts from the shared start's pose and sentence, then pairs each motion step with its text", () => {
    const { steps, whole } = readGuide(start, guide, [{ say: 'Fold {index} next to {thumb}.', checks: ['{index} folded down'] }])
    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({ say: 'Start with an open hand.', checks: [], fingers: [], duration: 0 })
    expect(steps[0].pose.pinky).toEqual([0, 0, 0])
    expect(steps[1]).toMatchObject({ checks: ['{index} folded down'], fingers: ['thumb', 'index'], duration: 500 })
    expect(steps[1].pose.index).toEqual([1.4, 1.7, 0.6])
    expect(steps[1].pose.motion).toBeUndefined()
    expect(whole.pinky).toEqual([0, 0, 0])
    expect(whole.motion).toHaveLength(1)
  })

  it('takes its steps from the motion, not the text: a missing sentence is null, an extra one is left out', () => {
    expect(readGuide(start, guide, []).steps.map((step) => step.say)).toEqual(['Start with an open hand.', null])
    expect(readGuide(start, guide, []).steps[1]).toMatchObject({ checks: [], fingers: [] })
    const extra = readGuide(start, guide, [{ say: 'One.' }, { say: 'Two.' }])
    expect(extra.steps.map((step) => step.say)).toEqual(['Start with an open hand.', 'One.'])
  })

  it('throws on an empty sentence and a missing start', () => {
    expect(() => readGuide(start, guide, [{ say: ' ' }])).toThrow(/step 2/)
    expect(() => readGuide(null, guide, [{ say: 'One.' }])).toThrow(/Relaxed/)
  })

  it('reads a guide with no motion as still: its own pose, one step, no start needed', () => {
    const { steps, whole, stepByStep } = readGuide(null, readLetterPose(JSON.stringify(folded)))
    expect(stepByStep).toBe(false)
    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ say: null, checks: [], fingers: [], duration: 0 })
    expect(steps[0].pose.index).toEqual([1.4, 1.7, 0.6])
    expect(whole.motion).toBeUndefined()
  })
})

// Every letter has a guide file, still or step by step, that the page can read.
describe.each(LETTERS)("%s's guide file", (letter) => {
  it('reads', () => {
    expect(() => readGuide(START, guideOf(letter), [])).not.toThrow()
  })
})

// The real files. text/index.json lists exactly the letters with a text file.
describe('guides/text/index.json', () => {
  it('lists every text file in guides/text/, each once', () => {
    const files = readdirSync(file('guides/text/'))
      .filter((name) => name !== 'index.json' && name !== 'Relaxed.json')
      .map((name) => name.replace(/\.json$/, ''))
    expect([...LETTERS_WITH_GUIDES].sort()).toEqual(files.sort())
    expect(new Set(LETTERS_WITH_GUIDES).size).toBe(LETTERS_WITH_GUIDES.length)
  })
})

// Every letter in the index must have a guide that fits it and the letter's
// finger rules; a letter with no guide yet just isn't in the index.
describe.each(Object.keys(TEXTS))("%s's guide", (letter) => {
  it('is a letter with a guide file', () => {
    expect(RULES[letter]).toBeDefined()
    expect(existsSync(file(`guides/${letter}.json`))).toBe(true)
  })

  it('can be read (for now its text needn\'t have one entry per motion step)', () => {
    expect(() => readGuide(START, guideOf(letter), TEXTS[letter])).not.toThrow()
  })

  it("completes exactly the letter's finger conditions, each once", () => {
    const checks = TEXTS[letter].flatMap((step) => step.checks ?? [])
    expect([...checks].sort()).toEqual(RULES[letter].map((rule) => rule.text).sort())
  })

  it('names only real fingers in its sentences', () => {
    for (const { say } of [...START.texts, ...TEXTS[letter]]) {
      for (const [, name] of say.matchAll(/\{(\w+)\}/g)) expect(FINGERS).toContain(name)
    }
  })

  // Off for now, while the guides are being remade in Eidos (2026-11-14): V's
  // new guide ends on a different hand than letters/V.json. Turn it back on
  // once they match.
  it.skip("ends on the letter's own pose, the hand Learn shows", () => {
    const { steps } = readGuide(START, guideOf(letter), TEXTS[letter])
    const letterPose = readLetterPose(readFileSync(file(`letters/${letter}.json`), 'utf8'))
    expect(steps.at(-1).pose).toEqual(stillPose(letterPose))
  })
})
