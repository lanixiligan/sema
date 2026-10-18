import { useEffect, useState } from 'react'

// Changing pages without reloading the browser tab:
// - navigate(path) changes the address with history.pushState (a new history
//   entry, so Back works) or history.replaceState (no new entry, for redirects);
// - the browser fires 'popstate' when the person presses Back or Forward;
// - pushState itself fires nothing, so navigate() sends an event of our own.
// Entries navigate() adds carry { sema: true }, so goBack() can tell whether
// the page before is one of Sema's. A redirect keeps the entry's mark.
const NAVIGATE_EVENT = 'sema:navigate'

export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname) return
  if (replace) window.history.replaceState(window.history.state, '', path)
  else window.history.pushState({ sema: true }, '', path)
  window.scrollTo(0, 0) // a new page starts at the top
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

// Back to the page the person came from, like the browser's Back button. If
// they opened this page directly (no Sema page before it), Back would leave
// Sema, so it goes to `fallback` instead.
export function goBack(fallback) {
  if (window.history.state?.sema) window.history.back()
  else navigate(fallback, { replace: true })
}

// The current path. The component re-renders whenever it changes.
export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(NAVIGATE_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])
  return pathname
}
