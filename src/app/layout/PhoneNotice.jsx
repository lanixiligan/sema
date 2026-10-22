import { useState } from 'react'
import Logo from '../../components/Logo.jsx'

// Shown instead of the app on small screens (App decides when): Sema's pages
// are designed for a computer with a webcam. "Continue on this phone" shows
// the app anyway, until the page is reloaded.
export default function PhoneNotice({ onContinue }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      // The browser can refuse (no permission, or not a secure page). The link
      // is still in the address bar, so there's nothing more to do.
    }
  }

  return (
    <div className="phone-notice">
      <header className="phone-notice-bar">
        <Logo className="wordmark-logo" />
        <span className="preview-note">Preview</span>
      </header>

      <main className="phone-notice-main">
        <div className="phone-notice-icon" aria-hidden="true">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="11" rx="1.5" />
            <path d="M2 19h20" />
            <circle cx="12" cy="8" r="0.8" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1>Sema is made for computers, for now</h1>
          <p>
            It runs on phones, but the pages are designed for a laptop or desktop with a webcam. For the
            best experience, open this link on a computer.
          </p>
        </div>
        <div className="phone-notice-actions">
          <button type="button" className="phone-notice-copy" onClick={copyLink}>
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <button type="button" className="phone-notice-continue" onClick={onContinue}>
            Continue on this phone
          </button>
        </div>
      </main>
    </div>
  )
}
