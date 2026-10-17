import { useEffect, useRef, useState } from 'react'
import { idleSecondsLeft, shouldTurnOff } from '../camera/idleRules.js'
import { useSharedCamera } from './sharedCamera.js'

// Turns the shared camera off when no hand has been in view for a minute
// (idleRules.js), with stopReason 'idle', and returns the seconds left for
// the notice (null when there's nothing to show). It only counts while hand
// tracking is running (`isDetecting`), so a slow model load isn't "no hand".
// A timer checks once a second. It reads the hand's presence and the latest
// stop function from refs, so a hand seen on every frame doesn't re-render
// the page or restart the timer.
export function useIdleCameraOff({ isDetecting, handInView }) {
  const { stop } = useSharedCamera()
  const [secondsLeft, setSecondsLeft] = useState(null)
  const handRef = useRef(handInView)
  const stopRef = useRef(stop)
  useEffect(() => {
    handRef.current = handInView
    stopRef.current = stop
  })

  useEffect(() => {
    if (!isDetecting) return
    let lastHandAt = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      if (handRef.current) lastHandAt = now
      const idleMs = now - lastHandAt
      setSecondsLeft(idleSecondsLeft(idleMs))
      if (shouldTurnOff(idleMs)) stopRef.current('idle')
    }, 1000)
    return () => {
      clearInterval(timer)
      setSecondsLeft(null)
    }
  }, [isDetecting])

  return secondsLeft
}
