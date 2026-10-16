import { useEffect, useState } from 'react'

// Changing pages without reloading the browser tab:
// - navigate(path) changes the address with history.pushState (a new history
//   entry, so Back works) or history.replaceState (no new entry, for redirects);
// - the browser fires 'popstate' when the person presses Back or Forward;
// - pushState itself fires nothing, so navigate() sends an event of our own.
const NAVIGATE_EVENT = 'sema:navigate'

export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname) return
  if (replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  window.scrollTo(0, 0) // a new page starts at the top
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
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
