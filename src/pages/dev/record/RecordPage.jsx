import { useEffect, useRef, useState } from 'react'
import DevTopBar from '../DevTopBar.jsx'
import { useSharedCamera } from '../../../app/shared-camera/sharedCamera.js'
import CameraView from '../../../components/camera-view/CameraView.jsx'
import { useLetters } from '../../../recorder/letters.js'
import { acceptedCount, addTake, deleteTake, needsDownload, newSession } from '../../../recorder/sessionFile.js'
import {
  clearSession,
  downloadSession,
  loadSession,
  rememberDownload,
  rememberSessionId,
  saveSession,
  wasDownloaded,
} from '../../../recorder/sessionStore.js'
import { TAKES_TARGET } from '../../../recorder/takeRules.js'
import { useRecording } from '../../../recorder/useRecording.js'
import { browserName } from '../../../vision/model/browserName.js'
import { useHandDetection } from '../../../vision/tracking/useHandDetection.js'
import ConsentForm from './ConsentForm.jsx'
import FinishedStep from './FinishedStep.jsx'
import LetterList from './LetterList.jsx'
import LetterGuide from './LetterGuide.jsx'
import TakeOverlay, { TakePanelHead } from './TakeOverlay.jsx'
import TakePanel from './TakePanel.jsx'
import TakeResult from './TakeResult.jsx'
import { takeReadiness } from './takeReadiness.js'

// "2026-11-02" in the person's own time zone.
const today = () => new Date().toLocaleDateString('en-CA')

// The Record page, in three steps:
// - consent: the participant's code and consent answers (or the offer to
//   continue a session saved in this browser);
// - recording: the letter list, the camera with the record button, and the
//   chosen letter's card, steps and Finish;
// - finished: after "Finish and download".
// The camera is on only during recording: that's the only step with a camera
// view (CameraView), and CameraProvider starts and stops it to match.
export default function RecordPage({ signingHand }) {
  // A session saved in this browser is offered back when the page opens; if
  // it was downloaded as it is (even before a reload), it counts as downloaded.
  const [opening] = useState(loadSavedSession)
  const [saved, setSaved] = useState(opening.saved)
  const [session, setSession] = useState(null)
  const [finished, setFinished] = useState(false)
  const [storageOk, setStorageOk] = useState(true)
  const [downloaded, setDownloaded] = useState(opening.downloaded) // the session object last downloaded
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
  const allLetters = letters.status === 'ready' ? [...letters.training, ...letters.pilot].sort() : []
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

  // Carries on with the saved session, on the hand of its last take.
  function continueSaved() {
    const last = saved.recordings.at(-1)
    if (last) setTakeHand(last.hand)
    setSession(saved)
    setSaved(null)
  }

  function download(current) {
    downloadSession(current)
    rememberDownload(current)
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

  // Deletes one kept take, chosen on its letter row (TakeMarks).
  function deleteOne(recordingId) {
    updateSession(deleteTake(session, recordingId))
    recording.dismiss() // the result line may describe the take just removed
  }

  const step = !session ? 'consent' : finished ? 'finished' : 'recording'

  return (
    <>
      <DevTopBar title="Record" />

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
        // Three columns that start and end on the same lines: the letters,
        // the camera, and the chosen letter, the record button and Finish at
        // the bottom (grid areas in styles.css).
        <main className="record">
          <div className="record-letters">
            {letters.status === 'ready' && (
              <LetterList
                training={letters.training}
                pilot={letters.pilot}
                session={session}
                hand={takeHand}
                selected={cell}
                onSelect={setLetter}
                onDelete={deleteOne}
                disabled={recording.busy}
              />
            )}
          </div>
          <section className="record-camera" aria-label="Camera">
            {/* The camera check's panel: a header with the take's status, then
                the video. Dark in every theme, like every camera frame. The
                controls are hidden during a take: switching the camera or the
                hand would spoil it. */}
            <div className="camera-panel on-dark record-panel" role="group" aria-label="Camera preview">
              <TakePanelHead recording={recording} idleText={readiness.text} />
              <CameraView
                canvasRef={canvasRef}
                hand={hand}
                className="record-stage"
                offNote="Turn on your camera to start recording."
                controls={!recording.busy && { hand: takeHand, onHandChange: setTakeHand, handLabel: 'Hand for this take' }}
              >
                <TakeOverlay recording={recording} />
              </CameraView>
            </div>
            {/* Right under the picture: start a take. Space does the same,
                as a shortcut. While a take runs the button says so and stays
                disabled, so a second click can't start another. */}
            <button
              type="button"
              className="record-take"
              disabled={!canStartTake}
              onClick={startTake}
              aria-keyshortcuts="Space"
            >
              <span className="record-take-dot" aria-hidden="true" />
              {recordLabel(recording.busy, cell && acceptedCount(session, cell.letter, cell.hand))}
            </button>
          </section>
          {/* Under the camera column's bottom line, like Finish's line beside it. */}
          <p className="record-take-hint">You can also press Space on your keyboard.</p>

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
              <TakePanel
                cell={cell}
                isPilot={letters.pilot.includes(cell.letter)}
                image={letters.images[cell.letter]}
                accepted={acceptedCount(session, cell.letter, cell.hand)}
              />
            )}
            {cell && (
              <LetterGuide steps={letters.instructions[cell.letter]} hand={cell.hand} />
            )}
            {/* The last take's result, in a line that's always there, so
                nothing moves when it appears. */}
            {cell && (
              <div className="record-feedback">
                <TakeResult recording={recording} cell={cell} />
              </div>
            )}
            {/* Last, at the bottom of the column: done with the session. */}
            <div className="record-finish">
              <button
                type="button"
                className="outline-button"
                disabled={session.recordings.length === 0 || recording.busy}
                aria-describedby="record-finish-help"
                onClick={finish}
              >
                Finish and download
              </button>
            </div>
          </aside>
          <span id="record-finish-help" className="record-finish-help">
            {session.recordings.length === 0 ? 'Record a take first' : 'Downloads your session file'}
          </span>
        </main>
      )}
    </>
  )
}

