// The app's pages and the address of each. A small router of our own: with
// a handful of fixed paths, the browser's History API is all we need, so no
// router library. navigation.js is the part that talks to the browser.
export const PATHS = {
  welcome: '/',
  // What Sema is, how it works and how it handles your data, in one page and
  // in the menu. Optional: a new visitor has no link to it from Welcome.
  about: '/about',
  // Setup's one page: Get started opens it, and passing it opens Learn.
  cameraCheck: '/camera-setup',
  // The letters one at a time, with the guide of all 26 (Practice's page
  // was merged into it on 2026-10-27): the main page.
  learn: '/learn',
  // Test what was learned: the choice between the two kinds of quiz.
  quiz: '/quiz',
  // The two kinds, one page each (2026-11-04): Words, signed with the camera,
  // and Guess the letter, which shows hand signs to name and needs no camera.
  quizWords: '/quiz/words',
  quizGuess: '/quiz/guess',
  // The developer tools, behind an access code (src/pages/dev/DevArea.jsx):
  // the dashboard, then each tool. Not in the menu.
  dev: '/dev',
  devTracking: '/dev/tracking',
  devExtract: '/dev/extract',
  devRecord: '/dev/record',
}

// Old addresses that still work, every one Sema has had: Learn was Practice,
// at /practice, until 2026-10-27 (and Try, at /try, before 2026-10-23, and the
// developer tool /dev/try before 2026-10-22); Record was the main page, at
// /record, until 2026-10-22 (it's a developer tool now, so the old address
// leads to the main page); setup had its own pages under /setup/ (the signing
// hand and how Sema works, gone since 2026-10-27), and the camera check was at
// /setup/camera until 2026-10-29; About was three intro pages until 2026-10-27,
// the other two at /how-it-works and /privacy. The Letters quiz (/quiz/letters,
// 10 random letters signed) was replaced by Guess the letter on 2026-11-04, so
// its address leads to the choice.
const MOVED = {
  '/quiz/letters': PATHS.quiz,
  '/try': PATHS.learn,
  '/practice': PATHS.learn,
  '/dev/try': PATHS.learn,
  '/record': PATHS.learn,
  '/setup/camera': PATHS.cameraCheck,
  '/setup/hand': PATHS.cameraCheck,
  '/setup/how-it-works': PATHS.about,
  '/how-it-works': PATHS.about,
  '/privacy': PATHS.about,
}

// Pages that need setup finished first.
const NEEDS_SETUP = ['learn', 'quiz', 'quizWords', 'quizGuess']
// Where the camera check may lead once it passes, besides Learn.
const CHECK_NEXT = [PATHS.learn, PATHS.quizWords]

// The camera check's address, saying where to go once it passes (`next`, a
// path): /camera-setup?next=/quiz/words. The part after "?" is the query; the
// router only reads the path, so it never changes which page shows.
export function cameraCheckPath(next) {
  return CHECK_NEXT.includes(next) && next !== PATHS.learn ? `${PATHS.cameraCheck}?next=${next}` : PATHS.cameraCheck
}

// Where the camera check leads, from its address's query (`search`, like
// "?next=/quiz/words"): one of CHECK_NEXT, or Learn.
export function cameraCheckNext(search) {
  const next = new URLSearchParams(search).get('next')
  return CHECK_NEXT.includes(next) ? next : PATHS.learn
}

// Pages that start the camera as they open, so they need the camera check
// passed. (Learn needs it too, but its camera waits for a click, so it opens
// and says "Set up your camera" in its frame instead.)
const NEEDS_CAMERA_CHECK = ['quizWords']

// Which page a path shows, as { page: 'learn' }, or { redirect: '/' } to
// send the person somewhere else. `progress` is the saved settings
// (progressStore): a new visitor goes through setup first, and a returning one
// skips Welcome. Someone who finished setup without the camera check
// (`cameraChecked` false) is sent to it from the Words quiz. A trailing slash
// is ignored. An address Sema never had shows the "Page not found" page
// ('notFound', which has no address of its own); until 2026-10-29 it quietly
// sent the person to Welcome.
export function resolveRoute(pathname, { setupDone, cameraChecked }) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (MOVED[path]) return { redirect: MOVED[path] }
  const page = Object.keys(PATHS).find((name) => PATHS[name] === path)
  if (!page) return { page: 'notFound' }
  if (page === 'welcome' && setupDone) return { redirect: PATHS.learn }
  if (NEEDS_SETUP.includes(page) && !setupDone) return { redirect: PATHS.welcome }
  if (NEEDS_CAMERA_CHECK.includes(page) && !cameraChecked) return { redirect: cameraCheckPath(PATHS[page]) }
  return { page }
}
