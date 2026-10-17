import { goBack } from '../../app/navigation.js'
import { PATHS } from '../../app/router.js'
import AboutPreview from './AboutPreview.jsx'
import IntroLayout from './IntroLayout.jsx'
import { useStaggeredReveal } from './useStaggeredReveal.js'

const LINES = [
  <>
    Sema is a coach for the ASL alphabet. It shows you a letter. You sign it to your webcam. Sema tells you{' '}
    <span className="intro-key">how close you are</span>.
  </>,
  <>
    <span className="intro-key">Fingerspelling</span> is how ASL spells names and words that have no sign of their
    own.
  </>,
  <>
    Sema is still being built. Right now it can <span className="intro-key">find your hand</span>. Checking letters
    arrives one letter at a time.
  </>,
]

// Page 2, About Sema: what Sema is. Two columns: the text on the left, and on
// the right a picture of what it describes (AboutPreview). The headline and
// the picture, then the lines, appear one after another. During setup,
// Previous returns to Welcome. Once setup is done (opened from the settings
// menu), Previous returns to wherever the person came from.
export default function AboutPage({ setupDone }) {
  const reveal = useStaggeredReveal(LINES.length + 1)

  return (
    <IntroLayout
      reveal={reveal}
      previous={setupDone ? { onClick: () => goBack(PATHS.record) } : { to: PATHS.welcome }}
      next={{ to: PATHS.howSemaWorks }}
    >
      <div className="split">
        <div className="split-text">
          <h1 className={`display intro-title ${reveal.itemClass(0)}`}>What is Sema?</h1>
          <div className="intro-lines">
            {LINES.map((line, i) => (
              <p key={i} className={reveal.itemClass(i + 1)}>
                {line}
              </p>
            ))}
          </div>
        </div>
        <AboutPreview className={reveal.itemClass(0)} />
      </div>
    </IntroLayout>
  )
}
