import { normalizeHand } from '../vision/normalizeHand.js'
import { toPhysicalHand } from '../vision/handedness.js'

// One take: a countdown, a short pause so the hand can finish forming the
// shape, then the capture window.
export const COUNTDOWN_MS = 3000
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
export const POSITION_HINTS = ['Centre of the picture', 'Closer to the camera', 'Off to one side']
export const LIFEPRINT_URL = 'https://www.lifeprint.com/asl101/fingerspelling/'

export function takePhase(elapsedMs) {
  if (elapsedMs < COUNTDOWN_MS) return 'countdown'
  if (elapsedMs < COUNTDOWN_MS + SETTLE_MS) return 'settling'
  if (elapsedMs < COUNTDOWN_MS + SETTLE_MS + CAPTURE_MS) return 'capturing'
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
  if (mismatched > 0) parts.push(`${mismatched} had the other hand detected`)
  const missing = expected - kept - droppedNoHand
  if (missing > 0) parts.push(`${missing} never arrived (the camera or hand tracking was too slow)`)
  const reason = `${matched} of ${expected} frames matched` + (parts.length ? `: ${parts.join(', ')}` : '')
  return { status: 'rejected', reason }
}
