import { useState } from 'react'
import { DEV_CODE_HASH, hashCode } from './devAccess.js'
import DevTopBar from './DevTopBar.jsx'

// Asks for the access code before any developer page opens (DevArea.jsx).
// The code is compared by its fingerprint (devAccess.js); onUnlock gets the
// fingerprint, which App saves so this browser stays unlocked.
export default function DevGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | checking | wrong

  async function submit(event) {
    event.preventDefault()
    setStatus('checking')
    const fingerprint = await hashCode(code)
    if (fingerprint === DEV_CODE_HASH) onUnlock(fingerprint)
    else setStatus('wrong')
  }

  return (
    <>
      <DevTopBar />
      <main className="placeholder dev-gate">
        <section>
          <h1>Developer tools</h1>
          {DEV_CODE_HASH === null ? (
            <p>
              No access code is set yet. Set one with <code>npm run dev-code -- "a long passphrase"</code>,
              then commit and deploy for the live site.
            </p>
          ) : (
            <form onSubmit={submit}>
              <label htmlFor="dev-code">Access code</label>
              <input
                id="dev-code"
                type="password"
                autoComplete="current-password"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value)
                  setStatus('idle')
                }}
                aria-describedby={status === 'wrong' ? 'dev-code-error' : undefined}
              />
              {status === 'wrong' && (
                <p id="dev-code-error" className="dev-gate-error" role="alert">
                  That code isn&rsquo;t right.
                </p>
              )}
              <button type="submit" className="primary-button" disabled={!code.trim() || status === 'checking'}>
                Unlock
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  )
}
