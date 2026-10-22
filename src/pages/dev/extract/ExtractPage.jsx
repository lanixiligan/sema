import { useEffect, useRef, useState } from 'react'
import DevTopBar from '../DevTopBar.jsx'
import { browserName } from '../../../vision/model/browserName.js'
import { loadHandLandmarker } from '../../../vision/model/loadHandLandmarker.js'
import { LOADING_HAND_MODEL, getVisionErrorMessage } from '../../../vision/model/visionMessages.js'
import { DATASETS, extractionFileName, newExtraction, parsePhotoPath, samplesFromDetection } from './extractFile.js'

// The readouts update once per this many photos. Updating React state after
// every photo would spend more time redrawing the page than finding hands.
const UPDATE_EVERY = 50

// Today as 2026-10-22, in local time (the same as Record's).
const today = () => new Date().toLocaleDateString('en-CA')

// Developer tool for milestone 2.2 (behind the access code, DevArea.jsx).
// It runs the photos of a public ASL dataset (one of DATASETS in
// extractFile.js, in its folder in data/public/) through Sema's own hand
// model and normalization, and downloads the hand
// points as one file for training. Nothing is uploaded: the browser reads the
// photos from disk and everything happens on this page.
export default function ExtractPage() {
  const inputRef = useRef(null)
  const [chosen, setChosen] = useState(null) // { folder, dataset, photos, skipped }
  const [phase, setPhase] = useState('idle') // idle | loading | running | stopped | finished | error
  const [progress, setProgress] = useState(null)
  const [delegate, setDelegate] = useState(null) // 'GPU' or 'CPU', once the model is loaded
  const [error, setError] = useState(null)
  // The run's file, filled as it goes. A ref, not state: it grows by
  // thousands of samples, and the readouts only need the counts.
  const extractionRef = useRef(null)
  const stopRef = useRef(false)

  // Leaving the page stops a run; the run then closes the hand model.
  useEffect(() => {
    return () => {
      stopRef.current = true
    }
  }, [])

  // The folder picker gives every file inside the folder, with its path
  // (webkitRelativePath, like "asl-hg/B/P10_B_1000.jpg").
  function choose(event) {
    const files = Array.from(event.target.files)
    const photos = []
    for (const file of files) {
      const photo = parsePhotoPath(file.webkitRelativePath)
      if (photo) photos.push({ file, ...photo })
    }
    // The folder picked is the dataset: every photo found has the same one.
    const folder = files[0]?.webkitRelativePath.split('/')[0] ?? ''
    setChosen({ folder, dataset: photos[0]?.dataset ?? null, photos, skipped: files.length - photos.length })
    setPhase('idle')
    setProgress(null)
    setError(null)
    extractionRef.current = null
  }

  async function run() {
    stopRef.current = false
    setError(null)
    setPhase('loading')
    let landmarker = null
    let extraction
    try {
      const loaded = await loadHandLandmarker('GPU')
      landmarker = loaded.landmarker
      // The app's hand model, made the app's way (GPU, or the CPU when the
      // GPU can't be used), then switched from VIDEO mode, which follows a
      // hand from one frame to the next, to IMAGE mode: every photo is a new
      // picture, so nothing may carry over from the one before.
      await landmarker.setOptions({ runningMode: 'IMAGE' })
      extraction = newExtraction({
        dataset: chosen.dataset,
        browser: browserName(),
        delegate: loaded.delegate,
        date: today(),
      })
    } catch (loadError) {
      landmarker?.close()
      setError(getVisionErrorMessage(loadError))
      setPhase('error')
      return
    }
    extractionRef.current = extraction
    setDelegate(extraction.delegate)

    const counts = { done: 0, withHand: 0, noHand: 0, twoHands: 0, unreadable: 0 }
    const startedAt = performance.now()
    setPhase('running')
    setProgress({ ...counts, secondsLeft: null })

    for (const photo of chosen.photos) {
      if (stopRef.current) break
      try {
        await extractPhoto(landmarker, photo, extraction, counts)
      } catch (detectError) {
        // A failure in the hand model itself would fail every photo after it.
        console.error(detectError)
        setError(`Hand tracking stopped working at ${photo.image}: ${detectError.message}`)
        break
      }
      counts.done += 1
      if (counts.done % UPDATE_EVERY === 0) {
        const perPhoto = (performance.now() - startedAt) / counts.done
        setProgress({ ...counts, secondsLeft: ((chosen.photos.length - counts.done) * perPhoto) / 1000 })
        // Lets the browser draw the new numbers before carrying on.
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    landmarker.close()
    extraction.photos = counts.done
    extraction.complete = counts.done === chosen.photos.length
    setProgress({ ...counts, secondsLeft: null })
    setPhase(extraction.complete ? 'finished' : 'stopped')
  }

  const running = phase === 'loading' || phase === 'running'
  const canDownload = (phase === 'finished' || phase === 'stopped') && progress?.withHand > 0
  // One obvious action: the next step gets the filled button, the rest are quiet.
  const next = canDownload ? 'download' : chosen?.photos.length > 0 && !running ? 'start' : 'choose'
  const buttonClass = (action) => (action === next && !running ? 'button' : 'button-quiet')

  return (
    <>
      <DevTopBar title="Extract hand points" />

      <main className="page extract">
        <p>
          Runs every photo of a public dataset through Sema&rsquo;s hand model and
          normalization, then downloads the hand points as one file. Choose the
          dataset&rsquo;s folder in <code>data/public</code>: <DatasetFolders />. Chrome will ask
          to &ldquo;upload&rdquo; the files: they only go to this page, nothing leaves your
          computer. Keep this tab in front while it runs.
        </p>

        <div className="controls">
          <button
            type="button"
            className={buttonClass('choose')}
            disabled={running}
            onClick={() => inputRef.current.click()}
          >
            Choose folder
          </button>
          <input ref={inputRef} type="file" webkitdirectory="" hidden onChange={choose} />
          {chosen && !running && (
            <button
              type="button"
              className={buttonClass('start')}
              disabled={chosen.photos.length === 0}
              onClick={run}
            >
              {phase === 'idle' ? 'Start' : 'Start again'}
            </button>
          )}
          {running && (
            <button type="button" className="button-quiet" onClick={() => (stopRef.current = true)}>
              Stop
            </button>
          )}
          {canDownload && (
            <button type="button" className={buttonClass('download')} onClick={() => download(extractionRef.current)}>
              {phase === 'stopped' ? 'Download what is done' : 'Download'}
            </button>
          )}
        </div>

        {chosen && (
          <p>
            {chosen.folder}: {chosen.photos.length.toLocaleString()} photos
            {chosen.skipped > 0 &&
              `, ${chosen.skipped.toLocaleString()} other ${chosen.skipped === 1 ? 'file' : 'files'} skipped`}
            {chosen.photos.length === 0 && (
              <>
                . Choose one of these folders instead: <DatasetFolders />.
              </>
            )}
          </p>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {phase === 'loading' && <p>{LOADING_HAND_MODEL}</p>}

        {progress && (
          <dl className="readouts">
            <Readout label="Photos done">
              {progress.done.toLocaleString()} of {chosen.photos.length.toLocaleString()}
            </Readout>
            <Readout label="Time left">{formatTimeLeft(progress.secondsLeft, phase)}</Readout>
            <Readout label="Runs on">{delegate ?? '—'}</Readout>
            <Readout label="Hand found">{progress.withHand.toLocaleString()}</Readout>
            <Readout label="No hand">{progress.noHand.toLocaleString()}</Readout>
            <Readout label="Two hands">{progress.twoHands.toLocaleString()}</Readout>
          </dl>
        )}

        {phase === 'finished' && (
          <p>
            Done. Download the file and move it into <code>data/extracted/</code> (gitignored).
          </p>
        )}
        {phase === 'stopped' && <p>Stopped before the last photo.</p>}
      </main>
    </>
  )
}

// One photo: decode it, find the hands, keep their samples. A photo the
// browser can't decode, or with no hand, is listed in `misses` with the reason.
async function extractPhoto(landmarker, photo, extraction, counts) {
  let bitmap
  try {
    bitmap = await createImageBitmap(photo.file)
  } catch {
    extraction.misses.push({ image: photo.image, reason: 'unreadable' })
    counts.unreadable += 1
    return
  }
  try {
    const result = landmarker.detect(bitmap)
    const samples = samplesFromDetection(result, { ...photo, width: bitmap.width, height: bitmap.height })
    if (samples.length === 0) {
      extraction.misses.push({ image: photo.image, reason: 'no hand' })
      counts.noHand += 1
      return
    }
    extraction.samples.push(...samples)
    counts.withHand += 1
    if (samples.length > 1) counts.twoHands += 1
  } finally {
    bitmap.close() // frees the decoded picture straight away
  }
}

// Saves the file in the browser's downloads (like Record's session download).
function download(extraction) {
  const blob = new Blob([JSON.stringify(extraction)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = extractionFileName(extraction)
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatTimeLeft(seconds, phase) {
  if (phase !== 'running') return '—'
  if (seconds === null) return 'Measuring…'
  if (seconds < 60) return 'Under a minute'
  return `About ${Math.round(seconds / 60)} min`
}

// The folders this page knows, as "asl-hg or aslyset".
function DatasetFolders() {
  const names = Object.keys(DATASETS)
  return names.map((name, i) => (
    <span key={name}>
      {i > 0 && (i === names.length - 1 ? ' or ' : ', ')}
      <code>{name}</code>
    </span>
  ))
}

function Readout({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
