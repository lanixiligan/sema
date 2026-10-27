import { describe, expect, it } from 'vitest'
import {
  NO_TRACE,
  TRACE_TOLERANCE,
  closestAlong,
  fingertip,
  pathLength,
  pathUpTo,
  pointAlong,
  traceDone,
  traceShare,
  updateTrace,
  zPath,
} from './zTrace.js'

const ASPECT = 640 / 480
const path = zPath('right', ASPECT)
const length = pathLength(path)

// Feeds the trace one fingertip per frame, 33 ms apart, from `start` ms.
function run(trace, tips, start = 0) {
  return tips.reduce((t, tip, i) => updateTrace(t, tip, start + i * 33, path), trace)
}
// Fingertips along the line from `from` to `to`, `step` apart.
function walk(from, to, step = 0.05) {
  const tips = []
  for (let a = from; a < to; a += step) tips.push(pointAlong(path, a))
  tips.push(pointAlong(path, to))
  return tips
}

describe('zPath', () => {
  it('reads as a Z on the mirrored video for a left hand: it starts on the frame\'s right', () => {
    const left = zPath('left', ASPECT)
    expect(left[0].x).toBeGreaterThan(left[1].x)
    expect(left[0].y).toBe(left[1].y)
  })

  it('is the other way round for a right hand', () => {
    const left = zPath('left', ASPECT)
    expect(path[0].x).toBeCloseTo(ASPECT - left[0].x)
    expect(path[3].x).toBeCloseTo(ASPECT - left[3].x)
  })
})

describe('fingertip', () => {
  it('is point 8, its x in frame heights', () => {
    const raw = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }))
    raw[8] = { x: 0.5, y: 0.25, z: 0 }
    expect(fingertip(raw, ASPECT)).toEqual({ x: 0.5 * ASPECT, y: 0.25 })
  })
})

describe('the line', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ]

  it('measures and walks along its strokes', () => {
    expect(pathLength(square)).toBe(2)
    expect(pointAlong(square, 0.5)).toEqual({ x: 0.5, y: 0 })
    expect(pointAlong(square, 1.5)).toEqual({ x: 1, y: 0.5 })
    expect(pathUpTo(square, 1.5)).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.5 }])
    expect(pointAlong(square, 5)).toEqual({ x: 1, y: 1 })
  })

  it('finds the nearest point only inside the window it is given', () => {
    expect(closestAlong(square, { x: 1.1, y: 0.5 }, 0, 2)).toEqual({ along: 1.5, distance: expect.closeTo(0.1) })
    // Looking only at the first stroke, the nearest is its end.
    expect(closestAlong(square, { x: 1.1, y: 0.5 }, 0, 1).along).toBe(1)
  })
})

describe('updateTrace', () => {
  it('starts only with the fingertip on the dot', () => {
    expect(updateTrace(NO_TRACE, null, 0, path)).toBe(NO_TRACE)
    expect(updateTrace(NO_TRACE, pointAlong(path, 0.3), 0, path)).toBe(NO_TRACE)
    expect(updateTrace(NO_TRACE, path[0], 0, path)).toEqual({ along: 0, lastOnAt: 0, done: false })
  })

  it('follows the line in order to the end', () => {
    const trace = run(NO_TRACE, walk(0, length))
    expect(traceDone(trace)).toBe(true)
    expect(traceShare(trace, path)).toBe(1)
  })

  it('is done on reaching the end dot, a little short of the line\'s end', () => {
    const almost = run(NO_TRACE, walk(0, length - TRACE_TOLERANCE * 0.8))
    expect(traceDone(almost)).toBe(true)
    expect(traceDone(run(NO_TRACE, walk(0, length - TRACE_TOLERANCE * 1.5)))).toBe(false)
  })

  it('tolerates a fingertip a little off the line', () => {
    const near = walk(0, length).map((p) => ({ x: p.x, y: p.y + TRACE_TOLERANCE * 0.8 }))
    expect(traceDone(run(NO_TRACE, near))).toBe(true)
  })

  it('can\'t skip to the end', () => {
    const halfway = run(NO_TRACE, walk(0, 0.3))
    const jumped = run(halfway, [path[3]], halfway.lastOnAt + 33)
    expect(jumped.along).toBeCloseTo(halfway.along)
    expect(traceDone(jumped)).toBe(false)
  })

  it('never goes backwards', () => {
    const forward = run(NO_TRACE, walk(0, 0.3))
    expect(run(forward, [pointAlong(path, 0.25)], forward.lastOnAt + 33).along).toBeCloseTo(0.3)
  })

  it('survives a short slip but restarts after a long one', () => {
    const started = run(NO_TRACE, walk(0, 0.3))
    const at = started.lastOnAt
    expect(updateTrace(started, null, at + 600, path)).toBe(started)
    expect(updateTrace(started, { x: 0, y: 0.9 }, at + 600, path)).toBe(started)
    expect(updateTrace(started, null, at + 1000, path)).toBe(NO_TRACE)
    expect(updateTrace(started, { x: 0, y: 0.9 }, at + 1000, path)).toBe(NO_TRACE)
  })

  it('restarts straight away when the slip ends back on the dot', () => {
    const started = run(NO_TRACE, walk(0, 0.6))
    expect(updateTrace(started, path[0], started.lastOnAt + 1000, path)).toEqual({ along: 0, lastOnAt: started.lastOnAt + 1000, done: false })
  })
})
