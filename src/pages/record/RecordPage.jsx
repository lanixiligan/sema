import { useEffect, useRef, useState } from 'react'
import MenuBar from '../../app/MenuBar.jsx'
import { useSharedCamera } from '../../app/sharedCamera.js'
import CameraStage from '../../components/CameraStage.jsx'
import { CheckIcon, LockIcon } from '../../components/icons.jsx'
import StageProblem from '../../components/StageProblem.jsx'
import { useLetters } from '../../recorder/letters.js'
import { acceptedCount, addTake, needsDownload, newSession, undoLastTake } from '../../recorder/sessionFile.js'
import { clearSession, downloadSession, loadSession, rememberSessionId, saveSession } from '../../recorder/sessionStore.js'
import { TAKES_TARGET } from '../../recorder/takeRules.js'
import { useRecording } from '../../recorder/useRecording.js'
import { browserName } from '../../vision/browserName.js'
import { useHandDetection } from '../../vision/useHandDetection.js'
import { LOADING_HAND_MODEL } from '../../vision/visionMessages.js'
import ConsentForm from './ConsentForm.jsx'
import FinishedStep from './FinishedStep.jsx'
import HandToggle from './HandToggle.jsx'
import RecordingGrid from './RecordingGrid.jsx'
import TakeOverlay from './TakeOverlay.jsx'
import TakePanel from './TakePanel.jsx'
import TakeResult from './TakeResult.jsx'

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
  const hand = useHandDetection({
    videoRef,
    canvasRef,
    landmarkerRef: handModel.landmarkerRef,
    listenerRef,
    isRunning: isDetecting,
  })

  // The hand the next take is for (starts on the signing hand) and the chosen
  // letter. Switching hands keeps the letter.
  const [takeHand, setTakeHand] = useState(signingHand ?? 'right')
  const [pickedLetter, setLetter] = useState(null)
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

  function undo() {
    updateSession(undoLastTake(session))
    recording.dismiss() // the result card described the take just removed
  }

  const step = !session ? 'consent' : finished ? 'finished' : 'recording'

  return (
    <>
      <MenuBar active="record">
        {session && <SessionStatus session={session} storageOk={storageOk} />}
      </MenuBar>

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
        <main className="record">
          <section className="record-camera" aria-label="Camera">
            <CameraStage canvasRef={canvasRef} className="stage record-stage">
              {camera.error ? (
                <StageProblem title="The camera didn't start" body={camera.error} onRetry={camera.start} />
              ) : handModel.status === 'error' || hand.error ? (
                <StageProblem title="Hand tracking couldn't start" body={handModel.error || hand.error} />
              ) : (
                <TakeOverlay
                  recording={recording}
                  idleText={describeHand(camera.status, handModel.status, hand.handLabel)}
                />
              )}
            </CameraStage>
            <p className="record-private">
              <LockIcon size={14} />
              Only hand points are saved. No video.
            </p>
          </section>

          <aside className="record-side" aria-label="Current take">
            <HandToggle hand={takeHand} onChange={setTakeHand} disabled={recording.busy} />
            {!storageOk && (
              <p className="record-note" role="alert">
                Progress isn't being saved in this browser. Download the file before closing.
              </p>
            )}
            {letters.status === 'error' && (
              <p className="record-note" role="alert">
                Couldn't load the letter list (public/languages/asl/letters.json).
              </p>
            )}
            {cell && (
              <TakePanel
                cell={cell}
                isPilot={letters.pilot.includes(cell.letter)}
                instructions={letters.instructions[cell.letter]}
                image={letters.images[cell.letter]}
                accepted={acceptedCount(session, cell.letter, cell.hand)}
              />
            )}
            <TakeResult recording={recording} cell={cell} />
            <div className="record-actions">
              <button
                type="button"
                className="primary-button record-take"
                disabled={!isDetecting || !cell || recording.busy}
                onClick={() => {
                  setLetter(cell.letter) // keep this letter chosen, so its result stays in view
                  recording.start(cell.letter, cell.hand)
                }}
              >
                Record take
              </button>
              <button
                type="button"
                className="quiet-button"
                disabled={session.recordings.length === 0 || recording.busy}
                onClick={undo}
              >
                Undo last take
              </button>
            </div>
          </aside>

          {letters.status === 'ready' && (
            <div className="record-letters">
              <RecordingGrid
                training={letters.training}
                pilot={letters.pilot}
                session={session}
                hand={takeHand}
                selected={cell}
                onSelect={setLetter}
                disabled={recording.busy}
              />
              <button
                type="button"
                className="outline-button record-finish"
                disabled={session.recordings.length === 0 || recording.busy}
                onClick={finish}
              >
                Finish and download
              </button>
            </div>
          )}
        </main>
      )}
    </>
  )
}

// The right side of the menu bar while a session is open: its code and ID,
// and whether it's being saved in this browser.
function SessionStatus({ session, storageOk }) {
  return (
    <>
      <span className="session-id">
        {session.person} · {session.session}
      </span>
      {storageOk ? (
        <span className="session-saved">
          <CheckIcon />
          Saved in this browser · {countTakes(session)}
        </span>
      ) : (
        <span className="session-not-saved">Not saved in this browser · {countTakes(session)}</span>
      )}
    </>
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

function countTakes(session) {
  const n = session.recordings.length
  return n === 1 ? '1 take' : `${n} takes`
}

// The top of the video when no take is running: what the camera and hand
// tracking are doing.
function describeHand(cameraStatus, modelStatus, handLabel) {
  if (cameraStatus === 'starting') return 'Waiting for the camera…'
  if (cameraStatus !== 'live') return 'Camera is off'
  if (modelStatus === 'loading' || modelStatus === 'idle') return LOADING_HAND_MODEL
  return handLabel ? `${handLabel} hand found` : 'No hand in view'
}
