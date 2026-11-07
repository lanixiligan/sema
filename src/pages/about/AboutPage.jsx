import MenuBar from '../../app/layout/MenuBar.jsx'
import Link from '../../app/routing/Link.jsx'
import { PATHS } from '../../app/routing/router.js'
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
// checklist's picture. The last one is left unticked on purpose: it shows
// what "which finger to fix" looks like.
const B_CHECKS = [
  { finger: 'index', text: 'straight', met: true },
  { finger: 'middle', text: 'straight', met: true },
  { finger: 'ring', text: 'straight', met: true },
  { finger: 'pinky', text: 'straight', met: true },
  { finger: 'thumb', text: 'folded across the palm', met: false },
]

// The letter model's picture: its three likeliest letters for a B, made up
// but typical (the model gives every letter a share; the shares add to 100%).
const MODEL_GUESSES = [
  { letter: 'B', share: 96 },
  { letter: 'U', share: 3 },
  { letter: 'R', share: 1 },
]

// 1. The camera: a dark video frame, read in the browser.
function CameraPicture() {
  return (
    <div className="about-picture about-frame" aria-hidden="true">
      <span className="about-frame-icon">
        <CameraIcon />
      </span>
      <span className="about-frame-chip">In your browser</span>
    </div>
  )
}

// 2. Hand tracking: the camera frame with a hand drawn the way Sema draws a
// tracked one (HandSketch).
function TrackedHandPicture() {
  return (
    <div className="about-picture about-frame" aria-hidden="true">
      <HandSketch className="about-frame-hand" />
      <span className="about-frame-chip">21 points</span>
    </div>
  )
}

// 3. The letter model: its likeliest letters as bars, the top one green.
function ModelPicture() {
  return (
    <div className="about-picture about-panel about-model" aria-hidden="true">
      <div className="about-panel-title">Letter model</div>
      <ul>
        {MODEL_GUESSES.map(({ letter, share }, i) => (
          <li key={letter} className={i === 0 ? 'is-top' : undefined}>
            <span className="about-model-letter">{letter}</span>
            <span className="about-model-bar">
              <span style={{ width: `${share}%` }} />
            </span>
            <span className="about-model-share">{share}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 4. The checklist: four fingers ticked and the thumb still to fix. The
// finger rules and their badges are Learn's (the .finger-* rules in styles.css).
function ChecklistPicture() {
  return (
    <div className="about-picture about-panel about-checks" aria-hidden="true">
      <div className="about-panel-title">Letter B</div>
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

// How Sema works, stage by stage, in the order the data flows. Checked against
// the code (2026-11-07): the camera starts only on a click and asks for no
// audio (useCamera.js); MediaPipe Hand Landmarker runs on each video frame in
// the browser (src/vision/); normalizeHand.js moves the points to the wrist,
// scales them by the palm and flips a left hand, with no rotation; the letter
// model is the logistic regression in training/reports/small.md (27,463
// samples from 14 signers), a second opinion only; the checklist is
// letterShapes.js and letterMatch.js, with LETTER_HOLD_MS = 1.5 s. Change the
// text when any of that changes.
const STAGES = [
  {
    label: 'Your camera',
    title: 'The video stays with you',
    Picture: CameraPicture,
    text: 'Sema asks for your camera only when you press Turn camera on, and never for your microphone. Every frame is read right here in your browser; none is uploaded or saved.',
  },
  {
    label: 'Hand tracking',
    title: '21 points on your hand',
    Picture: TrackedHandPicture,
    text: (
      <>
        <span className="intro-key">MediaPipe Hand Landmarker</span>, a hand-tracking model by Google, marks 21 points
        on every frame: your wrist, each knuckle and each fingertip. Sema draws them over the video, so you see what it
        sees.
      </>
    ),
  },
  {
    label: 'Letter model',
    title: 'A second opinion',
    Picture: ModelPicture,
    text: 'The points are moved to your wrist, sized to your palm and flipped for a left hand, so only the handshape is left. A model trained on 27,463 photos of 14 signers names the letter it sees, and how sure it is.',
  },
  {
    label: 'Finger checklist',
    title: 'Each finger, checked',
    Picture: ChecklistPicture,
    text: 'Sema measures each finger: bent or straight, where the thumb sits, how far apart. Each rule turns green as you meet it; hold them all for 1.5 seconds and the letter passes. J and Z move, so you trace them.',
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
// soft shadows, the amber key button. How it works follows the data, stage by
// stage, each with a small picture (2026-11-07; before, three steps for using
// Sema); the data section is on the page's background (2026-11-07; before, a
// Deep Cobalt band).
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
        {/* 1. What is Sema? Everything centred: the title with the logo beside it, then the words. */}
        <section className="about-hero" aria-labelledby="about-what">
          <div className="about-inner about-hero-grid">
            <div className="about-hero-text">
              {/* The logo stands in for the word "Sema"; its alt text keeps the heading readable. */}
              <h1 id="about-what" className="about-hero-title">
                <span>What is</span>
                <Logo className="about-logo" />
                <span aria-hidden="true">?</span>
              </h1>
              <p>
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
          </div>
          <button type="button" className="about-scroll" onClick={scrollToHow}>
            How it works
            <span className="about-scroll-arrow" aria-hidden="true" />
          </button>
        </section>

        {/* 2. How Sema works: the four stages in the order the data flows, one row
            each, on a numbered line down the middle; the pictures and the words
            change sides from row to row. */}
        <section id="about-how-section" className="about-how" aria-labelledby="about-how">
          <div className="about-inner">
            <h2 id="about-how">How Sema works</h2>
            <p className="about-how-lead">Four stages, on every video frame, all inside your browser.</p>
            {/* An ordered list: screen readers announce the stages' numbers, so the
                drawn ones are hidden from them. */}
            <ol className="about-flow">
              {STAGES.map(({ label, title, text, Picture }, i) => (
                <li key={label} className="about-stage">
                  <Picture />
                  <span className="about-spine" aria-hidden="true">
                    <span className="about-step-number">{i + 1}</span>
                  </span>
                  <div className="about-stage-text">
                    <span className="about-stage-label">{label}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. How Sema handles your data, and Get started for a new visitor. */}
        <section className="about-privacy" aria-labelledby="about-data">
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

            {/* The way on, last on the page: Get started for a new visitor (it opens the
                camera check, then Learn), Go to Learn once setup is done. */}
            <div className="about-start">
              {setupDone ? (
                <Link to={PATHS.learn} className="key-button">
                  Go to Learn
                  <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : (
                <button type="button" className="key-button" onClick={onStart}>
                  Get started
                  <svg className="key-button-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </button>
              )}
            </div>

            <p className="about-hosting">
              Like every website, Sema's host sees basic visit details, such as your internet address.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
