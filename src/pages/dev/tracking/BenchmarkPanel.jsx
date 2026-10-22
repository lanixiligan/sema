import { useState } from 'react'
import { toTableRow } from '../../../vision/benchmark/benchmarkStats.js'
import { BENCHMARK_SECONDS, MIN_HAND_SHARE, useBenchmark } from '../../../vision/benchmark/useBenchmark.js'

// Developer tool: measures camera and detection speed under fixed conditions
// and gives a row for the benchmark results table in docs/dev.md.
export default function BenchmarkPanel({ videoRef, measurementsRef, canRun, delegate }) {
  const benchmark = useBenchmark({ videoRef, measurementsRef, canRun, delegate })
  const [copyStatus, setCopyStatus] = useState(null) // null | 'copied' | 'failed'
  const { phase, result } = benchmark
  const row = result?.counts ? toTableRow(result) : null

  function start() {
    setCopyStatus(null)
    benchmark.run()
  }

  function copy() {
    navigator.clipboard.writeText(row).then(
      () => setCopyStatus('copied'),
      () => setCopyStatus('failed'),
    )
  }

  return (
    <div className="benchmark">
      <p>
        Benchmark: hold one hand in view the whole time, keep this tab in front
        and DevTools closed. Takes {BENCHMARK_SECONDS} seconds.
      </p>
      <button
        type="button"
        className="button-quiet"
        disabled={!canRun || phase === 'running'}
        onClick={start}
      >
        {phase === 'running' ? `Measuring… ${benchmark.secondsLeft} s` : 'Run benchmark'}
      </button>

      {phase === 'stopped' && (
        <p className="error" role="alert">
          The benchmark stopped: {benchmark.problem} Run it again.
        </p>
      )}

      {result && (
        <>
          <dl className="benchmark-results">
            <Result label="Camera">{result.cameraFps.toFixed(1)} fps</Result>
            <Result label="Detection">{result.detectionFps.toFixed(1)} fps</Result>
            <Result label="Median">{result.medianMs.toFixed(1)} ms</Result>
            <Result label="95th percentile">{result.p95Ms.toFixed(1)} ms</Result>
            <Result label="Mean">{result.meanMs.toFixed(1)} ms</Result>
          </dl>
          <p>
            {result.browser}, {result.delegate}, {result.width} × {result.height}.{' '}
            {result.detections} frames analysed and {result.skippedFrames} skipped
            in {result.seconds.toFixed(1)} s. Hand
            found in {percent(result.handShare)} of frames. Clock step{' '}
            {Number(result.timerStepMs.toPrecision(2))} ms
            {result.timerStepMs >= 0.5 &&
              ': single times are rounded to this, so trust the mean more than the median'}
            .
          </p>
          {row ? (
            <div className="benchmark-row">
              <code>{row}</code>
              <button type="button" className="button-quiet" onClick={copy}>
                {copyStatus === 'copied' ? 'Copied' : 'Copy row'}
              </button>
            </div>
          ) : (
            <p className="error">
              Your hand was found in only {percent(result.handShare)} of frames.
              Detection is slower with a hand in view, so a run only counts above{' '}
              {percent(MIN_HAND_SHARE)}. Run it again with your hand in view the whole
              time.
            </p>
          )}
          {copyStatus === 'failed' && (
            <p className="error">Couldn't copy. Select the row and copy it by hand.</p>
          )}
        </>
      )}
    </div>
  )
}

function Result({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function percent(share) {
  return `${Math.round(share * 100)}%`
}
