import { useEffect, useState } from 'react'

const NO_STATS = { width: 0, height: 0, fps: null, fpsIsMeasured: true }

// Reads the real picture size and frame rate of a playing <video>, about once
// a second, while `isLive` is true.
export function useVideoStats(videoRef, isLive) {
  const [stats, setStats] = useState(NO_STATS)

  useEffect(() => {
    const video = videoRef.current
    if (!isLive || !video) return

    // requestVideoFrameCallback runs our function once for each new video
    // frame the browser shows, so counting calls gives the real frame rate.
    // Chromium has it, and Firefox since version 132.
    const canCountFrames = 'requestVideoFrameCallback' in video
    let frameCount = 0
    let callbackId = null

    function onVideoFrame() {
      frameCount += 1
      callbackId = video.requestVideoFrameCallback(onVideoFrame)
    }
    if (canCountFrames) {
      callbackId = video.requestVideoFrameCallback(onVideoFrame)
    }

    let lastTick = performance.now()
    const intervalId = setInterval(() => {
      const now = performance.now()
      let fps
      if (canCountFrames) {
        fps = (frameCount * 1000) / (now - lastTick)
        frameCount = 0
      } else {
        // Fallback: this is not a measurement. It is the frame rate the camera
        // was set up for, which can be higher than what actually arrives
        // (many webcams slow down in low light).
        const track = video.srcObject?.getVideoTracks()[0]
        fps = track?.getSettings().frameRate ?? null
      }
      lastTick = now

      // videoWidth/videoHeight are the size of the frames the camera is really
      // sending, which may differ from the 640×480 we asked for.
      setStats({
        width: video.videoWidth,
        height: video.videoHeight,
        fps,
        fpsIsMeasured: canCountFrames,
      })
    }, 1000)

    return () => {
      clearInterval(intervalId)
      if (callbackId !== null) video.cancelVideoFrameCallback(callbackId)
      setStats(NO_STATS)
    }
  }, [videoRef, isLive])

  return stats
}
