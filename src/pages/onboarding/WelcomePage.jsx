import { useState } from 'react'
import Link from '../../app/Link.jsx'
import PreviewPill from '../../app/PreviewPill.jsx'
import { PATHS } from '../../app/router.js'

// Page 1, Welcome: the name and what it means on the left (dark), what Sema is
// and "Get started" on the right. Only new visitors see it; returning ones go
// straight to Record (router.js).
export default function WelcomePage() {
  const [cameraNoteOpen, setCameraNoteOpen] = useState(false)

  return (
    <div className="welcome">
      <section className="welcome-name" aria-label="About the name">
        <div className="welcome-greek">σῆμα · a sign</div>
        <div className="welcome-hand">
          <HandIllustration />
        </div>
        <p className="welcome-tagline">Seeing a hand's shape is not the same as knowing what it signs.</p>
      </section>

      <main className="welcome-main">
        <div className="welcome-content">
          <div>
            <div className="welcome-title">
              <span className="welcome-sema">Sema</span>
              <PreviewPill />
            </div>
            <div className="welcome-descriptor">ASL fingerspelling coach</div>
          </div>

          <div>
            <h1>Learn the ASL alphabet with your webcam.</h1>
            <p className="welcome-lead">No account. Your video never leaves this device.</p>
            <p className="welcome-note">
              <strong>Sema is still being built.</strong> For now, you can help train it by recording a few
              letters. The lessons are open as a preview, and letter feedback arrives one letter at a time.
            </p>
          </div>

          <Link to={PATHS.howSemaWorks} className="primary-button welcome-start">
            Get started
          </Link>

          <div>
            <button
              type="button"
              className="disclosure"
              aria-expanded={cameraNoteOpen}
              onClick={() => setCameraNoteOpen(!cameraNoteOpen)}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 3l4 4-4 4" />
              </svg>
              How Sema handles your camera
            </button>
            {cameraNoteOpen && (
              <p className="disclosure-text">
                Your camera video is processed entirely in your browser and is never uploaded or recorded. Sema
                has no accounts and no analytics. Your signing hand and progress are saved only in this
                browser's local storage, so you don't lose them; Reset progress or clearing your site data
                removes them. Like any website, the hosting service may keep standard technical logs, such as IP
                addresses.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// The tracked hand points forming the letter W, drawn like the live overlay:
// Bright Sky bones and Cloud White joints. Coordinates are from the design.
const BONES = [
  'M150 270L125 250L115 225L135 205L160 200',
  'M150 270L120 200L105 160L97 130L92 105',
  'M120 200L145 190L145 145L145 115L145 90',
  'M145 190L170 195L182 155L190 128L197 105',
  'M170 195L180 205L176 192L166 196L160 200',
  'M150 270L180 205',
]
const JOINTS = [
  [125, 250], [115, 225], [135, 205], [160, 200],
  [120, 200], [105, 160], [97, 130], [92, 105],
  [145, 190], [145, 145], [145, 115], [145, 90],
  [170, 195], [182, 155], [190, 128], [197, 105],
  [180, 205], [176, 192], [166, 196],
]

function HandIllustration() {
  return (
    <svg viewBox="60 70 200 220" role="img" aria-label="Illustration of tracked hand points forming the letter W" className="welcome-hand-svg">
      <g fill="none" stroke="var(--bright-sky)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {BONES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill="var(--cloud-white)">
        <circle cx="150" cy="270" r="4" />
        {JOINTS.map(([cx, cy]) => (
          <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="3.2" />
        ))}
      </g>
    </svg>
  )
}
