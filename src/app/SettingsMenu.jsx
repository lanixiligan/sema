import { useEffect, useId, useRef, useState } from 'react'
import { SettingsIcon } from '../components/icons.jsx'
import { useSettings } from './settings.js'

// The settings menu at the right of the menu bar: a gear (no text, so it's
// named by aria-label and title) that opens a small panel under it, which
// for now holds one thing: deleting everything Sema saved in this browser,
// after a confirmation. (The theme has its own toggle, ThemeToggle.jsx.)
// aria-expanded tells screen readers whether the panel is open. A click
// outside the menu or Escape closes it; Escape also puts focus back on the
// button.
const DELETE_QUESTION =
  "Delete everything Sema saved in this browser?\n\nThis removes your settings and any recording session, including takes you haven't downloaded. Sema will start again from the welcome page."

export default function SettingsMenu() {
  const { deleteData } = useSettings()
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

  function confirmDelete() {
    if (!window.confirm(DELETE_QUESTION)) return
    setOpen(false)
    deleteData()
  }

  return (
    <div className="settings" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="settings-button"
        aria-label="Settings"
        title="Settings"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
      >
        <SettingsIcon />
      </button>

      {open && (
        <div id={`${id}-panel`} className="settings-panel">
          <button type="button" className="settings-delete" onClick={confirmDelete}>
            Delete Sema's data
          </button>
          <p className="settings-note">Removes your settings and any recording session from this browser.</p>
        </div>
      )}
    </div>
  )
}
