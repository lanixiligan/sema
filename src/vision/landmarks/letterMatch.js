import { measureHand } from './handMeasures.js'
import { RULES, TRACED_LETTERS } from './letterShapes.js'

// Does the hand make the letter? Its finger conditions (letterShapes.js) are
// scored for the hand, ticked on Learn's checklist, and decide the hold
// (2026-10-27; before, the letter model's guess decided).

// A condition is met (ticked) at this score…
const MET = 0.6
// …and stays ticked until it drops below this, so a tick doesn't flicker
// while a finger sits near the line.
const UNMET = 0.45
// The letter is made when the overall score (mostly the average, partly the
// weakest condition) reaches PASS_SCORE and no condition is under PASS_FLOOR.
const PASS_SCORE = 0.78
const PASS_FLOOR = 0.5
// Another letter may score at most this much better before the hand counts
// as that letter instead.
const RIVAL_MARGIN = 0.06

// The letter's conditions scored for this hand (measureHand's): [{ text, score }].
const scoreRules = (letter, hand) => (RULES[letter] ?? []).map(({ text, score }) => ({ text, score: score(hand) }))

// The overall score: mostly the average, partly the weakest condition, so one
// badly missed condition can't hide behind the others.
function overall(checks) {
  const scores = checks.map((check) => check.score)
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length
  return 0.6 * average + 0.4 * Math.min(...scores)
}

// Are the letter's conditions met?
function checksPass(checks) {
  if (checks.length === 0) return false
  return overall(checks) >= PASS_SCORE && Math.min(...checks.map((check) => check.score)) >= PASS_FLOOR
}

// Does any other still letter fit the hand clearly better? An E meets most
// of X's conditions, and a V most of K's. J and Z aren't rivals (they move;
// J's hand is I's).
function hasBetterRival(letter, checks, hand) {
  const mine = overall(checks)
  return Object.keys(RULES).some(
    (other) =>
      other !== letter && !TRACED_LETTERS.includes(other) && overall(scoreRules(other, hand)) - mine >= RIVAL_MARGIN,
  )
}

// The letter's conditions scored for one hand, and whether the hand makes the
// letter: its conditions are met, and no other still letter fits better.
// For J and Z (traced) only their handshape's conditions count: a traced
// letter's hand is held while it moves, so it isn't compared with others.
// landmarks: normalizeHand's 63 numbers. Returns { checks, makes }.
export function matchLetter(letter, landmarks) {
  const hand = measureHand(landmarks)
  const checks = scoreRules(letter, hand)
  const traced = TRACED_LETTERS.includes(letter)
  const makes = checksPass(checks) && (traced || !hasBetterRival(letter, checks, hand))
  return { checks, makes }
}

// The letter's conditions with no hand to score: every one unmet.
export function emptyChecks(letter) {
  return (RULES[letter] ?? []).map(({ text }) => ({ text, score: 0, met: false }))
}

// The checklist's ticks, steadied: each score is smoothed over frames, and a
// tick goes on at MET and off only below UNMET. previous: the last frame's
// list (or null); the conditions must be the same letter's, in the same
// order. Returns the checks with `met` set.
export function steadyChecks(previous, checks) {
  return checks.map((check, i) => {
    const before = previous?.[i]
    const smooth = before ? before.smooth + (check.score - before.smooth) * 0.4 : check.score
    const met = before?.met ? smooth >= UNMET : smooth >= MET
    return { ...check, smooth, met }
  })
}
