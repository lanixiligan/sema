import Link from '../../app/Link.jsx'
import { HandIcon, LockIcon } from '../../components/icons.jsx'
import SetupBar from './SetupBar.jsx'
import { PATHS } from '../../app/router.js'

// Setup step 1 of 3: what Sema does with what it sees and saves, before the
// camera turns on.
export default function HowSemaWorksPage() {
  return (
    <div className="setup-page">
      <SetupBar step={1} />
      <main className="setup-main">
        <section className="setup-section setup-section-wide">
          <div>
            <h1 className="setup-title">How Sema works</h1>
            <p className="setup-lead">Before your camera turns on, here's what Sema does with what it sees and saves.</p>
          </div>

          <ul className="how-list">
            <Point icon={<HandIcon />} title="It checks the shape of your hand">
              Sema finds 21 points on your hand and compares their shape with the letter you're learning. It
              matches shapes; the meaning is yours to learn.
            </Point>
            <Point icon={<LockIcon />} title="Your video never leaves this device">
              Hand detection runs in your browser. Your video is never uploaded or recorded.
            </Point>
            <Point icon={<NoTrackingIcon />} title="No account, no analytics, no tracking">
              Sema doesn't know who you are.
            </Point>
            <Point icon={<NotesIcon />} title="Progress is saved in this browser only">
              Your signing hand and letters are kept in this browser's local storage. Reset progress, or clearing
              your site data, removes them.
            </Point>
          </ul>

          <p className="how-footnote">
            Like any website, the hosting service may keep standard technical logs, such as IP addresses.
          </p>

          <div className="setup-actions">
            <Link to={PATHS.welcome} className="back-link">
              Back
            </Link>
            <Link to={PATHS.signingHand} className="primary-button">
              Continue
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function Point({ icon, title, children }) {
  return (
    <li className="how-point">
      <span className="how-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <div className="how-title">{title}</div>
        <div className="how-text">{children}</div>
      </div>
    </li>
  )
}

// Icons only this page uses, from the design.
function NoTrackingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="3" />
      <path d="M3.5 15.5c.8-2.6 3-4 5.5-4s4.7 1.4 5.5 4" />
      <path d="M2 2l14 14" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="12" height="12" rx="2" />
      <path d="M6 9h6M6 6h6M6 12h3" />
    </svg>
  )
}
