import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../camera/useCamera.js'
import { browserName } from '../vision/browserName.js'
import { useHandDetection } from '../vision/useHandDetection.js'
import { useHandLandmarker } from '../vision/useHandLandmarker.js'
import { LOADING_HAND_MODEL } from '../vision/visionMessages.js'
import ConsentForm from './ConsentForm.jsx'
import RecordingGrid from './RecordingGrid.jsx'
import TakeOverlay from './TakeOverlay.jsx'
import TakePanel from './TakePanel.jsx'
import { useLetters } from './letters.js'
import { acceptedCount, addTake, needsDownload, newSession, undoLastTake } from './sessionFile.js'
import { clearSession, downloadSession, loadSession, rememberSessionId, saveSession } from './sessionStore.js'
import { useRecording } from './useRecording.js'

// "2026-11-02" in the person's own time zone.
const today = () => new Date().toLocaleDateString('en-CA')

export default function RecorderApp() {
  const [saved, setSaved] = useState(loadSession) // offered back when the page opens
  const [session, setSession] = useState(null)
  const [storageOk, setStorageOk] = useState(true)
  const [downloaded, setDownloaded] = useState(null) // the session object last downloaded
  const letters = useLetters()

  const { videoRef, status, error, start, stop } = useCamera()
  const isLive = status === 'live'
  const canvasRef = useRef(null)
  const listenerRef = useRef(null)
  const handModel = useHandLandmarker(isLive, 'GPU')
  const isDetecting = isLive && handModel.status === 'ready'
  const hand = useHandDetection({
    videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    listenerRef,
    isRunning: isDetecting,
  })
  const [cell, setCell] = useState(null) // { letter, hand } chosen in the grid
  const recording = useRecording({
    videoRef,
    listenerRef,
    isDetecting,
    onTakeDone: (take) => {
      if (session) updateSession(addTake(session, take))
    },
  })

  // Every change to the session is saved in the browser straight away.
  function updateSession(next) {
    setSession(next)
    setStorageOk(saveSession(next))
  }

  function startSession({ person, sessionId, consent }) {
    rememberSessionId(sessionId)
    setSaved(null)
    setDownloaded(null)
    updateSession(newSession({ person, session: sessionId, consent, date: today(), browser: browserName() }))
  }

  function download(current) {
    downloadSession(current)
    setDownloaded(current)
  }

  function deleteSession() {
    if (!window.confirm('Delete this session from this browser? Download it first if you want to keep it.')) return
    startFresh()
  }

  // Back to the consent form, with nothing saved in the browser. The camera
  // is turned off (the video element goes away with the session view) so the
  // light goes off before the next person consents.
  function startFresh() {
    stop()
    setCell(null)
    clearSession()
    setSession(null)
    setSaved(null)
    setDownloaded(null)
  }

  // Warn before leaving if there are takes that haven't been downloaded.
  const unsaved = needsDownload(session, downloaded)
  useEffect(() => {
    if (!unsaved) return
    function warn(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  const canRecord = isDetecting && cell !== null && !recording.busy

  function undo() {
    updateSession(undoLastTake(session))
    recording.dismiss() // the result banner described the take just removed
  }

  return (
    <>
      <header className="top-bar">
        <span>Sema recorder</span>
        {session && (
          <div className="session-bar">
            <span>
              Session {session.person} · {session.session} · {countTakes(session)}
            </span>
            <button type="button" className="button-quiet" disabled={recording.busy} onClick={() => download(session)}>
              Download session file
            </button>
            <button type="button" className="button-quiet" disabled={recording.busy} onClick={deleteSession}>
              Delete this session
            </button>
          </div>
        )}
      </header>

      <main className={session ? 'page page-wide' : 'page'}>
        {!session && saved && (
          <section className="saved-session">
            <p>
              Continue session {saved.person} · {saved.session} ({countTakes(saved)})?
            </p>
            <div className="controls">
              <button type="button" className="button" onClick={() => setSession(saved)}>Continue</button>
              <button type="button" className="button-quiet" onClick={() => download(saved)}>Download</button>
              <button type="button" className="button-quiet" onClick={deleteSession}>Delete</button>
              {/* A new session needs the old one downloaded or deleted first. */}
              {!needsDownload(saved, downloaded) && (
                <button type="button" className="button-quiet" onClick={startFresh}>Start a new session</button>
              )}
            </div>
          </section>
        )}

        {!session && !saved && <ConsentForm today={today()} onStart={startSession} />}

        {session && (
          <>
            {!storageOk && (
              <p className="error" role="alert">
                Progress isn't being saved here; download the file before closing.
              </p>
            )}
            {letters.status === 'error' && (
              <p className="error" role="alert">Couldn't load the letter list (public/languages/asl/letters.json).</p>
            )}
            {letters.status === 'ready' && letters.training.length === 0 && (
              <p className="error">No training letters configured yet.</p>
            )}

            {/* Left: the camera, with the take's status on top of it, and the
                controls. Right: the chosen letter and the grid. Everything a
                take needs fits on one desktop screen. */}
            <div className="recorder-layout">
              <div className="recorder-main">
                <div className="stage">
                  <video ref={videoRef} className="video" autoPlay playsInline muted />
                  <canvas ref={canvasRef} className="overlay" />
                  {!isLive && (
                    <p className="stage-message">{status === 'starting' ? 'Waiting for the camera…' : 'Camera is off'}</p>
                  )}
                  <TakeOverlay recording={recording} cell={cell} />
                </div>

                <div className="controls">
                  {status === 'idle' && (
                    <button type="button" className="button" onClick={start}>Start camera</button>
                  )}
                  {status === 'starting' && (
                    <button type="button" className="button" onClick={stop}>Cancel</button>
                  )}
                  {isLive && (
                    <>
                      <button
                        type="button"
                        className="button"
                        disabled={!canRecord}
                        onClick={() => recording.start(cell.letter, cell.hand)}
                      >
                        Record
                      </button>
                      <span className="hand-status">{describeHand(handModel.status, hand.handLabel)}</span>
                    </>
                  )}
                  <span className="controls-quiet">
                    <button
                      type="button"
                      className="button-quiet"
                      disabled={session.recordings.length === 0 || recording.busy}
                      onClick={undo}
                    >
                      Undo last take
                    </button>
                    {isLive && (
                      <button type="button" className="button-quiet" disabled={recording.busy} onClick={stop}>
                        Stop camera
                      </button>
                    )}
                  </span>
                </div>
                {error && <p className="error" role="alert">{error}</p>}
                {isLive && (handModel.error || hand.error) && (
                  <p className="error" role="alert">{handModel.error || hand.error}</p>
                )}
              </div>

              <aside className="recorder-side">
                <TakePanel
                  cell={cell}
                  instructions={cell ? letters.instructions[cell.letter] : undefined}
                  image={cell ? letters.images[cell.letter] : undefined}
                  accepted={cell ? acceptedCount(session, cell.letter, cell.hand) : 0}
                />
                {letters.status === 'ready' && (
                  <RecordingGrid
                    training={letters.training}
                    pilot={letters.pilot}
                    session={session}
                    selected={cell}
                    onSelect={setCell}
                    disabled={recording.busy}
                  />
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  )
}

function countTakes(session) {
  const n = session.recordings.length
  return n === 1 ? '1 take' : `${n} takes`
}

function describeHand(modelStatus, handLabel) {
  if (modelStatus === 'loading' || modelStatus === 'idle') return LOADING_HAND_MODEL
  if (modelStatus === 'error') return 'Hand tracking is off'
  return handLabel ? `Hand found (${handLabel})` : 'No hand'
}
