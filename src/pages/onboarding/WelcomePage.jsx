import { useEffect, useState } from 'react'
import TopBar from '../../app/layout/TopBar.jsx'
import Logo from '../../components/Logo.jsx'

// Whether Welcome has already played its entrance. A module variable lives
// as long as the browser tab, so the entrance plays on the first load only:
// coming back from About shows the page straight away. A reload resets it.
let entrancePlayed = false

// Page 1, Welcome: the shared top bar (the name, as on every
// page), then one centred column, sized to fit 1280×720 without scrolling.
// Only new visitors see it; returning ones go straight to Learn.
// Get started opens the camera check, setup's one page (onStart). The
// "What is Sema?" link to About is gone (Lanix removed it on 2026-10-27).
export default function WelcomePage({ onStart }) {
  const [animate] = useState(() => !entrancePlayed)
  useEffect(() => {
    entrancePlayed = true
  }, [])

  // The headline, the text under it and the button fade in one after
  // another (rise-1…3 in styles.css). With reduced motion the CSS turns this off.
  const rise = (step) => (animate ? ` rise-in rise-${step}` : '')

  return (
    <div className="welcome">
      <TopBar />
      <main className="welcome-hero">
        <Logo className="welcome-logo" />
        <h1 className={`display welcome-title${rise(1)}`}>Learn the American Sign Language (ASL) alphabet with your webcam.</h1>
        <p className={`lead welcome-lead${rise(2)}`}>No account. Your video never leaves this device.</p>
        <div className={`welcome-actions${rise(3)}`}>
          <button type="button" className="primary-button" onClick={onStart}>
            Get started
          </button>
        </div>
      </main>
    </div>
  )
}
