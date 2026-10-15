import { useState } from 'react'
import { isValidPersonCode, nextSessionId, normalizePersonCode } from './sessionFile.js'
import { loadUsedSessionIds } from './sessionStore.js'

export default function ConsentForm({ today, onStart }) {
  const [person, setPerson] = useState('')
  const [sessionId, setSessionId] = useState(() => nextSessionId(today, loadUsedSessionIds()))
  const [train, setTrain] = useState(false)
  const [publish, setPublish] = useState(false)

  const code = normalizePersonCode(person)
  const codeOk = isValidPersonCode(code)
  const canStart = codeOk && sessionId.trim() !== '' && train

  function submit(event) {
    event.preventDefault()
    if (canStart) onStart({ person: code, sessionId: sessionId.trim(), consent: { train, publish } })
  }

  return (
    <form className="consent" onSubmit={submit}>
      <h1>Record hand shapes for Sema</h1>
      <div className="consent-text">
        <p>
          Sema is a student project that teaches ASL fingerspelling. This page records the
          positions of 21 points on your hand while you sign letters. It does not save video
          or photos. Your recordings are labelled with a code (like p03), never your name.
        </p>
        <p>
          Everything stays in this browser until you download the file at the end; nothing is
          uploaded. You then send the file to Lanix, who keeps it private and uses it to train
          and test Sema's letter recognition. Ask Lanix to delete your recordings at any time.
          You can stop whenever you like, and "Delete this session" removes what's stored in
          this browser.
        </p>
      </div>

      <label className="field">
        Your code
        <input name="person" value={person} placeholder="p03" autoComplete="off" onChange={(e) => setPerson(e.target.value)} />
      </label>
      {person !== '' && !codeOk && (
        <p className="error">Use the code Lanix gave you: p followed by at least two digits, like p03.</p>
      )}

      <label className="field">
        Session
        <input name="session" value={sessionId} autoComplete="off" onChange={(e) => setSessionId(e.target.value)} />
      </label>

      <label className="check">
        <input type="checkbox" name="train" checked={train} onChange={(e) => setTrain(e.target.checked)} />
        <span>My recordings may be used to train Sema. (required)</span>
      </label>
      <label className="check">
        <input type="checkbox" name="publish" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        <span>My recordings may be published in a public dataset. (optional)</span>
      </label>

      <button type="submit" className="button" disabled={!canStart}>
        Start session
      </button>
    </form>
  )
}
