import { PATHS } from '../../../app/routing/router.js'
import IntroLayout from './IntroLayout.jsx'
import { BookIcon, HandPointsIcon, ScanIcon } from '../../../components/icons/LineIcons.jsx'
import { useStaggeredReveal } from './useStaggeredReveal.js'

const STEPS = [
  {
    title: 'Explore a letter',
    Icon: BookIcon,
    text: 'Each letter includes a reference image and a brief guide to its corresponding handshape.',
  },
  {
    title: 'Form the letter',
    Icon: ScanIcon,
    text: (
      <>
        Show your chosen hand to the camera. Sema tracks <span className="intro-key">21 landmarks</span> as you form
        the handshape.
      </>
    ),
  },
  {
    title: 'Understand the handshape',
    Icon: HandPointsIcon,
    text: "Sema is being developed to recognize letters. For now, it can detect and track your hand.",
  },
]

// Intro page 2 of 3, How Sema works: the headline on one line at the left,
// then the three steps of a lesson side by side, each under a thin line. The
// headline comes in first, then each step.
export default function HowSemaWorksPage() {
  const reveal = useStaggeredReveal(STEPS.length + 1)

  return (
    <IntroLayout
      reveal={reveal}
      previous={{ to: PATHS.about }}
      next={{ to: PATHS.privacy }}
    >
      <div className="how-it-works">
        <h1 className={`display how-title ${reveal.itemClass(0)}`}>Three steps, one letter at a time.</h1>
        {/* An ordered list: screen readers announce the steps' numbers, so the
            drawn 01–03 are hidden from them. */}
        <ol className="intro-steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className={reveal.itemClass(i + 1)}>
              {/* One row: the number and title on the left, the icon on the right. */}
              <div className="intro-step-head">
                <h2>
                  <span className="intro-step-number" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {step.title}
                </h2>
                <span className="intro-step-icon">
                  <step.Icon />
                </span>
              </div>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </IntroLayout>
  )
}
