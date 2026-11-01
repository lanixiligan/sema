import MenuBar from '../../app/layout/MenuBar.jsx'
import AslDrawing from '../../components/AslDrawing.jsx'
import Logo from '../../components/Logo.jsx'
import { CheckIcon } from '../../components/icons/icons.jsx'
import { CameraIcon, CameraOffIcon, NoAccountIcon, ShieldCheckIcon } from '../../components/icons/LineIcons.jsx'
import { FINGER_NUMBERS } from '../../vision/landmarks/handPoints.js'
import HandSketch from './HandSketch.jsx'

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

// Letter B's finger conditions as Learn lists them (letterShapes.js), for the
// third step's picture. The last one is left unticked on purpose: it shows
// what "which finger to fix" looks like.
const B_CHECKS = [
  { finger: 'index', text: 'straight', met: true },
  { finger: 'middle', text: 'straight', met: true },
  { finger: 'ring', text: 'straight', met: true },
  { finger: 'pinky', text: 'straight', met: true },
  { finger: 'thumb', text: 'folded across the palm', met: false },
]

// The first step's picture: a letter's card, its drawing and name.
function LetterCardPicture() {
  return (
    <div className="about-picture about-card" aria-hidden="true">
      <span className="about-card-drawing">
        <AslDrawing letter="B" hand="right" />
      </span>
      <div className="about-card-title">Letter B</div>
    </div>
  )
}

// The second step's picture: the camera frame with a hand drawn the way Sema
// draws a tracked one (HandSketch).
function TrackedHandPicture() {
  return (
    <div className="about-picture about-frame" aria-hidden="true">
      <HandSketch className="about-frame-hand" />
      <span className="about-frame-chip">21 points</span>
    </div>
  )
}

// The third step's picture: the checklist, four fingers ticked and the thumb
// still to fix. The finger rules and their badges are Learn's (the .finger-*
// rules in styles.css).
function ChecklistPicture() {
  return (
    <div className="about-picture about-checks" aria-hidden="true">
      <div className="about-card-title">Letter B</div>
      <div className="finger-checks">
        <ul>
          {B_CHECKS.map(({ finger, text, met }) => (
            <li key={finger} className={met ? 'met' : undefined}>
              <span className="finger-check-mark">{met && <CheckIcon size={11} strokeWidth={3} />}</span>
              <span>
                <b className="finger-name">
                  <span className="finger-badge">{FINGER_NUMBERS[finger]}</span>
                  {finger[0].toUpperCase() + finger.slice(1)}
                </b>{' '}
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Explore a letter',
    Picture: LetterCardPicture,
    text: 'Each letter includes a reference image and a brief guide to its corresponding handshape.',
  },
  {
    title: 'Form the letter',
    Picture: TrackedHandPicture,
    text: (
      <>
        Show your chosen hand to the camera. Sema tracks <span className="intro-key">21 landmarks</span> as you form
        the handshape.
      </>
    ),
  },
  {
    title: 'Understand the handshape',
    Picture: ChecklistPicture,
    text: 'Sema ticks off each finger rule as you match it. Hold the letter to pass, or trace the line for J and Z. A letter model, trained on thousands of hand photos, gives a second opinion.',
  },
]

// About (/about), the one page that says what Sema is. It joins what were
// three intro pages (About Sema, How Sema works, How Sema handles your data;
// merged on 2026-10-27) as three sections, one under another, in a page that
// scrolls. The old /how-it-works and /privacy addresses redirect here. It is
// in the menu. A new visitor who opened it by its address also
// gets a Get started button at the end (onStart, which opens the camera
// check, as Welcome's does); once setup is done there is none.
// Redesigned 2026-11-02 in Quiz's look: Gabarito, white sticker pictures with
// soft shadows, the amber key button. The three steps share one screen, each
// with a small picture; the data section is a Deep Cobalt band.
export default function AboutPage({ setupDone, onStart }) {
  // The cue at the bottom of the first section: scrolls to the next one.
  // A button (not a link) so the address doesn't change. No behavior option:
  // the CSS decides (scroll-behavior on html), smooth unless the person asked
  // their system for reduced motion.
  function scrollToHow() {
    document.getElementById('about-how-section')?.scrollIntoView()
  }

  return (
    <>
      <MenuBar active="about" />

      <main className="about-page">
        {/* 1. What is Sema? The words on the left, Sema's name in hands on the right. */}
        <section className="about-hero" aria-labelledby="about-what">
          <div className="about-inner about-hero-grid">
            <div className="about-hero-text">
              <h1 id="about-what">What is Sema?</h1>
              <p className="about-lead">
                <span className="intro-key">Sema</span> is an interactive learning tool that helps you master the{' '}
                <span className="intro-key">American Sign Language (ASL) fingerspelling alphabet</span>. Practice
                forming each letter in front of your webcam and receive feedback on how closely your hand signs match
                the target.
              </p>
              <p>
                <span className="intro-key">Fingerspelling</span> uses individual handshapes to represent letters,
                allowing you to spell names, words, and other terms that do not have their own signs.
              </p>
              <p>
                Sema checks each handshape against the letter&rsquo;s finger rules, and has you trace J and Z, the two
                letters that move. It&rsquo;s <span className="intro-key">still improving.</span>
              </p>
            </div>

            {/* The logo on a sticker. It has its own alt text. */}
            <div className="about-logo-sticker">
              <Logo className="about-logo" />
            </div>
          </div>
          <button type="button" className="about-scroll" onClick={scrollToHow}>
            How it works
            <span className="about-scroll-arrow" aria-hidden="true" />
          </button>
        </section>

        {/* 2. How Sema works: the three steps side by side on one screen, each
            with a small picture of what it looks like. */}
        <section id="about-how-section" className="about-how" aria-labelledby="about-how">
          <div className="about-inner">
            <h2 id="about-how">Three steps, one letter at a time.</h2>
            {/* An ordered list: screen readers announce the steps' numbers, so the
                drawn ones are hidden from them. */}
            <ol className="about-steps">
              {STEPS.map(({ title, text, Picture }, i) => (
                <li key={title} className="about-step">
                  <Picture />
                  <span className="about-step-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. How Sema handles your data, and Get started for a new visitor. */}
        <section className="about-privacy on-dark" aria-labelledby="about-data">
          <div className="about-inner">
            <div className="about-privacy-grid">
              <div className="about-privacy-head">
                <span className="about-privacy-badge">
                  <ShieldCheckIcon />
                </span>
                <h2 id="about-data">Your hands stay yours.</h2>
                <p>
                  Sema processes your hand in real time, right in your browser. Your video is{' '}
                  <span className="intro-key">never uploaded or recorded</span> by Sema.
                </p>
              </div>

              <ul className="about-points">
                {POINTS.map(({ Icon, title, text }) => (
                  <li key={title}>
                    <span className="about-point-icon">
                      <Icon />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {!setupDone && (
              <div className="about-start">
                <button type="button" className="key-button" onClick={onStart}>
                  Get started
                  <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            )}

            <p className="about-hosting">
              Like every website, Sema's host sees basic visit details, such as your internet address.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
