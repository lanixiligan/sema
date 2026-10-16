import { useEffect, useState } from 'react'
import Link from '../../app/Link.jsx'
import { PATHS } from '../../app/router.js'

// Whether Welcome has already played its entrance. A module variable lives
// as long as the browser tab, so the entrance plays on the first load only:
// coming back from setup shows the page straight away. A reload resets it.
let entrancePlayed = false

// Page 1, Welcome: one centred column with no top bar, sized to fit 1280×720
// without scrolling. The name sits at the top in place of a logo (Sema has
// none yet). Only new visitors see it; returning ones go straight to Record.
export default function WelcomePage() {
  const [animate] = useState(() => !entrancePlayed)
  useEffect(() => {
    entrancePlayed = true
  }, [])

  // The headline, the text under it and the actions fade in one after
  // another (rise-1…3 in styles.css). With reduced motion the CSS turns this off.
  const rise = (step) => (animate ? ` rise-in rise-${step}` : '')

  return (
    <div className="welcome">
      <main className="welcome-hero">
        <div className={`welcome-head${rise(1)}`}>
          <p className="welcome-name">Sema</p>
          <p className="eyebrow">ASL fingerspelling coach</p>
          <h1 className="display">Learn the ASL alphabet with your webcam.</h1>
        </div>
        <p className={`lead${rise(2)}`}>No account. Your video never leaves this device.</p>
        <div className={`welcome-actions${rise(3)}`}>
          <Link to={PATHS.about} className="primary-button">
            Get started
          </Link>
        </div>
      </main>
    </div>
  )
}
