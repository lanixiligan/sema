// Measures the finger rules (src/vision/landmarks/letterShapes.js), the way
// training/ measures the letter model: on real hands.
// Usage: npm run check-rules -- data/extracted/<file>.json [...] data/raw/<session>.json [...]
// Any number of extracted files and session files, in any order. Every hand
// goes through matchLetter (letterMatch.js), the same call Learn and the quiz
// make on every camera frame, once for each still letter. It writes
// training/reports/rules.md (numbers only, no hand points): per letter, how
// often its hands pass as that letter, which other letters they would also
// pass as, and each condition's average score, which shows the condition to
// look at when a letter fails. Run it before and after changing a rule.
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { isWholeHand } from '../src/vision/landmarks/handChecks.js'
import { matchLetter } from '../src/vision/landmarks/letterMatch.js'
import { LETTERS, TRACED_LETTERS } from '../src/vision/landmarks/letterShapes.js'

const REPORT = new URL('../training/reports/rules.md', import.meta.url)

// The letters held still: J and Z are traced, and not compared with others.
const STILL_LETTERS = LETTERS.filter((letter) => !TRACED_LETTERS.includes(letter))
// A condition averaging under this is shown in bold: it's the checklist's
// "met" score (MET in letterMatch.js), so most hands leave it unticked.
const LOW_SCORE = 0.6

// The 63 raw numbers (x, y, z per point) as points, for the whole-hand rule.
const rawPoints = (raw) => Array.from({ length: 21 }, (_, i) => ({ x: raw[3 * i], y: raw[3 * i + 1] }))

// A file's hands that are fit to judge, as [{ letter, landmarks }].
// An extracted file's (public photos): the rules training/dataset.py's clean()
// applies one sample at a time: a still letter, one hand in the photo,
// detected as a right hand, whole. (clean() also drops duplicates and broken
// detections, about 1% more; they're kept here.) A session file's: frames
// where the hand detected was the hand asked for, like usable_frames().
export function usableHands(file) {
  const fit =
    file.kind === 'extracted'
      ? (s) => s.handsFound === 1 && s.detected === 'right' && isWholeHand(rawPoints(s.raw))
      : (s) => s.detected === s.hand
  return file.samples
    .filter((s) => STILL_LETTERS.includes(s.letter) && fit(s))
    .map(({ letter, landmarks }) => ({ letter, landmarks }))
}

// hands: [{ letter, landmarks }]. Returns, for each letter that has hands:
// { hands, own, none, others, conditions }: how many hands; how many make
// their own letter; how many make no letter at all; how many would pass as
// each other letter ({ X: 12 }); and each of the letter's conditions with its
// mean score, in the checklist's order.
export function tallyRules(hands) {
  const tally = {}
  for (const { letter, landmarks } of hands) {
    const own = matchLetter(letter, landmarks)
    const entry = (tally[letter] ??= {
      hands: 0,
      own: 0,
      none: 0,
      others: {},
      conditions: own.checks.map(({ text }) => ({ text, total: 0 })),
    })
    entry.hands += 1
    if (own.makes) entry.own += 1
    own.checks.forEach((check, i) => (entry.conditions[i].total += check.score))
    const passesAs = STILL_LETTERS.filter((other) => other !== letter && matchLetter(other, landmarks).makes)
    for (const other of passesAs) entry.others[other] = (entry.others[other] ?? 0) + 1
    if (!own.makes && passesAs.length === 0) entry.none += 1
  }
  for (const entry of Object.values(tally)) {
    entry.conditions = entry.conditions.map(({ text, total }) => ({ text, mean: total / entry.hands }))
  }
  return tally
}

const percent = (share, decimals = 1) => `${(share * 100).toFixed(decimals)}%`
// "{index} folded down" as the checklist's words, without the braces.
const plain = (text) => text.replace(/[{}]/g, '')

// groups: [{ name, tally }], one per file. Returns the report's lines.
export function formatReport(groups) {
  const lines = [
    '# Finger rules report',
    '',
    'How the finger rules (`src/vision/landmarks/letterShapes.js`) judge real hands. Every hand goes',
    'through `matchLetter`, as on Learn, once per still letter. Made by `npm run check-rules`.',
    '',
    '- **Passes as itself**: the share of a letter’s hands that would count toward its hold.',
    '- **Passes no letter**: hands that make neither their own letter nor any other.',
    '- **Also passes as**: other letters the same hands would pass, were that letter asked for.',
    '',
    'Photos are other people’s hands, one picture each; recordings are frames of video from Sema’s',
    'own recorder. A low number on photos alone can be the photos’ angle, not the rule.',
  ]
  for (const { name, tally } of groups) {
    const letters = STILL_LETTERS.filter((letter) => tally[letter])
    const hands = letters.reduce((sum, letter) => sum + tally[letter].hands, 0)
    const own = letters.reduce((sum, letter) => sum + tally[letter].own, 0)
    lines.push(
      '',
      `## ${name}`,
      '',
      `${hands.toLocaleString('en-US')} hands of ${letters.length} letters. **${percent(own / hands)}** pass as their own letter.`,
      '',
      '| Letter | Hands | Passes as itself | Passes no letter | Also passes as |',
      '| --- | --- | --- | --- | --- |',
    )
    for (const letter of letters) {
      const entry = tally[letter]
      const others = Object.entries(entry.others)
        // Under half a percent would print as "0%": left out.
        .filter(([, count]) => count / entry.hands >= 0.005)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([other, count]) => `${other} ${percent(count / entry.hands, 0)}`)
      lines.push(
        `| ${letter} | ${entry.hands} | ${percent(entry.own / entry.hands)} | ${percent(entry.none / entry.hands)} | ${others.join(', ') || '—'} |`,
      )
    }
    lines.push(
      '',
      `Each condition’s average score, 0 to 1 (bold under ${LOW_SCORE}: most hands leave it unticked):`,
      '',
      '| Letter | Conditions |',
      '| --- | --- |',
    )
    for (const letter of letters) {
      const conditions = tally[letter].conditions.map(({ text, mean }) => {
        const score = mean.toFixed(2)
        return `${plain(text)} ${mean < LOW_SCORE ? `**${score}**` : score}`
      })
      lines.push(`| ${letter} | ${conditions.join(' · ')} |`)
    }
  }
  return lines
}

// A file's name in the report: its dataset, or the session's person and name.
const groupName = (file) => (file.kind === 'extracted' ? `Photos: ${file.dataset}` : `Recordings: ${file.person} ${file.session}`)

function main(paths) {
  if (paths.length === 0) {
    console.error('Usage: npm run check-rules -- data/extracted/<file>.json [...] data/raw/<session>.json [...]')
    process.exit(2)
  }
  const groups = paths.map((path) => {
    const file = JSON.parse(readFileSync(path, 'utf8'))
    return { name: groupName(file), tally: tallyRules(usableHands(file)) }
  })
  const report = formatReport(groups).join('\n') + '\n'
  writeFileSync(REPORT, report)
  console.log(report)
  console.log(`Saved training/reports/rules.md`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
