import { useEffect, useState } from 'react'
import Logo from '../../components/Logo.jsx'
import ThemeToggle from '../../app/settings/ThemeToggle.jsx'

// Whether Welcome has already played its entrance. A module variable lives
// as long as the browser tab, so the entrance plays on the first load only:
// coming back from About shows the page straight away. A reload resets it.
let entrancePlayed = false

// Page 1, Welcome (redesigned 2026-10-31, in Duolingo's layout 2026-11-02): a
// bare header with only the theme button, then one row: the logo on the left,
// where Duolingo has its picture, and on the right one line on what Sema is
// with the Get started button under it. It was a "HELLO my name is" tag that
// fingerspelled a typed name, then a "WELCOME to" sticker, then a centred
// column with a paragraph; Lanix cut each. Only new visitors see the page;
// returning ones go straight to Learn. Get started opens the camera check,
// setup's one page (onStart).
export default function WelcomePage({ onStart }) {
  const [animate] = useState(() => !entrancePlayed)
  useEffect(() => {
    entrancePlayed = true
  }, [])

  return (
    <div className="welcome">
      <header className="welcome-bar">
        <ThemeToggle />
      </header>
      <main className="welcome-main">
        {/* The row rises in on the first visit (enter-copy in styles.css);
            with reduced motion the CSS turns it off. */}
        <div className={`welcome-hero${animate ? ' enter-copy' : ''}`}>
          <Logo className="welcome-logo" />
          <div className="welcome-actions">
            <h1 className="welcome-title">Learn American Sign Language (ASL) fingerspelling with your webcam</h1>
            <button type="button" className="key-button" onClick={onStart}>
              Get started

            </button>
            <p className="welcome-note">No account needed.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
