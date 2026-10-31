import { Suspense, lazy, useEffect, useState } from 'react'
import CameraProvider from './shared-camera/CameraProvider.jsx'
import PhoneNotice from './layout/PhoneNotice.jsx'
import { navigate, usePathname } from './routing/navigation.js'
import { NEW_VISITOR, clearSavedData, loadProgress, saveProgress } from './settings/progressStore.js'
import { PATHS, resolveRoute } from './routing/router.js'
import { applyTheme, followTheme, systemThemeQuery } from './settings/theme.js'
import { SettingsContext } from './settings/settings.js'
import AboutPage from '../pages/about/AboutPage.jsx'
import CameraCheckPage from '../pages/onboarding/CameraCheckPage.jsx'
import LearnPage from '../pages/learn/LearnPage.jsx'
import NotFoundPage from '../pages/not-found/NotFoundPage.jsx'
import WelcomePage from '../pages/onboarding/WelcomePage.jsx'
import LettersQuizPage from '../pages/quiz/LettersQuizPage.jsx'
import QuizPage from '../pages/quiz/QuizPage.jsx'
import WordsQuizPage from '../pages/quiz/WordsQuizPage.jsx'

// The developer pages, behind their access code. Loaded on demand (lazy), so
// visitors who never open /dev never download them.
const DevArea = lazy(() => import('../pages/dev/DevArea.jsx'))
const DEV_PAGES = ['dev', 'devTracking', 'devExtract', 'devRecord']

// Each page's name in the browser tab, the page first so narrow tabs still
// tell them apart (2026-10-29; before, every tab said "Sema"). Welcome keeps
// index.html's plain "Sema".
const TITLES = {
  welcome: 'Sema',
  about: 'About · Sema',
  cameraCheck: 'Camera setup · Sema',
  learn: 'Learn · Sema',
  quiz: 'Quiz · Sema',
  quizLetters: 'Letters quiz · Sema',
  quizWords: 'Words quiz · Sema',
  notFound: 'Page not found · Sema',
  dev: 'Developer tools · Sema',
  devTracking: 'Tracking and benchmark · Sema',
  devExtract: 'Extract hand points · Sema',
  devRecord: 'Record · Sema',
}

// Displays narrower than this get the phone notice (from the design).
const SMALL_SCREEN = '(max-width: 899px)'

// The app shell: reads the address, picks the page, and wraps every page in
// the shared camera. Changing pages never reloads the browser tab.
export default function App() {
  const pathname = usePathname()
  // The saved settings (signing hand, setup done). They decide where a visitor
  // may go: setup first for a new one, straight to Learn for a returning one.
  const [progress, setProgress] = useState(loadProgress)
  const route = resolveRoute(pathname, progress)
  // Checked once, when the page opens: a phone doesn't change size, and a
  // computer whose window is made narrow later shouldn't lose its page.
  const [showPhoneNotice, setShowPhoneNotice] = useState(() => window.matchMedia(SMALL_SCREEN).matches)
  // The theme on screen right now, 'light' or 'dark' (with System, the
  // system's). index.html already set it on <html> before the first paint.
  const [shownTheme, setShownTheme] = useState(() => document.documentElement.dataset.theme ?? 'light')

  // An address the visitor can't open (or that has no page of its own) is
  // replaced rather than added to the history, so Back doesn't land on it again.
  useEffect(() => {
    if (route.redirect) navigate(route.redirect, { replace: true })
  }, [route.redirect])

  // The tab's title. One HTML page serves every page, so the browser never
  // changes it by itself; it follows the page here. (While a redirect is on
  // its way there's no page yet, and the title waits for it.)
  useEffect(() => {
    if (route.page) document.title = TITLES[route.page] ?? 'Sema'
  }, [route.page])

  // Shows the chosen theme, and with System keeps following the system's
  // setting while the app is open. Runs again when the choice changes. It also
  // remembers what it showed, so the theme button knows which way to switch.
  useEffect(() => {
    return followTheme(progress.theme, systemThemeQuery(), (theme) => {
      applyTheme(theme)
      setShownTheme(theme)
    })
  }, [progress.theme])

  // Settings changes are saved straight away. If the browser refuses, the app
  // carries on; the settings just won't survive a reload.
  function updateProgress(changes) {
    const next = { ...progress, ...changes }
    setProgress(next)
    saveProgress(next)
  }

  // The camera check's Next, which ends setup. Sema doesn't ask for the
  // signing hand, so it keeps a saved one, or Right. The settings change and the navigation
  // happen in the same click, so React applies them in one render: the
  // router never sees one without the other.
  function finishSetup() {
    updateProgress({ signingHand: progress.signingHand ?? 'right', setupDone: true })
    navigate(PATHS.learn)
  }

  // Welcome's Get started (and About's, for a new visitor) opens the camera
  // check, setup's one page. Brought back on 2026-10-27 after a day without it.
  function startSetup() {
    navigate(PATHS.cameraCheck)
  }

  // The developer dashboard's Delete Sema's data (after the person confirmed):
  // everything saved in this browser goes, and Sema starts over as for a new
  // visitor, on Welcome. It doesn't reload the tab: going to Welcome closes
  // the page and the camera, and the settings in memory go back to a new
  // visitor's in the same render.
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

  const settings = {
    shownTheme,
    setTheme: (theme) => updateProgress({ theme }),
    deleteData,
  }

  return (
    <SettingsContext value={settings}>
      <CameraProvider>
        {route.page && (
          <Page
            name={route.page}
            signingHand={progress.signingHand}
            setupDone={progress.setupDone}
            onStartSetup={startSetup}
            onFinishSetup={finishSetup}
            onSigningHandChange={(signingHand) => updateProgress({ signingHand })}
            handView={progress.handView}
            onHandViewChange={(handView) => updateProgress({ handView })}
            devModel={progress.devModel}
            onDevModelChange={(devModel) => updateProgress({ devModel })}
            devAccess={progress.devAccess}
            onDevAccessChange={(devAccess) => updateProgress({ devAccess })}
          />
        )}
      </CameraProvider>
    </SettingsContext>
  )
}

function Page({
  name,
  signingHand,
  setupDone,
  onStartSetup,
  onFinishSetup,
  onSigningHandChange,
  handView,
  onHandViewChange,
  devModel,
  onDevModelChange,
  devAccess,
  onDevAccessChange,
}) {
  if (DEV_PAGES.includes(name)) {
    return (
      <Suspense fallback={null}>
        <DevArea
          page={name}
          signingHand={signingHand}
          devModel={devModel}
          onModelChange={onDevModelChange}
          devAccess={devAccess}
          onAccessChange={onDevAccessChange}
        />
      </Suspense>
    )
  }
  switch (name) {
    case 'welcome':
      return <WelcomePage onStart={onStartSetup} />
    case 'about':
      return <AboutPage setupDone={setupDone} onStart={onStartSetup} />
    case 'cameraCheck':
      return <CameraCheckPage onDone={onFinishSetup} />
    case 'learn':
      return (
        <LearnPage
          signingHand={signingHand}
          onSigningHandChange={onSigningHandChange}
          handView={handView}
          onHandViewChange={onHandViewChange}
          model={devModel}
        />
      )
    case 'quiz':
      return <QuizPage />
    case 'quizLetters':
      return <LettersQuizPage signingHand={signingHand} onSigningHandChange={onSigningHandChange} model={devModel} />
    case 'quizWords':
      return <WordsQuizPage signingHand={signingHand} onSigningHandChange={onSigningHandChange} model={devModel} />
    case 'notFound':
      return <NotFoundPage />
  }
}
