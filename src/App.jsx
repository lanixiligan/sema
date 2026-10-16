import { useEffect, useState } from 'react'
import CameraProvider from './app/CameraProvider.jsx'
import PhoneNotice from './app/PhoneNotice.jsx'
import { navigate, usePathname } from './app/navigation.js'
import { loadProgress, saveProgress } from './app/progressStore.js'
import { PATHS, resolveRoute } from './app/router.js'
import CameraCheckPage from './pages/onboarding/CameraCheckPage.jsx'
import DevPage from './pages/dev/DevPage.jsx'
import LearnPage from './pages/learn/LearnPage.jsx'
import HowSemaWorksPage from './pages/onboarding/HowSemaWorksPage.jsx'
import SigningHandPage from './pages/onboarding/SigningHandPage.jsx'
import WelcomePage from './pages/onboarding/WelcomePage.jsx'
import PracticePage from './pages/practice/PracticePage.jsx'
import RecordPage from './pages/record/RecordPage.jsx'

// Displays narrower than this get the phone notice (from the design).
const SMALL_SCREEN = '(max-width: 899px)'

// The app shell: reads the address, picks the page, and wraps every page in
// the shared camera. Changing pages never reloads the browser tab.
export default function App() {
  const pathname = usePathname()
  // The saved settings (signing hand, setup done). They decide where a visitor
  // may go: setup first for a new one, straight to Record for a returning one.
  const [progress, setProgress] = useState(loadProgress)
  const route = resolveRoute(pathname, progress)
  // Checked once, when the page opens: a phone doesn't change size, and a
  // computer whose window is made narrow later shouldn't lose its page.
  const [showPhoneNotice, setShowPhoneNotice] = useState(() => window.matchMedia(SMALL_SCREEN).matches)

  // An address the visitor can't open (or that has no page of its own) is
  // replaced rather than added to the history, so Back doesn't land on it again.
  useEffect(() => {
    if (route.redirect) navigate(route.redirect, { replace: true })
  }, [route.redirect])

  // Settings changes are saved straight away. If the browser refuses, the app
  // carries on; the settings just won't survive a reload.
  function updateProgress(changes) {
    const next = { ...progress, ...changes }
    setProgress(next)
    saveProgress(next)
  }

  // The settings change and the navigation happen in the same click, so React
  // applies them in one render: the router never sees one without the other.
  function finishSetup() {
    updateProgress({ setupDone: true })
    navigate(PATHS.record)
  }

  // The notice replaces the app rather than covering it, so nothing behind it
  // (such as the camera) starts.
  if (showPhoneNotice) return <PhoneNotice onContinue={() => setShowPhoneNotice(false)} />

  return (
    <CameraProvider>
      {route.page && (
        <Page
          name={route.page}
          signingHand={progress.signingHand}
          onChooseHand={(hand) => updateProgress({ signingHand: hand })}
          onFinishSetup={finishSetup}
        />
      )}
    </CameraProvider>
  )
}

function Page({ name, signingHand, onChooseHand, onFinishSetup }) {
  switch (name) {
    case 'welcome':
      return <WelcomePage />
    case 'howSemaWorks':
      return <HowSemaWorksPage />
    case 'signingHand':
      return <SigningHandPage signingHand={signingHand} onChoose={onChooseHand} />
    case 'cameraCheck':
      return <CameraCheckPage signingHand={signingHand} onSwitchHand={onChooseHand} onDone={onFinishSetup} />
    case 'record':
      return <RecordPage signingHand={signingHand} />
    case 'learn':
      return <LearnPage />
    case 'practice':
      return <PracticePage />
    case 'dev':
      return <DevPage />
  }
}
