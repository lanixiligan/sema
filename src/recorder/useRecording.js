import { useEffect, useRef, useState } from 'react'
import { fpsBetween, nextFrameCount } from '../camera/frameCounter.js'
import {
  COUNTDOWN_MS,
  SETTLE_MS,
  frameFromDetection,
  judgeTake,
  sampleSlot,
  takePhase,
  tallyTake,
} from './takeRules.js'

const BUSY = ['countdown', 'settling', 'capturing', 'saving']

// One take at a time: countdown, a short settle, capture, then the result is
// handed to onTakeDone. Frames arrive through listenerRef from the detection
// loop; a timer drives the phases and checks the take is still valid.
export function useRecording({ videoRef, listenerRef, isDetecting, onTakeDone }) {
  const [state, setState] = useState({ phase: 'idle' })
  const takeRef = useRef(null)
  // Refs so the timer always sees the latest values without restarting.
  const isDetectingRef = useRef(isDetecting)
  const onTakeDoneRef = useRef(onTakeDone)

  useEffect(() => {
    isDetectingRef.current = isDetecting
  }, [isDetecting])

  useEffect(() => {
    onTakeDoneRef.current = onTakeDone
  })

  // If the page goes away mid-take, stop the timer and the listener.
  useEffect(() => () => takeRef.current?.stop(), [])

  function start(letter, hand) {
    if (takeRef.current) return
    const video = videoRef.current
    const startAt = performance.now()
    const captureAt = startAt + COUNTDOWN_MS + SETTLE_MS
    const take = { frames: [], lastSlot: -1, fpsStart: null, fpsRequested: false, hidden: false, stop: null }
    let timer = null

    function onDetection(detection) {
      const t = detection.time - captureAt
      const slot = sampleSlot(t, take.lastSlot)
      if (slot === null) return
      take.lastSlot = slot
      take.frames.push(frameFromDetection(detection, Math.round(t)))
    }

    function onVisibilityChange() {
      if (document.hidden) take.hidden = true
    }

    take.stop = () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (listenerRef.current === onDetection) listenerRef.current = null
      if (takeRef.current === take) takeRef.current = null
    }

    function discard(message) {
      take.stop()
      setState({ phase: 'discarded', letter, hand, message })
    }

    async function finish() {
      take.stop()
      setState({ phase: 'saving', letter, hand })
      const fpsEnd = await nextFrameCount(video)
      const counts = tallyTake(take.frames, hand)
      const result = {
        letter,
        hand,
        counts,
        ...judgeTake(counts),
        cameraFps: fpsBetween(take.fpsStart, fpsEnd),
        frames: take.frames,
      }
      onTakeDoneRef.current(result)
      setState({ phase: 'review', letter, hand, result })
    }

    function tick() {
      if (take.hidden) return discard("The tab was hidden, which pauses the camera. This take wasn't saved.")
      if (!isDetectingRef.current) {
        return discard("The camera stopped or the hand model reloaded. This take wasn't saved.")
      }
      const elapsed = performance.now() - startAt
      const phase = takePhase(elapsed)
      if (phase === 'capturing' && !take.fpsRequested) {
        take.fpsRequested = true
        nextFrameCount(video).then((count) => {
          take.fpsStart = count
        })
      }
      if (phase === 'done') return finish()
      setState({ phase, letter, hand, secondsLeft: Math.ceil((COUNTDOWN_MS - elapsed) / 1000) })
    }

    takeRef.current = take
    listenerRef.current = onDetection
    document.addEventListener('visibilitychange', onVisibilityChange)
    timer = setInterval(tick, 100)
    tick()
  }

  // Clears a finished take's result, e.g. after Undo removed that take.
  function dismiss() {
    if (!takeRef.current) setState({ phase: 'idle' })
  }

  return { ...state, busy: BUSY.includes(state.phase), start, dismiss }
}
