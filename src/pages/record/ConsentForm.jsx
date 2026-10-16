import { useState } from 'react'
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

  // Two columns on desktop: what this is and what gets saved on the left, the
  // form on the right. Both sit inside the one <form>, so Start recording
  // still submits the fields.
  return (
    <main className="record-consent">
      <form className="consent" onSubmit={submit}>
        <div className="consent-about">
          <div>
            <h1 className="setup-title">Help train Sema</h1>
            <p className="consent-lead">
              You're set up. While Sema is being built, the most useful thing you can do is help train it: to
              learn the alphabet, it needs examples from real hands, maybe yours. Learn and Practice are open as a
              preview in the menu above.
            </p>
            <p className="consent-lead consent-lead-next">
              You'll sign a few letters, three short takes each, with both hands. It takes about 10 minutes. The
              file stays on this computer until you send it to Lanix.
            </p>
          </div>

          <div className="consent-saved">
            <div className="consent-saved-title">What gets saved</div>
            <ul>
              <li>21 points on your hand, about ten times a second. No video, no photos.</li>
              <li>Your code, the letter, which hand, and your browser's name.</li>
              <li>Nothing is uploaded. You download a file and send it to Lanix.</li>
            </ul>
          </div>
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
                  From Lanix. Never your name.
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
                Filled in for you.
              </span>
            </div>
          </div>

          <div className="consent-answers">
            <label className="consent-check">
              <input type="checkbox" name="train" checked={train} onChange={(event) => setTrain(event.target.checked)} />
              <span>
                My recordings may be used to train Sema <span className="consent-optional">(required)</span>
              </span>
            </label>
            <p className="consent-delete">You can ask Lanix to delete your recordings at any time.</p>
          </div>

          <button type="submit" className="primary-button consent-start" disabled={!canStart}>
            Start recording
          </button>
        </div>
      </form>
    </main>
  )
}
