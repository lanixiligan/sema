import { useEffect, useState } from 'react'
import CameraProvider from './shared-camera/CameraProvider.jsx'
import PhoneNotice from './layout/PhoneNotice.jsx'
import { navigate, usePathname } from './routing/navigation.js'
import { NEW_VISITOR, clearSavedData, loadProgress, saveProgress } from './settings/progressStore.js'
import { PATHS, resolveRoute } from './routing/router.js'
import { applyTheme, followTheme, systemThemeQuery } from './settings/theme.js'
import { SettingsContext } from './settings/settings.js'
import AboutPage from '../pages/onboarding/intro/AboutPage.jsx'
import CameraCheckPage from '../pages/onboarding/CameraCheckPage.jsx'
import DevPage from '../pages/dev/DevPage.jsx'
import LearnPage from '../pages/learn/LearnPage.jsx'
import HowSemaWorksPage from '../pages/onboarding/intro/HowSemaWorksPage.jsx'
import PrivacyPage from '../pages/onboarding/intro/PrivacyPage.jsx'
import WelcomePage from '../pages/onboarding/WelcomePage.jsx'
import PracticePage from '../pages/practice/PracticePage.jsx'
import RecordPage from '../pages/record/RecordPage.jsx'

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

  // Shows the chosen theme, and with System keeps following the system's
  // setting while the app is open. Runs again when the choice changes.
  useEffect(() => followTheme(progress.theme, systemThemeQuery(), applyTheme), [progress.theme])

  // Settings changes are saved straight away. If the browser refuses, the app
  // carries on; the settings just won't survive a reload.
  function updateProgress(changes) {
    const next = { ...progress, ...changes }
    setProgress(next)
    saveProgress(next)
  }

  // The camera check's Next. Setup doesn't ask for the signing hand, so it
  // keeps a saved one, or Right (Record's hand toggle switches it). The
  // settings change and the navigation happen in the same click, so React
  // applies them in one render: the router never sees one without the other.
  function finishSetup() {
    updateProgress({ signingHand: progress.signingHand ?? 'right', setupDone: true })
    navigate(PATHS.record)
  }

  // The settings menu's Delete Sema's data (after the person confirmed):
  // everything saved in this browser goes, and Sema starts over as for a new
  // visitor, on Welcome. It doesn't reload the tab: going to Welcome closes
  // Record (its unsaved session in memory with it) and the camera, and the
  // settings in memory go back to a new visitor's in the same render.
  // Nothing is saved again until the person changes a setting.
  function deleteData() {
    const cleared = clearSavedData()
    setProgress(NEW_VISITOR)
    navigate(PATHS.welcome)
    return cleared
  }

  // The notice replaces the app rather than covering it, so nothing behind it
  // (such as the camera) starts.
  if (showPhoneNotice) return <PhoneNotice onContinue={() => setShowPhoneNotice(false)} />

  const settings = { theme: progress.theme, setTheme: (theme) => updateProgress({ theme }), deleteData }

  return (
    <SettingsContext value={settings}>
      <CameraProvider>
        {route.page && (
          <Page
            name={route.page}
            signingHand={progress.signingHand}
            setupDone={progress.setupDone}
            onFinishSetup={finishSetup}
          />
        )}
      </CameraProvider>
    </SettingsContext>
  )
}

function Page({ name, signingHand, setupDone, onFinishSetup }) {
  switch (name) {
    case 'welcome':
      return <WelcomePage />
    case 'about':
      return <AboutPage setupDone={setupDone} />
    case 'howSemaWorks':
      return <HowSemaWorksPage />
    case 'privacy':
      return <PrivacyPage setupDone={setupDone} />
    case 'cameraCheck':
      return <CameraCheckPage onDone={onFinishSetup} />
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
