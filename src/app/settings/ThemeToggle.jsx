import { MoonIcon, SunIcon } from '../../components/icons/icons.jsx'
import { useSettings } from './settings.js'

// The theme button at the right of every page's top bar: one round button
// that switches between day and night. Until it's first clicked, Sema follows
// the system's setting (the System choice, the default); a click saves the
// opposite of what's on screen, Light or Dark. It shows where it leads: a
// moon by day, a sun by night. The icon has no text, so the button gets its
// name from aria-label (for screen readers) and title (the tooltip on hover).
export default function ThemeToggle() {
  const { shownTheme, setTheme } = useSettings()
  const isDark = shownTheme === 'dark'
  const label = isDark ? 'Switch to day mode' : 'Switch to night mode'

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
