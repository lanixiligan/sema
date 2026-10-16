import { useState } from 'react'
import Link from '../../app/Link.jsx'
import { HandIcon } from '../../components/icons.jsx'
import { navigate } from '../../app/navigation.js'
import SetupBar from './SetupBar.jsx'
import { PATHS } from '../../app/router.js'

const HANDS = [
  { id: 'left', name: 'Left' },
  { id: 'right', name: 'Right' },
]

// Setup step 1 of 2: which hand the person signs with. It starts on the saved
// choice, or Right for a new visitor (as designed). The choice is saved when
// they press Continue.
// Two columns: the text and Back/Continue on the left, the choice on the
// right. In the page, the choice comes before the buttons, so Tab reaches it
// before Continue; the grid in styles.css puts the buttons under the text.
export default function SigningHandPage({ signingHand, onChoose }) {
  const [hand, setHand] = useState(signingHand ?? 'right')

  function next() {
    onChoose(hand)
    navigate(PATHS.cameraCheck)
  }

  return (
    <div className="setup-page">
      <SetupBar step={1} />
      <main className="setup-main">
        <div className="split signing-hand">
          <div className="signing-hand-text">
            <h1 className="setup-title">Which hand will you use?</h1>
            <p className="setup-lead">
              Choose the hand you’ll use to practice. Sema will adjust the reference images and instructions to match your choice. You can change this anytime.
            </p>
          </div>

          {/* Two toggle buttons: aria-pressed tells screen readers which one is on. */}
          <div className="hand-choice signing-hand-choice" role="group" aria-label="Signing hand">
            {HANDS.map(({ id, name }) => (
              <button key={id} type="button" aria-pressed={hand === id} onClick={() => setHand(id)}>
                <span className={id === 'left' ? 'hand-choice-icon mirrored' : 'hand-choice-icon'} aria-hidden="true">
                  <HandIcon size={64} />
                </span>
                {name}
              </button>
            ))}
          </div>

          <div className="setup-actions signing-hand-actions">
            <Link to={PATHS.privacy} className="back-link">
              Back
            </Link>
            <button type="button" className="primary-button" onClick={next}>
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
