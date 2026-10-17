import { goBack } from '../../app/navigation.js'
import { PATHS } from '../../app/router.js'
import { CameraIcon, CameraOffIcon, NoAccountIcon, ShieldCheckIcon } from '../../components/LineIcons.jsx'
import IntroLayout from './IntroLayout.jsx'
import { useStaggeredReveal } from './useStaggeredReveal.js'

// Each point was checked against the code (2026-10-18): frames go only to
// MediaPipe in the browser, and the only requests are Sema's own files (the
// model, its wasm, letters.json); nothing saves video (recording keeps hand
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

// Intro page 3 of 3, How Sema handles your data. At the top, centred: a shield
// badge, the headline and what Sema does with the camera; under a thin line,
// three points side by side; at the bottom, the hosting note.
// It works two ways:
// - during setup it's the last intro page: Next goes to the camera check,
//   Previous to How Sema works;
// - once setup is done it's a page to read from anywhere: only Previous,
//   which returns to wherever the person came from.
export default function PrivacyPage({ setupDone }) {
  // The headline, the intro, each point, then the note.
  const reveal = useStaggeredReveal(POINTS.length + 3)

  return (
    <IntroLayout
      reveal={reveal}
      previous={setupDone ? { onClick: () => goBack(PATHS.record) } : { to: PATHS.howSemaWorks }}
      next={setupDone ? undefined : { to: PATHS.cameraCheck }}
    >
      <div className="privacy">
        <div className="privacy-head">
          <span className={`privacy-badge ${reveal.itemClass(0)}`}>
            <ShieldCheckIcon />
          </span>
          <h1 className={`display privacy-title ${reveal.itemClass(0)}`}>Your hands stay yours.</h1>
          <p className={`privacy-intro ${reveal.itemClass(1)}`}>
            Sema processes your hand in real time, right in your browser. Your video is{' '}
            <span className="intro-key">never uploaded or recorded</span> by Sema.
          </p>
        </div>

        <ul className="privacy-points">
          {POINTS.map(({ Icon, title, text }, i) => (
            <li key={title} className={reveal.itemClass(i + 2)}>
              <span className="privacy-point-icon">
                <Icon />
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </li>
          ))}
        </ul>

        <p className={`privacy-hosting ${reveal.itemClass(POINTS.length + 2)}`}>
          Like every website, Sema's host sees basic visit details, such as your internet address.
        </p>
      </div>
    </IntroLayout>
  )
}
