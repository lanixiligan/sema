import { useEffect, useId, useRef, useState } from 'react'
import { SettingsIcon } from '../components/icons.jsx'
import Link from './Link.jsx'
import { PATHS } from './router.js'
import { useThemeChoice } from './themeChoice.js'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

// The settings menu at the right of the menu bar: the theme, and the two intro
// pages worth re-reading. A button opens a small panel under it.
// aria-expanded tells screen readers whether it's open. A click outside the
// menu or Escape closes it; Escape also puts focus back on the button.
export default function SettingsMenu() {
  const { theme, setTheme } = useThemeChoice()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  // A unique id, so the button can point at its panel (aria-controls) and
  // the radio buttons share a group name.
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
          {/* Real radio buttons, drawn as a segmented control: screen readers
              announce them as one group, and the arrow keys move between them. */}
          <fieldset className="settings-theme">
            <legend>Theme</legend>
            <div className="segmented">
              {THEME_OPTIONS.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name={`${id}-theme`}
                    value={option.id}
                    checked={theme === option.id}
                    onChange={() => setTheme(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="settings-note">Saved in this browser only.</p>
          <div className="settings-links">
            <Link to={PATHS.about}>About Sema</Link>
            <Link to={PATHS.privacy}>Privacy</Link>
          </div>
        </div>
      )}
    </div>
  )
}
