import { useId } from 'react'
import { MonitorIcon, MoonIcon, SunIcon } from '../components/icons.jsx'
import { useSettings } from './settings.js'

const OPTIONS = [
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'system', label: 'System', Icon: MonitorIcon },
]

// The theme toggle at the right of every page's top bar: three icons, the
// chosen one raised. They are real radio buttons, so screen readers announce
// one "Theme" group and the arrow keys move between them. The icons have no
// text, so each option gets its name from aria-label (for screen readers)
// and title (the tooltip on hover).
export default function ThemeToggle() {
  const { theme, setTheme } = useSettings()
  // A unique group name, so the three radios belong together.
  const name = useId()

  return (
    <fieldset className="theme-toggle">
      <legend className="visually-hidden">Theme</legend>
      <div className="theme-toggle-track">
        {OPTIONS.map(({ id, label, Icon }) => (
          <label key={id} title={label}>
            <input
              type="radio"
              name={name}
              value={id}
              aria-label={label}
              checked={theme === id}
              onChange={() => setTheme(id)}
            />
            <span className="theme-toggle-option">
              <Icon />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
