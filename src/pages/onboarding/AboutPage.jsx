import { goBack } from '../../app/navigation.js'
import { PATHS } from '../../app/router.js'
import AboutPreview from './AboutPreview.jsx'
import IntroLayout from './IntroLayout.jsx'
import { useStaggeredReveal } from './useStaggeredReveal.js'

// The text in three sections, with a thin line between them. The first has
// two paragraphs: what Sema is, then what you do with it.
const SECTIONS = [
  [
    <>
      <span className="intro-key">Sema</span> is an interactive learning tool that helps you master the{' '}
      <span className="intro-key">American Sign Language (ASL) fingerspelling alphabet</span>.
    </>,
    <>
      Practice forming each letter in front of your webcam and receive feedback on how closely your hand signs match
      the target.
    </>,
  ],
  [
    <>
      <span className="intro-key">Fingerspelling</span> uses individual handshapes to represent letters, allowing you
      to spell names, words, and other terms that do not have their own signs.
    </>,
  ],
  [
    <>
      Sema is still <span className="intro-key">under development.</span> For now, it can detect your hand through your
      webcam and guide you through the alphabet, one letter at a time.
    </>,
  ],
]

// Page 2, About Sema: what Sema is. Two columns: the text on the left, and on
// the right a picture of what it describes (AboutPreview). The headline and
// the picture, then each section, appear one after another. During setup,
// Previous returns to Welcome. Once setup is done (opened by its address),
// Previous returns to wherever the person came from.
export default function AboutPage({ setupDone }) {
  const reveal = useStaggeredReveal(SECTIONS.length + 1)

  return (
    <IntroLayout
      reveal={reveal}
      previous={setupDone ? { onClick: () => goBack(PATHS.record) } : { to: PATHS.welcome }}
      next={{ to: PATHS.howSemaWorks }}
    >
      <div className="split">
        <div className="split-text">
          <h1 className={`display intro-title ${reveal.itemClass(0)}`}>What is Sema?</h1>
          <div className="about-lines">
            {SECTIONS.map((paragraphs, i) => (
              <div key={i} className={`about-section ${reveal.itemClass(i + 1)}`}>
                {paragraphs.map((paragraph, j) => (
                  <p key={j}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <AboutPreview className={reveal.itemClass(0)} />
      </div>
    </IntroLayout>
  )
}
