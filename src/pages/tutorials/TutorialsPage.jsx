import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import MenuBar from '../../app/layout/MenuBar.jsx'
import Link from '../../app/routing/Link.jsx'
import { navigate } from '../../app/routing/navigation.js'
import { letterInAddress, letterPath } from '../../app/routing/router.js'
import HandSideToggle from '../../app/settings/HandSideToggle.jsx'
import { useSettings } from '../../app/settings/settings.js'
import AslDrawing from '../../components/AslDrawing.jsx'
import FingerText from '../../components/FingerText.jsx'
import { CheckIcon } from '../../components/icons/icons.jsx'
import { useLetterGuide } from '../../hand-model/letterGuides.js'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// Loaded only once a guide is on screen, so three.js isn't downloaded before
// it's needed (the same file Learn's 3D hand loads).
const HandModelView = lazy(() => import('../../hand-model/HandModelView.jsx'))

// How long the hand takes to move to a step that isn't the next one (Back, or
// a step picked in the list), in ms. The move to the next step takes the time
// set for it in Eidos.
const JUMP_MS = 600

// Tutorials (/tutorials, 2026-11-14): how to make a letter, step by step, on a
// large 3D hand. It teaches; Learn practises and checks, so there's no camera
// here. Each letter's guide is made in Eidos as a movement, and each step of
// that movement is one step here, with a sentence from guides/text/B.json
// (src/hand-model/letterGuides.js, docs/hand-poses.md "Guides").
//
// The page: the letters that have a guide in a row on top, the 3D hand on the
// left, and on the right the steps as a list. Next and Back (or a click on any
// step) move the hand to that step; the fingers the step's sentence names have
// their fingertip numbers lit. The last step leads to Learn, on the same
// letter, to try it with the camera.
//
// The hand is always the 3D one here, with its numbers on, whatever the saved
// 2D | 3D choice says, and that choice is left alone. If the 3D hand can't be
// drawn (no WebGL), the letter's drawing shows instead and the steps still
// read as a list.
export default function TutorialsPage({ signingHand, onSigningHandChange }) {
  const hand = signingHand ?? 'right'
  const { shownTheme, cameraLocked } = useSettings()
  // Every letter has a tutorial (a still one until its guide is made in
  // Eidos). The one picked: the letter in the address (/tutorials?letter=B),
  // else A.
  const letters = LETTERS
  const [picked, setPicked] = useState(() => letterInAddress(window.location.search))
  const letter = letters.includes(picked) ? picked : letters[0]
  const guide = useLetterGuide(letter)
  // The step on screen, and how long the hand takes to get to it.
  const [at, setAt] = useState({ step: 0, duration: 0 })

  // On a phone the letters are one row that scrolls sideways: keep the picked
  // one in view (as Learn's guide does). The row only exists once a guide has
  // loaded, hence `ready`.
  const row = useRef(null)
  const ready = guide.guide !== null
  useEffect(() => {
    const tile = row.current?.querySelector('[aria-pressed="true"]')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    tile?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: calm ? 'auto' : 'smooth' })
  }, [letter, ready])

  function pick(next) {
    setPicked(next)
    setAt({ step: 0, duration: 0 })
    // The address follows the letter, so a reload or a shared link opens it.
    // replace: picking letters doesn't fill the Back button's history.
    navigate(letterPath('tutorials', next), { replace: true })
  }

  if (guide.status === 'loading' && !guide.guide) {
    return (
      <Shell>
        <p className="tutorial-note">Loading the tutorials…</p>
      </Shell>
    )
  }
  if (guide.status === 'unavailable') {
    return (
      <Shell>
        <p className="tutorial-note">The tutorial for {letter} can&rsquo;t be shown right now.</p>
      </Shell>
    )
  }

  // While the next letter's guide arrives, the last one stays up (a moment,
  // or none once it's been fetched), so everything below is about `shown`.
  const shown = guide.letter
  const { steps, whole, stepByStep } = guide.guide
  const step = Math.min(at.step, steps.length - 1)
  const last = step === steps.length - 1
  const nextLetter = letters[letters.indexOf(shown) + 1]

  function go(to) {
    if (to < 0 || to >= steps.length || to === step) return
    setAt({ step: to, duration: to === step + 1 ? steps[to].duration : JUMP_MS })
  }

  const drawing = (
    <div className="tutorial-flat">
      <AslDrawing letter={shown} hand={hand} alt={`Handshape for ${shown}`} />
      <p>The 3D hand can&rsquo;t run in this browser. This drawing is the finished letter.</p>
    </div>
  )

  return (
    <Shell>
      <section className="tutorial-letters" aria-labelledby="tutorial-letters-title">
        <h2 id="tutorial-letters-title" className="visually-hidden">
          Letters
        </h2>
        <ul ref={row}>
          {letters.map((each) => (
            <li key={each}>
              <button type="button" className="learn-tile" aria-pressed={each === letter} onClick={() => pick(each)}>
                {each}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="tutorial-card" aria-label="The hand">
        <Suspense fallback={<p className="hand-model-wait">Loading the 3D hand…</p>}>
          <HandModelView
            letter={shown}
            pose={steps[step].pose}
            duration={at.duration}
            fitTo={whole}
            highlight={steps[step].fingers}
            hand={hand}
            theme={shownTheme}
            fallback={drawing}
            label={`3D hand at step ${step + 1} of making ${shown}. Grab it to turn it.`}
          />
        </Suspense>
        {stepByStep && (
          <p className="tutorial-count" aria-hidden="true">
            Step {step + 1} of {steps.length}
          </p>
        )}
        <div className="tutorial-corner">
          <HandSideToggle hand={hand} onChange={onSigningHandChange} />
        </div>
      </section>

      <section className="tutorial-steps" aria-labelledby="tutorial-title">
        <h1 id="tutorial-title" className="tutorial-title">
          How to make <span>{shown}</span>
        </h1>
        {/* A still guide (no movement made in Eidos yet) is the finished
            letter alone, with a note instead of the steps. */}
        {!stepByStep && (
          <p className="tutorial-still-note">
            A step-by-step guide for {shown} is coming soon. For now, here is the finished letter: turn the hand to see
            it from every side.
          </p>
        )}
        {/* Every step is a button, so any of them can be gone back to. The
            one on screen says so to screen readers (aria-current). */}
        {stepByStep && (
          <ol className="tutorial-list">
            {steps.map((each, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={i < step ? 'tutorial-step done' : 'tutorial-step'}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => go(i)}
                >
                  <span className="tutorial-step-number" aria-hidden="true">
                    {i < step ? <CheckIcon size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="tutorial-step-text">
                    {/* A step with no sentence yet (its text file is shorter
                        than the movement) shows only its number. */}
                    {each.say ? (
                      <>
                        <span className="visually-hidden">Step {i + 1}: </span>
                        <FingerText text={each.say} />
                      </>
                    ) : (
                      <>Step {i + 1}</>
                    )}
                    {/* What the step gets right: the finger conditions Learn's
                        checklist will tick (letterShapes.js). */}
                    {i === step && each.checks.length > 0 && (
                      <span className="tutorial-checks">
                        <span className="visually-hidden">Learn will check: </span>
                        {each.checks.map((check) => (
                          <span key={check} className="tutorial-check">
                            <CheckIcon size={11} strokeWidth={3} />
                            <span>
                              <FingerText text={check} />
                            </span>
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="tutorial-actions">
          {stepByStep && (
            <button type="button" className="tutorial-back" disabled={step === 0} onClick={() => go(step - 1)}>
              Back
            </button>
          )}
          {!last && (
            <button type="button" className="button tutorial-next" onClick={() => go(step + 1)}>
              Next step
            </button>
          )}
          {/* Learn needs the camera check; someone who skipped it gets the
              next letter instead. */}
          {last && !cameraLocked && (
            <Link className="button tutorial-next" to={letterPath('learn', shown)}>
              Try {shown} with your camera
            </Link>
          )}
          {last && nextLetter && (
            <button type="button" className={cameraLocked ? 'button tutorial-next' : 'tutorial-back'} onClick={() => pick(nextLetter)}>
              Next letter: {nextLetter}
            </button>
          )}
        </div>
      </section>
    </Shell>
  )
}

// The page around every state: the menu bar and the page's frame.
function Shell({ children }) {
  return (
    <>
      <MenuBar active="tutorials" />
      <main className="tutorial">{children}</main>
    </>
  )
}
