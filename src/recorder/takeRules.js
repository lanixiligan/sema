import { normalizeHand } from '../vision/normalizeHand.js'
import { toPhysicalHand } from '../vision/handedness.js'

// One take: a countdown, then a wait until the take's hand is whole in view
// (it may already be), a short pause so the hand can finish forming the
// shape, then the capture window. The countdown leaves time to start the take
// with one hand and raise the other.
export const COUNTDOWN_MS = 3000
// After the countdown, how long to wait for the hand before cancelling.
export const WAIT_FOR_HAND_MS = 10000
export const SETTLE_MS = 500
export const CAPTURE_MS = 3000
// One sample per this many milliseconds of capture. J and Z may need faster
// sampling in Phase 4.
export const SAMPLE_INTERVAL_MS = 100
export const EXPECTED_SAMPLES = Math.round(CAPTURE_MS / SAMPLE_INTERVAL_MS)
// A take passes when kept − mismatched ≥ MIN_MATCHED (24 of 30).
export const MIN_MATCHED_SHARE = 0.8
export const MIN_MATCHED = Math.round(MIN_MATCHED_SHARE * EXPECTED_SAMPLES)

export const TAKES_TARGET = 3

// Times are milliseconds since the take started. readyAt is when, after the
// countdown, the take's hand was first whole in view: null until then.

// How far through capture a take is, from 0 to 1, for the progress bar under
// the video. 0 until capture starts; 1 once it's over.
export function captureProgress(elapsed, readyAt) {
  if (readyAt === null) return 0
  const intoCapture = elapsed - readyAt - SETTLE_MS
  return Math.min(1, Math.max(0, intoCapture / CAPTURE_MS))
}

export function takePhase(elapsed, readyAt) {
  if (elapsed < COUNTDOWN_MS) return 'countdown'
  if (readyAt === null) return elapsed - COUNTDOWN_MS < WAIT_FOR_HAND_MS ? 'waiting' : 'timedOut'
  const sinceReady = elapsed - readyAt
  if (sinceReady < SETTLE_MS) return 'settling'
  if (sinceReady < SETTLE_MS + CAPTURE_MS) return 'capturing'
  return 'done'
}

// Sampling by time: the capture window is cut into slots of intervalMs, and
// the first detection in each slot becomes a sample. Returns that slot's
// index, or null if this detection shouldn't be sampled (outside the window,
// or its slot already has a sample). A slow camera just fills fewer slots;
// after a stall, samples don't bunch up.
export function sampleSlot(t, lastSlot, intervalMs = SAMPLE_INTERVAL_MS, captureMs = CAPTURE_MS) {
  if (t < 0 || t >= captureMs) return null
  const slot = Math.floor(t / intervalMs)
  return slot > lastSlot ? slot : null
}

// Turns one detection (from useHandDetection's listener) into a frame.
// t: milliseconds since capture started.
export function frameFromDetection({ landmarks, handedness, width, height }, t) {
  if (!landmarks || !handedness) return { hasHand: false, t }
  const detected = toPhysicalHand(handedness.categoryName).toLowerCase()
  // Flip by the detected hand, for now (an open decision in the plan).
  const normalized = normalizeHand(landmarks, { width, height, hand: detected })
  if (!normalized) return { hasHand: false, t }
  return {
    hasHand: true,
    t,
    detected,
    detectedScore: handedness.score,
    width,
    height,
    raw: landmarks.flatMap((p) => [p.x, p.y, p.z]),
    landmarks: normalized,
  }
}

export function tallyTake(frames, hand) {
  const withHand = frames.filter((f) => f.hasHand)
  return {
    kept: withHand.length,
    mismatched: withHand.filter((f) => f.detected !== hand).length,
    droppedNoHand: frames.length - withHand.length,
  }
}

export function judgeTake({ kept, mismatched, droppedNoHand }, expected = EXPECTED_SAMPLES) {
  const matched = kept - mismatched
  if (matched >= MIN_MATCHED) return { status: 'accepted', reason: null }

  const parts = []
  if (droppedNoHand > 0) parts.push(`${droppedNoHand} had no hand`)
  if (mismatched > 0) parts.push(`${mismatched} had the other hand`)
  const missing = expected - kept - droppedNoHand
  if (missing > 0) parts.push(`${missing} never arrived (the camera or hand tracking was too slow)`)
  const reason = `${matched} of ${expected} frames matched` + (parts.length ? `: ${parts.join(', ')}` : '')
  return { status: 'rejected', reason }
}
