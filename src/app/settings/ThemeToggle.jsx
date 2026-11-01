import { useState } from 'react'
import { MoonIcon, SunIcon } from '../../components/icons/icons.jsx'
import { useSettings } from './settings.js'
import { changeThemeWithReveal } from './themeTransition.js'

// The theme button at the right of every page's top bar: one round button
// that switches between day and night. Until it's first clicked, Sema follows
// the system's setting (the System choice, the default); a click saves the
// opposite of what's on screen, Light or Dark. It shows where it leads: a
// moon by day, a sun by night. The icon has no text, so the button gets its
// name from aria-label (for screen readers) and title (the tooltip on hover).
//
// A click also plays the reveal (themeTransition.js): the new theme grows out
// of this button. `clicked` makes the new icon turn in; it starts false on
// every page, so a page that merely opens doesn't play it.
export default function ThemeToggle() {
  const { shownTheme, setTheme } = useSettings()
  const [clicked, setClicked] = useState(false)
  const isDark = shownTheme === 'dark'
  const label = isDark ? 'Switch to day mode' : 'Switch to night mode'

  function handleClick(event) {
    setClicked(true)
    changeThemeWithReveal(() => setTheme(isDark ? 'light' : 'dark'), event.currentTarget)
  }

  return (
    <button
      type="button"
      className={clicked ? 'theme-toggle theme-toggle-turned' : 'theme-toggle'}
      aria-label={label}
      title={label}
      onClick={handleClick}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
