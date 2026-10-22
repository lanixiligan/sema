// MediaPipe works out the 21 points again on every frame, so even a still hand
// shakes by a few pixels, and more when fingers hide each other (A, E, S…).
// This steadies the points before they're drawn, with a One Euro filter
// (Casiez, Roussel and Vogel, 2012): smoothing that adapts to speed. A still
// point is smoothed a lot, which removes the shake; a fast-moving point only a
// little, so the drawing keeps up with the hand.
// Only the drawing is smoothed: the recorder and the checks get raw points.

// Tuned by eye in Chrome. To tune: set BETA to 0 and lower MIN_CUTOFF until a
// still hand stops shaking, then raise BETA until fast moves stop lagging.
const MIN_CUTOFF = 1 // Hz: lower is steadier when still, but slower to settle
const BETA = 20 // how fast the smoothing eases off as a point speeds up
const D_CUTOFF = 1 // Hz: smoothing of the speed estimate itself

// A hand found this close (a fraction of the frame) to where a hand's wrist
// was on the last frame is taken to be that same hand.
const SAME_HAND_DISTANCE = 0.15
// A hand not seen for this long is forgotten, so when it comes back it starts
// fresh instead of sliding in from where it was (like HAND_LOST_AFTER_MS).
const FORGET_AFTER_MS = 300

// How much of the new value to take, for a filter with this cutoff frequency
// (Hz) after dt seconds. 1 takes the new value as it is; near 0 barely moves.
function smoothingFactor(cutoff, dt) {
  const timeConstant = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + timeConstant / dt)
}

// A One Euro filter for one number. Returns a function that takes each new
// value with its time (ms, always increasing) and returns the smoothed value.
export function createOneEuroFilter({ minCutoff, beta, dCutoff }) {
  let last = null // { value, speed, time }: the last smoothed value and speed
  return function filter(value, time) {
    if (!last) {
      last = { value, speed: 0, time }
      return value
    }
    const dt = (time - last.time) / 1000
    // How fast the point is moving (per second), itself smoothed a little.
    const rawSpeed = (value - last.value) / dt
    const speed = last.speed + smoothingFactor(dCutoff, dt) * (rawSpeed - last.speed)
    // Faster means a higher cutoff, so less smoothing and less lag.
    const cutoff = minCutoff + beta * Math.abs(speed)
    const smoothed = last.value + smoothingFactor(cutoff, dt) * (value - last.value)
    last = { value: smoothed, speed, time }
    return smoothed
  }
}

// The followed hand whose wrist is nearest this wrist, if it's close enough
// and no other hand on this frame has claimed it. Otherwise null.
function findTrack(tracks, wrist, claimed) {
  let nearest = null
  let nearestDistance = SAME_HAND_DISTANCE
  for (const track of tracks) {
    const distance = Math.hypot(track.wrist.x - wrist.x, track.wrist.y - wrist.y)
    if (!claimed.has(track) && distance <= nearestDistance) {
      nearest = track
      nearestDistance = distance
    }
  }
  return nearest
}

// Filters for a newly found hand: one per number (x, y, z of every point).
function newTrack(points) {
  const filter = () => createOneEuroFilter({ minCutoff: MIN_CUTOFF, beta: BETA, dCutoff: D_CUTOFF })
  return { filters: points.map(() => ({ x: filter(), y: filter(), z: filter() })) }
}

// Returns a function that takes a frame's hands (a list of 21-point lists, as
// MediaPipe gives them) and its time (ms), and returns the same hands, in the
// same order, with steadied points. Each hand keeps its own filters from frame
// to frame, matched by where its wrist was, since MediaPipe can list the two
// hands in either order.
export function createHandSmoother() {
  let tracks = [] // the hands being followed: { filters, wrist, seenAt }

  return function smoothHands(hands, time) {
    tracks = tracks.filter((track) => time - track.seenAt <= FORGET_AFTER_MS)
    const claimed = new Set()
    return hands.map((points) => {
      let track = findTrack(tracks, points[0], claimed)
      if (!track) {
        track = newTrack(points)
        tracks.push(track)
      }
      claimed.add(track)
      track.wrist = points[0]
      track.seenAt = time
      return points.map((p, i) => {
        const filters = track.filters[i]
        return { x: filters.x(p.x, time), y: filters.y(p.y, time), z: filters.z(p.z, time) }
      })
    })
  }
}
