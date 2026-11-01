import Logo from '../../components/Logo.jsx'
import Link from '../routing/Link.jsx'
import { PATHS } from '../routing/router.js'
import ThemeToggle from '../settings/ThemeToggle.jsx'

// The thin bar at the top of every page: the logo on the left, then what the
// page adds: the menu on the main pages (`nav`), and items on the right
// (`children`), then the theme toggle, the last thing in the bar. It always
// uses the dark colour set (on-dark), as the camera frame does: since
// 2026-11-02 the light theme's bar is Deep Cobalt, an anchor over the sky page,
// the same bar the dark theme has.
export default function TopBar({ nav, children }) {
  return (
    <header className="app-bar on-dark">
      <div className="app-bar-left">
        <Link to={PATHS.welcome} className="wordmark">
          <Logo className="wordmark-logo" />
        </Link>
        {nav}
      </div>
      <div className="app-bar-right">
        {children}
        <ThemeToggle />
      </div>
    </header>
  )
}
