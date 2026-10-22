import { CheckIcon } from '../../../components/icons/icons.jsx'
import { sessionFileName } from '../../../recorder/sessionFile.js'

// After "Finish and download": thanks, how many takes were kept, and where the
// file went. The camera is off here (no camera view on this step).
export default function FinishedStep({ session, onNewSession, onDelete, onKeepRecording }) {
  const kept = session.recordings.filter((r) => r.status === 'accepted').length
  const notKept = session.recordings.length - kept

  return (
    <main className="record-finished">
      <section>
        <div className="record-finished-icon" aria-hidden="true">
          <CheckIcon size={30} strokeWidth={2.2} />
        </div>
        <div>
          <h1>Thanks, your session is downloaded</h1>
          <p className="record-finished-counts">
            {plural(kept, 'take')} kept, {notKept} not kept.
          </p>
        </div>
        <div className="record-finished-file">
          <div className="record-finished-file-title">Send this file to Lanix</div>
          <div className="record-finished-file-name">{sessionFileName(session)}</div>
          <div className="record-finished-file-where">
            It's in your Downloads folder. Messenger or email is fine. Nothing has been uploaded.
          </div>
        </div>
        <div className="record-finished-actions">
          <button type="button" className="primary-button" onClick={onNewSession}>
            Start a new session
          </button>
          <button type="button" className="danger-link" onClick={onDelete}>
            Delete from this browser
          </button>
        </div>
        <button type="button" className="back-link" onClick={onKeepRecording}>
          Keep recording
        </button>
      </section>
    </main>
  )
}

function plural(n, word) {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`
}
