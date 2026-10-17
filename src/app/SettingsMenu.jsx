import { useEffect, useId, useRef, useState } from 'react'
import { SettingsIcon } from '../components/icons.jsx'
import Link from './Link.jsx'
import { PATHS } from './router.js'

// The settings menu at the right of the menu bar: the two intro pages worth
// re-reading. (The theme has its own toggle in the top bar, ThemeToggle.jsx.)
// A button opens a small panel under it. aria-expanded tells screen readers
// whether it's open. A click outside the menu or Escape closes it; Escape
// also puts focus back on the button.
export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  // A unique id, so the button can point at its panel (aria-controls).
  const id = useId()

  useEffect(() => {
    if (!open) return
    function closeOnOutsideClick(event) {
      if (!menuRef.current.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="settings" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="settings-button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
      >
        <SettingsIcon />
        Settings
      </button>

      {open && (
        <div id={`${id}-panel`} className="settings-panel">
          <div className="settings-links">
            <Link to={PATHS.about}>About Sema</Link>
            <Link to={PATHS.privacy}>Privacy</Link>
          </div>
        </div>
      )}
    </div>
  )
}
