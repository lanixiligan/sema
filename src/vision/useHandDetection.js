import { useEffect, useRef, useState } from 'react'
import { clearHand, drawHand } from './drawHand.js'
import { toPhysicalHand } from './handedness.js'
import { getDetectionErrorMessage } from './visionMessages.js'

// How long the hand must be missing before we say "No hand". Without this the
// readout would flicker whenever a single frame misses the hand.
const HAND_LOST_AFTER_MS = 300

const NO_STATS = { detectionFps: null, detectionMs: null }

// Runs hand detection on each new video frame while `isRunning` is true,
// draws the result on the canvas, and reports what it found.
export function useHandDetection({ videoRef, canvasRef, landmarkerRef, isRunning }) {
  const [handLabel, setHandLabel] = useState(null) // null means no hand
  const [stats, setStats] = useState(NO_STATS)
  const [error, setError] = useState(null)
  // MediaPipe rejects a timestamp that isn't larger than the previous one.
  // A ref, so it survives the loop stopping and starting again.
  const lastTimestampRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!isRunning || !video || !canvas) return

    // requestVideoFrameCallback calls us once per new video frame, so we can
    // never detect the same frame twice. Older browsers fall back to
    // requestAnimationFrame, which runs on every screen refresh, so there we
    // skip refreshes where the video hasn't moved on.
    const hasVideoFrameCallback = 'requestVideoFrameCallback' in video
    let callbackId = null
    let lastVideoTime = -1

    let lastHandSeenAt = 0
    let shownLabel = null

    let windowStart = performance.now()
    let detections = 0
    let detectionMsTotal = 0

    function scheduleNextFrame() {
      callbackId = hasVideoFrameCallback
        ? video.requestVideoFrameCallback(onFrame)
        : requestAnimationFrame(onFrame)
    }

    function onFrame() {
      if (!hasVideoFrameCallback) {
        if (video.currentTime === lastVideoTime) return scheduleNextFrame()
        lastVideoTime = video.currentTime
      }

      const landmarker = landmarkerRef.current
      if (!landmarker) return scheduleNextFrame() // being swapped for a new one

      const now = performance.now()
      const timestamp = Math.max(now, lastTimestampRef.current + 1)
      lastTimestampRef.current = timestamp

      let result
      try {
        result = landmarker.detectForVideo(video, timestamp)
      } catch (err) {
        console.error('Hand detection failed.', err)
        clearHand(canvas)
        setHandLabel(null)
        setError(getDetectionErrorMessage(err))
        return // stop the loop
      }
      detections += 1
      detectionMsTotal += performance.now() - now

      // With numHands: 1 there is at most one hand, at index 0.
      const landmarks = result.landmarks[0]
      if (landmarks) {
        lastHandSeenAt = now
        drawHand(canvas, landmarks, video.videoWidth, video.videoHeight)
        const label = toPhysicalHand(result.handedness[0][0].categoryName)
        if (label !== shownLabel) {
          shownLabel = label
          setHandLabel(label)
        }
      } else if (shownLabel && now - lastHandSeenAt > HAND_LOST_AFTER_MS) {
        clearHand(canvas)
        shownLabel = null
        setHandLabel(null)
      }

      // Report averages about once a second.
      if (now - windowStart >= 1000) {
        setStats({
          detectionFps: (detections * 1000) / (now - windowStart),
          detectionMs: detectionMsTotal / detections,
        })
        windowStart = now
        detections = 0
        detectionMsTotal = 0
      }

      scheduleNextFrame()
    }

    scheduleNextFrame()

    return () => {
      if (hasVideoFrameCallback) video.cancelVideoFrameCallback(callbackId)
      else cancelAnimationFrame(callbackId)
      clearHand(canvas)
      setHandLabel(null)
      setStats(NO_STATS)
      setError(null)
    }
  }, [videoRef, canvasRef, landmarkerRef, isRunning])

  return { handLabel, ...stats, error }
}
