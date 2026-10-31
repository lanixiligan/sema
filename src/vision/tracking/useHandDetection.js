import { useEffect, useRef, useState } from 'react'
import { clearHand, drawHand, drawHands } from './drawHand.js'
import { isWholeHand } from '../landmarks/handChecks.js'
import { toPhysicalHand } from './handedness.js'
import { listHands, pickHand } from './pickHand.js'
import { createHandSmoother } from './smoothHands.js'
import { getDetectionErrorMessage } from '../model/visionMessages.js'

// How long the hand must be missing before we say "No hand". Without this the
// readout would flicker whenever a single frame misses the hand.
const HAND_LOST_AFTER_MS = 300

const NO_STATS = { detectionFps: null, detectionMs: null }

// Runs hand detection on each new video frame while `isRunning` is true,
// draws the result on the canvas, and reports what it found.
// Optional hooks for other tools: while a benchmark is recording,
// measurementsRef.current is an array that every frame's detection time is
// appended to; while the recorder is taking, listenerRef.current is a
// function called with every detection.
// wantedHand ('left' or 'right', optional): with two hands in view, that one
// is used (pickHand.js); it's the only hand drawn, and the other is reported
// but not drawn. Without it, the first hand found is used and drawn.
// drawAllHands (optional): draw every hand found, not just the picked one
// (the camera check, which accepts either hand).
// The listener gets the picked hand (landmarks, handedness) and, as `hands`,
// every hand found (pickHand.js's listHands). It gets the raw points: only the
// drawing is smoothed (smoothHands.js).
export function useHandDetection({
  videoRef,
  canvasRef,
  landmarkerRef,
  measurementsRef,
  listenerRef,
  isRunning,
  wantedHand,
  drawAllHands = false,
}) {
  const [handLabel, setHandLabel] = useState(null) // null means no hand
  // Every point of the hand, wrist included, inside the frame (handChecks.js).
  const [wholeHand, setWholeHand] = useState(false)
  const [stats, setStats] = useState(NO_STATS)
  const [error, setError] = useState(null)
  // MediaPipe rejects a timestamp that isn't larger than the previous one.
  // A ref, so it survives the loop stopping and starting again.
  const lastTimestampRef = useRef(0)
  // The loop reads the wanted hand from a ref on every frame, so switching
  // hands doesn't stop and restart detection.
  const wantedHandRef = useRef(wantedHand)
  useEffect(() => {
    wantedHandRef.current = wantedHand
  }, [wantedHand])

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
    let shownWhole = false
    // Steadies the drawn points; new each time the loop starts.
    const smoothHands = createHandSmoother()

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
      const detectionMs = performance.now() - now
      detections += 1
      detectionMsTotal += detectionMs

      // Up to two hands are found; from here on, only the picked one counts
      // (except for drawing, with drawAllHands).
      const hands = listHands(result)
      const picked = pickHand(result, wantedHandRef.current)
      const landmarks = picked?.landmarks
      measurementsRef?.current?.push({ ms: detectionMs, hand: Boolean(landmarks) })
      listenerRef?.current?.({
        landmarks: landmarks ?? null,
        handedness: picked?.handedness ?? null,
        hands,
        width: video.videoWidth,
        height: video.videoHeight,
        time: now,
      })

      if (landmarks) {
        lastHandSeenAt = now
        const label = toPhysicalHand(picked.handedness.categoryName)
        // The other hand is cleared straight away: no points on the wrong hand.
        const wanted = wantedHandRef.current
        // The timestamp, not `now`: it always increases, so the smoothing's
        // time step is never zero.
        if (drawAllHands) {
          const smoothed = smoothHands(hands.map((hand) => hand.landmarks), timestamp)
          drawHands(canvas, smoothed, video.videoWidth, video.videoHeight)
        } else if (!wanted || label.toLowerCase() === wanted) {
          const [smoothed] = smoothHands([landmarks], timestamp)
          drawHand(canvas, smoothed, video.videoWidth, video.videoHeight)
        } else {
          clearHand(canvas)
        }
        // State changes only when the result does, so the page doesn't
        // re-render on every frame.
        if (label !== shownLabel) {
          shownLabel = label
          setHandLabel(label)
        }
        const whole = isWholeHand(landmarks)
        if (whole !== shownWhole) {
          shownWhole = whole
          setWholeHand(whole)
        }
      } else if (shownLabel && now - lastHandSeenAt > HAND_LOST_AFTER_MS) {
        clearHand(canvas)
        shownLabel = null
        setHandLabel(null)
        shownWhole = false
        setWholeHand(false)
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
      setWholeHand(false)
      setStats(NO_STATS)
      setError(null)
    }
  }, [videoRef, canvasRef, landmarkerRef, measurementsRef, listenerRef, isRunning, drawAllHands])

  return { handLabel, wholeHand, ...stats, error }
}
