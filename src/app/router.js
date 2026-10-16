// The app's pages and the address of each. A small router of our own: with
// a handful of fixed paths, the browser's History API is all we need, so no
// router library. navigation.js is the part that talks to the browser.
export const PATHS = {
  welcome: '/',
  howSemaWorks: '/setup/how-it-works',
  signingHand: '/setup/hand',
  cameraCheck: '/setup/camera',
  record: '/record',
  learn: '/learn',
  practice: '/practice',
  dev: '/dev',
}

// Pages that need setup finished first.
const NEEDS_SETUP = ['record', 'learn', 'practice']

// Which page a path shows, as { page: 'record' }, or { redirect: '/' } to
// send the person somewhere else. `progress` is the saved settings
// (progressStore): a new visitor goes through setup first, and a returning one
// skips Welcome. A trailing slash is ignored.
export function resolveRoute(pathname, { signingHand, setupDone }) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = Object.keys(PATHS).find((name) => PATHS[name] === path)
  if (!page) return { redirect: PATHS.welcome }
  if (page === 'welcome' && setupDone) return { redirect: PATHS.record }
  if (NEEDS_SETUP.includes(page) && !setupDone) return { redirect: PATHS.welcome }
  if (page === 'cameraCheck' && !signingHand) return { redirect: PATHS.signingHand }
  return { page }
}
