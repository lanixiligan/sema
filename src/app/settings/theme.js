// Sema's colour theme. The person chooses Light, Dark or System (the default)
// with the toggle in the top bar; the choice is saved with the other settings in
// progressStore. The page shows it through one attribute on <html>,
// data-theme="light" or "dark", and styles.css swaps its colour variables on
// that. index.html sets the attribute once before the first paint (so a dark
// theme never flashes white), with the same rule as resolveTheme below.
export const THEMES = ['light', 'dark', 'system']
export const DEFAULT_THEME = 'system'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// The theme to show: the choice itself, or for System, the system's.
export function resolveTheme(choice, systemIsDark) {
  if (choice === 'light' || choice === 'dark') return choice
  return systemIsDark ? 'dark' : 'light'
}

// Shows `choice` now through `apply`, and with System, again whenever the
// system's setting changes (no reload needed). `media` is a MediaQueryList:
// matchMedia's answer, which fires 'change' when the answer changes. Returns
// the function that stops following, for a React effect's cleanup.
export function followTheme(choice, media, apply) {
  const update = () => apply(resolveTheme(choice, media.matches))
  update()
  if (choice !== 'system') return () => {}
  media.addEventListener('change', update)
  return () => media.removeEventListener('change', update)
}

// The browser side: the system's setting, and the attribute on <html>.
// color-scheme tells the browser to draw its own parts (scrollbars, the
// camera picker's list) light or dark to match.
export function systemThemeQuery() {
  return window.matchMedia(DARK_QUERY)
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
