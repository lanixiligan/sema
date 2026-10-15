import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../camera/useCamera.js'
import { browserName } from '../vision/browserName.js'
import { useHandDetection } from '../vision/useHandDetection.js'
import { useHandLandmarker } from '../vision/useHandLandmarker.js'
import { LOADING_HAND_MODEL } from '../vision/visionMessages.js'
import ConsentForm from './ConsentForm.jsx'
import { useLetters } from './letters.js'
import { newSession } from './sessionFile.js'
import { clearSession, downloadSession, loadSession, rememberSessionId, saveSession } from './sessionStore.js'

// "2026-11-02" in the person's own time zone.
const today = () => new Date().toLocaleDateString('en-CA')

export default function RecorderApp() {
  const [saved, setSaved] = useState(loadSession) // offered back when the page opens
  const [session, setSession] = useState(null)
  const [storageOk, setStorageOk] = useState(true)
  const [downloadedTakes, setDownloadedTakes] = useState(0)
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

  // Every change to the session is saved in the browser straight away.
  function updateSession(next) {
    setSession(next)
    setStorageOk(saveSession(next))
  }

  function startSession({ person, sessionId, consent }) {
    rememberSessionId(sessionId)
    setSaved(null)
    setDownloadedTakes(0)
    updateSession(newSession({ person, session: sessionId, consent, date: today(), browser: browserName() }))
  }

  function download(current) {
    downloadSession(current)
    setDownloadedTakes(current.recordings.length)
  }

  function deleteSession() {
    if (!window.confirm('Delete this session from this browser? Download it first if you want to keep it.')) return
    startFresh()
  }

  // Back to the consent form, with nothing saved in the browser.
  function startFresh() {
    clearSession()
    setSession(null)
    setSaved(null)
    setDownloadedTakes(0)
  }

  // Warn before leaving if there are takes that haven't been downloaded.
  const unsaved = session !== null && session.recordings.length > downloadedTakes
  useEffect(() => {
    if (!unsaved) return
    function warn(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  return (
    <>
      <header className="top-bar">Sema recorder</header>
      <main className="page">
        {!session && saved && (
          <section className="saved-session">
            <p>
              Continue session {saved.person} · {saved.session} ({saved.recordings.length} takes)?
            </p>
            <div className="controls">
              <button type="button" className="button" onClick={() => setSession(saved)}>Continue</button>
              <button type="button" className="button-quiet" onClick={() => download(saved)}>Download</button>
              <button type="button" className="button-quiet" onClick={deleteSession}>Delete</button>
              {/* A new session needs the old one downloaded or deleted first. */}
              {downloadedTakes === saved.recordings.length && (
                <button type="button" className="button-quiet" onClick={startFresh}>Start a new session</button>
              )}
            </div>
          </section>
        )}

        {!session && !saved && <ConsentForm today={today()} onStart={startSession} />}

        {session && (
          <>
            <div className="session-bar">
              <span>
                Session {session.person} · {session.session} · {session.recordings.length} takes
              </span>
              <button type="button" className="button-quiet" onClick={() => download(session)}>Download session file</button>
              <button type="button" className="button-quiet" onClick={deleteSession}>Delete this session</button>
            </div>
            {!storageOk && (
              <p className="error" role="alert">
                Progress isn't being saved here; download the file before closing.
              </p>
            )}

            <div className="stage">
              <video ref={videoRef} className="video" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="overlay" />
              {!isLive && (
                <p className="stage-message">{status === 'starting' ? 'Waiting for the camera…' : 'Camera is off'}</p>
              )}
            </div>
            <div className="controls">
              {status === 'idle' ? (
                <button type="button" className="button" onClick={start}>Start camera</button>
              ) : (
                <button type="button" className="button" onClick={stop}>
                  {status === 'starting' ? 'Cancel' : 'Stop camera'}
                </button>
              )}
              {isLive && <span className="hand-status">{describeHand(handModel.status, hand.handLabel)}</span>}
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            {isLive && (handModel.error || hand.error) && (
              <p className="error" role="alert">{handModel.error || hand.error}</p>
            )}

            {letters.status === 'error' && (
              <p className="error" role="alert">Couldn't load the letter list (public/languages/asl/letters.json).</p>
            )}
            {letters.status === 'ready' && letters.training.length === 0 && (
              <p className="error">No training letters configured yet.</p>
            )}
            {/* Task 7 adds the recording grid and the take panel here. */}
          </>
        )}
      </main>
    </>
  )
}

function describeHand(modelStatus, handLabel) {
  if (modelStatus === 'loading' || modelStatus === 'idle') return LOADING_HAND_MODEL
  if (modelStatus === 'error') return 'Hand tracking is off'
  return handLabel ? `Hand found (${handLabel})` : 'No hand'
}
