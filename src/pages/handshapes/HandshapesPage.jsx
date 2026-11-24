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

// Handshapes (/handshapes, 2026-11-14): how to make a letter, step by step, on a
// large 3D hand. It teaches; Learn practises and checks, so there's no camera
// here. Each letter's guide is made in Eidos as a movement, and each step of
// that movement is one step here, with a sentence from guides/text/B.json
// (src/hand-model/letterGuides.js, docs/hand-poses.md "Guides").
//
// The page (2026-11-15): the 26 letters in a row on top, then two columns. The
// left one is only the hand: its card, with "How to make B" along its top. The
// right one is everything else: every step as a list, each with its number in
// a dot, the dots joined by a line down the list (a tick for a step done, the
// one on screen a card), and at the bottom Back and Next step. A click on a
// step goes to it. The fingers the step's sentence names have their fingertip
// numbers lit. On the last step the card's title becomes "That's B!" in green
// (above the hand, never on it) and the buttons lead to Learn, on the same
// letter, to try it with the camera. On a phone only the step on screen is
// listed, with the dots in a row under it.
//
// The hand is always the 3D one here, with its numbers on, whatever the saved
// 2D | 3D choice says, and that choice is left alone. If the 3D hand can't be
// drawn (no WebGL), a notice above the card says so, with a button to Learn,
// the letter's drawing takes the card and the steps still read as a list.
export default function HandshapesPage({ signingHand, onSigningHandChange }) {
  const hand = signingHand ?? 'right'
  const { shownTheme, cameraLocked } = useSettings()
  // Every letter has a guide (a still one until its guide is made in
  // Eidos). The one picked: the letter in the address (/handshapes?letter=B),
  // else A.
  const letters = LETTERS
  const [picked, setPicked] = useState(() => letterInAddress(window.location.search))
  const letter = letters.includes(picked) ? picked : letters[0]
  const guide = useLetterGuide(letter)
  // The step on screen, and how long the hand takes to get to it.
  const [at, setAt] = useState({ step: 0, duration: 0 })
  // Whether the 3D hand could be drawn: 'loading' until HandModelView says
  // (onReady when the hand is in its frame, then onSettled either way), then
  // 'ready', or 'failed' when the browser has no WebGL or the model didn't load.
  const [hand3d, setHand3d] = useState('loading')

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
    navigate(letterPath('handshapes', next), { replace: true })
  }

  if (guide.status === 'loading' && !guide.guide) {
    return (
      <Shell>
        <p className="handshapes-note">Loading the guides…</p>
      </Shell>
    )
  }
  if (guide.status === 'unavailable') {
    return (
      <Shell>
        <p className="handshapes-note">The guide for {letter} can&rsquo;t be shown right now.</p>
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

  // The finished letter: the last step of a guide that has steps.
  const made = stepByStep && last

  return (
    <Shell>
      <section className="handshapes-letters" aria-labelledby="handshapes-letters-title">
        <h2 id="handshapes-letters-title" className="visually-hidden">
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

      <div className="handshapes-stage">
        {/* No WebGL: say so above the card, where it can't be missed. Learn
            needs the camera check, so someone who skipped it gets no button. */}
        {hand3d === 'failed' && (
          <div className="handshapes-notice" role="status">
            <div>
              <p className="handshapes-notice-title">This browser can&rsquo;t show the 3D hand</p>
              <p>
                It needs WebGL, which is off or missing here (Learn&rsquo;s camera needs it too). Turn on hardware
                acceleration in your browser&rsquo;s settings, or open Sema in Chrome. Until then, the drawing shows the
                finished letter.
              </p>
            </div>
            {!cameraLocked && (
              <Link className="button handshapes-notice-button" to={letterPath('learn', shown)}>
                Go to Learn
              </Link>
            )}
          </div>
        )}

        <section className={made ? 'handshapes-card made' : 'handshapes-card'} aria-labelledby="handshapes-title">
          {/* The card's top strip: the title, or on the last step "That's B!".
              It's above the hand's frame, so it never covers the hand. The
              heading stays in the page for screen readers either way. */}
          <header className="handshapes-head">
            <h1 id="handshapes-title" className={made ? 'visually-hidden' : 'handshapes-title'}>
              How to make <span>{shown}</span>
            </h1>
            {made && (
              // key: a new letter's "That's C!" pops in again.
              <p key={shown} className="handshapes-made" role="status">
                <span className="handshapes-made-tick" aria-hidden="true">
                  <CheckIcon size={18} strokeWidth={3.5} />
                </span>
                That&rsquo;s {shown}!
              </p>
            )}
          </header>
          <div className="handshapes-hand">
            <Suspense fallback={<p className="hand-model-wait">Loading the 3D hand…</p>}>
              <HandModelView
                letter={shown}
                pose={steps[step].pose}
                duration={at.duration}
                fitTo={whole}
                highlight={steps[step].fingers}
                hand={hand}
                theme={shownTheme}
                fallback={<AslDrawing letter={shown} hand={hand} alt={`Handshape for ${shown}`} />}
                label={`3D hand at step ${step + 1} of making ${shown}. Grab it to turn it.`}
                onReady={() => setHand3d('ready')}
                // Called after onReady when the hand loaded; alone when it didn't.
                onSettled={() => setHand3d((now) => (now === 'ready' ? now : 'failed'))}
              />
            </Suspense>
            <div className="handshapes-corner">
              <HandSideToggle hand={hand} onChange={onSigningHandChange} look="camera" />
            </div>
          </div>
        </section>

        {/* Every step, beside the hand. Each is a button, so any of them can
            be gone back to; the one on screen is a card and says so to screen
            readers (aria-current). On a phone only that one is shown. */}
        <div className="handshapes-side">
          <div className="handshapes-steps">
            {/* A still guide (no movement made in Eidos yet) is the finished
                letter alone, with a note instead of the steps. */}
            {!stepByStep && (
              <div className="handshapes-still-note">
                <NoInstructions />
                <p>
                  A step-by-step guide for {shown} is coming soon. For now, here is the finished letter: turn the hand
                  to see it from every side.
                </p>
              </div>
            )}
            {stepByStep && (
              <ol className="handshapes-list">
                {steps.map((each, i) => (
                  // done: the line from this step to the next is green.
                  <li key={i} className={i < step ? 'done' : undefined}>
                    <button
                      type="button"
                      className={i < step ? 'handshapes-step done' : 'handshapes-step'}
                      aria-current={i === step ? 'step' : undefined}
                      onClick={() => go(i)}
                    >
                      <span className="handshapes-step-number" aria-hidden="true">
                        {i < step ? <CheckIcon size={14} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="handshapes-step-text">
                        <span className="visually-hidden">Step {i + 1}: </span>
                        {/* A step with no sentence yet (no text file, or one
                            shorter than the movement) says so; its number is
                            in the dot. */}
                        {each.say ? <FingerText text={each.say} /> : <NoInstructions />}
                        {/* What the step gets right: the finger conditions
                            Learn's checklist will tick (letterShapes.js). */}
                        {i === step && each.checks.length > 0 && (
                          <span className="handshapes-checks">
                            <span className="visually-hidden">Learn will check: </span>
                            {each.checks.map((check) => (
                              <span key={check} className="handshapes-check">
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
          </div>

          <div className="handshapes-actions">
            {stepByStep && (
              <button type="button" className="handshapes-back" disabled={step === 0} onClick={() => go(step - 1)}>
                Back
              </button>
            )}
            {/* On a phone, where only the step on screen is listed: a dot per
                step, to show how far along it is and to go to any step. */}
            {stepByStep && (
              <ol className="handshapes-dots" aria-label="Steps">
                {steps.map((each, i) => (
                  <li key={i} className={i <= step ? 'reached' : undefined}>
                    <button
                      type="button"
                      className={i < step ? 'handshapes-dot done' : 'handshapes-dot'}
                      aria-current={i === step ? 'step' : undefined}
                      aria-label={`Step ${i + 1} of ${steps.length}`}
                      onClick={() => go(i)}
                    >
                      {i < step ? <CheckIcon size={14} strokeWidth={3} /> : i + 1}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="handshapes-forward">
              {!last && (
                <button type="button" className="button handshapes-next" onClick={() => go(step + 1)}>
                  Next step
                </button>
              )}
              {/* Learn needs the camera check; someone who skipped it gets the
                  next letter instead. */}
              {last && !cameraLocked && (
                <Link className="button handshapes-next" to={letterPath('learn', shown)}>
                  Try {shown} with your camera
                </Link>
              )}
              {last && nextLetter && (
                <button
                  type="button"
                  className={cameraLocked ? 'button handshapes-next' : 'handshapes-back'}
                  onClick={() => pick(nextLetter)}
                >
                  Next letter: {nextLetter}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

// The sign for a step, or a whole letter, whose words aren't written yet: an
// amber pill, so it reads as "not done" rather than as an instruction.
function NoInstructions() {
  return <span className="handshapes-no-text">No instructions yet</span>
}

// The page around every state: the menu bar and the page's frame.
function Shell({ children }) {
  return (
    <>
      <MenuBar active="handshapes" />
      <main className="handshapes">{children}</main>
    </>
  )
}
