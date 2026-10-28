import { useEffect, useState } from 'react'

// Changing pages without reloading the browser tab:
// - navigate(path) changes the address with history.pushState (a new history
//   entry, so Back works) or history.replaceState (no new entry, for redirects);
// - the browser fires 'popstate' when the person presses Back or Forward;
// - pushState itself fires nothing, so navigate() sends an event of our own.
const NAVIGATE_EVENT = 'sema:navigate'

// A page that would lose something by being left (a quiz running) sets a
// question here with useLeaveWarning; the person is asked it before Sema
// changes pages. Only one page shows at a time, so one is enough.
let leaveWarning = null // { path, question } or null

function mayLeave() {
  return !leaveWarning || window.confirm(leaveWarning.question)
}

// Back and Forward: the browser has already changed the address when
// 'popstate' fires, and it can't be cancelled. So if the person says no, the
// page's address is put back, and the event is stopped before usePathname
// sees it, so the page never changes. This listener is added when this file
// first loads, before any component's, so it runs first.
window.addEventListener('popstate', (event) => {
  if (!leaveWarning || window.location.pathname === leaveWarning.path) return
  if (mayLeave()) return
  event.stopImmediatePropagation()
  window.history.pushState(null, '', leaveWarning.path)
})

// Closing the tab, reloading, or typing another address: the browser asks with
// its own words (pages can't choose the text any more).
function warnBeforeUnload(event) {
  event.preventDefault()
}

// Ask `question` before leaving this page while `active` is true.
export function useLeaveWarning(active, question) {
  useEffect(() => {
    if (!active) return
    leaveWarning = { path: window.location.pathname, question }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => {
      leaveWarning = null
      window.removeEventListener('beforeunload', warnBeforeUnload)
    }
  }, [active, question])
}

export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname) return
  // Redirects (replace) happen on their own, never from a click, so they don't ask.
  if (!replace && !mayLeave()) return
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
