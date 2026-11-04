import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// The quiz (2026-10-27) tests what was learned. Two kinds (since 2026-11-04;
// before, 'letters' asked 10 random letters to sign, which felt the same as
// words):
// - 'words': WORD_COUNT short words (public/languages/asl/words.json), signed
//   letter by letter from memory with the camera. Each letter is checked as on
//   Learn (useLetterCheck), and either passes or is skipped.
// - 'guess': GUESS_COUNT random hand signs, shown as pictures; the person
//   names the letter, with no camera. Each is 'passed' (named right), 'wrong'
//   or 'skipped'.
// Both are a list of items, each a string of letters: a guess quiz is a list
// of one-letter items.
export const WORD_COUNT = 5
export const GUESS_COUNT = 10
// The letters Guess the letter asks and offers as keys: all 26 (since 2026-11-04;
// before, 24, because J and Z move and a still picture can't show that). J and Z
// are shown as their drawings (the handshape they start from) and have no 3D hand
// yet, so with 3D chosen their picture says so (LetterPicture).
export const GUESS_LETTERS = LETTERS
// The keys' order when the person chooses the keyboard's (2026-11-04): QWERTY's three
// rows, ten, nine and seven keys. The keys are drawn in this one list order, and the
// styles start the second and third rows half a key and one and a half keys in.
export const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
export const KEYBOARD_LETTERS = [...KEYBOARD_ROWS.join('')]
// How long "That's B!" stays before the next letter.
export const NEXT_LETTER_MS = 1000

// What End quiz asks before it stops a quiz early (2026-11-04), with the browser's
// own confirm box, as Leave the quiz and Delete Sema's data do. Both quizzes use it.
export const END_QUESTION = 'End the quiz now?\n\nThe letters you haven’t reached will count as skipped.'
// The same wait in Guess the letter (2026-11-04), longer: the person's eyes are on
// the tiles they just clicked, so the green sticker on the picture needs time to be seen.
export const GUESS_RIGHT_MS = 1700

// `count` random letters from `from`, never the same one twice in a row (the
// same picture twice would look like the quiz got stuck).
export function pickLetters(count, random = Math.random, from = LETTERS) {
  const letters = []
  while (letters.length < count) {
    const letter = from[Math.floor(random() * from.length)]
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

// How many letters have `mark` ('skipped', 'wrong').
export function markCount(quiz, mark) {
  return quiz.marks.flat().filter((m) => m === mark).length
}

// The headline on the results, from how much was signed: a title and one
// line under it. Warm at every score, and honest: a letter skipped is a
// letter to review, not a failure.
export function resultsVerdict(passed, total) {
  const share = total > 0 ? passed / total : 0
  if (passed === 0) {
    return { title: 'Let’s warm up', text: 'Nothing signed this time. Learn goes one letter at a time, with hints. Then come back.' }
  }
  if (share === 1) return { title: 'Perfect round!', text: 'Every letter signed. Well done.' }
  if (share >= 0.8) return { title: 'Great signing!', text: 'Almost every letter. The few you missed are quick to review in Learn.' }
  if (share >= 0.5) return { title: 'Nice work!', text: 'More than half signed. Review the rest in Learn, then try again.' }
  return { title: 'Good start!', text: 'Every round makes the letters stick. Review the rest in Learn, then try again.' }
}

// The same for Guess the letter, where letters are named, not signed.
export function guessVerdict(named, total) {
  const share = total > 0 ? named / total : 0
  if (named === 0) {
    return { title: 'Let’s warm up', text: 'None named this time. The letter guide on Learn shows every handshape. Then come back.' }
  }
  if (share === 1) return { title: 'Perfect round!', text: 'You read every hand. Well done.' }
  if (share >= 0.8) return { title: 'Sharp eyes!', text: 'Almost every letter. The few you missed are quick to look up in Learn.' }
  if (share >= 0.5) return { title: 'Nice work!', text: 'More than half named. Look over the rest in Learn, then try again.' }
  return { title: 'Good start!', text: 'Every round makes the shapes stick. Look over the rest in Learn, then try again.' }
}
