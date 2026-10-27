import { TIPS } from './handPoints.js'

// Z moves: the index finger draws a Z in the air. Instead of recognizing the
// motion, Practice draws a Z on the camera view and the person traces it with
// the index fingertip, from its start, in order, staying near the line.
//
// Every point here is in frame heights: y is MediaPipe's y (0 at the top, 1
// at the bottom) and x is MediaPipe's x times the frame's width / height
// (aspect), so a distance means the same sideways as up and down. On the
// video, a point is at (x × videoHeight, y × videoHeight) pixels.

// The Z's corners as fractions of the un-mirrored frame, for a left hand.
// The video is shown mirrored, so the frame's right is the screen's left:
// this reads as a normal Z on screen, drawn top left → top right → bottom
// left → bottom right. High in the frame, so the wrist stays in view on the
// bottom stroke. Tuned by eye (2026-10-24: made smaller twice, from
// 0.35–0.65 by 0.2–0.55 to 0.40–0.60 by 0.26–0.50).
const Z_CORNERS = [
  { x: 0.6, y: 0.26 },
  { x: 0.4, y: 0.26 },
  { x: 0.6, y: 0.5 },
  { x: 0.4, y: 0.5 },
]

// How far the fingertip may be from the line, and from the dot to start, in
// frame heights (0.13 is about 62 pixels of a 480-pixel-high frame). Tuned by
// eye (2026-10-24: up from 0.07, then 0.09: tracing a Z by hand was too hard).
export const TRACE_TOLERANCE = 0.13
// How far along the line the fingertip may get in one frame. A jump further
// than this is off the line, so the Z can't be finished by skipping to its end.
const MAX_STEP = 0.35
// How far back along the line the fingertip may wobble and still count as on it.
const MAX_BACK = 0.2
// Off the line, or without the handshape, for longer than this restarts the
// trace, so a few odd frames can't. Longer than the 300 ms of every other hold
// in Sema: a hand in motion often drops the handshape for a moment.
const GAP_MS = 800

// No trace yet: `along` is how far along the line the fingertip has got (null
// before it starts at the dot), `lastOnAt` when it was last on the line, and
// `done` once it reached the end dot following the line.
export const NO_TRACE = { along: null, lastOnAt: null, done: false }

// The Z for the signing hand ('left' or 'right'), in frame heights. A right
// hand gets the Z mirrored on screen (2026-10-24: swapped, at Lanix's request).
export function zPath(hand, aspect) {
  return Z_CORNERS.map((p) => ({ x: (hand === 'right' ? 1 - p.x : p.x) * aspect, y: p.y }))
}

// A fingertip of MediaPipe's 21 raw points (the index's, unless another point
// is given: J's pinky), in frame heights.
export function fingertip(rawLandmarks, aspect, point = TIPS.index) {
  const tip = rawLandmarks[point]
  return { x: tip.x * aspect, y: tip.y }
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export function pathLength(path) {
  let length = 0
  for (let i = 1; i < path.length; i++) length += distance(path[i - 1], path[i])
  return length
}

// The point `along` the line from its start.
export function pointAlong(path, along) {
  return pathUpTo(path, along).at(-1)
}

// The line from its start to `along`, as points (for drawing the traced part).
export function pathUpTo(path, along) {
  const points = [path[0]]
  let start = 0
  for (let i = 1; i < path.length; i++) {
    const length = distance(path[i - 1], path[i])
    if (along >= start + length) {
      points.push(path[i])
    } else {
      const t = Math.max(0, along - start) / length
      points.push({ x: path[i - 1].x + t * (path[i].x - path[i - 1].x), y: path[i - 1].y + t * (path[i].y - path[i - 1].y) })
      return points
    }
    start += length
  }
  return points
}

// The point of the line nearest `point`, looking only between `from` and `to`
// along it: { along, distance }.
export function closestAlong(path, point, from, to) {
  let best = { along: from, distance: Infinity }
  let start = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const length = distance(a, b)
    const low = Math.max(start, from)
    const high = Math.min(start + length, to)
    if (low <= high) {
      // Where the point falls on this stroke (0 at a, 1 at b), kept inside
      // the part of the stroke being looked at.
      const t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (length * length)
      const along = Math.min(high, Math.max(low, start + t * length))
      const s = (along - start) / length
      const d = distance(point, { x: a.x + s * (b.x - a.x), y: a.y + s * (b.y - a.y) })
      if (d < best.distance) best = { along, distance: d }
    }
    start += length
  }
  return best
}

// One frame of the trace. tip: the fingertip in frame heights, or null when
// the signing hand isn't in view or isn't making the letter's handshape.
// `scale` multiplies the tolerance and the steps, for a line drawn bigger or
// smaller than Z (J's, sized to the hand: jTrace.js). After a slip the trace
// starts over at the dot; with `restart: false` it just ends (NO_TRACE): J's
// line goes, and J starts over from the I.
export function updateTrace(trace, tip, now, path, { restart = true, scale = 1 } = {}) {
  const tolerance = TRACE_TOLERANCE * scale
  if (trace.along === null) {
    // It starts with the fingertip on the dot at the line's start.
    const onStart = tip !== null && distance(tip, path[0]) <= tolerance
    return onStart ? { along: 0, lastOnAt: now, done: false } : NO_TRACE
  }
  if (tip !== null) {
    const nearest = closestAlong(path, tip, trace.along - MAX_BACK * scale, trace.along + MAX_STEP * scale)
    if (nearest.distance <= tolerance) {
      // On the line here, so reaching the end dot means it was followed there.
      const done = distance(tip, path.at(-1)) <= tolerance
      return { along: Math.max(trace.along, nearest.along), lastOnAt: now, done }
    }
  }
  if (now - trace.lastOnAt < GAP_MS) return trace
  // Off the line too long: start over, which may already be on the dot again.
  return restart ? updateTrace(NO_TRACE, tip, now, path, { scale }) : NO_TRACE
}

// How much of the Z is traced, 0 to 1.
export function traceShare(trace, path) {
  if (trace.along === null) return 0
  return Math.min(1, trace.along / pathLength(path))
}

// Done when the fingertip, following the line, reaches the end dot.
export function traceDone(trace) {
  return trace.done
}
