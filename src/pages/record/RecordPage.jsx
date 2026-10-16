import { useEffect, useRef, useState } from 'react'
import MenuBar from '../../app/MenuBar.jsx'
import { useSharedCamera } from '../../app/sharedCamera.js'
import CameraStage from '../../components/CameraStage.jsx'
import { CheckIcon, VideoOffIcon } from '../../components/icons.jsx'
import StageProblem from '../../components/StageProblem.jsx'
import { useLetters } from '../../recorder/letters.js'
import { acceptedCount, addTake, deleteTake, needsDownload, newSession } from '../../recorder/sessionFile.js'
import { clearSession, downloadSession, loadSession, rememberSessionId, saveSession } from '../../recorder/sessionStore.js'
import { TAKES_TARGET } from '../../recorder/takeRules.js'
import { useRecording } from '../../recorder/useRecording.js'
import { browserName } from '../../vision/browserName.js'
import { useHandDetection } from '../../vision/useHandDetection.js'
import CameraControls from './CameraControls.jsx'
import ConsentForm from './ConsentForm.jsx'
import FinishedStep from './FinishedStep.jsx'
import LetterList from './LetterList.jsx'
import TakeOverlay from './TakeOverlay.jsx'
import TakePanel from './TakePanel.jsx'
import TakeList from './TakeList.jsx'
import TakeResult from './TakeResult.jsx'
import { takeReadiness } from './takeReadiness.js'

// "2026-11-02" in the person's own time zone.
const today = () => new Date().toLocaleDateString('en-CA')

