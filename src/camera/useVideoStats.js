import { useEffect, useState } from 'react'

const NO_STATS = { width: 0, height: 0, fps: null, fpsIsMeasured: true }

// Reads the real picture size and frame rate of a playing <video>, about once
// a second, while `isLive` is true.
export function useVideoStats(videoRef, isLive) {
  const [stats, setStats] = useState(NO_STATS)

  useEffect(() => {
    const video = videoRef.current
    if (!isLive || !video) return

    // requestVideoFrameCallback runs our function when new video frames are
    // shown, and tells us the browser's running total of frames shown so far
    // (presentedFrames). We use that total rather than counting our own calls:
    // when the page is busy (hand detection runs on the same thread), several
    // frames can go by between calls, and counting calls would undercount.
    // Chromium has it, and Firefox since version 132.
    const canCountFrames = 'requestVideoFrameCallback' in video
    let latest = null // { frames, time } from the most recent frame callback
    let atLastTick = null
    let callbackId = null

    function onVideoFrame(now, metadata) {
      // Frame count and time come from the same moment, so a late timer tick
      // can't skew the result.
      latest = { frames: metadata.presentedFrames, time: now }
      callbackId = video.requestVideoFrameCallback(onVideoFrame)
    }
    if (canCountFrames) {
      callbackId = video.requestVideoFrameCallback(onVideoFrame)
    }

    const intervalId = setInterval(() => {
      let fps = null
      if (canCountFrames) {
        if (latest && atLastTick && latest.time > atLastTick.time) {
          fps = ((latest.frames - atLastTick.frames) * 1000) / (latest.time - atLastTick.time)
        }
        atLastTick = latest
      } else {
        // Fallback: this is not a measurement. It is the frame rate the camera
        // was set up for, which can be higher than what actually arrives
        // (many webcams slow down in low light).
        const track = video.srcObject?.getVideoTracks()[0]
        fps = track?.getSettings().frameRate ?? null
      }

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
