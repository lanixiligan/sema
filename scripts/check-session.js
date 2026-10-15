// Checks a recorded session file before it goes into data/raw/.
// Usage: npm run check-session -- path/to/sema-asl-p03-2026-11-02a.json
// Exits with code 1 if anything is wrong. See docs/data-format.md.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const KNOWN_FORMATS = [1]
export const KNOWN_NORMALIZATIONS = [1]

const isNumbers63 = (value) => Array.isArray(value) && value.length === 63 && value.every(Number.isFinite)

export function checkSession(file, otherRecordingIds = new Set()) {
  const errors = []
  if (!KNOWN_FORMATS.includes(file.format)) errors.push(`Unknown format version: ${file.format}`)
  if (!KNOWN_NORMALIZATIONS.includes(file.normalization)) {
    errors.push(`Unknown normalization version: ${file.normalization}`)
  }

  const consent = file.consent ?? {}
  if (consent.train !== true) errors.push('consent.train must be true')
  if (typeof consent.publish !== 'boolean') errors.push('consent.publish must be true or false')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(consent.date ?? '')) errors.push('consent.date must be a date like 2026-11-02')

  const recordings = file.recordings ?? []
  const samples = file.samples ?? []

  const seen = new Set()
  for (const r of recordings) {
    if (seen.has(r.recording)) errors.push(`Recording ${r.recording} appears twice in this file`)
    seen.add(r.recording)
    if (otherRecordingIds.has(r.recording)) {
      errors.push(`Recording ${r.recording} is already in another file in data/raw/`)
    }
  }

  const byId = new Map(recordings.map((r) => [r.recording, r]))
  const samplesPerRecording = new Map()
  samples.forEach((s, i) => {
    if (!isNumbers63(s.raw)) errors.push(`Sample ${i}: raw must be 63 numbers`)
    if (!isNumbers63(s.landmarks)) errors.push(`Sample ${i}: landmarks must be 63 numbers`)
    if (byId.get(s.recording)?.status !== 'accepted') {
      errors.push(`Sample ${i}: recording ${s.recording} has no accepted entry in recordings`)
    }
    samplesPerRecording.set(s.recording, (samplesPerRecording.get(s.recording) ?? 0) + 1)
  })

  for (const r of recordings) {
    const count = samplesPerRecording.get(r.recording) ?? 0
    if (r.status === 'accepted' && r.kept !== count) {
      errors.push(`Recording ${r.recording} says kept ${r.kept} but has ${count} samples`)
    }
  }

  return { errors, table: takeTable(recordings) }
}

function takeTable(recordings) {
  const rows = new Map()
  for (const r of recordings) {
    const key = `${r.letter}|${r.hand}`
    const row = rows.get(key) ?? { letter: r.letter, hand: r.hand, accepted: 0, rejected: 0 }
    if (r.status === 'accepted') row.accepted += 1
    else row.rejected += 1
    rows.set(key, row)
  }
  return [...rows.values()].sort((a, b) => a.letter.localeCompare(b.letter) || a.hand.localeCompare(b.hand))
}

export function formatTable(table) {
  const lines = ['Letter  Hand   Accepted  Rejected']
  for (const row of table) {
    lines.push(`${row.letter.padEnd(8)}${row.hand.padEnd(7)}${String(row.accepted).padStart(8)}${String(row.rejected).padStart(10)}`)
  }
  return lines.join('\n')
}

function recordingIdsInDataRaw(skipPath) {
  const ids = new Set()
  const dir = resolve('data/raw')
  if (!existsSync(dir)) return ids
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (!name.endsWith('.json') || full === skipPath) continue
    for (const r of JSON.parse(readFileSync(full, 'utf8')).recordings ?? []) ids.add(r.recording)
  }
  return ids
}

function main(path) {
  if (!path) {
    console.error('Usage: npm run check-session -- <session file>')
    process.exit(2)
  }
  let file
  try {
    file = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    console.error(`Can't read ${path} as JSON: ${error.message}`)
    process.exit(1)
  }
  const { errors, table } = checkSession(file, recordingIdsInDataRaw(resolve(path)))
  console.log(formatTable(table))
  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):`)
    for (const error of errors.slice(0, 20)) console.error(`- ${error}`)
    if (errors.length > 20) console.error(`- …and ${errors.length - 20} more`)
    process.exit(1)
  }
  console.log('\nOK: this file can go into data/raw/')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2])
}
