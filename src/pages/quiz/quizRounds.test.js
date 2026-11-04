import { describe, expect, it } from 'vitest'
import {
  currentLetter,
  markLetter,
  newQuiz,
  pickLetters,
  pickWords,
  quizScore,
  resultsVerdict,
  GUESS_LETTERS,
  KEYBOARD_LETTERS,
  usableWords,
} from './quizRounds.js'

// Gives the same numbers every time, from a list, round and round.
function fixedRandom(values) {
  let i = 0
  return () => values[i++ % values.length]
}

describe('pickLetters', () => {
  it('gives the count asked for, never the same letter twice in a row', () => {
    // 0 is A each time, then 0.04 (B): the repeated A is skipped.
    const letters = pickLetters(3, fixedRandom([0, 0, 0.04]))
    expect(letters).toEqual(['A', 'B', 'A'])
  })

  it('picks from the list given', () => {
    expect(pickLetters(2, fixedRandom([0, 0.99]), ['K', 'L'])).toEqual(['K', 'L'])
  })
})

describe('KEYBOARD_LETTERS', () => {
  it('has the same 26 letters as the A to Z keys, in a keyboard\'s order', () => {
    expect(KEYBOARD_LETTERS).toHaveLength(26)
    expect([...KEYBOARD_LETTERS].sort()).toEqual([...GUESS_LETTERS].sort())
    expect(KEYBOARD_LETTERS.slice(0, 6).join('')).toBe('QWERTY')
  })
})

describe('GUESS_LETTERS', () => {
  it('is the whole alphabet, J and Z included', () => {
    expect(GUESS_LETTERS).toHaveLength(26)
    expect(GUESS_LETTERS).toContain('J')
    expect(GUESS_LETTERS).toContain('Z')
  })
})

describe('usableWords', () => {
  it('keeps A–Z words without a doubled letter, once each, in capitals', () => {
    expect(usableWords(['cab', 'HELLO', 'it’s', 'CAB', 'fish', 42])).toEqual(['CAB', 'FISH'])
  })
})

describe('pickWords', () => {
  it('picks different words, no more than there are', () => {
    expect(pickWords(['CAB', 'DOG'], 5, fixedRandom([0]))).toEqual(['CAB', 'DOG'])
  })
})

describe('markLetter', () => {
  it('goes letter by letter, then to the next word, then finishes', () => {
    let quiz = newQuiz('words', ['AB', 'C'])
    expect(currentLetter(quiz)).toBe('A')
    quiz = markLetter(quiz, 'passed')
    expect(currentLetter(quiz)).toBe('B')
    quiz = markLetter(quiz, 'skipped')
    expect(currentLetter(quiz)).toBe('C')
    quiz = markLetter(quiz, 'passed')
    expect(quiz.at).toBeNull()
    expect(quiz.marks).toEqual([['passed', 'skipped'], ['passed']])
    expect(quiz.step).toBe(3)
    expect(quizScore(quiz)).toEqual({ passed: 2, total: 3 })
  })

  it('does nothing once the quiz is finished', () => {
    const done = markLetter(newQuiz('letters', ['A']), 'passed')
    expect(markLetter(done, 'skipped')).toBe(done)
  })
})

describe('resultsVerdict', () => {
  it('has a different title for nothing, some, most and all signed', () => {
    const titles = [0, 3, 6, 9, 10].map((passed) => resultsVerdict(passed, 10).title)
    expect(new Set(titles).size).toBe(5)
  })

  it('does not divide by zero for an empty quiz', () => {
    expect(resultsVerdict(0, 0).title).toBe('Let’s warm up')
  })
})