// A session saved in this browser, offered back when the page opens: whose
// it is, then the actions from most to least likely: continue, download,
// start a new one (only once this one is downloaded, so no takes are lost),
// and, set apart, delete (which asks first, deleteSession).
function SavedSessionOffer({ saved, canStartNew, onContinue, onDownload, onDelete, onStartNew }) {
  return (
    <main className="record-narrow">
      <section className="saved-offer">
        <div>
          <h1 className="setup-title">Pick up where you left off</h1>
          <p className="consent-lead">You have an unfinished session saved on this device.</p>
        </div>
        <dl className="saved-offer-meta">
          <div>
            <dt>Participant</dt>
            <dd className="session-id">{saved.person}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd className="session-id">{saved.session}</dd>
          </div>
        </dl>
        <div className="saved-offer-actions">
          <button type="button" className="primary-button" onClick={onContinue}>
            Continue session
          </button>
          <button type="button" className="outline-button" onClick={onDownload}>
            Download session
          </button>
          {canStartNew && (
            <button type="button" className="quiet-button" onClick={onStartNew}>
              Start a new session
            </button>
          )}
        </div>
        <div className="saved-offer-delete">
          <button type="button" className="danger-link" onClick={onDelete}>
            Delete saved session
          </button>
        </div>
      </section>
    </main>
  )
}

// The saved session, and the same object as `downloaded` if it was downloaded
// unchanged, so needsDownload (which compares objects) sees no new takes.
function loadSavedSession() {
  const saved = loadSession()
  return { saved, downloaded: saved && wasDownloaded(saved) ? saved : null }
}

// The record button's label: the take it will record ("Record take 2 of 3"),
// or that one is under way.
function recordLabel(busy, kept) {
  if (busy) return 'Recording…'
  if (kept === null) return 'Record take'
  return kept < TAKES_TARGET ? `Record take ${kept + 1} of ${TAKES_TARGET}` : 'Record another take'
}
