import Logo from '../components/Logo.jsx'
import Link from './Link.jsx'
import { PATHS } from './router.js'
import ThemeToggle from './ThemeToggle.jsx'

// The thin bar at the top of every page: the logo and a quiet "Preview"
// (Sema's only preview signal) on the left, then what the page adds: the menu
// on the main pages (`nav`), and items on the right (`children`), then the
// theme toggle, then `end` (the settings menu on the main pages), so that's
// the last thing in the bar. Its colours come from the theme, or from the
// dark set inside an always-dark page.
export default function TopBar({ nav, children, end }) {
  return (
    <header className="app-bar">
      <div className="app-bar-left">
        <Link to={PATHS.welcome} className="wordmark">
          <Logo className="wordmark-logo" />
        </Link>
        <span className="preview-note">Preview</span>
        {nav}
      </div>
      <div className="app-bar-right">
        {children}
        <ThemeToggle />
        {end}
      </div>
    </header>
  )
}
