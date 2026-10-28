import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// The quiz (2026-10-27): Sema asks for letters and the person signs them from
// memory, with no drawing and no hints. Two kinds:
// - 'letters': LETTER_COUNT random letters, one at a time;
// - 'words': WORD_COUNT short words (public/languages/asl/words.json), signed
//   letter by letter.
// Both are a list of items, each a string of letters: a letters quiz is a list
// of one-letter items. Each letter is checked as on Practice
// (useLetterCheck), and either passes or is skipped.
export const LETTER_COUNT = 10
export const WORD_COUNT = 5
// How long "That's B!" stays before the next letter.
export const NEXT_LETTER_MS = 1000

// `count` random letters, never the same one twice in a row (the second would
// pass as soon as it's asked, with the hand already making it).
export function pickLetters(count, random = Math.random) {
  const letters = []
  while (letters.length < count) {
    const letter = LETTERS[Math.floor(random() * LETTERS.length)]
    if (letter !== letters.at(-1)) letters.push(letter)
  }
  return letters
}

// The words a quiz can ask: A–Z only, and no letter twice in a row (the
// second L of "HELLO" would pass at once, since the hand already makes it).
export function usableWords(words) {
  const usable = (words ?? [])
    .filter((word) => typeof word === 'string')
    .map((word) => word.trim().toUpperCase())
    .filter((word) => /^[A-Z]+$/.test(word) && !/(.)\1/.test(word))
  return [...new Set(usable)]
}

// `count` different words in a random order (fewer if the list is shorter),
// none starting with the letter the one before ended on: it would pass at once.
export function pickWords(words, count, random = Math.random) {
  const left = [...words]
  const picked = []
  while (picked.length < count) {
    const lastLetter = picked.at(-1)?.at(-1)
    const fits = left.filter((word) => word[0] !== lastLetter)
    if (fits.length === 0) break
    const word = fits[Math.floor(random() * fits.length)]
    picked.push(word)
    left.splice(left.indexOf(word), 1)
  }
  return picked
}

// A new quiz: its items, where it is (`at`: the item and the letter in it,
// null once finished), each letter's mark ('passed' or 'skipped', null until
// it's done), `peeked` (the same shape: did the person look at the letter's
// drawing first), and `step`, which counts every letter asked, so asking the same
// letter again starts a new check.
export function newQuiz(kind, items) {
  return {
    kind,
    items,
    at: { item: 0, letter: 0 },
    marks: items.map((item) => [...item].map(() => null)),
    peeked: items.map((item) => [...item].map(() => false)),
    step: 0,
  }
}

export function currentLetter(quiz) {
  return quiz.at ? quiz.items[quiz.at.item][quiz.at.letter] : null
}

// Marks the current letter (`peeked`: the drawing was looked at) and moves on
// to the next, or finishes the quiz (at: null) after the last.
export function markLetter(quiz, mark, peeked = false) {
  if (!quiz.at) return quiz
  const { item, letter } = quiz.at
  const marks = quiz.marks.map((row, i) => (i === item ? row.map((m, j) => (j === letter ? mark : m)) : row))
  let at = null
  if (letter + 1 < quiz.items[item].length) at = { item, letter: letter + 1 }
  else if (item + 1 < quiz.items.length) at = { item: item + 1, letter: 0 }
  const looked = quiz.peeked.map((row, i) => (i === item ? row.map((p, j) => (j === letter ? peeked : p)) : row))
  return { ...quiz, at, marks, peeked: looked, step: quiz.step + 1 }
}

// Ends the quiz before the last letter (End quiz): the letters not reached count
// as skipped.
export function endQuiz(quiz) {
  const marks = quiz.marks.map((row) => row.map((mark) => mark ?? 'skipped'))
  return { ...quiz, at: null, marks }
}

// How many passed letters were passed after a peek at the drawing.
export function peekCount(quiz) {
  return quiz.marks.flat().filter((mark, i) => mark === 'passed' && quiz.peeked.flat()[i]).length
}

// How many letters passed, out of all of them.
export function quizScore(quiz) {
  const all = quiz.marks.flat()
  return { passed: all.filter((m) => m === 'passed').length, total: all.length }
}
