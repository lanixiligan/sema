import { useEffect, useRef, useState } from 'react'
import { summarize } from './benchmarkStats.js'
import { browserName } from './browserName.js'

const WARM_UP_SECONDS = 2
const MEASURE_SECONDS = 10
export const BENCHMARK_SECONDS = WARM_UP_SECONDS + MEASURE_SECONDS
// Detection takes longer when there's a hand to follow than when there isn't,
// so a run only counts if a hand was found in at least this share of frames.
export const MIN_HAND_SHARE = 0.9

// Thrown to end a run early. An empty message means "stop quietly".
class BenchmarkStopped extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The smallest step performance.now() takes in this browser. Firefox rounds
// the clock more coarsely than Chrome (to resist fingerprinting), which limits
// how precise a single detection time can be.
function measureTimerStep() {
  let smallest = Infinity
  let last = performance.now()
  for (let steps = 0; steps < 20; ) {
    const now = performance.now()
    if (now !== last) {
      smallest = Math.min(smallest, now - last)
      last = now
      steps += 1
    }
  }
  return smallest
}

// Resolves on the next video frame with its time and the browser's running
// total of frames shown (the same counter the camera fps readout uses).
function nextVideoFrame(video) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new BenchmarkStopped('The video stopped.')), 1000)
    video.requestVideoFrameCallback((now, metadata) => {
      clearTimeout(timeout)
      resolve({ time: now, frames: metadata.presentedFrames })
    })
  })
}

// Measures camera and detection speed over a fixed window. While a run is
// recording, measurementsRef.current is an array that the detection loop
// appends every frame's { ms, hand } to; the rest of the time it's null.
export function useBenchmark({ videoRef, measurementsRef, canRun, delegate }) {
  const [state, setState] = useState({ phase: 'idle' }) // idle | running | done | stopped
  const runIdRef = useRef(0)
  // Set when something happens mid-run that would make the numbers unreliable.
  const problemRef = useRef(null)

  useEffect(() => {
    if (!canRun) problemRef.current = 'The camera stopped or the hand model reloaded.'
  }, [canRun])

  // Stop recording if the component goes away mid-run.
  useEffect(() => {
    return () => {
      runIdRef.current += 1
      measurementsRef.current = null
    }
  }, [measurementsRef])

  async function run() {
    runIdRef.current += 1
    const runId = runIdRef.current
    const video = videoRef.current
    problemRef.current = null

    function onVisibilityChange() {
      if (document.hidden) {
        problemRef.current = 'The tab was hidden, and browsers slow hidden tabs down.'
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Ends the run if a newer one started, we unmounted, or there's a problem.
    function check() {
      if (runId !== runIdRef.current) throw new BenchmarkStopped('')
      if (problemRef.current) throw new BenchmarkStopped(problemRef.current)
    }

    async function countDown(seconds, secondsAfter) {
      for (let left = seconds; left > 0; left -= 1) {
        setState({ phase: 'running', secondsLeft: left + secondsAfter })
        await sleep(1000)
        check()
      }
    }

    try {
      const timerStepMs = measureTimerStep()
      // The first frames after starting or switching delegates are slower,
      // so let things settle before recording.
      await countDown(WARM_UP_SECONDS, MEASURE_SECONDS)

      const start = await nextVideoFrame(video)
      measurementsRef.current = []
      await countDown(MEASURE_SECONDS, 0)
      const end = await nextVideoFrame(video)
      const measurements = measurementsRef.current
      measurementsRef.current = null
      check()
      if (measurements.length === 0) throw new BenchmarkStopped('No frames were analysed.')

      const seconds = (end.time - start.time) / 1000
      const result = summarize(measurements, end.frames - start.frames, seconds)
      setState({
        phase: 'done',
        result: {
          ...result,
          browser: browserName(),
          delegate,
          width: video.videoWidth,
          height: video.videoHeight,
          timerStepMs,
          counts: result.handShare >= MIN_HAND_SHARE,
        },
      })
    } catch (error) {
      if (!(error instanceof BenchmarkStopped)) throw error
      if (runId === runIdRef.current) measurementsRef.current = null
      if (error.message) setState({ phase: 'stopped', problem: error.message })
    } finally {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }

  return { ...state, run }
}
