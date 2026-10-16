import Link from '../../app/Link.jsx'
import { PATHS } from '../../app/router.js'
import IntroLayout from './IntroLayout.jsx'
import { useStaggeredReveal } from './useStaggeredReveal.js'

const STEPS = [
  {
    title: 'See a letter',
    text: 'Each letter comes with a reference photo and a short description of the handshape.',
  },
  {
    title: 'Sign it to your camera',
    text: (
      <>
        Sema finds <span className="intro-key">21 points</span> on your hand and follows them as you move.
      </>
    ),
  },
  {
    title: 'Check the shape',
    text: "Sema compares your hand's shape with the letter. In this preview it can find your hand but can't check letters yet.",
  },
]

// Intro page 2 of 3, How Sema works: the three steps of a lesson, side by
// side. The headline comes in first, then each step, then Continue.
export default function HowSemaWorksPage({ setupDone }) {
  const reveal = useStaggeredReveal(STEPS.length + 2)

  return (
    <IntroLayout reveal={reveal} backTo={PATHS.about} skipTo={setupDone ? PATHS.record : PATHS.signingHand}>
      <h1 className={`display intro-title ${reveal.itemClass(0)}`}>Three steps, one letter at a time.</h1>
      {/* An ordered list: screen readers announce the steps' numbers, so the
          drawn 01–03 are hidden from them. */}
      <ol className="intro-steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className={reveal.itemClass(i + 1)}>
            <h2>
              <span className="intro-step-number" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {step.title}
            </h2>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <Link
        to={PATHS.privacy}
        className={`primary-button intro-continue ${reveal.itemClass(STEPS.length + 1)}`}
      >
        Continue
      </Link>
    </IntroLayout>
  )
}