// The Record page, in three steps (Record.dc.html):
// - consent: the participant's code and consent answers (or the offer to
//   continue a session saved in this browser);
// - recording: the camera, the chosen letter and hand, the letter tiles;
// - finished: after "Finish and download".
// The camera is on only during recording: that's the only step with a camera
// view (CameraStage), and CameraProvider starts and stops it to match.
export default function RecordPage({ signingHand }) {
  const [saved, setSaved] = useState(loadSession) // offered back when the page opens
  const [session, setSession] = useState(null)
  const [finished, setFinished] = useState(false)
  const [storageOk, setStorageOk] = useState(true)
  const [downloaded, setDownloaded] = useState(null) // the session object last downloaded
  const letters = useLetters()

  const camera = useSharedCamera()
  const { videoRef, handModel } = camera
  const isLive = camera.status === 'live'
  const canvasRef = useRef(null)
  const listenerRef = useRef(null)
  const isDetecting = isLive && handModel.status === 'ready'

  // The hand the next take is for (starts on the signing hand) and the chosen
  // letter. Switching hands keeps the letter.
  const [takeHand, setTakeHand] = useState(signingHand ?? 'right')
  const [pickedLetter, setLetter] = useState(null)

  // Only the take's hand gets the points drawn on it.
  const hand = useHandDetection({
    videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    listenerRef,
    isRunning: isDetecting,
    wantedHand: takeHand,
  })
  // Whether the take's hand is whole in view, and what the video says
  // (takeReadiness.js). A take's capture waits for it (useRecording).
  const readiness = takeReadiness({
    cameraStatus: camera.status,
    modelStatus: handModel.status,
    seenHand: hand.handLabel?.toLowerCase() ?? null,
    wholeHand: hand.wholeHand,
    takeHand,
  })
  // Until one is picked, the chosen letter is the first that still needs
  // takes for this hand (worked out on each render, so it stays current).
  const allLetters = letters.status === 'ready' ? [...letters.training, 'none', ...letters.pilot] : []
  const letter =
    pickedLetter ?? (session && allLetters.find((l) => acceptedCount(session, l, takeHand) < TAKES_TARGET)) ?? allLetters[0] ?? null
  const cell = session && letter ? { letter, hand: takeHand } : null

  const recording = useRecording({
    videoRef,
    listenerRef,
    isDetecting,
    isHandReady: readiness.ready,
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

  function continueSaved() {
    setSession(saved)
    setSaved(null)
  }

  function download(current) {
    downloadSession(current)
    setDownloaded(current)
  }

  function finish() {
    download(session)
    setFinished(true)
  }

  function deleteSession() {
    if (!window.confirm('Delete this session from this browser? Download it first if you want to keep it.')) return
    startFresh()
  }

  // Back to the consent step, with nothing saved in the browser. The camera
  // view goes away with the recording step, so the light goes off before the
  // next person consents.
  function startFresh() {
    setLetter(null)
    clearSession()
    setSession(null)
    setSaved(null)
    setDownloaded(null)
    setFinished(false)
  }

  // Warn before leaving if there are takes that haven't been downloaded.
  // A take can start once the camera and hand model are running. It then
  // counts down and waits for the hand, so it can be started with either hand.
  const canStartTake = isDetecting && cell !== null && !finished && !recording.busy

  function startTake() {
    if (!canStartTake) return
    setLetter(cell.letter) // keep this letter chosen, so its result stays in view
    recording.start(cell.letter, cell.hand)
  }

  // Space starts a take too, so the signing hand never has to reach for the
  // mouse. Not while typing in a field, and not when the keyboard has put
  // focus on a button: then Space presses that button, as keyboard users
  // expect. A mouse click also leaves focus on the button, but without
  // :focus-visible, so after a click Space still starts a take.
  // The listener reads startTake from a ref, so it isn't re-added on every render.
  const startTakeRef = useRef(startTake)
  useEffect(() => {
    startTakeRef.current = startTake
  })
  useEffect(() => {
    function onKeyDown(event) {
      if (event.code !== 'Space' || event.repeat) return
      const target = event.target
      if (target.closest?.('input, textarea, select, [contenteditable]')) return
      if (target.matches?.(':focus-visible')) return
      event.preventDefault() // no page scroll, and no press of a clicked button
      startTakeRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

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

  // Deletes one kept take, chosen in the take list.
  function deleteOne(recordingId) {
    updateSession(deleteTake(session, recordingId))
    recording.dismiss() // the result line may describe the take just removed
  }

  const step = !session ? 'consent' : finished ? 'finished' : 'recording'

  return (
    <>
      <MenuBar active="record" />

      {step === 'consent' && saved && (
        <SavedSessionOffer
          saved={saved}
          canStartNew={!needsDownload(saved, downloaded)}
          onContinue={continueSaved}
          onDownload={() => download(saved)}
          onDelete={deleteSession}
          onStartNew={startFresh}
        />
      )}
      {step === 'consent' && !saved && <ConsentForm today={today()} onStart={startSession} />}

      {step === 'finished' && (
        <FinishedStep
          session={session}
          onNewSession={startFresh}
          onDelete={deleteSession}
          onKeepRecording={() => setFinished(false)}
        />
      )}

      {step === 'recording' && (
        // A row with the session and Finish, then three columns that start on
        // the same line: the letters, the camera, and the chosen letter with
        // its takes and the record button (grid areas in styles.css).
        <main className="record">
          <div className="record-session">
            <SessionStatus session={session} storageOk={storageOk} />
            <button
              type="button"
              className="outline-button record-finish"
              disabled={session.recordings.length === 0 || recording.busy}
              onClick={finish}
            >
              Finish and download
            </button>
          </div>

          <div className="record-letters">
            {letters.status === 'ready' && (
              <LetterList
                training={letters.training}
                pilot={letters.pilot}
                session={session}
                hand={takeHand}
                selected={cell}
                onSelect={setLetter}
                disabled={recording.busy}
              />
            )}
          </div>

          <section className="record-camera" aria-label="Camera">
            <CameraStage canvasRef={canvasRef} className="stage record-stage">
              {camera.error ? (
                <StageProblem title="The camera didn't start" body={camera.error} onRetry={camera.start} />
              ) : handModel.status === 'error' || hand.error ? (
                <StageProblem title="Hand tracking couldn't start" body={handModel.error || hand.error} />
              ) : camera.status === 'idle' ? (
                <div className="camera-off" role="status">
                  <VideoOffIcon size={28} />
                  <p className="camera-off-title">Camera is off</p>
                </div>
              ) : (
                <TakeOverlay recording={recording} idleText={readiness.text} />
              )}
              {/* Hidden during a take: switching the camera or the hand would spoil it. */}
              {!recording.busy && (
                <CameraControls hand={takeHand} onHandChange={setTakeHand} handLabel="Hand for this take" />
              )}
            </CameraStage>
          </section>

          <aside className="record-side" aria-label="Current take">
            {!storageOk && (
              <p className="record-note" role="alert">
                Not saved in this browser. Download before closing.
              </p>
            )}
            {letters.status === 'error' && (
              <p className="record-note" role="alert">
                Couldn't load the letter list (public/languages/asl/letters.json).
              </p>
            )}
            {cell && (
              <>
                <TakePanel
                  cell={cell}
                  isPilot={letters.pilot.includes(cell.letter)}
                  instructions={letters.instructions[cell.letter]}
                  image={letters.images[cell.letter]}
                  accepted={acceptedCount(session, cell.letter, cell.hand)}
                />
                <TakeList takes={keptTakes(session, cell)} onDelete={deleteOne} disabled={recording.busy} />
              </>
            )}
            <button
              type="button"
              className="primary-button record-take"
              disabled={!canStartTake}
              onClick={startTake}
              aria-keyshortcuts="Space"
            >
              {/* Space is the main way to start a take; a click works too. */}
              Press <kbd>Space</kbd> to record
            </button>
            <TakeResult recording={recording} cell={cell} />
          </aside>
        </main>
      )}
    </>
  )
}

// Above the camera while a session is open: its code and ID, and whether
// it's saved in this browser.
function SessionStatus({ session, storageOk }) {
  return (
    <div className="record-session-status">
      <span className="session-id">
        {session.person} · {session.session}
      </span>
      {storageOk ? (
        <span className="session-saved">
          <CheckIcon />
          Saved · {countTakes(session)}
        </span>
      ) : (
        <span className="session-not-saved">Not saved · {countTakes(session)}</span>
      )}
    </div>
  )
}

// A session saved in this browser, offered back when the page opens. A new
// session needs the old one downloaded or deleted first.
function SavedSessionOffer({ saved, canStartNew, onContinue, onDownload, onDelete, onStartNew }) {
  return (
    <main className="record-narrow">
      <section className="saved-offer">
        <div>
          <h1 className="setup-title">Continue your session?</h1>
          <p className="consent-lead">
            This browser has a session that isn't finished: <span className="session-id">{saved.person} · {saved.session}</span>,{' '}
            {countTakes(saved)}.
          </p>
        </div>
        <div className="saved-offer-actions">
          <button type="button" className="primary-button" onClick={onContinue}>
            Continue
          </button>
          <button type="button" className="quiet-button" onClick={onDownload}>
            Download
          </button>
          {canStartNew && (
            <button type="button" className="quiet-button" onClick={onStartNew}>
              Start a new session
            </button>
          )}
          <button type="button" className="danger-link" onClick={onDelete}>
            Delete
          </button>
        </div>
      </section>
    </main>
  )
}

// Kept takes only: rejected attempts stay in the file but don't count here.
function countTakes(session) {
  const n = session.recordings.filter((r) => r.status === 'accepted').length
  return n === 1 ? '1 take' : `${n} takes`
}

// The kept takes for one letter and hand, oldest first.
function keptTakes(session, { letter, hand }) {
  return session.recordings.filter((r) => r.letter === letter && r.hand === hand && r.status === 'accepted')
}
