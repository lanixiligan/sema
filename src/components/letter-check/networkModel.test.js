import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NORMALIZATION_VERSION } from '../../vision/landmarks/normalizeHand.js'
import { classify, readModel } from './networkModel.js'

// A tiny model in the saved file's shape: 2 numbers in, letters A, B and C out.
// With this one layer, A's score is the first number and B's the second.
const file = (changes = {}) => ({
  kind: 'network',
  name: 'test model',
  normalization: NORMALIZATION_VERSION,
  letters: ['A', 'B', 'C'],
  threshold: 0.4,
  mean: [0, 0],
  scale: [1, 1],
  layers: [{ weights: [[1, 0], [0, 1], [0, 0]], biases: [0, 0, 0] }],
  ...changes,
})

describe('readModel', () => {
  it('refuses a file that is not a network model', () => {
    expect(() => readModel(file({ kind: 'knn' }))).toThrow()
  })

  it('refuses a model made with another normalization', () => {
    expect(() => readModel(file({ normalization: NORMALIZATION_VERSION + 1 }))).toThrow()
  })
})

describe('classify', () => {
  it('turns the scores into percentages and picks the top one', () => {
    // Scores ln 2, 0, 0: e^score is 2, 1, 1, so 50%, 25%, 25%.
    const guess = classify(readModel(file()), [Math.log(2), 0])
    expect(guess.letter).toBe('A')
    expect(guess.confidence).toBeCloseTo(0.5)
    expect(guess.closest.map((c) => c.letter)).toEqual(['A', 'B', 'C'])
    expect(guess.closest[1].confidence).toBeCloseTo(0.25)
  })

  it('scales the numbers with the saved mean and scale first', () => {
    const model = readModel(file({ mean: [1, 0], scale: [2, 1] }))
    // (1 + 2 ln 2 − 1) / 2 = ln 2, as above.
    expect(classify(model, [1 + 2 * Math.log(2), 0]).confidence).toBeCloseTo(0.5)
  })

  it('sets negatives to 0 between layers, but not after the last', () => {
    const model = readModel(
      file({
        layers: [
          { weights: [[1, 0], [-1, 0]], biases: [0, 0] },
          { weights: [[1, 0], [0, 1], [0, -1]], biases: [0, 0, 0] },
        ],
      }),
    )
    // Hidden: −ln 2 and ln 2, the first set to 0. Scores 0, ln 2, −ln 2:
    // e^score is 1, 2, 0.5, so B gets 2 / 3.5.
    const guess = classify(model, [-Math.log(2), 0])
    expect(guess.letter).toBe('B')
    expect(guess.confidence).toBeCloseTo(2 / 3.5)
  })

  it('is not sure when the top percentage is under the threshold', () => {
    expect(classify(readModel(file({ threshold: 0.6 })), [Math.log(2), 0]).sure).toBe(false)
    expect(classify(readModel(file({ threshold: 0.4 })), [Math.log(2), 0]).sure).toBe(true)
  })
})

// One real hand per still letter (public ASL-HG photos), with the answers
// training/small.py's forward() gives for the published model. The Python side
// checks the same file (training/test_letter_hands.py).
describe('the published model', () => {
  const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
  const { hands } = read('../../vision/landmarks/fixtures/letter-hands.json')
  const model = readModel(read('../../../public/models/asl-letters.json'))

  it.each(hands)('gives $letter hand the answer Python gives', ({ landmarks, model: expected }) => {
    const guess = classify(model, landmarks)
    expect(guess.letter).toBe(expected.letter)
    expect(guess.confidence).toBeCloseTo(expected.confidence, 6)
  })
})

describe('readModel on a malformed file', () => {
  it('refuses a mean that is not as long as the first layer’s input', () => {
    expect(() => readModel(file({ mean: [0] }))).toThrow(/mean/)
  })

  it('refuses a scale that is not as long as the mean', () => {
    expect(() => readModel(file({ scale: [1, 1, 1] }))).toThrow(/scale/)
  })

  it('refuses a last layer without one output per letter', () => {
    expect(() => readModel(file({ letters: ['A', 'B'] }))).toThrow(/letters/)
  })

  it('refuses a layer whose biases do not match its outputs', () => {
    expect(() => readModel(file({ layers: [{ weights: [[1, 0], [0, 1], [0, 0]], biases: [0, 0] }] }))).toThrow(/biases/)
  })
})
