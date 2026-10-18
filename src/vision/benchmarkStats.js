// Plain maths for the benchmark, kept apart from React so it's easy to check.

// The value below which p percent of the values fall. Between two values it
// interpolates, like NumPy's default. `sorted` must be sorted ascending.
export function percentile(sorted, p) {
  const index = ((sorted.length - 1) * p) / 100
  const below = Math.floor(index)
  const above = Math.ceil(index)
  return sorted[below] + (sorted[above] - sorted[below]) * (index - below)
}

// measurements: one { ms, hand } per detection in the window.
// frames: camera frames shown in the window. seconds: the window's length.
export function summarize(measurements, frames, seconds) {
  const times = measurements.map((m) => m.ms).sort((a, b) => a - b)
  const total = times.reduce((sum, ms) => sum + ms, 0)
  return {
    cameraFps: frames / seconds,
    detectionFps: measurements.length / seconds,
    medianMs: percentile(times, 50),
    p95Ms: percentile(times, 95),
    meanMs: total / times.length,
    detections: measurements.length,
    seconds,
    // Frames that arrived while the previous detection was still running.
    skippedFrames: Math.max(0, frames - measurements.length),
    handShare: measurements.filter((m) => m.hand).length / measurements.length,
  }
}

// One row for the performance table in docs/benchmarks.md.
export function toTableRow(result) {
  const cells = [
    result.browser,
    result.delegate,
    result.cameraFps.toFixed(1),
    result.detectionFps.toFixed(1),
    result.medianMs.toFixed(1),
    result.p95Ms.toFixed(1),
    result.meanMs.toFixed(1),
  ]
  return `| ${cells.join(' | ')} |`
}
