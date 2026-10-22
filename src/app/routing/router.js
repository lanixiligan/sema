// The app's pages and the address of each. A small router of our own: with
// a handful of fixed paths, the browser's History API is all we need, so no
// router library. navigation.js is the part that talks to the browser.
export const PATHS = {
  welcome: '/',
  // The three intro pages, for new visitors (anyone can re-read them).
  about: '/about',
  howSemaWorks: '/how-it-works',
  privacy: '/privacy',
  // Setup's one page: it finds the signing hand.
  cameraCheck: '/setup/camera',
  learn: '/learn',
  practice: '/practice',
  // The developer tools, behind an access code (src/pages/dev/DevArea.jsx):
  // the dashboard, then each tool. Not in the menu.
  dev: '/dev',
  devTracking: '/dev/tracking',
  devRecord: '/dev/record',
}

// Pages that need setup finished first.
const NEEDS_SETUP = ['learn', 'practice']

// Which page a path shows, as { page: 'learn' }, or { redirect: '/' } to
// send the person somewhere else. `progress` is the saved settings
// (progressStore): a new visitor goes through setup first, and a returning one
// skips Welcome. A trailing slash is ignored.
export function resolveRoute(pathname, { setupDone }) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = Object.keys(PATHS).find((name) => PATHS[name] === path)
  if (!page) return { redirect: PATHS.welcome }
  if (page === 'welcome' && setupDone) return { redirect: PATHS.learn }
  if (NEEDS_SETUP.includes(page) && !setupDone) return { redirect: PATHS.welcome }
  return { page }
}
