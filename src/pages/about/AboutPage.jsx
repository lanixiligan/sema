import MenuBar from '../../app/layout/MenuBar.jsx'
import {
  BookIcon,
  CameraIcon,
  CameraOffIcon,
  HandPointsIcon,
  NoAccountIcon,
  ScanIcon,
  ShieldCheckIcon,
} from '../../components/icons/LineIcons.jsx'
import AboutPreview from './AboutPreview.jsx'

// What Sema is, in three parts.
const WHAT_IS_SEMA = [
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
    text: 'Sema is being developed to recognize letters. For now, it can detect and track your hand.',
  },
]

// Each point was checked against the code (2026-10-18): frames go only to
// MediaPipe in the browser, and the only requests are Sema's own files (the
// model, its wasm, the word list); nothing saves video (recording keeps hand
// points only); the camera is asked for without audio (useCamera.js), has an
// off button on every camera view, and stops when the tab is hidden or no
// hand is seen for a minute (CameraProvider.jsx, useIdleCameraOff.js);
// settings are kept in this browser (progressStore.js); nothing needs an
// account. Change the text when any of that changes.
const POINTS = [
  {
    Icon: CameraIcon,
    title: 'Your camera helps you practice',
    text: 'Sema tracks 21 points on your hand to follow its shape and movement.',
  },
  {
    Icon: CameraOffIcon,
    title: "You're in control of the camera",
    text: 'Sema uses your camera, never your microphone. Turn it off any time; it also turns off when you switch tabs or step away.',
  },
  {
    Icon: NoAccountIcon,
    title: 'No account needed',
    text: 'Open Sema and start learning. Your settings stay on this computer.',
  },
]

// About (/about), the one page that says what Sema is. It joins what were
// three intro pages (About Sema, How Sema works, How Sema handles your data;
// merged on 2026-10-27) as three sections, one under another, in a page that
// scrolls, each as tall as the window. The old /how-it-works and /privacy addresses redirect here. It is
// in the menu. A new visitor who opened it by its address also
// gets a Get started button at the end (onStart, which opens the camera
// check, as Welcome's does); once setup is done there is none.
export default function AboutPage({ setupDone, onStart }) {
  // The cue at the bottom of the first section: scrolls to the next one.
  // A button (not a link) so the address doesn't change.
  function scrollToHow() {
    document.getElementById('about-how-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <MenuBar active="about" />

      {/* Each section is as tall as the window (min-height in the CSS), with
          its content centred, and the page snaps from one to the next. */}
      <main className="about-page">
        {/* 1. What is Sema? The text on the left, a picture on the right. */}
        <section className="about-block about-hero" aria-labelledby="about-what">
          <div className="about-inner split">
            <div className="split-text">
              <h1 id="about-what" className="display intro-title">
                What is Sema?
              </h1>
              <div className="about-lines">
                {WHAT_IS_SEMA.map((paragraphs, i) => (
                  <div key={i} className="about-section">
                    {paragraphs.map((paragraph, j) => (
                      <p key={j}>{paragraph}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <AboutPreview />
          </div>
          <button type="button" className="about-scroll" onClick={scrollToHow}>
            How it works
            <span className="about-scroll-arrow" aria-hidden="true" />
          </button>
        </section>

        {/* 2. How Sema works: three steps side by side. */}
        <section id="about-how-section" className="about-block about-band" aria-labelledby="about-how">
          <div className="about-inner">
            <h2 id="about-how" className="display about-title">
              Three steps, one letter at a time.
            </h2>
            {/* An ordered list: screen readers announce the steps' numbers, so the
                drawn 01–03 are hidden from them. */}
            <ol className="intro-steps">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <span className="intro-step-number" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="intro-step-icon">
                    <step.Icon />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. How Sema handles your data, and Get started for a new visitor. */}
        <section className="about-block privacy" aria-labelledby="about-data">
          <div className="about-inner">
            <div className="privacy-head">
              <span className="privacy-badge">
                <ShieldCheckIcon />
              </span>
              <h2 id="about-data" className="display about-title">
                Your hands stay yours.
              </h2>
              <p className="privacy-intro">
                Sema processes your hand in real time, right in your browser. Your video is{' '}
                <span className="intro-key">never uploaded or recorded</span> by Sema.
              </p>
            </div>

            <ul className="privacy-points">
              {POINTS.map(({ Icon, title, text }) => (
                <li key={title}>
                  <span className="privacy-point-icon">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>

            {!setupDone && (
              <div className="about-start">
                <button type="button" className="primary-button" onClick={onStart}>
                  Get started
                </button>
              </div>
            )}

            <p className="privacy-hosting">
              Like every website, Sema's host sees basic visit details, such as your internet address.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
