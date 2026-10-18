import { NORMALIZATION_VERSION } from '../vision/normalizeHand.js'
import { TAKES_TARGET } from './takeRules.js'

// Builds the session file described in docs/data-format.md. Everything here
// returns new objects; nothing is changed in place.
export const FORMAT_VERSION = 1
export const LANGUAGE = 'asl'

const round = (value, decimals) => Math.round(value * 10 ** decimals) / 10 ** decimals

export function normalizePersonCode(text) {
  return text.trim().toLowerCase()
}

// "p" followed by at least two digits, like p03.
export function isValidPersonCode(code) {
  return /^p\d{2,}$/.test(code)
}

// Today's date plus the first letter not yet used in this browser that day.
export function nextSessionId(date, usedIds) {
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    const id = `${date}${letter}`
    if (!usedIds.includes(id)) return id
  }
  return `${date}z`
}

export function makeRecordingId({ person, session, letter, hand, take }) {
  return `${person}-${session}-${letter}-${hand}-${take}`
}

export function newSession({ person, session, consent, date, browser }) {
  return {
    format: FORMAT_VERSION,
    normalization: NORMALIZATION_VERSION,
    language: LANGUAGE,
    person,
    session,
    browser,
    cameraFps: null,
    // Training is the only thing people are asked to agree to; publishing a
    // dataset is out of scope.
    consent: { train: consent.train, date },
    recordings: [],
    samples: [],
  }
}

function takesFor(session, letter, hand) {
  return session.recordings.filter((r) => r.letter === letter && r.hand === hand)
}

// All attempts still in the session, accepted or rejected.
export function attemptCount(session, letter, hand) {
  return takesFor(session, letter, hand).length
}

// One more than the highest take number for this letter and hand, counting
// rejected attempts. Deleting a take can leave a gap, but a number still in
// the session is never reused, so every recording ID stays unique.
function nextTakeNumber(session, letter, hand) {
  return Math.max(0, ...takesFor(session, letter, hand).map((r) => r.take)) + 1
}

export function acceptedCount(session, letter, hand) {
  return takesFor(session, letter, hand).filter((r) => r.status === 'accepted').length
}

// Progress toward the collection plan: kept takes for these letters and
// hands, each letter and hand counting at most TAKES_TARGET (extra takes
// don't make up for missing ones), out of how many are needed in all.
export function takeProgress(session, letters, hands = ['left', 'right']) {
  let kept = 0
  for (const letter of letters) {
    for (const hand of hands) kept += Math.min(acceptedCount(session, letter, hand), TAKES_TARGET)
  }
  return { kept, needed: letters.length * hands.length * TAKES_TARGET }
}

function median(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// take: { letter, hand, counts: { kept, mismatched, droppedNoHand }, status,
// reason, cameraFps, frames } where frames come from takeRules.frameFromDetection.
export function addTake(session, take) {
  const number = nextTakeNumber(session, take.letter, take.hand)
  const recording = makeRecordingId({
    person: session.person,
    session: session.session,
    letter: take.letter,
    hand: take.hand,
    take: number,
  })
  const entry = {
    recording,
    letter: take.letter,
    hand: take.hand,
    take: number,
    status: take.status,
    reason: take.reason,
    kept: take.counts.kept,
    mismatched: take.counts.mismatched,
    droppedNoHand: take.counts.droppedNoHand,
    cameraFps: take.cameraFps === null ? null : round(take.cameraFps, 1),
  }
  // Only accepted takes keep their frames. Mismatched frames are kept too;
  // training filters to detected === hand.
  const samples =
    take.status === 'accepted'
      ? take.frames
          .filter((f) => f.hasHand)
          .map((f) => ({
            person: session.person,
            session: session.session,
            language: session.language,
            letter: take.letter,
            hand: take.hand,
            detected: f.detected,
            detectedScore: round(f.detectedScore, 2),
            recording,
            take: number,
            t: f.t,
            width: f.width,
            height: f.height,
            raw: f.raw.map((v) => round(v, 4)),
            landmarks: f.landmarks.map((v) => round(v, 4)),
          }))
      : []
  const recordings = [...session.recordings, entry]
  return {
    ...session,
    cameraFps: median(recordings.map((r) => r.cameraFps).filter((v) => v !== null)),
    recordings,
    samples: [...session.samples, ...samples],
  }
}

// Removes one take (by its recording ID) and its samples.
export function deleteTake(session, recordingId) {
  if (!session.recordings.some((r) => r.recording === recordingId)) return session
  const recordings = session.recordings.filter((r) => r.recording !== recordingId)
  return {
    ...session,
    cameraFps: median(recordings.map((r) => r.cameraFps).filter((v) => v !== null)),
    recordings,
    samples: session.samples.filter((s) => s.recording !== recordingId),
  }
}

// True if the session has takes that aren't in the last downloaded file.
// Sessions are never changed in place (every take or delete makes a new
// object), so "the same object" means "nothing changed since that download".
export function needsDownload(session, downloaded) {
  return session !== null && session.recordings.length > 0 && session !== downloaded
}

export function sessionFileName(session) {
  return `sema-${session.language}-${session.person}-${session.session}.json`
}
