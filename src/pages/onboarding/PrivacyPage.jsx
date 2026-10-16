import Link from '../../app/Link.jsx'
import { goBack } from '../../app/navigation.js'
import { PATHS } from '../../app/router.js'
import IntroLayout from './IntroLayout.jsx'
import { useStaggeredReveal } from './useStaggeredReveal.js'

const LINES = [
  <>
    Hand detection runs in your browser. Your video is <span className="intro-key">never uploaded or recorded</span>.
  </>,
  <>No account, no analytics, no tracking.</>,
  <>
    Your signing hand and progress are saved <span className="intro-key">in this browser only</span>. Reset progress,
    or clearing your site data, removes them.
  </>,
  <>
    If you record letters, <span className="intro-key">only hand points</span> are saved, and you send the file
    yourself.
  </>,
]

// Intro page 3 of 3, How Sema handles your data. It works two ways:
// - during setup it's the last intro page: Continue goes to the signing hand,
//   Back to How Sema works;
// - once setup is done it's a page to read from anywhere: only Back, which
//   returns to wherever the person came from.
// The small print comes in with Continue, after the last line.
export default function PrivacyPage({ setupDone }) {
  const reveal = useStaggeredReveal(LINES.length + 2)
  const last = reveal.itemClass(LINES.length + 1)

  return (
    <IntroLayout
      reveal={reveal}
      backTo={setupDone ? undefined : PATHS.howSemaWorks}
      onBack={setupDone ? () => goBack(PATHS.record) : undefined}
    >
      <h1 className={`display intro-title ${reveal.itemClass(0)}`}>Your video stays yours.</h1>
      <div className="intro-lines">
        {LINES.map((line, i) => (
          <p key={i} className={reveal.itemClass(i + 1)}>
            {line}
          </p>
        ))}
      </div>
      <p className={`intro-small ${last}`}>
        Like any website, the hosting service may keep standard technical logs, such as IP addresses.
      </p>
      {!setupDone && (
        <Link to={PATHS.signingHand} className={`primary-button intro-continue ${last}`}>
          Continue
        </Link>
      )}
    </IntroLayout>
  )
}
