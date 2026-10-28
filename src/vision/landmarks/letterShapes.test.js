import { describe, expect, it } from 'vitest'
import { RULES } from './letterShapes.js'

// A measured hand (handMeasures.js) with only what the finger rules read: each
// finger's bends, knuckle to tip, adding up to `total` degrees. 120 is a
// curved finger; `straight` replaces some fingers' totals.
const CURVED = 120
const STRAIGHT = 10

function measuredHand(straight = []) {
  const finger = (name) => {
    const total = straight.includes(name) ? STRAIGHT : CURVED
    return { knuckle: total / 3, middle: total / 3, top: total / 3, total }
  }
  return { index: finger('index'), middle: finger('middle'), ring: finger('ring'), pinky: finger('pinky') }
}

const condition = (letter, text) => RULES[letter].find((c) => c.text === text)

describe('C: All four fingers curved', () => {
  const allCurved = condition('C', 'All four fingers curved')

  it('is met when the four fingers are curved', () => {
    expect(allCurved.score(measuredHand())).toBe(1)
  })

  it.each(['index', 'middle', 'ring', 'pinky'])('is not met with the %s straight', (finger) => {
    expect(allCurved.score(measuredHand([finger]))).toBe(0)
  })
})

describe('O: middle, ring and pinky curved too', () => {
  const othersCurved = condition('O', '{middle}, {ring} and {pinky} curved too')

  it('is met when the three fingers are curved', () => {
    expect(othersCurved.score(measuredHand())).toBe(1)
  })

  it.each(['middle', 'ring', 'pinky'])('is not met with the %s straight', (finger) => {
    expect(othersCurved.score(measuredHand([finger]))).toBe(0)
  })
})
