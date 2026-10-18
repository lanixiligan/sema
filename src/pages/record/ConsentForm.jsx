import { useState } from 'react'
import { CameraOffIcon, FileSendIcon, HandPointsIcon } from '../../components/LineIcons.jsx'
import { isValidPersonCode, nextSessionId, normalizePersonCode } from '../../recorder/sessionFile.js'
import { loadUsedSessionIds } from '../../recorder/sessionStore.js'

// Record's first step: the participant's code, the session ID (filled in),
// what gets saved, and consent to use the recordings to train Sema, which is
// required to record.
export default function ConsentForm({ today, onStart }) {
  const [person, setPerson] = useState('')
  const [sessionId, setSessionId] = useState(() => nextSessionId(today, loadUsedSessionIds()))
  const [train, setTrain] = useState(false)

  const code = normalizePersonCode(person)
  const codeOk = isValidPersonCode(code)
  const canStart = codeOk && sessionId.trim() !== '' && train

  function submit(event) {
    event.preventDefault()
    if (canStart) onStart({ person: code, sessionId: sessionId.trim(), consent: { train } })
  }

  // Two columns on desktop, centred in the page: a short explanation and three
  // facts about what gets saved on the left; the fields, then the consent
  // and Start recording, on the right. No cards: space and two thin lines
  // separate the parts. Both columns sit inside the one <form>, so Start
  // recording still submits the fields.
  return (
    <main className="record-consent">
      <form className="consent" onSubmit={submit}>
        <div className="consent-about">
          <div>
            <h1 className="consent-title">Help improve Sema</h1>
            <p className="consent-lead">
              Help me test how well Sema recognizes ASL letters. It takes about 10 minutes.
            </p>
          </div>

          <ul className="consent-facts" aria-label="What gets saved">
            <li>
              <HandPointsIcon size={26} />
              <strong>21 hand points</strong>
              <span>Your hand's position and movement.</span>
            </li>
            <li>
              <CameraOffIcon size={26} />
              <strong>No video or photos</strong>
              <span>Only hand-point data is saved.</span>
            </li>
            <li>
              <FileSendIcon size={26} />
              <strong>You send the file</strong>
              <span>Nothing is uploaded automatically.</span>
            </li>
          </ul>
        </div>

        <div className="consent-side">
          <div className="consent-fields">
            <div className="consent-field">
              <label htmlFor="rec-code">Participant code</label>
              <input
                id="rec-code"
                name="person"
                value={person}
                placeholder="p03"
                autoComplete="off"
                aria-describedby="rec-code-help"
                onChange={(event) => setPerson(event.target.value)}
              />
              {person !== '' && !codeOk ? (
                <span id="rec-code-help" className="consent-help consent-help-error">
                  Use the code Lanix gave you: p and at least two digits, like p03.
                </span>
              ) : (
                <span id="rec-code-help" className="consent-help">
                  Use the code Lanix gave you. Don't enter your name.
                </span>
              )}
            </div>
            <div className="consent-field">
              <label htmlFor="rec-session">Session</label>
              <input
                id="rec-session"
                name="session"
                value={sessionId}
                autoComplete="off"
                aria-describedby="rec-session-help"
                onChange={(event) => setSessionId(event.target.value)}
              />
              <span id="rec-session-help" className="consent-help">
                Added automatically.
              </span>
            </div>
          </div>

          <div className="consent-answers">
            <label className="consent-check">
              <input type="checkbox" name="train" checked={train} onChange={(event) => setTrain(event.target.checked)} />
              <span>
                I agree that the hand-movement data I record may be used to improve Sema.{' '}
                <span className="consent-optional">(Required)</span>
              </span>
            </label>
            {/* The rest of what's in the file, so the agreement is informed. */}
            <p className="consent-delete">
              The file also holds your code, the letters and hands, the date, and basic browser and camera
              details. You can ask Lanix to delete your recordings at any time.
            </p>
          </div>

          <button type="submit" className="primary-button consent-start" disabled={!canStart}>
            Start recording
          </button>
        </div>
      </form>
    </main>
  )
}
