import { useEffect, useRef, useState } from 'react'
import { CloseIcon, MenuIcon } from '../../components/icons/icons.jsx'
import Link from '../routing/Link.jsx'
import { PATHS } from '../routing/router.js'
import TopBar from './TopBar.jsx'

const MENU = [
  { page: 'learn', label: 'Learn' },
  { page: 'quiz', label: 'Quiz' },
  { page: 'about', label: 'About' },
]

// The top bar on the main pages, with the menu, and on the right whatever the
// page passes in, then the theme toggle.
// The current page's link gets aria-current="page": screen readers announce
// it as the current page, and the CSS fills its pill.
//
// On a phone (under 600px) the menu doesn't fit beside the logo, so the CSS
// hides it and shows a burger button instead; the button opens the menu as a
// panel under the bar. `open` is only for that panel: on a wider screen the
// menu is always shown and the button is hidden, so it changes nothing there.
export default function MenuBar({ active, children }) {
  const [open, setOpen] = useState(false)
  const button = useRef(null)
  const menu = useRef(null)

  // While the panel is open, a tap anywhere outside it, or Escape, closes it
  // (Escape also puts the keyboard back on the button). The listeners go on
  // the document and are removed when the panel closes.
  useEffect(() => {
    if (!open) return
    function handlePointerDown(event) {
      if (menu.current?.contains(event.target) || button.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <TopBar
      nav={
        // A click on a link closes the panel (the page itself changes, but a
        // link to the page you're already on wouldn't).
        <nav
          ref={menu}
          id="main-menu"
          aria-label="Main"
          className={open ? 'menu is-open' : 'menu'}
          onClick={() => setOpen(false)}
        >
          {MENU.map((item) => (
            <Link
              key={item.page}
              to={PATHS[item.page]}
              aria-current={item.page === active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      }
    >
      {children}
      <button
        ref={button}
        type="button"
        className="menu-toggle"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon size={16} /> : <MenuIcon />}
      </button>
    </TopBar>
  )
}
