// The app's pages and the address of each. A small router of our own: with
// a handful of fixed paths, the browser's History API is all we need, so no
// router library. navigation.js is the part that talks to the browser.
export const PATHS = {
  welcome: '/',
  // What Sema is, how it works and how it handles your data, in one page and
  // in the menu. Optional: a new visitor has no link to it from Welcome.
  about: '/about',
  // Setup's one page: Get started opens it, and passing it opens Learn.
  cameraCheck: '/setup/camera',
  // The letters one at a time, with the guide of all 26 (Practice's page
  // was merged into it on 2026-10-27): the main page.
  learn: '/learn',
  // Sign letters or words from memory, to test what was learned.
  quiz: '/quiz',
  // The two kinds of quiz, one page each.
  quizLetters: '/quiz/letters',
  quizWords: '/quiz/words',
  // The developer tools, behind an access code (src/pages/dev/DevArea.jsx):
  // the dashboard, then each tool. Not in the menu.
  dev: '/dev',
  devTracking: '/dev/tracking',
  devExtract: '/dev/extract',
  devRecord: '/dev/record',
}

// Old addresses that still work: Learn was Practice, at /practice, until
// 2026-10-27 (and Try, at /try, before 2026-10-23), and About was three intro
// pages until 2026-10-27, the other two at /how-it-works and /privacy.
const MOVED = {
  '/try': PATHS.learn,
  '/practice': PATHS.learn,
  '/how-it-works': PATHS.about,
  '/privacy': PATHS.about,
}

// Pages that need setup finished first.
const NEEDS_SETUP = ['learn', 'quiz', 'quizLetters', 'quizWords']

// Which page a path shows, as { page: 'learn' }, or { redirect: '/' } to
// send the person somewhere else. `progress` is the saved settings
// (progressStore): a new visitor goes through setup first, and a returning one
// skips Welcome. A trailing slash is ignored.
export function resolveRoute(pathname, { setupDone }) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (MOVED[path]) return { redirect: MOVED[path] }
  const page = Object.keys(PATHS).find((name) => PATHS[name] === path)
  if (!page) return { redirect: PATHS.welcome }
  if (page === 'welcome' && setupDone) return { redirect: PATHS.learn }
  if (NEEDS_SETUP.includes(page) && !setupDone) return { redirect: PATHS.welcome }
  return { page }
}
