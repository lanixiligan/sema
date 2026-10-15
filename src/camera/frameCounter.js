// Resolves on the next video frame with the time and the browser's running
// total of frames shown (presentedFrames), or null if no frame arrives within
// timeoutMs (the video stopped, or the browser lacks requestVideoFrameCallback).
export function nextFrameCount(video, timeoutMs = 1000) {
  return new Promise((resolve) => {
    if (!('requestVideoFrameCallback' in video)) {
      resolve(null)
      return
    }
    const timeout = setTimeout(() => resolve(null), timeoutMs)
    video.requestVideoFrameCallback((now, metadata) => {
      clearTimeout(timeout)
      resolve({ time: now, frames: metadata.presentedFrames })
    })
  })
}

// Frames per second between two readings from nextFrameCount.
export function fpsBetween(start, end) {
  if (!start || !end || end.time <= start.time) return null
  return ((end.frames - start.frames) * 1000) / (end.time - start.time)
}
